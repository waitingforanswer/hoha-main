import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegisterRequest {
  username: string;
  password: string;
  full_name: string;
  phone: string;
}

interface LoginRequest {
  identifier: string; // username or phone
  password: string;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5; // Max attempts per window
const MAX_REGISTER_ATTEMPTS = 3; // Max registration attempts per window
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes lockout after max failures

// In-memory rate limit store (resets on function cold start, which is acceptable for edge functions)
const rateLimitStore = new Map<string, { count: number; firstAttempt: number; lockedUntil?: number }>();

function getClientIP(req: Request): string {
  // Try various headers for client IP
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  // Fallback to a default identifier
  return "unknown";
}

function getRateLimitKey(ip: string, action: string, identifier?: string): string {
  // Combine IP with action and optionally the user identifier for more granular limiting
  if (identifier) {
    return `${action}:${ip}:${identifier}`;
  }
  return `${action}:${ip}`;
}

function checkRateLimit(key: string, maxAttempts: number): { allowed: boolean; retryAfter?: number; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Check if locked out
  if (record?.lockedUntil && now < record.lockedUntil) {
    const retryAfter = Math.ceil((record.lockedUntil - now) / 1000);
    console.log(`Rate limit lockout for key ${key}, retry after ${retryAfter}s`);
    return { allowed: false, retryAfter, remaining: 0 };
  }

  // Clean up expired records or lockouts that have passed
  if (record && (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS || (record.lockedUntil && now >= record.lockedUntil))) {
    rateLimitStore.delete(key);
  }

  const currentRecord = rateLimitStore.get(key);

  if (!currentRecord) {
    rateLimitStore.set(key, { count: 1, firstAttempt: now });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (currentRecord.count >= maxAttempts) {
    // Apply lockout
    currentRecord.lockedUntil = now + LOCKOUT_DURATION_MS;
    rateLimitStore.set(key, currentRecord);
    const retryAfter = Math.ceil(LOCKOUT_DURATION_MS / 1000);
    console.log(`Rate limit exceeded for key ${key}, locking out for ${retryAfter}s`);
    return { allowed: false, retryAfter, remaining: 0 };
  }

  currentRecord.count++;
  rateLimitStore.set(key, currentRecord);
  return { allowed: true, remaining: maxAttempts - currentRecord.count };
}

function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

function json(payload: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...headers },
  });
}

function normalizeIdentifier(value: string) {
  return value.trim();
}

function normalizePhone(value: string) {
  // keep digits only
  return value.replace(/\D/g, "");
}

// Convert Uint8Array to hex string
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Convert hex string to Uint8Array
function fromHex(hex: string): Uint8Array {
  const clean = hex.trim();
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

// PBKDF2 password hashing (Deno edge compatible)
async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  const rawSalt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  // Force an ArrayBuffer-backed Uint8Array for WebCrypto type compatibility
  const saltBytes = new Uint8Array(rawSalt);
  const actualSaltHex = saltHex ?? toHex(saltBytes);

  const key = await crypto.subtle.importKey("raw", passwordData, "PBKDF2", false, ["deriveBits"]);

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100_000,
      hash: "SHA-256",
    },
    key,
    256
  );

  const hashHex = toHex(new Uint8Array(derivedBits));

  // store as salt:hash
  return { hash: `${actualSaltHex}:${hashHex}`, salt: actualSaltHex };
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex] = stored.split(":");
  if (!saltHex) return false;
  const { hash } = await hashPassword(password, saltHex);
  return hash === stored;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();
    const clientIP = getClientIP(req);

    if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

    const body = await req.json();

    if (action === "register") {
      // Rate limit registration by IP
      const rateLimitKey = getRateLimitKey(clientIP, "register");
      const { allowed, retryAfter, remaining } = checkRateLimit(rateLimitKey, MAX_REGISTER_ATTEMPTS);
      
      if (!allowed) {
        console.log(`Registration rate limited for IP: ${clientIP}`);
        return json(
          { success: false, error: "Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau." },
          429,
          { "Retry-After": String(retryAfter), "X-RateLimit-Remaining": "0" }
        );
      }

      const result = await handleRegister(supabase, body as RegisterRequest);
      return result;
    }
    
    if (action === "login") {
      const identifier = normalizeIdentifier((body as LoginRequest).identifier || "");
      
      // Rate limit login by IP + identifier combination
      const rateLimitKey = getRateLimitKey(clientIP, "login", identifier);
      const { allowed, retryAfter, remaining } = checkRateLimit(rateLimitKey, MAX_LOGIN_ATTEMPTS);
      
      if (!allowed) {
        console.log(`Login rate limited for IP: ${clientIP}, identifier: ${identifier}`);
        return json(
          { success: false, error: "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau." },
          429,
          { "Retry-After": String(retryAfter), "X-RateLimit-Remaining": "0" }
        );
      }

      const result = await handleLogin(supabase, body as LoginRequest, rateLimitKey);
      return result;
    }

    return json({ success: false, error: "Unknown action" }, 400);
  } catch (error) {
    console.error("Auth error:", error);
    return json({ success: false, error: "Internal server error" }, 500);
  }
});

