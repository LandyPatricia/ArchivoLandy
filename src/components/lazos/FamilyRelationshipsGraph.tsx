import { useEffect, useRef } from "react";
import cytoscape, { type Core, type ElementDefinition, type LayoutOptions } from "cytoscape";
import {
  REL_DIRECTED,
  REL_LABEL,
  REL_STYLE,
  initials,
  isFlorTabasco,
  personMunicipality,
  personYear,
  type Person,
  type Relationship,
  type RelKey,
} from "@/lib/lazos-data";

export type ViewMode = "families" | "time" | "municipalities";

type Props = {
  people: Person[];
  relationships: Relationship[];
  view: ViewMode;
  familyIndex: Map<string, string>; // personId -> familyId
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onEdgeSelect?: (rel: Relationship | null) => void;
};

export function FamilyRelationshipsGraph({
  people, relationships, view, familyIndex, selectedId, hoveredId, onSelect, onHover, onEdgeSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);

  // Init once
  useEffect(() => {
    if (!containerRef.current || cyRef.current) return;
    cyRef.current = cytoscape({
      container: containerRef.current,
      wheelSensitivity: 0.2,
      minZoom: 0.3,
      maxZoom: 2.5,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#F7F1E1",
            "border-color": "#D21034",
            "border-width": 2,
            width: 54,
            height: 54,
            label: "data(initials)",
            "text-valign": "center",
            "text-halign": "center",
            "font-family": "Cormorant Garamond, serif",
            "font-size": 18,
            color: "#1E1E1E",
            "text-outline-color": "#F7F1E1",
            "text-outline-width": 2,
          } as any,
        },
        {
          selector: "node[portrait]",
          style: {
            "background-image": "data(portrait)",
            "background-fit": "cover cover",
          } as any,
        },
        {
          selector: "node.flor",
          style: {
            "border-color": "#C8A24B",
            "border-width": 4,
            "border-style": "double",
          } as any,
        },
        { selector: "node.pending", style: { "border-style": "dashed" } as any },
        { selector: "node.dim", style: { opacity: 0.18 } as any },
        { selector: "node.focus", style: { "border-width": 5, width: 62, height: 62 } as any },
        { selector: "node:selected", style: { "border-color": "#1E1E1E", "border-width": 5 } as any },
        {
          selector: "node.label-visible",
          style: {
            label: "data(name)",
            "text-valign": "bottom",
            "text-margin-y": 6,
            "font-family": "Inter, sans-serif",
            "font-size": 11,
          } as any,
        },
        {
          selector: "edge",
          style: {
            width: 1.6,
            "line-color": "data(color)",
            "target-arrow-color": "data(color)",
            "curve-style": "bezier",
            opacity: 0.7,
            "font-family": "Inter, sans-serif",
            "font-size": 9,
            color: "#1E1E1E",
            "text-background-color": "#F7F1E1",
            "text-background-opacity": 0.85,
            "text-background-padding": 2,
          } as any,
        },
        { selector: "edge.dashed", style: { "line-style": "dashed" } as any },
        { selector: "edge.directed", style: { "target-arrow-shape": "triangle" } as any },
        { selector: "edge.dim", style: { opacity: 0.08 } as any },
        { selector: "edge.focus", style: { width: 3, opacity: 1, label: "data(label)" } as any },
      ],
      elements: [],
    });

    const cy = cyRef.current;
    cy.on("mouseover", "node", (e) => onHover(e.target.id()));
    cy.on("mouseout", "node", () => onHover(null));
    cy.on("tap", "node", (e) => { onSelect(e.target.id()); onEdgeSelect?.(null); });
    cy.on("tap", "edge", (e) => {
      const relId = e.target.data("relId");
      const rel = relationships.find((r) => r.id === relId) ?? null;
      onEdgeSelect?.(rel);
    });
    cy.on("tap", (e) => { if (e.target === cy) { onSelect(null); onEdgeSelect?.(null); } });

    const ro = new ResizeObserver(() => cy.resize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update elements and layout when data or view changes
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const visibleIds = new Set(people.map((p) => p.id));
    const nodes: ElementDefinition[] = people.map((p) => {
      const yr = personYear(p);
      const mu = personMunicipality(p);
      const classes: string[] = [];
      if (isFlorTabasco(p)) classes.push("flor");
      if (p.verification === "investigating" || p.verification === "community") classes.push("pending");
      const data: Record<string, any> = {
        id: p.id,
        name: p.full_name.split(/\s+/).slice(0, 2).join(" "),
        fullName: p.full_name,
        initials: initials(p.full_name),
        year: yr ?? 0,
        municipality: mu?.name ?? "",
        familyId: familyIndex.get(p.id) ?? p.id,
      };
      if (p.portrait) data.portrait = p.portrait;
      return { data, classes: classes.join(" ") };
    });

    const edges: ElementDefinition[] = relationships
      .filter((r) => visibleIds.has(r.person_a) && visibleIds.has(r.person_b))
      .map((r) => {
        const rk = r.relationship as RelKey;
        const s = REL_STYLE[rk];
        const classes: string[] = [];
        if (s.dashed || r.verification === "investigating") classes.push("dashed");
        if (REL_DIRECTED[rk]) classes.push("directed");
        return {
          data: {
            id: r.id,
            relId: r.id,
            source: r.person_a,
            target: r.person_b,
            color: s.color,
            label: REL_LABEL[rk],
          },
          classes: classes.join(" "),
        };
      });

    cy.elements().remove();
    cy.add([...nodes, ...edges]);

    const layout = buildLayout(view, cy);
    cy.layout(layout).run();
    // Fit after a tick so layout settles
    requestAnimationFrame(() => cy.fit(undefined, 40));
  }, [people, relationships, view, familyIndex]);

  // Hover / selection styling
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.elements().removeClass("dim focus label-visible");
      const focusId = hoveredId ?? selectedId;
      if (!focusId) return;
      const node = cy.getElementById(focusId);
      if (!node || node.empty()) return;
      const neighborhood = node.closedNeighborhood();
      cy.elements().not(neighborhood).addClass("dim");
      node.addClass("focus label-visible");
      neighborhood.nodes().addClass("label-visible");
      neighborhood.edges().addClass("focus");
    });
  }, [hoveredId, selectedId]);

  // El alto lo manda el contenedor. El minimo es solo una red por si nadie lo
  // fija: a 560 px se salia del marco en movil, donde la caja mide 26 rem.
  return <div ref={containerRef} className="w-full h-full min-h-[18rem] bg-card rounded-lg" />;
}

