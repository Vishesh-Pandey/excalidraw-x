"use client";
import React, { useState, useRef, useEffect } from "react";
import type { Workspace } from "./useWorkspaces";
import styles from "./WorkspaceBar.module.css";

interface WorkspaceBarProps {
  workspaces: Workspace[];
  activeId: string;
  onSwitch: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

export default function WorkspaceBar({
  workspaces,
  activeId,
  onSwitch,
  onAdd,
  onRename,
  onRemove,
}: WorkspaceBarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const newInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [adding]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleAddConfirm = () => {
    const name = newName.trim();
    onAdd(name || `Sheet ${workspaces.length + 1}`);
    setNewName("");
    setAdding(false);
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAddConfirm();
    if (e.key === "Escape") {
      setNewName("");
      setAdding(false);
    }
  };

  const startRename = (ws: Workspace) => {
    setEditingId(ws.id);
    setEditingName(ws.name);
  };

  const handleRenameConfirm = () => {
    if (editingId) {
      onRename(editingId, editingName);
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRenameConfirm();
    if (e.key === "Escape") {
      setEditingId(null);
      setEditingName("");
    }
  };

  return (
    <div className={styles.bar}>
      <span className={styles.label}>Sheets</span>
      <div className={styles.tabs}>
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className={`${styles.tab} ${ws.id === activeId ? styles.active : ""}`}
            onClick={() => onSwitch(ws.id)}
            title={ws.name}
          >
            {editingId === ws.id ? (
              <input
                ref={editInputRef}
                className={styles.renameInput}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleRenameConfirm}
                onKeyDown={handleRenameKeyDown}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span
                  className={styles.tabName}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startRename(ws);
                  }}
                >
                  {ws.name}
                </span>
                {workspaces.length > 1 && (
                  <button
                    className={styles.deleteBtn}
                    title="Delete sheet"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(ws.id);
                    }}
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </div>
        ))}

        {adding ? (
          <div className={styles.newTab}>
            <input
              ref={newInputRef}
              className={styles.newInput}
              placeholder={`Sheet ${workspaces.length + 1}`}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleAddConfirm}
              onKeyDown={handleAddKeyDown}
            />
          </div>
        ) : (
          <button
            className={styles.addBtn}
            title="New sheet"
            onClick={() => setAdding(true)}
          >
            + New Sheet
          </button>
        )}
      </div>
    </div>
  );
}
