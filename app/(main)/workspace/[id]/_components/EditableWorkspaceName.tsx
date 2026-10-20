"use client";

import { useState, useRef } from "react";
import { updateWorkspace } from "@/actions/workspace";
import { useFetch } from "@/hooks/use-fetch";

export function EditableWorkspaceName({
  workspaceId,
  initialName,
}: {
  workspaceId: string;
  initialName: string;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [prevInitialName, setPrevInitialName] = useState(initialName);
  const { fn: updateWorkspaceFn } = useFetch(updateWorkspace);

  if (initialName !== prevInitialName) {
    setPrevInitialName(initialName);
    if (!editing) {
      setName(initialName);
    }
  }

  const isCommittingRef = useRef(false);

  const commit = async () => {
    if (isCommittingRef.current) return;
    isCommittingRef.current = true;
    setEditing(false);
    try {
      const trimmed = name.trim();
      // Nothing to save — revert rather than firing a no-op mutation.
      if (!trimmed || trimmed === initialName) {
        setName(initialName);
        return;
      }
      await updateWorkspaceFn(workspaceId, trimmed);
    } finally {
      isCommittingRef.current = false;
    }
  };

  if (editing) {
    return (
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setName(initialName);
            setEditing(false);
          }
        }}
        autoFocus
        className="rounded px-2 py-0.5 text-sm font-semibold text-white bg-white/[0.06] border border-amber-500/50 outline-none focus:ring-1 focus:ring-amber-500/30 transition-all shadow-sm"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click to rename workspace"
      className="rounded px-2 py-0.5 text-sm font-semibold text-zinc-100 hover:text-white hover:bg-white/[0.06] transition-colors border border-transparent hover:border-white/10 cursor-pointer"
    >
      {name}
    </button>
  );
}
