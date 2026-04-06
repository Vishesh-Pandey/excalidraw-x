"use client";
import React, { useMemo, useEffect, useCallback, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI, AppState } from "@excalidraw/excalidraw/types";

import "@excalidraw/excalidraw/index.css";

import { useWorkspaces, loadWorkspaceData, saveWorkspaceData } from "./workspaces/useWorkspaces";
import WorkspaceBar from "./workspaces/WorkspaceBar";

import "./excalidrawWrapper.css";

const ExcalidrawWrapper: React.FC = () => {
  const {
    workspaces,
    activeId,
    addWorkspace,
    renameWorkspace,
    removeWorkspace,
    switchWorkspace,
  } = useWorkspaces();

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  // Save current scene to localStorage for the given workspace id
  const saveCurrentScene = useCallback(
    (id: string) => {
      if (!excalidrawAPI || !id) return;
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      // Only persist a subset of appState that is meaningful across sessions
      const persistedAppState: Partial<AppState> = {
        viewBackgroundColor: appState.viewBackgroundColor,
        currentItemFontFamily: appState.currentItemFontFamily,
        theme: appState.theme,
      };
      saveWorkspaceData(id, elements, persistedAppState);
    },
    [excalidrawAPI],
  );

  // Persist current sheet on tab close/reload.
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentScene(activeId);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [activeId, saveCurrentScene]);

  // Auto-save active sheet whenever the scene changes.
  const handleChange = useCallback(() => {
    saveCurrentScene(activeId);
  }, [activeId, saveCurrentScene]);

  const handleSwitch = useCallback(
    (id: string) => {
      if (id === activeId) {
        return;
      }
      saveCurrentScene(activeId);
      switchWorkspace(id);
    },
    [activeId, saveCurrentScene, switchWorkspace],
  );

  const handleAdd = useCallback(
    (name: string) => {
      saveCurrentScene(activeId);
      addWorkspace(name);
    },
    [activeId, addWorkspace, saveCurrentScene],
  );

  const handleRemove = useCallback(
    (id: string) => {
      if (id === activeId) {
        saveCurrentScene(activeId);
      }
      removeWorkspace(id);
    },
    [activeId, removeWorkspace, saveCurrentScene],
  );

  const initialData = useMemo(() => {
    if (!activeId) {
      return {
        elements: [],
        appState: {},
      };
    }
    return loadWorkspaceData(activeId);
  }, [activeId]);

  return (
    <div className="workspace-root">
      <WorkspaceBar
        workspaces={workspaces}
        activeId={activeId}
        onSwitch={handleSwitch}
        onAdd={handleAdd}
        onRename={renameWorkspace}
        onRemove={handleRemove}
      />
      <div className="excalidraw-container">
        <Excalidraw
          key={activeId || "default-sheet"}
          onExcalidrawAPI={setExcalidrawAPI}
          initialData={initialData}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default ExcalidrawWrapper;
