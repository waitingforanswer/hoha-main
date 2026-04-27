import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Gender icons as simple components
const MaleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="14" r="5"/>
    <line x1="19" y1="5" x2="13.6" y2="10.4"/>
    <line x1="19" y1="5" x2="14" y2="5"/>
    <line x1="19" y1="5" x2="19" y2="10"/>
  </svg>
);

const FemaleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="5"/>
    <line x1="12" y1="13" x2="12" y2="21"/>
    <line x1="9" y1="18" x2="15" y2="18"/>
  </svg>
);

// lineage_type: 'primary' = họ Hà (huyết thống chính), 'maternal' = khác
type LineageType = 'primary' | 'maternal';

interface FamilyMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  birth_date: string | null;
  death_date: string | null;
  is_alive: boolean | null;
  address: string | null;
  gender: string | null;
  is_primary_lineage?: boolean | null;
  lineage_type?: string | null;
  is_default_view?: boolean | null;
}

interface FamilyTreeNodeProps {
  member: FamilyMember;
  isSpouse?: boolean;
  wifeOrder?: number; // 1 = Vợ cả, 2 = Vợ hai, etc.
}

const calculateAge = (birthDate: string | null, deathDate: string | null, isAlive: boolean | null): number | null => {
  if (!birthDate) return null;
  
  const birth = new Date(birthDate);
  const endDate = isAlive === false && deathDate ? new Date(deathDate) : new Date();
  
  let age = endDate.getFullYear() - birth.getFullYear();
  const monthDiff = endDate.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Helper to get wife label
function getWifeLabel(order: number): string {
  switch (order) {
    case 1: return "Vợ cả";
    case 2: return "Vợ hai";
    case 3: return "Vợ ba";
    case 4: return "Vợ tư";
    case 5: return "Vợ năm";
    default: return `Vợ ${order}`;
  }
}

export function FamilyTreeNode({ member, isSpouse = false, wifeOrder }: FamilyTreeNodeProps) {
  const age = calculateAge(member.birth_date, member.death_date, member.is_alive);
  const isDeceased = member.is_alive === false;
  const isMale = member.gender === "male";
  const isFemale = member.gender === "female";
  
  // Determine lineage type - only 2 options: primary or maternal (khác)
  const rawLineageType = member.lineage_type || 
    (member.is_primary_lineage === false ? 'maternal' : 'primary');
  // Map 'spouse' to 'maternal' for backward compatibility
  const lineageType: LineageType = rawLineageType === 'primary' ? 'primary' : 'maternal';
  
  const isPrimaryLineage = lineageType === 'primary';
  
  // Get border color based on lineage type - simplified to 2 styles only
  const getBorderClass = () => {
    if (isPrimaryLineage) return "border-2 border-lineage-primary shadow-sm";
    return "border-2 border-foreground/40"; // Style for "Khác"
  };
  
  return (
    <div
      data-member-id={member.id}
      className={cn(
        "flex flex-col items-center gap-3 p-3 rounded-lg bg-card transition-all hover:shadow-md relative",
        // Fixed width and height for consistent card size
        "w-[140px] h-[180px]",
        // Border styling based on lineage
        getBorderClass(),
        isDeceased && "opacity-70",
        // Highlight default view member
        member.is_default_view && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Gender icon - top right */}
      <div className={cn(
        "absolute -top-2 -right-2 rounded-full p-1 shadow-sm",
        isMale ? "bg-blue-500 text-white" : isFemale ? "bg-pink-500 text-white" : "bg-muted text-muted-foreground"
      )}>
        {isMale ? (
          <MaleIcon className="h-3 w-3" />
        ) : isFemale ? (
          <FemaleIcon className="h-3 w-3" />
        ) : (
          <User className="h-3 w-3" />
        )}
      </div>

      {/* Wife order label - Vợ cả/Vợ hai only for multiple wives */}
      {wifeOrder !== undefined && wifeOrder > 0 && (
        <div className={cn(
          "absolute -top-2 -left-2 text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm",
          wifeOrder === 1 ? "bg-pink-500 text-white" : 
          wifeOrder === 2 ? "bg-purple-500 text-white" : 
          wifeOrder === 3 ? "bg-indigo-500 text-white" : "bg-slate-500 text-white"
        )}>
          {getWifeLabel(wifeOrder)}
        </div>
      )}
      
      <Link to={`/thanh-vien/${member.id}`} className="group flex-shrink-0">
        <Avatar className={cn(
          "h-14 w-14 border-2 transition-transform group-hover:scale-105",
          isDeceased ? "border-muted grayscale" : isPrimaryLineage ? "border-lineage-primary-light" : "border-foreground/30"
        )}>
          <AvatarImage 
            src={member.avatar_url || undefined} 
            alt={member.full_name} 
            className="object-cover object-center"
          />
          <AvatarFallback className={cn(
            isDeceased 
              ? "bg-muted text-muted-foreground" 
              : isPrimaryLineage 
                ? "bg-lineage-primary/10 text-lineage-primary" 
                : "bg-muted text-foreground"
          )}>
            <User className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
      </Link>
      
      <div className="text-center flex-1 flex flex-col justify-start overflow-hidden">
        <Link 
          to={`/thanh-vien/${member.id}`}
          className={cn(
            "text-sm hover:underline block text-center leading-snug",
            "line-clamp-2 min-h-[2.25rem]",
            isPrimaryLineage ? "font-semibold text-lineage-primary" : "font-medium text-foreground",
            isDeceased && "opacity-70"
          )}
        >
          {member.full_name}
        </Link>
        
        {age !== null && (
          <p className={cn(
            "text-[11px] mt-1",
            isDeceased ? "text-muted-foreground/70" : "text-muted-foreground"
          )}>
            {isDeceased ? `Mất năm ${age} tuổi` : `${age} tuổi`}
          </p>
        )}
        
        {member.address && (
          <p className={cn(
            "text-[11px] mt-0.5 inline-flex items-center justify-center gap-0.5",
            isDeceased ? "text-muted-foreground/70" : "text-muted-foreground"
          )}>
            <MapPin className="h-2.5 w-2.5 flex-shrink-0 inline-block align-middle" />
            <span className="truncate max-w-[100px]">{member.address}</span>
          </p>
        )}
      </div>
    </div>
  );
}