function buildLayout(view: ViewMode, cy: Core): LayoutOptions {
  if (view === "time") {
    const nodes = cy.nodes();
    const years = nodes.map((n) => n.data("year") as number).filter((y) => y > 0);
    const minY = years.length ? Math.min(...years) : 1950;
    const maxY = years.length ? Math.max(...years) : 2026;
    const span = Math.max(maxY - minY, 1);
    // group by family vertically, x by year
    const famBuckets = new Map<string, string[]>();
    nodes.forEach((n) => {
      const f = n.data("familyId") as string;
      const arr = famBuckets.get(f) ?? [];
      arr.push(n.id());
      famBuckets.set(f, arr);
    });
    const famList = [...famBuckets.keys()];
    const rowH = 90;
    const width = 1000;
    const positions: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n) => {
      const y = n.data("year") as number;
      const famIdx = famList.indexOf(n.data("familyId") as string);
      const x = 60 + ((y - minY) / span) * (width - 120);
      positions[n.id()] = { x, y: 60 + famIdx * rowH };
    });
    return {
      name: "preset",
      positions: (node: any) => positions[node.id()] ?? { x: 0, y: 0 },
      fit: true,
      padding: 40,
    } as LayoutOptions;
  }
  if (view === "municipalities") {
    const nodes = cy.nodes();
    const muniBuckets = new Map<string, string[]>();
    nodes.forEach((n) => {
      const m = (n.data("municipality") as string) || "—";
      const arr = muniBuckets.get(m) ?? [];
      arr.push(n.id());
      muniBuckets.set(m, arr);
    });
    const munis = [...muniBuckets.keys()].sort();
    const cols = Math.ceil(Math.sqrt(munis.length)) || 1;
    const cellW = 300, cellH = 260;
    const positions: Record<string, { x: number; y: number }> = {};
    munis.forEach((m, i) => {
      const cx = (i % cols) * cellW + cellW / 2;
      const cy2 = Math.floor(i / cols) * cellH + cellH / 2;
      const ids = muniBuckets.get(m) ?? [];
      ids.forEach((id, j) => {
        const angle = (j / Math.max(ids.length, 1)) * Math.PI * 2;
        const r = Math.min(90, 30 + ids.length * 6);
        positions[id] = { x: cx + r * Math.cos(angle), y: cy2 + r * Math.sin(angle) };
      });
    });
    return {
      name: "preset",
      positions: (node: any) => positions[node.id()] ?? { x: 0, y: 0 },
      fit: true,
      padding: 40,
    } as LayoutOptions;
  }
  // families: cose grouped by familyId
  return {
    name: "cose",
    animate: false,
    padding: 40,
    nodeRepulsion: () => 8000,
    idealEdgeLength: () => 90,
    edgeElasticity: () => 100,
    gravity: 0.3,
  } as any;
}
