import { useState, useEffect, useCallback } from "react";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState } from "@excalidraw/excalidraw/types";

export interface Workspace {
  id: string;
  name: string;
  createdAt: number;
}

const STORAGE_KEY_LIST = "excalidraw_workspaces";
const STORAGE_KEY_ACTIVE = "excalidraw_active_workspace";
const storageKey = (id: string) => `excalidraw_workspace_${id}`;

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
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

function saveActiveWorkspaceId(id: string): void {
  localStorage.setItem(STORAGE_KEY_ACTIVE, id);
}

function loadActiveWorkspaceId(): string {
  return localStorage.getItem(STORAGE_KEY_ACTIVE) || "";
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function makeUniqueWorkspaceName(
  desiredName: string,
  existingNames: readonly string[],
): string {
  const normalizedExisting = new Set(existingNames.map((name) => normalizeName(name)));
  const base = normalizeName(desiredName) || "Sheet";
  if (!normalizedExisting.has(base)) {
    return base;
  }

  let counter = 2;
  while (normalizedExisting.has(`${base} ${counter}`)) {
    counter += 1;
  }
  return `${base} ${counter}`;
}

function makeDefaultSheetName(existingNames: readonly string[]): string {
  const normalizedExisting = new Set(existingNames.map((name) => normalizeName(name)));
  let counter = 1;
  let candidate = `Sheet ${counter}`;
  while (normalizedExisting.has(candidate)) {
    counter += 1;
    candidate = `Sheet ${counter}`;
  }
  return candidate;
}

export function loadWorkspaceData(id: string): {
  elements: ExcalidrawElement[];
  appState: Partial<AppState>;
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
  elements: readonly ExcalidrawElement[],
  appState: Partial<AppState>,
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
    const persistedActiveId = loadActiveWorkspaceId();
    const nextActiveId =
      list.find((workspace) => workspace.id === persistedActiveId)?.id || list[0]?.id || "";
    setActiveId(nextActiveId);
    if (nextActiveId) {
      saveActiveWorkspaceId(nextActiveId);
    }
  }, []);

  useEffect(() => {
    if (activeId) {
      saveActiveWorkspaceId(activeId);
    }
  }, [activeId]);

  const addWorkspace = useCallback((name: string) => {
    const wsId = generateId();
    setWorkspaces((prev) => {
      const resolvedName =
        normalizeName(name).length > 0
          ? makeUniqueWorkspaceName(name, prev.map((workspace) => workspace.name))
          : makeDefaultSheetName(prev.map((workspace) => workspace.name));
      const ws: Workspace = {
        id: wsId,
        name: resolvedName,
        createdAt: Date.now(),
      };
      const next = [...prev, ws];
      saveWorkspaceList(next);
      return next;
    });
    setActiveId(wsId);
    return wsId;
  }, []);

  const renameWorkspace = useCallback((id: string, name: string) => {
    setWorkspaces((prev) => {
      const current = prev.find((workspace) => workspace.id === id);
      if (!current) {
        return prev;
      }
      const siblingNames = prev
        .filter((workspace) => workspace.id !== id)
        .map((workspace) => workspace.name);
      const resolvedName =
        normalizeName(name).length > 0
          ? makeUniqueWorkspaceName(name, siblingNames)
          : current.name;
      const next = prev.map((w) =>
        w.id === id ? { ...w, name: resolvedName } : w,
      );
      saveWorkspaceList(next);
      return next;
    });
  }, []);

  const removeWorkspace = useCallback(
    (id: string) => {
      setWorkspaces((prev) => {
        if (prev.length === 1) return prev; // keep at least one
        const removedIndex = prev.findIndex((workspace) => workspace.id === id);
        const next = prev.filter((w) => w.id !== id);
        saveWorkspaceList(next);
        deleteWorkspaceData(id);

        if (activeId === id) {
          const fallbackIndex = Math.min(removedIndex, next.length - 1);
          const nextActiveId = next[fallbackIndex]?.id || next[0]?.id || "";
          setActiveId(nextActiveId);
        }

        return next;
      });
    },
    [activeId],
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