async function handleRegister(supabase: any, data: RegisterRequest) {
  const username = normalizeIdentifier(data.username || "");
  const phone = normalizePhone(data.phone || "");
  const full_name = (data.full_name || "").trim();
  const password = data.password || "";

  if (!username || !password || !full_name || !phone) {
    return json({ success: false, error: "Vui lòng điền đầy đủ thông tin" });
  }

  if (password.length < 8) {
    return json({ success: false, error: "Mật khẩu phải có ít nhất 8 ký tự", field: "password" });
  }

  // Check uniqueness
  const { data: existingUsername } = await supabase
    .from("app_users")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existingUsername) return json({ success: false, error: "Tên đăng nhập đã tồn tại", field: "username" });

  const { data: existingPhone } = await supabase
    .from("app_users")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  if (existingPhone) return json({ success: false, error: "Số điện thoại đã được sử dụng", field: "phone" });

  const { hash: password_hash } = await hashPassword(password);

  const { data: newUser, error: insertError } = await supabase
    .from("app_users")
    .insert({
      username,
      phone,
      password_hash,
      full_name,
      status: "PENDING",
    })
    .select("id, username, full_name, status")
    .single();

  if (insertError) {
    console.error("Insert error:", insertError);
    return json({ success: false, error: "Không thể tạo tài khoản. Vui lòng thử lại." }, 500);
  }

  return json({
    success: true,
    message: "Tài khoản đã được tạo. Vui lòng liên hệ Hà Quang Thông để được duyệt.",
    user: newUser,
  });
}

async function handleLogin(supabase: any, data: LoginRequest, rateLimitKey?: string) {
  const identifier = normalizeIdentifier(data.identifier || "");
  const password = data.password || "";

  if (!identifier || !password) {
    return json({ success: false, error: "Vui lòng nhập đầy đủ thông tin" });
  }

  // Try username first (exact), then phone (normalized)
  const { data: byUsername, error: findUsernameError } = await supabase
    .from("app_users")
    .select("*")
    .eq("username", identifier)
    .maybeSingle();

  if (findUsernameError) {
    console.error("Find username error:", findUsernameError);
    return json({ success: false, error: "Lỗi hệ thống. Vui lòng thử lại." }, 500);
  }

  let user = byUsername;

  if (!user) {
    const phone = normalizePhone(identifier);
    const { data: byPhone, error: findPhoneError } = await supabase
      .from("app_users")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    if (findPhoneError) {
      console.error("Find phone error:", findPhoneError);
      return json({ success: false, error: "Lỗi hệ thống. Vui lòng thử lại." }, 500);
    }

    user = byPhone;
  }

  if (!user) {
    return json({ success: false, error: "Thông tin đăng nhập không chính xác" });
  }

  const passwordValid = await verifyPassword(password, user.password_hash);
  if (!passwordValid) {
    return json({ success: false, error: "Thông tin đăng nhập không chính xác" });
  }

  if (user.status !== "ACTIVE") {
    return json({ success: false, error: "Tài khoản chưa được kích hoạt. Vui lòng liên hệ quản trị viên." });
  }

  // Successful login - reset rate limit for this user
  if (rateLimitKey) {
    resetRateLimit(rateLimitKey);
  }

  // Fetch user's permissions via roles
  const permissions = await getUserPermissions(supabase, user.id);

  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const { password_hash, ...userWithoutPassword } = user;

  // Save session token to database for edge function verification
  const { error: sessionError } = await supabase
    .from("app_user_sessions")
    .insert({
      app_user_id: user.id,
      token: sessionToken,
      expires_at: expiresAt.toISOString(),
    });

  if (sessionError) {
    console.error("Session insert error:", sessionError);
    // Continue anyway - user can still use the app, just edge functions may not work
  }

  // Cleanup expired sessions for this user
  await supabase
    .from("app_user_sessions")
    .delete()
    .eq("app_user_id", user.id)
    .lt("expires_at", new Date().toISOString());

  console.log(`Successful login for user: ${user.username}`);

  return json({
    success: true,
    user: userWithoutPassword,
    permissions,
    session: {
      token: sessionToken,
      expires_at: expiresAt.toISOString(),
    },
  });
}

async function getUserPermissions(supabase: any, userId: string): Promise<string[]> {
  // Get user's roles
  const { data: userRoles, error: rolesError } = await supabase
    .from("app_user_roles")
    .select("role_id")
    .eq("app_user_id", userId);

  if (rolesError || !userRoles?.length) {
    console.log("No roles found for user:", userId);
    return [];
  }

  const roleIds = userRoles.map((ur: any) => ur.role_id);

  // Check if user has ADMIN role (bypasses all permissions)
  const { data: adminRole } = await supabase
    .from("roles")
    .select("id")
    .eq("code", "ADMIN")
    .single();

  if (adminRole && roleIds.includes(adminRole.id)) {
    // Admin has all permissions - return special marker
    return ["*"];
  }

  // Get permissions for user's roles
  const { data: rolePermissions, error: permError } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .in("role_id", roleIds);

  if (permError || !rolePermissions?.length) {
    return [];
  }

  const permissionIds = rolePermissions.map((rp: any) => rp.permission_id);

  // Get permission codes
  const { data: permissions, error: fetchError } = await supabase
    .from("permissions")
    .select("code")
    .in("id", permissionIds);

  if (fetchError || !permissions) {
    return [];
  }

  return permissions.map((p: any) => p.code);
}
