import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Project,
  Room,
  Staircase,
  Fireplace,
  ClientInfo,
  QuoteBuilder,
  Quote,
  GlobalPaintDefaults,
} from "../types/painting";
import { v4 as uuidv4 } from "uuid";
import { getDefaultQuoteBuilder, getDefaultPaintOptions } from "../utils/calculations";

// Helper function to get default global paint defaults
function getDefaultGlobalPaintDefaults(): GlobalPaintDefaults {
  return {
    paintWalls: true,
    paintCeilings: true,
    paintTrim: true,
    paintBaseboards: true,
    paintDoors: false,
    paintDoorJambs: false,
    paintWindows: false,
    paintCrownMoulding: false,
    paintClosetInteriors: true,
    includeStaircases: true,
    includeFireplaces: true,
    // Default coats for new rooms
    defaultWallCoats: 2,
    defaultCeilingCoats: 2,
    defaultTrimCoats: 2,
    defaultDoorCoats: 2,
  };
}

// Helper function to create a default quote
function createDefaultQuote(title: string = "Quote A"): Quote {
  return {
    id: uuidv4(),
    title,
    quoteBuilder: getDefaultQuoteBuilder(),
  };
}

interface ProjectStore {
  projects: Project[];
  currentProjectId: string | null;

  // Project operations
  createProject: (clientInfo: ClientInfo, floorInfo?: {
    floorCount?: number;
    floorHeights?: number[];
    // Legacy support
    hasTwoFloors?: boolean;
    firstFloorHeight?: number;
    secondFloorHeight?: number;
  }) => string;
  deleteProject: (projectId: string) => void;
  updateClientInfo: (projectId: string, clientInfo: ClientInfo) => void;
  updateProjectFloors: (projectId: string, floorCount: number, floorHeights: number[]) => void;
  updateProjectBaseboard: (projectId: string, paintBaseboard: boolean) => void;
  updateProjectCoats: (projectId: string, coats: 1 | 2) => void;
  updateQuoteBuilder: (projectId: string, quoteBuilder: QuoteBuilder) => void;
  updateGlobalPaintDefaults: (projectId: string, defaults: Partial<GlobalPaintDefaults>) => void;
  updateProjectCoverPhoto: (projectId: string, coverPhotoUri: string | undefined) => void;
  setCurrentProject: (projectId: string | null) => void;
  getCurrentProject: () => Project | null;

  // Quote operations
  addQuote: (projectId: string, title?: string) => string;
  duplicateQuote: (projectId: string, quoteId: string) => string;
  updateQuote: (projectId: string, quoteId: string, quote: Partial<Quote>) => void;
  deleteQuote: (projectId: string, quoteId: string) => void;
  setActiveQuote: (projectId: string, quoteId: string) => void;
  getActiveQuote: (projectId: string) => Quote | null;

  // Room operations
  addRoom: (projectId: string, floorNumber?: number) => string;
  updateRoom: (projectId: string, roomId: string, room: Partial<Room>) => void;
  deleteRoom: (projectId: string, roomId: string) => void;

  // Staircase operations
  addStaircase: (projectId: string) => string;
  updateStaircase: (
    projectId: string,
    staircaseId: string,
    staircase: Partial<Staircase>
  ) => void;
  deleteStaircase: (projectId: string, staircaseId: string) => void;

  // Fireplace operations
  addFireplace: (projectId: string) => string;
  updateFireplace: (
    projectId: string,
    fireplaceId: string,
    fireplace: Partial<Fireplace>
  ) => void;
  deleteFireplace: (projectId: string, fireplaceId: string) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,

      createProject: (clientInfo, floorInfo) => {
        const id = uuidv4();
        const now = Date.now();
        const defaultQuote = createDefaultQuote("Quote A");
        const newProject: Project = {
          id,
          clientInfo,
          rooms: [],
          staircases: [],
          fireplaces: [],
          createdAt: now,
          updatedAt: now,
          floorCount: floorInfo?.floorCount || 1,
          floorHeights: floorInfo?.floorHeights || [8],
          // Legacy support
          hasTwoFloors: floorInfo?.hasTwoFloors || false,
          firstFloorHeight: floorInfo?.firstFloorHeight || 8,
          secondFloorHeight: floorInfo?.secondFloorHeight,
          // Initialize global paint defaults
          globalPaintDefaults: getDefaultGlobalPaintDefaults(),
          // Initialize with one default quote
          quotes: [defaultQuote],
          activeQuoteId: defaultQuote.id,
        };
        set((state) => ({
          projects: [...state.projects, newProject],
          currentProjectId: id,
        }));
        return id;
      },

