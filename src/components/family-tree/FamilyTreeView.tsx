import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { FamilyTreeNode } from "./FamilyTreeNode";
import { ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize, Move, Users, Layers, Heart, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";

// Heart connector component for marriage link
const HeartConnector = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center justify-center", className)}>
    <Heart className="h-5 w-5 text-destructive fill-destructive" />
  </div>
);

interface FamilyMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  birth_date: string | null;
  death_date: string | null;
  is_alive: boolean | null;
  address: string | null;
  gender: string | null;
  father_id: string | null;
  mother_id: string | null;
  generation: number;
  spouse_id: string | null;
  is_primary_lineage: boolean | null;
  lineage_type?: string | null;
  is_default_view?: boolean | null;
}

interface FamilyMarriage {
  id: string;
  husband_id: string;
  wife_id: string;
  marriage_order: number;
  marriage_date: string | null;
  divorce_date: string | null;
  is_active: boolean;
  notes: string | null;
}

interface FamilyTreeViewProps {
  members: FamilyMember[];
  marriages?: FamilyMarriage[];
}

function buildFamilyTree(members: FamilyMember[], marriages: FamilyMarriage[] = []) {
  const memberMap = new Map<string, FamilyMember>();
  members.forEach(m => memberMap.set(m.id, m));
  
  // Build marriages map: husband_id -> array of wives (sorted by marriage_order)
  const marriagesMap = new Map<string, Array<{ wife: FamilyMember; order: number; isActive: boolean }>>();
  
  marriages.forEach(m => {
    const wife = memberMap.get(m.wife_id);
    if (wife) {
      const existing = marriagesMap.get(m.husband_id) || [];
      existing.push({ wife, order: m.marriage_order, isActive: m.is_active });
      marriagesMap.set(m.husband_id, existing);
    }
  });
  
  // Sort wives by marriage_order
  marriagesMap.forEach((wives, husbandId) => {
    wives.sort((a, b) => a.order - b.order);
  });
  
  // Find all children for a couple (father + mother)
  const getChildrenForCouple = (fatherId: string | null, motherId: string | null): FamilyMember[] => {
    return members.filter(m => {
      if (fatherId && motherId) {
        return m.father_id === fatherId && m.mother_id === motherId;
      }
      if (fatherId) {
        return m.father_id === fatherId;
      }
      if (motherId) {
        return m.mother_id === motherId;
      }
      return false;
    }).sort((a, b) => {
      if (a.birth_date && b.birth_date) {
        return new Date(a.birth_date).getTime() - new Date(b.birth_date).getTime();
      }
      return 0;
    });
  };
  
  // Get all spouses for a member (supports multiple wives)
  const getSpouses = (member: FamilyMember): Array<{ spouse: FamilyMember; order: number; isActive: boolean }> => {
    // Check marriages table first (for multiple wives)
    if (member.gender === 'male') {
      const wives = marriagesMap.get(member.id);
      if (wives && wives.length > 0) {
        return wives.map(w => ({ spouse: w.wife, order: w.order, isActive: w.isActive }));
      }
    }
    
    // Fallback to spouse_id for backwards compatibility
    if (member.spouse_id && memberMap.has(member.spouse_id)) {
      return [{ spouse: memberMap.get(member.spouse_id)!, order: 1, isActive: true }];
    }
    
    // Find spouse by looking at children's parents
    const children = members.filter(m => 
      m.father_id === member.id || m.mother_id === member.id
    );
    
    // Group by spouse to find all unique spouses
    const spouseMap = new Map<string, FamilyMember>();
    for (const child of children) {
      if (member.gender === 'male' && child.mother_id && memberMap.has(child.mother_id)) {
        spouseMap.set(child.mother_id, memberMap.get(child.mother_id)!);
      }
      if (member.gender === 'female' && child.father_id && memberMap.has(child.father_id)) {
        spouseMap.set(child.father_id, memberMap.get(child.father_id)!);
      }
    }
    
    // Return all found spouses (without order info, they all get order 1)
    return Array.from(spouseMap.values()).map((spouse, idx) => ({
      spouse,
      order: idx + 1,
      isActive: true
    }));
  };
  
  // Find root members (primary lineage members without parents in the system, or oldest generation)
  const rootMembers = members.filter(member => {
    // Must be primary lineage
    if (member.is_primary_lineage === false) return false;
    
    // Check if parents exist in system
    const hasParentInSystem = 
      (member.father_id && memberMap.has(member.father_id)) ||
      (member.mother_id && memberMap.has(member.mother_id));
    
    return !hasParentInSystem;
  }).sort((a, b) => a.generation - b.generation);
  
  return { rootMembers, memberMap, getChildrenForCouple, getSpouses, marriagesMap };
}

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

