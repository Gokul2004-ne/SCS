import { useEffect, useMemo } from 'react';
import { ReactFlow, ReactFlowProvider, Background, Controls, MarkerType, useReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Crosshair, Maximize2 } from 'lucide-react';
import { FRAMEWORKS } from '@/lib/knowledge/sources';
import type { Clause, Dependency } from '@/lib/knowledge/types';
import { DEP_STYLE } from './bits';

interface Props { clauses: Clause[]; deps: Dependency[]; selectedId: string | null; onSelect: (id: string) => void }

function layout(clauses: Clause[], deps: Dependency[], selectedId: string | null) {
  const ids = new Set<string>();
  deps.forEach((d) => { ids.add(d.sourceId); ids.add(d.targetId); });
  if (selectedId) ids.add(selectedId);
  const neighbours = new Set<string>();
  if (selectedId) deps.forEach((d) => { if (d.sourceId === selectedId) neighbours.add(d.targetId); if (d.targetId === selectedId) neighbours.add(d.sourceId); });
  const cols = FRAMEWORKS.map((f) => f.id);
  const rowIdx: Record<string, number> = {};
  const nodes: Node[] = [];
  const byId = new Map(clauses.map((c) => [c.id, c]));
  [...ids].map((id) => byId.get(id)).filter((c): c is Clause => !!c)
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))
    .forEach((c) => {
      const col = Math.max(0, cols.indexOf(c.frameworkId));
      const row = (rowIdx[c.frameworkId] = (rowIdx[c.frameworkId] ?? -1) + 1);
      const fw = FRAMEWORKS[col];
      const isSel = c.id === selectedId;
      const isNb = neighbours.has(c.id);
      const dim = !!selectedId && !isSel && !isNb;
      nodes.push({
        id: c.id,
        position: { x: col * 290 + (row % 2) * 24, y: row * 96 },
        data: {
          label: (
            <div className="text-left">
              <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] opacity-70">{fw?.code}</div>
              <div className="font-mono text-[12px] font-semibold">{c.number}</div>
              <div className="line-clamp-2 text-[11px] leading-tight">{c.title}</div>
            </div>
          ),
        },
        style: {
          width: 200, padding: 8, borderRadius: 6, fontFamily: 'var(--app-font-sans)',
          background: isSel ? 'hsl(228 55% 24%)' : 'hsl(44 45% 98%)',
          color: isSel ? 'hsl(42 50% 96%)' : 'hsl(226 38% 13%)',
          border: `1.5px solid ${isSel ? 'hsl(36 88% 52%)' : isNb ? 'hsl(36 88% 50%)' : 'hsl(38 20% 80%)'}`,
          boxShadow: isSel ? '0 8px 20px -8px hsl(228 40% 20% / .5)' : 'none',
          opacity: dim ? 0.42 : 1,
        },
      });
    });
  const edges: Edge[] = deps.map((d) => {
    const s = DEP_STYLE[d.type];
    const active = !!selectedId && (d.sourceId === selectedId || d.targetId === selectedId);
    const dim = !!selectedId && !active;
    return {
      id: d.id, source: d.sourceId, target: d.targetId, label: d.type,
      markerEnd: { type: MarkerType.ArrowClosed, color: s.color, width: 18, height: 18 },
      style: { stroke: s.color, strokeWidth: active ? 2.4 : 1.4, opacity: dim ? 0.25 : 1, strokeDasharray: d.type === 'Related' ? '5 4' : undefined },
      labelStyle: { fontSize: 10, fontWeight: 600, fill: s.color },
      labelBgStyle: { fill: 'hsl(44 45% 98%)' },
      labelBgPadding: [4, 2] as [number, number],
      animated: active && d.type === 'Requires',
    };
  });
  return { nodes, edges };
}

function Inner({ clauses, deps, selectedId, onSelect }: Props) {
  const { nodes, edges } = useMemo(() => layout(clauses, deps, selectedId), [clauses, deps, selectedId]);
  const rf = useReactFlow();
  const focus = () => { if (selectedId) rf.fitView({ nodes: [{ id: selectedId }], duration: 350, maxZoom: 1.25, padding: 1.2 }); };
  useEffect(() => {
    const t = setTimeout(() => { if (selectedId && nodes.some((n) => n.id === selectedId)) rf.fitView({ nodes: [{ id: selectedId }], duration: 350, maxZoom: 1.25, padding: 1.2 }); }, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes} edges={edges} fitView minZoom={0.2} maxZoom={2}
        nodesConnectable={false} nodesDraggable elementsSelectable
        onNodeClick={(_, n) => onSelect(n.id)}
        aria-label="Directed dependency graph"
      >
        <Background gap={18} size={1} color="hsl(38 18% 78%)" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
      <div className="absolute left-2 top-2 flex gap-1.5">
        <button type="button" data-testid="button-graph-fit" onClick={() => rf.fitView({ duration: 350, padding: 0.2 })} className="inline-flex items-center gap-1 rounded-[4px] border border-input bg-card/95 px-2 py-1 text-[11px] font-semibold shadow-xs hover:border-primary/50">
          <Maximize2 className="h-3 w-3" /> Fit all
        </button>
        <button type="button" data-testid="button-graph-focus" disabled={!selectedId} onClick={focus} className="inline-flex items-center gap-1 rounded-[4px] border border-input bg-card/95 px-2 py-1 text-[11px] font-semibold shadow-xs hover:border-primary/50 disabled:opacity-40">
          <Crosshair className="h-3 w-3" /> Focus selected
        </button>
      </div>
      {deps.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 mx-auto w-fit max-w-[90%] rounded-md border border-dashed border-border bg-card/95 px-4 py-2.5 text-center text-[12px] text-muted-foreground">
          No dependencies recorded yet. Select a clause and use <span className="font-semibold text-foreground">Add dependency</span> to draw the first arrow.
        </div>
      )}
    </div>
  );
}

export function DependencyGraph(p: Props) {
  return <ReactFlowProvider><Inner {...p} /></ReactFlowProvider>;
}
