"use client";
import { useState, useEffect, useCallback } from "react";

export interface Workspace {
  id: string;
  name: string;
  createdAt: number;
}

const STORAGE_KEY_LIST = "excalidraw_workspaces";
const storageKey = (id: string) => `excalidraw_workspace_${id}`;

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function loadWorkspaces(): Workspace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIST);
    if (raw) {
      return JSON.parse(raw) as Workspace[];
    }
  } catch {
    // ignore parse errors
  }
  const defaultWorkspace: Workspace = {
    id: generateId(),
    name: "Sheet 1",
    createdAt: Date.now(),
  };
  saveWorkspaceList([defaultWorkspace]);
  return [defaultWorkspace];
}

function saveWorkspaceList(workspaces: Workspace[]): void {
  localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(workspaces));
}

export function loadWorkspaceData(id: string): {
  elements: any[];
  appState: Record<string, any>;
} {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return { elements: [], appState: {} };
}

export function saveWorkspaceData(
  id: string,
  elements: readonly any[],
  appState: Record<string, any>,
): void {
  localStorage.setItem(
    storageKey(id),
    JSON.stringify({ elements, appState }),
  );
}

export function deleteWorkspaceData(id: string): void {
  localStorage.removeItem(storageKey(id));
}

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const list = loadWorkspaces();
    setWorkspaces(list);
    setActiveId(list[0].id);
  }, []);

  const addWorkspace = useCallback((name: string) => {
    const ws: Workspace = {
      id: generateId(),
      name: name.trim() || `Sheet ${Date.now()}`,
      createdAt: Date.now(),
    };
    setWorkspaces((prev) => {
      const next = [...prev, ws];
      saveWorkspaceList(next);
      return next;
    });
    setActiveId(ws.id);
    return ws.id;
  }, []);

  const renameWorkspace = useCallback((id: string, name: string) => {
    setWorkspaces((prev) => {
      const next = prev.map((w) =>
        w.id === id ? { ...w, name: name.trim() || w.name } : w,
      );
      saveWorkspaceList(next);
      return next;
    });
  }, []);

  const removeWorkspace = useCallback(
    (id: string) => {
      setWorkspaces((prev) => {
        if (prev.length === 1) return prev; // keep at least one
        const next = prev.filter((w) => w.id !== id);
        saveWorkspaceList(next);
        deleteWorkspaceData(id);
        return next;
      });
      setActiveId((prev) => {
        if (prev !== id) return prev;
        // switch to first remaining workspace
        const remaining = workspaces.filter((w) => w.id !== id);
        return remaining[0]?.id ?? "";
      });
    },
    [workspaces],
  );

  const switchWorkspace = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  return {
    workspaces,
    activeId,
    addWorkspace,
    renameWorkspace,
    removeWorkspace,
    switchWorkspace,
  };
}
