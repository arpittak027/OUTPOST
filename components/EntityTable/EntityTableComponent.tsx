import { useState } from "react";
import { useEditor, useIsEditing } from "tldraw";
import {
  HEADER_HEIGHT,
  ROW_HEIGHT,
  getTableHeight,
  newRow,
  type EntityRow,
  type EntityTableShape,
} from "@/components/EntityTable/EntityTableShape";

export function EntityTableComponent({ shape }: { shape: EntityTableShape }) {
  const editor = useEditor();
  // Editing state is a tldraw signal; useIsEditing subscribes to it so this re-renders on change.
  const isEditing = useIsEditing(shape.id);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const { rows, tableName, w } = shape.props;
  // Computed from the rows, not props.h, which only updates on resize and can be stale.
  const height = getTableHeight(rows.length);

  const updateShape = (props: Partial<EntityTableShape["props"]>) =>
    editor.updateShape({ id: shape.id, type: "entity-table", props });
  const setRows = (next: EntityRow[]) => updateShape({ rows: next, h: getTableHeight(next.length) });
  const updateRow = (rowId: string, patch: Partial<EntityRow>) =>
    setRows(rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));

  const addRow = () => {
    const row = newRow();
    setRows([...rows, row]);
    // Start editing the new row right away.
    setEditingRowId(row.id);
  };

  return (
    // No overflow-hidden here, so "+ Add row" can render below the table; the inner div clips instead.
    <div
      // pointer-events always on: the arrow tool needs to hit-test the table to bind to it.
      style={{ width: w, height, pointerEvents: "auto" }}
      className="relative text-left shadow-2xl transition-all"
      // Only swallow events while editing, so the shape can still be selected and dragged.
      onPointerDown={(e) => isEditing && e.stopPropagation()}
    >
      <div className="h-full overflow-hidden rounded-xl border border-white/12 bg-[#16171e] shadow-xl">
        <div
          style={{ height: HEADER_HEIGHT }}
          className="flex items-center bg-[#201d19] border-b border-white/8 px-3 text-xs font-semibold text-zinc-100"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-amber-400 mr-2 shrink-0">
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <line x1="2" y1="6" x2="14" y2="6" />
            <line x1="7" y1="6" x2="7" y2="14" />
          </svg>
          {isEditing ? (
            <input
              value={tableName}
              onChange={(e) => updateShape({ tableName: e.target.value })}
              className="w-full bg-transparent font-semibold text-amber-200 outline-none"
              autoFocus
            />
          ) : (
            <span className="font-semibold text-amber-200 tracking-wide">{tableName}</span>
          )}
        </div>

        {rows.map((row) => {
          const isEditingRow = isEditing && editingRowId === row.id;
          const doneOnEnter = (e: React.KeyboardEvent) => e.key === "Enter" && setEditingRowId(null);
          return (
            <div
              key={row.id}
              style={{ height: ROW_HEIGHT }}
              className="flex items-center gap-2 border-t border-white/5 px-3 text-xs hover:bg-white/3 transition-colors"
              onDoubleClick={() => isEditing && setEditingRowId(row.id)}
            >
              {isEditingRow ? (
                <>
                  <KeyBadge label="PK" on={row.isPK} editing={isEditingRow} onToggle={() => updateRow(row.id, { isPK: !row.isPK })} />
                  <KeyBadge label="FK" on={row.isFK} editing={isEditingRow} onToggle={() => updateRow(row.id, { isFK: !row.isFK })} />
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    onKeyDown={doneOnEnter}
                    className="min-w-0 flex-1 bg-transparent text-zinc-200 outline-none font-mono"
                    placeholder="column_name"
                    autoFocus
                  />
                  <input
                    value={row.dataType}
                    onChange={(e) => updateRow(row.id, { dataType: e.target.value })}
                    onKeyDown={doneOnEnter}
                    className="w-20 shrink-0 bg-transparent text-right text-zinc-400 outline-none"
                    placeholder="type"
                  />
                  <button
                    onClick={() => setEditingRowId(null)}
                    title="Done editing row"
                    className="text-zinc-400 hover:text-white"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setRows(rows.filter((r) => r.id !== row.id))}
                    title="Remove row"
                    className="text-zinc-400 hover:text-red-400"
                  >
                    ×
                  </button>
                </>
              ) : (
                <>
                  <span className={`min-w-0 flex-1 truncate font-mono text-[11px] ${row.name ? "text-zinc-200" : "italic text-zinc-500"}`}>
                    {row.name || "unnamed column"}
                  </span>
                  <span className="text-[11px] text-zinc-400 shrink-0 font-sans">{row.dataType}</span>
                  <KeyBadge label="PK" on={row.isPK} editing={false} onToggle={() => {}} />
                  <KeyBadge label="FK" on={row.isFK} editing={false} onToggle={() => {}} />
                </>
              )}
            </div>
          );
        })}
      </div>

      {isEditing && (
        <button
          onClick={addRow}
          className="absolute inset-x-0 top-full mt-1.5 rounded-lg border border-white/15 bg-[#171821] py-1 text-xs font-medium text-zinc-300 shadow-xl hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          + Add row
        </button>
      )}
    </div>
  );
}

// PK/FK tag matching reference video
function KeyBadge({ label, on, editing, onToggle }: { label: "PK" | "FK"; on: boolean; editing: boolean; onToggle: () => void }) {
  const badgeClasses = label === "PK"
    ? "bg-[#f59e0b] text-black font-bold text-[9px] px-1.5 py-0.5 rounded shadow-sm tracking-wide"
    : "bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold text-[9px] px-1.5 py-0.5 rounded tracking-wide";

  if (!editing) return on ? <span className={badgeClasses}>{label}</span> : null;
  return (
    <button
      onClick={onToggle}
      title={label === "PK" ? "Toggle primary key" : "Toggle foreign key"}
      className={`rounded px-1.5 py-0.5 text-[9px] font-bold cursor-pointer transition-all ${
        on ? badgeClasses : "text-zinc-500 hover:text-zinc-300 bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}