export function FamilyTreeView({ members, marriages = [] }: FamilyTreeViewProps) {
  const isMobile = useIsMobile();
  const [zoom, setZoom] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hasInitializedView, setHasInitializedView] = useState(false);
  const [collapsedBranches, setCollapsedBranches] = useState<Set<string>>(new Set());
  
  // Touch gesture states
  const [isTouching, setIsTouching] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [isPinching, setIsPinching] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  
  const { rootMembers, memberMap, getChildrenForCouple, getSpouses, marriagesMap } = buildFamilyTree(members, marriages);
  
  // Find default view member
  const defaultViewMember = useMemo(() => {
    return members.find(m => m.is_default_view === true);
  }, [members]);
  
  // Calculate stats
  const stats = useMemo(() => {
    const totalMembers = members.length;
    const generations = new Set(members.map(m => m.generation));
    return {
      totalMembers,
      totalGenerations: generations.size
    };
  }, [members]);

  // Count all descendants of a member
  const countDescendants = useCallback((memberId: string): number => {
    const children = members.filter(m => m.father_id === memberId || m.mother_id === memberId);
    let count = children.length;
    for (const child of children) {
      count += countDescendants(child.id);
    }
    return count;
  }, [members]);

  // Check if a member has any children
  const hasChildren = useCallback((memberId: string): boolean => {
    return members.some(m => m.father_id === memberId || m.mother_id === memberId);
  }, [members]);

  // Toggle collapse state for a branch
  const toggleCollapse = useCallback((memberId: string) => {
    setCollapsedBranches(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }, []);

  // Auto-collapse branches from generation 7+
  useEffect(() => {
    const gen7PlusParents = members.filter(m => 
      m.generation >= 7 && hasChildren(m.id) && m.gender === 'male'
    );
    if (gen7PlusParents.length > 0) {
      setCollapsedBranches(new Set(gen7PlusParents.map(m => m.id)));
    }
  }, [members, hasChildren]);
  
  // Zoom toward/from the center of the visible viewport
  const zoomAtCenter = useCallback((newZoom: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setZoom(prev => {
      const clamped = Math.max(0.3, Math.min(3, newZoom));
      const scale = clamped / prev;
      // Adjust position so the point under the viewport center stays fixed
      setPosition(pos => ({
        x: centerX - scale * (centerX - pos.x),
        y: centerY - scale * (centerY - pos.y),
      }));
      return clamped;
    });
  }, []);

  const handleZoomIn = () => {
    zoomAtCenter(zoom + 0.2);
  };
  
  const handleZoomOut = () => {
    zoomAtCenter(zoom - 0.2);
  };
  
  const handleResetZoom = () => {
    setZoom(0.8);
    // Center on default view member if exists, otherwise center view
    if (defaultViewMember) {
      centerOnMember(defaultViewMember.id);
    } else {
      centerOnTree();
    }
  };
  
  // Center view on a specific member
  const centerOnMember = useCallback((memberId: string) => {
    if (!containerRef.current || !contentRef.current) return;
    
    const memberNode = contentRef.current.querySelector(`[data-member-id="${memberId}"]`) as HTMLElement;
    if (!memberNode) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const nodeRect = memberNode.getBoundingClientRect();
    
    // Calculate the node's position relative to the content (accounting for current zoom)
    const currentZoom = 0.8;
    const nodeRelativeX = (nodeRect.left - contentRect.left) / zoom + nodeRect.width / (2 * zoom);
    const nodeRelativeY = (nodeRect.top - contentRect.top) / zoom + nodeRect.height / (2 * zoom);
    
    // Calculate position to center the node in the container
    const newX = containerRect.width / 2 - nodeRelativeX * currentZoom;
    const newY = containerRect.height / 2 - nodeRelativeY * currentZoom;
    
    setPosition({ x: newX, y: newY });
  }, [zoom]);
  
  // Center on the entire tree
  const centerOnTree = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const contentWidth = contentRef.current.scrollWidth * 0.8;
    const contentHeight = contentRef.current.scrollHeight * 0.8;
    
    const newX = (containerRect.width - contentWidth) / 2;
    const newY = Math.max(0, (containerRect.height - contentHeight) / 2);
    
    setPosition({ x: newX, y: newY });
  }, []);
  
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
    if (!isFullscreen) {
      // When entering fullscreen, recenter after a short delay
      setTimeout(() => {
        if (defaultViewMember) {
          centerOnMember(defaultViewMember.id);
        } else {
          centerOnTree();
        }
      }, 100);
    }
  };
  
  // Handle mouse wheel zoom - requires Ctrl/Cmd key
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) {
      return;
    }
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    // Zoom toward the cursor position
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    setZoom(prev => {
      const newZoom = Math.max(0.3, Math.min(3, prev + delta));
      const scale = newZoom / prev;
      setPosition(pos => ({
        x: cursorX - scale * (cursorX - pos.x),
        y: cursorY - scale * (cursorY - pos.y),
      }));
      return newZoom;
    });
  }, []);
  
  // Handle mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start dragging if clicking on a link or button
    if ((e.target as HTMLElement).closest('a, button')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for mobile/tablet
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't start dragging if touching a link or button
    if ((e.target as HTMLElement).closest('a, button')) return;
    
    if (e.touches.length === 2) {
      // Pinch zoom start
      setIsPinching(true);
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1) {
      // Single touch drag start
      setIsTouching(true);
      setTouchStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching) {
      // Pinch zoom
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      if (lastTouchDistance > 0) {
        const scale = distance / lastTouchDistance;
        setZoom(prev => Math.max(0.3, Math.min(3, prev * scale)));
      }
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && isTouching && !isPinching) {
      // Single touch drag
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - touchStart.x,
        y: e.touches[0].clientY - touchStart.y
      });
    }
  }, [isTouching, isPinching, touchStart, lastTouchDistance]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsTouching(false);
      setIsPinching(false);
      setLastTouchDistance(0);
    } else if (e.touches.length === 1) {
      // Switched from pinch to single touch
      setIsPinching(false);
      setLastTouchDistance(0);
      setIsTouching(true);
      setTouchStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  }, [position]);

  // Handle minimap click to navigate
  const handleMinimapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Calculate relative position (0-1)
    const relativeX = clickX / rect.width;
    const relativeY = clickY / rect.height;
    
    // Calculate new position to center the view on clicked point
    const scaledContentWidth = contentSize.width * zoom;
    const scaledContentHeight = contentSize.height * zoom;
    
    const newX = -(relativeX * scaledContentWidth - containerSize.width / 2);
    const newY = -(relativeY * scaledContentHeight - containerSize.height / 2);
    
    setPosition({ x: newX, y: newY });
  }, [contentSize, containerSize, zoom]);
  
  // Add wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener("wheel", handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  // Update content and container sizes
  useEffect(() => {
    const updateSizes = () => {
      if (contentRef.current) {
        setContentSize({
          width: contentRef.current.scrollWidth,
          height: contentRef.current.scrollHeight
        });
      }
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    updateSizes();
    window.addEventListener('resize', updateSizes);
    
    // Update after a short delay to ensure content is rendered
    const timer = setTimeout(updateSizes, 100);
    
    return () => {
      window.removeEventListener('resize', updateSizes);
      clearTimeout(timer);
    };
  }, [members, zoom, isFullscreen]);

  // Initialize view on first load - center on default member or tree center
  useEffect(() => {
    if (hasInitializedView) return;
    if (!containerRef.current || !contentRef.current) return;
    if (contentSize.width === 0 || contentSize.height === 0) return;
    
    // Wait a bit for all nodes to be rendered
    const timer = setTimeout(() => {
      if (!containerRef.current || !contentRef.current) return;
      
      if (defaultViewMember) {
        // Find the node for default view member using data attribute
        const memberNode = contentRef.current.querySelector(`[data-member-id="${defaultViewMember.id}"]`) as HTMLElement;
        if (memberNode) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const nodeRect = memberNode.getBoundingClientRect();
          const contentRect = contentRef.current.getBoundingClientRect();
          
          // Calculate position relative to unscaled content
          const currentZoom = 0.8;
          const nodeRelativeX = (nodeRect.left - contentRect.left) / currentZoom + nodeRect.width / (2 * currentZoom);
          const nodeRelativeY = (nodeRect.top - contentRect.top) / currentZoom + nodeRect.height / (2 * currentZoom);
          
          // Calculate new position to center the node
          const newX = containerRect.width / 2 - nodeRelativeX * currentZoom;
          const newY = containerRect.height / 2 - nodeRelativeY * currentZoom;
          
          setZoom(0.8);
          setPosition({ x: newX, y: newY });
          setHasInitializedView(true);
        }
      } else {
        // Center on the tree
        const containerRect = containerRef.current!.getBoundingClientRect();
        const contentWidth = contentRef.current!.scrollWidth * 0.8;
        const contentHeight = contentRef.current!.scrollHeight * 0.8;
        
        const newX = (containerRect.width - contentWidth) / 2;
        const newY = 20; // Small padding from top
        
        setPosition({ x: newX, y: newY });
        setHasInitializedView(true);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [contentSize, containerSize, defaultViewMember, hasInitializedView]);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);
  
  // Render children for a specific mother
  const renderChildren = (
    children: FamilyMember[], 
    processedIds: Set<string>, 
    childrenContinueBloodline: boolean
  ): React.ReactNode => {
    if (children.length === 0) return null;
    
    return (
      <div className="flex gap-6 relative">
        {/* Horizontal line connecting siblings */}
        {children.length > 1 && (
          <div 
            className={cn(
              "absolute top-0 left-1/2 -translate-x-1/2",
              childrenContinueBloodline 
                ? "h-[3px] bg-lineage-primary" 
                : "h-[2px] bg-foreground/30"
            )}
            style={{ width: `calc(100% - 80px)` }}
          />
        )}
        
        {children.map(child => {
          const isOtherType = child.lineage_type === 'maternal';
          // Only recursively render primary lineage children or "Khác" type
          if (child.is_primary_lineage !== false || isOtherType) {
            return (
              <div key={child.id} className="relative flex flex-col items-center pt-3">
                {/* Vertical connector from horizontal line to child */}
                <div className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 h-3",
                  isOtherType 
                    ? "w-[2px] bg-foreground/30" 
                    : childrenContinueBloodline 
                      ? "w-[3px] bg-lineage-primary" 
                      : "w-[2px] bg-foreground/30"
                )} />
                {renderFamilyTree(child, processedIds)}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  // Collapse toggle button component
  const renderCollapseToggle = (memberId: string) => {
    if (!hasChildren(memberId)) return null;
    const isCollapsed = collapsedBranches.has(memberId);
    const descendantCount = countDescendants(memberId);
    
    return (
      <button
        onClick={(e) => { e.stopPropagation(); toggleCollapse(memberId); }}
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors",
          "border bg-background hover:bg-accent shadow-sm cursor-pointer z-10",
          isCollapsed ? "text-primary border-primary/40" : "text-muted-foreground border-border"
        )}
      >
        {isCollapsed ? (
          <>
            <ChevronRight className="h-3 w-3" />
            <span>+{descendantCount}</span>
          </>
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>
    );
  };

  // Render children section with collapse support
  const renderChildrenSection = (
    children: FamilyMember[],
    processedIds: Set<string>,
    childrenContinueBloodline: boolean,
    parentId: string
  ): React.ReactNode => {
    if (children.length === 0) return null;
    const isCollapsed = collapsedBranches.has(parentId);

    return (
      <div className="flex flex-col items-center">
        {/* Vertical line from couple to children */}
        <div className={cn(
          "h-3",
          childrenContinueBloodline 
            ? "w-[3px] bg-lineage-primary" 
            : "w-[2px] bg-foreground/30"
        )} />
        {/* Collapse toggle */}
        {renderCollapseToggle(parentId)}
        
        {!isCollapsed && (
          <div className="flex flex-col items-center">
            <div className={cn(
              "h-3",
              childrenContinueBloodline 
                ? "w-[3px] bg-lineage-primary" 
                : "w-[2px] bg-foreground/30"
            )} />
            {renderChildren(children, processedIds, childrenContinueBloodline)}
          </div>
        )}
      </div>
    );
  };

  // Recursive function to render family tree with multiple spouses support
  // Layout: Husband on top, wives stacked vertically below with children from each wife
  const renderFamilyTree = (primaryMember: FamilyMember, processedIds: Set<string>): React.ReactNode => {
    if (processedIds.has(primaryMember.id)) return null;
    processedIds.add(primaryMember.id);
    
    const spouses = getSpouses(primaryMember);
    const hasMultipleSpouses = spouses.length > 1;
    
    // Mark all spouses as processed
    spouses.forEach(s => processedIds.add(s.spouse.id));
    
    // Check if children continue the bloodline (họ Hà)
    const childrenContinueBloodline = primaryMember.is_primary_lineage !== false && primaryMember.gender === 'male';
    
    // Get all children grouped by mother
    const childrenByMother = new Map<string | null, FamilyMember[]>();
    
    if (primaryMember.gender === 'male') {
      spouses.forEach(({ spouse }) => {
        const children = getChildrenForCouple(primaryMember.id, spouse.id);
        childrenByMother.set(spouse.id, children);
      });
      
      // Also get children with unknown mother
      const childrenWithUnknownMother = members.filter(m => 
        m.father_id === primaryMember.id && 
        (!m.mother_id || !spouses.find(s => s.spouse.id === m.mother_id))
      );
      if (childrenWithUnknownMother.length > 0) {
        childrenByMother.set(null, childrenWithUnknownMother);
      }
    } else {
      // For female members, get children with husband
      const spouse = spouses[0]?.spouse;
      const children = getChildrenForCouple(spouse?.id || null, primaryMember.id);
      if (children.length > 0) {
        childrenByMother.set(primaryMember.id, children);
      }
    }

    // CASE: Male with multiple wives - vertical layout
    if (primaryMember.gender === 'male' && hasMultipleSpouses) {
      return (
        <div key={primaryMember.id} className="flex flex-col items-center">
          {/* Husband card */}
          <FamilyTreeNode member={primaryMember} />
          
          {/* Vertical line from husband to horizontal connector */}
          <div className={cn(
            "h-4",
            childrenContinueBloodline 
              ? "w-[3px] bg-lineage-primary" 
              : "w-[2px] bg-foreground/30"
          )} />
          
          {/* Horizontal line connecting to wives with heart icons */}
          <div className="flex items-start relative">
            {/* Horizontal connector spanning all wives */}
            <div 
              className={cn(
                "absolute top-[10px] left-0 right-0",
                childrenContinueBloodline 
                  ? "h-[3px] bg-lineage-primary" 
                  : "h-[2px] bg-foreground/30"
              )}
            />
            
            {/* Wives with their children */}
            <div className="flex gap-8">
              {spouses.map(({ spouse, order }, idx) => {
                const motherChildren = childrenByMother.get(spouse.id) || [];
                
                return (
                  <div key={spouse.id} className="flex flex-col items-center">
                    {/* Heart icon as connector */}
                    <HeartConnector className="z-10 bg-background px-1" />
                    
                    {/* Vertical line from heart to wife */}
                    <div className={cn(
                      "h-3",
                      childrenContinueBloodline 
                        ? "w-[3px] bg-lineage-primary" 
                        : "w-[2px] bg-foreground/30"
                    )} />
                    
                    {/* Wife card */}
                    <FamilyTreeNode 
                      member={spouse} 
                      isSpouse 
                      wifeOrder={order}
                    />
                    
                    {/* Children of this wife */}
                    {motherChildren.length > 0 && (
                      <div className="flex flex-col items-center mt-1">
                        {renderChildrenSection(motherChildren, processedIds, childrenContinueBloodline, primaryMember.id)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Children with unknown mother */}
          {childrenByMother.get(null) && childrenByMother.get(null)!.length > 0 && (
            <div className="flex flex-col items-center mt-4">
              {renderChildrenSection(childrenByMother.get(null)!, processedIds, childrenContinueBloodline, primaryMember.id)}
            </div>
          )}
        </div>
      );
    }
    
    // CASE: Single spouse or no spouse - horizontal layout (original)
    return (
      <div key={primaryMember.id} className="flex flex-col items-center gap-1">
        {/* Couple display */}
        <div className="flex items-center gap-1">
          <FamilyTreeNode member={primaryMember} />
          
          {spouses.length > 0 && (
            <>
              {/* Heart icon as marriage connector */}
              <HeartConnector />
              <FamilyTreeNode 
                member={spouses[0].spouse} 
                isSpouse 
              />
            </>
          )}
        </div>
        
        {/* Children */}
        {childrenByMother.size > 0 && (
          <div className="relative flex flex-col items-center">
            {renderChildrenSection(
              Array.from(childrenByMother.values()).flat(), 
              processedIds, 
              childrenContinueBloodline,
              primaryMember.id
            )}
          </div>
        )}
      </div>
    );
  };
  
  if (members.length === 0) {
    return null;
  }
  
  const processedIds = new Set<string>();

  const treeContent = (
    <>
      {/* Controls */}
      <div className={cn(
        "flex items-center gap-2 flex-wrap",
        isFullscreen && "absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm p-2 rounded-lg shadow-lg"
      )}>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          disabled={zoom <= 0.3}
          title="Thu nhỏ"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          title="Phóng to"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleResetZoom}
          title="Đặt lại"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        >
        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        {collapsedBranches.size > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCollapsedBranches(new Set())}
            title="Mở rộng tất cả"
            className="text-xs"
          >
            Mở rộng tất cả
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const parentsWithChildren = members.filter(m => m.generation >= 7 && hasChildren(m.id) && m.gender === 'male');
              setCollapsedBranches(new Set(parentsWithChildren.map(m => m.id)));
            }}
            title="Thu gọn từ đời 7"
            className="text-xs"
          >
            Thu gọn
          </Button>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
          <Move className="h-3 w-3" />
          <span className="hidden sm:inline">Giữ chuột để kéo | Ctrl/⌘ + Scroll để zoom</span>
          <span className="sm:hidden">Chạm để kéo | Chụm để zoom</span>
        </div>
      </div>

      {/* Stats floating box */}
      <div className={cn(
        "bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg px-4 py-2 pointer-events-none",
        isFullscreen ? "absolute top-4 right-4 z-10" : "absolute top-0 right-0 z-10"
      )}>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Thành viên:</span>
            <span className="font-semibold">{stats.totalMembers}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Số đời:</span>
            <span className="font-semibold">{stats.totalGenerations}</span>
          </div>
        </div>
      </div>
      
      {/* Tree container */}
      <div 
        ref={containerRef}
        className={cn(
          "overflow-hidden border rounded-lg bg-muted/30 select-none touch-none",
          isFullscreen ? "flex-1" : "min-h-[400px] max-h-[70vh]",
          isDragging || isTouching ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div 
          ref={contentRef}
          className="p-8 inline-block min-w-full transition-transform duration-75"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: 'top left'
          }}
        >
          <div className="flex flex-col items-center gap-8">
            {rootMembers.map((rootMember) => (
              renderFamilyTree(rootMember, processedIds)
            ))}
          </div>
        </div>

        {/* Mini-map */}
        {(zoom > 1 || position.x !== 0 || position.y !== 0) && contentSize.width > 0 && (
          <div 
            className="absolute bottom-4 right-4 z-10 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-2 cursor-pointer"
            onClick={handleMinimapClick}
          >
            <div className="text-[10px] text-muted-foreground mb-1 text-center">Mini-map</div>
            <div 
              className="relative bg-muted/50 rounded border overflow-hidden"
              style={{ 
                width: 120, 
                height: Math.min(80, (contentSize.height / contentSize.width) * 120) || 60 
              }}
            >
              {/* Content representation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-lineage-primary opacity-50" />
              </div>
              
              {/* Viewport indicator */}
              <div 
                className="absolute border-2 border-primary rounded bg-primary/10 pointer-events-none"
                style={{
                  width: Math.max(10, (containerSize.width / (contentSize.width * zoom)) * 120),
                  height: Math.max(8, (containerSize.height / (contentSize.height * zoom)) * (contentSize.height / contentSize.width * 120)),
                  left: Math.max(0, Math.min(120 - 10, (-position.x / (contentSize.width * zoom)) * 120)),
                  top: Math.max(0, Math.min(60, (-position.y / (contentSize.height * zoom)) * (contentSize.height / contentSize.width * 120)))
                }}
              />
            </div>
          </div>
        )}
      </div>
      
    </>
  );
  
  // Fullscreen mode
  if (isFullscreen) {
    return (
      <div 
        ref={fullscreenRef}
        className="fixed inset-0 z-50 bg-background flex flex-col p-4 gap-4"
      >
        {treeContent}
      </div>
    );
  }
  
  return (
    <div className="relative space-y-4">
      {treeContent}
    </div>
  );
}