      deleteProject: (projectId) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          currentProjectId:
            state.currentProjectId === projectId
              ? null
              : state.currentProjectId,
        }));
      },

      updateClientInfo: (projectId, clientInfo) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, clientInfo, updatedAt: Date.now() }
              : p
          ),
        }));
      },

      updateProjectFloors: (projectId, floorCount, floorHeights) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  floorCount,
                  floorHeights,
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      updateProjectBaseboard: (projectId, paintBaseboard) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  paintBaseboard,
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      updateProjectCoats: (projectId, coats) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  projectCoats: coats,
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      updateQuoteBuilder: (projectId, quoteBuilder) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  quoteBuilder,
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      updateGlobalPaintDefaults: (projectId, defaults) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  globalPaintDefaults: {
                    ...getDefaultGlobalPaintDefaults(),
                    ...p.globalPaintDefaults,
                    ...defaults,
                  },
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      updateProjectCoverPhoto: (projectId, coverPhotoUri) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  coverPhotoUri,
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      setCurrentProject: (projectId) => {
        set({ currentProjectId: projectId });
      },

      getCurrentProject: () => {
        const state = get();
        return (
          state.projects.find((p) => p.id === state.currentProjectId) || null
        );
      },

      // Quote operations
      addQuote: (projectId, title) => {
        const state = get();
        const project = state.projects.find((p) => p.id === projectId);
        if (!project) return "";

        const quoteNumber = project.quotes.length + 1;
        const newQuote = createDefaultQuote(title || `Quote ${String.fromCharCode(64 + quoteNumber)}`);

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  quotes: [...p.quotes, newQuote],
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
        return newQuote.id;
      },

      duplicateQuote: (projectId, quoteId) => {
        const state = get();
        const project = state.projects.find((p) => p.id === projectId);
        if (!project) return "";

        const originalQuote = project.quotes.find((q) => q.id === quoteId);
        if (!originalQuote) return "";

        const duplicatedQuote: Quote = {
          ...originalQuote,
          id: uuidv4(),
          title: `${originalQuote.title} Copy`,
          totals: undefined, // Force recalculation
        };

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  quotes: [...p.quotes, duplicatedQuote],
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
        return duplicatedQuote.id;
      },

      updateQuote: (projectId, quoteId, quoteUpdate) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  quotes: p.quotes.map((q) =>
                    q.id === quoteId ? { ...q, ...quoteUpdate } : q
                  ),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      deleteQuote: (projectId, quoteId) => {
        const state = get();
        const project = state.projects.find((p) => p.id === projectId);
        if (!project || project.quotes.length <= 1) {
          // Prevent deleting the last quote
          return;
        }

        const newQuotes = project.quotes.filter((q) => q.id !== quoteId);
        const newActiveQuoteId =
          project.activeQuoteId === quoteId
            ? newQuotes[0].id
            : project.activeQuoteId;

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  quotes: newQuotes,
                  activeQuoteId: newActiveQuoteId,
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      setActiveQuote: (projectId, quoteId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  activeQuoteId: quoteId,
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      getActiveQuote: (projectId) => {
        const state = get();
        const project = state.projects.find((p) => p.id === projectId);
        if (!project) return null;

        // Auto-set activeQuoteId if not set
        if (!project.activeQuoteId && project.quotes.length > 0) {
          const firstQuoteId = project.quotes[0].id;
          get().setActiveQuote(projectId, firstQuoteId);

          // Ensure paint options exist (backward compatibility)
          const quote = project.quotes[0];
          if (quote.quoteBuilder && !quote.quoteBuilder.paintOptions) {
            quote.quoteBuilder.paintOptions = getDefaultPaintOptions();
            quote.quoteBuilder.showPaintOptionsInProposal = true;
          }

          return quote;
        }

        const activeQuote = project.quotes.find((q) => q.id === project.activeQuoteId) || project.quotes[0] || null;

        // Ensure paint options exist (backward compatibility)
        if (activeQuote?.quoteBuilder && !activeQuote.quoteBuilder.paintOptions) {
          activeQuote.quoteBuilder.paintOptions = getDefaultPaintOptions();
          activeQuote.quoteBuilder.showPaintOptionsInProposal = true;
        }

        return activeQuote;
      },

      addRoom: (projectId, floorNumber) => {
        const roomId = uuidv4();
        const state = get();
        const project = state.projects.find((p) => p.id === projectId);

        // Get global paint defaults or use fallback defaults
        const globalDefaults = project?.globalPaintDefaults || getDefaultGlobalPaintDefaults();

        const newRoom: Room = {
          id: roomId,
          name: "",
          length: 0,
          width: 0,
          height: 0,
          ceilingType: "flat",
          windowCount: 0,
          doorCount: 0,
          hasCloset: false,
          coatsWalls: globalDefaults.defaultWallCoats ?? 2,
          coatsCeiling: globalDefaults.defaultCeilingCoats ?? 2,
          coatsTrim: globalDefaults.defaultTrimCoats ?? 2,
          coatsDoors: globalDefaults.defaultDoorCoats ?? 2,
          floor: floorNumber || 1, // Use provided floor or default to first floor
          // Copy global paint defaults to room
          paintWalls: globalDefaults.paintWalls,
          paintCeilings: globalDefaults.paintCeilings,
          paintTrim: globalDefaults.paintTrim,
          paintBaseboard: globalDefaults.paintBaseboards,
          paintWindows: globalDefaults.paintWindows,
          paintDoors: globalDefaults.paintDoors,
          paintJambs: globalDefaults.paintDoorJambs,
          hasCrownMoulding: globalDefaults.paintCrownMoulding,
          includeClosetInteriorInQuote: globalDefaults.paintClosetInteriors,
        };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, rooms: [...p.rooms, newRoom], updatedAt: Date.now() }
              : p
          ),
        }));
        return roomId;
      },

      updateRoom: (projectId, roomId, room) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  rooms: p.rooms.map((r) =>
                    r.id === roomId ? { ...r, ...room } : r
                  ),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      deleteRoom: (projectId, roomId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  rooms: p.rooms.filter((r) => r.id !== roomId),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      addStaircase: (projectId) => {
        const staircaseId = uuidv4();
        const newStaircase: Staircase = {
          id: staircaseId,
          riserCount: 0,
          riserHeight: 0,
          treadDepth: 0,
          handrailLength: 0,
          spindleCount: 0,
          coats: 2,
          hasSecondaryStairwell: false,
          tallWallHeight: 0,
          shortWallHeight: 0,
          doubleSidedWalls: false,
        };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  staircases: [...p.staircases, newStaircase],
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
        return staircaseId;
      },

      updateStaircase: (projectId, staircaseId, staircase) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  staircases: p.staircases.map((s) =>
                    s.id === staircaseId ? { ...s, ...staircase } : s
                  ),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      deleteStaircase: (projectId, staircaseId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  staircases: p.staircases.filter((s) => s.id !== staircaseId),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      addFireplace: (projectId) => {
        const fireplaceId = uuidv4();
        const newFireplace: Fireplace = {
          id: fireplaceId,
          width: 0,
          height: 0,
          depth: 0,
          hasTrim: false,
          trimLinearFeet: 0,
          coats: 2,
        };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  fireplaces: [...p.fireplaces, newFireplace],
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
        return fireplaceId;
      },

      updateFireplace: (projectId, fireplaceId, fireplace) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  fireplaces: p.fireplaces.map((f) =>
                    f.id === fireplaceId ? { ...f, ...fireplace } : f
                  ),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      deleteFireplace: (projectId, fireplaceId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  fireplaces: p.fireplaces.filter((f) => f.id !== fireplaceId),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },
    }),
    {
      name: "project-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Migration: Convert old quoteBuilder to quotes array
        if (state) {
          state.projects = state.projects.map((project) => {
            // If project has old quoteBuilder but no quotes array, migrate it
            if (project.quoteBuilder && (!project.quotes || project.quotes.length === 0)) {
              const migratedQuote: Quote = {
                id: uuidv4(),
                title: "Imported Quote",
                quoteBuilder: project.quoteBuilder,
              };
              return {
                ...project,
                quotes: [migratedQuote],
                activeQuoteId: migratedQuote.id,
                quoteBuilder: undefined, // Remove old property
              };
            }
            // If project has no quotes array at all, create default
            if (!project.quotes || project.quotes.length === 0) {
              const defaultQuote = createDefaultQuote("Quote A");
              return {
                ...project,
                quotes: [defaultQuote],
                activeQuoteId: defaultQuote.id,
              };
            }
            // Ensure activeQuoteId is set
            if (!project.activeQuoteId && project.quotes.length > 0) {
              return {
                ...project,
                activeQuoteId: project.quotes[0].id,
              };
            }
            return project;
          });
        }
      },
    }
  )
);
