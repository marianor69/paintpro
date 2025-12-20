import { v4 as uuidv4 } from "uuid";
import { Project, Room, QuoteBuilder } from "../types/painting";
import { useProjectStore } from "../state/projectStore";
import { usePricingStore } from "../state/pricingStore";
import { computeRoomPricingSummary } from "./pricingSummary";
import { getDefaultQuoteBuilder } from "./calculations";

interface ImportedProject {
  clientInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  floorCount?: number;
  floorHeights?: number[];
  paintBaseboard?: boolean;
  projectCoats?: 1 | 2;
  quoteBuilder?: QuoteBuilder; // Add quoteBuilder support
  pricing?: {
    wallLaborPerSqFt?: number;
    ceilingLaborPerSqFt?: number;
    baseboardLaborPerLF?: number;
    doorLabor?: number;
    windowLabor?: number;
    closetLabor?: number;
    riserLabor?: number;
    spindleLabor?: number;
    handrailLaborPerLF?: number;
    fireplaceLabor?: number;
    crownMouldingLaborPerLF?: number;
    wallPaintPerGallon?: number;
    ceilingPaintPerGallon?: number;
    trimPaintPerGallon?: number;
    doorPaintPerGallon?: number;
    primerPerGallon?: number;
    wallPaintPer5Gallon?: number;
    ceilingPaintPer5Gallon?: number;
    trimPaintPer5Gallon?: number;
    doorPaintPer5Gallon?: number;
    primerPer5Gallon?: number;
    wallCoverageSqFtPerGallon?: number;
    ceilingCoverageSqFtPerGallon?: number;
    trimCoverageSqFtPerGallon?: number;
  };
  rooms?: Array<{
    id?: string; // Optional ID to preserve from JSON import
    name: string;
    length: number;
    width: number;
    height: number;
    manualArea?: number | null;
    ceilingType: "flat" | "cathedral" | "cathhedral"; // Support typo in data
    cathedralPeakHeight?: number | null;
    windowCount: number;
    doorCount: number;
    hasCloset: boolean;
    singleDoorClosets?: number;
    doubleDoorClosets?: number;
    // Room-level paint toggles (all default to true if not specified)
    paintWalls?: boolean;
    paintCeilings?: boolean;
    paintTrim?: boolean;
    paintWindows?: boolean;
    paintDoors?: boolean;
    paintJambs?: boolean;
    paintBaseboard?: boolean;
    hasCrownMoulding?: boolean;
    // Include toggles (for calculations)
    included?: boolean;
    includeWindows?: boolean;
    includeDoors?: boolean;
    includeTrim?: boolean;
    includeClosetInteriorInQuote?: boolean;
    coatsWalls: number;
    coatsCeiling: number;
    coatsTrim: number;
    coatsDoors: number;
    floor?: number;
  }>;
  staircases?: Array<any>;
  fireplaces?: Array<any>;
}

export function importProjectFromJSON(jsonString: string): {
  success: boolean;
  error?: string;
  projectId?: string;
} {
  try {
    console.log("[importProject] Starting import...");
    console.log("[importProject] JSON string length:", jsonString.length);
    console.log("[importProject] First 100 chars:", jsonString.substring(0, 100));

    const data: ImportedProject = JSON.parse(jsonString);
    console.log("[importProject] Parsed JSON successfully");

    // Validate required fields
    if (!data.clientInfo || !data.clientInfo.name) {
      console.log("[importProject] Validation failed: missing clientInfo.name");
      return {
        success: false,
        error: "Invalid JSON: clientInfo.name is required",
      };
    }

    console.log("[importProject] Client info:", data.clientInfo);

    // Update pricing if provided
    if (data.pricing) {
      console.log("[importProject] Updating pricing...");
      const pricingStore = usePricingStore.getState();
      pricingStore.updatePricing(data.pricing);
    }

    // Create the project
    console.log("[importProject] Creating project...");
    const projectStore = useProjectStore.getState();
    const projectId = projectStore.createProject(
      data.clientInfo,
      {
        floorCount: data.floorCount || 1,
        floorHeights: data.floorHeights || [8],
      }
    );
    console.log("[importProject] Project created with ID:", projectId);

    // Update paintBaseboard default
    if (data.paintBaseboard !== undefined) {
      console.log("[importProject] Setting paintBaseboard:", data.paintBaseboard);
      projectStore.updateProjectBaseboard(projectId, data.paintBaseboard);
    }

    // Update projectCoats
    if (data.projectCoats !== undefined) {
      console.log("[importProject] Setting projectCoats:", data.projectCoats);
      projectStore.updateProjectCoats(projectId, data.projectCoats);
    }

    // Import quoteBuilder if provided
    if (data.quoteBuilder !== undefined) {
      console.log("[importProject] Setting quoteBuilder:", data.quoteBuilder);

      // Handle legacy "roomsIncluded" field name (if present in JSON)
      const quoteBuilder = { ...data.quoteBuilder };
      if ((quoteBuilder as any).roomsIncluded && !quoteBuilder.includedRoomIds) {
        quoteBuilder.includedRoomIds = (quoteBuilder as any).roomsIncluded;
        delete (quoteBuilder as any).roomsIncluded;
      }

      projectStore.updateQuoteBuilder(projectId, quoteBuilder);
    }

    // Import rooms
    if (data.rooms && data.rooms.length > 0) {
      console.log("[importProject] Importing", data.rooms.length, "rooms");

      // Get pricing and project data for calculations
      const pricingStore = usePricingStore.getState();
      // Extract pricing settings (everything except the methods)
      const { updatePricing, resetToDefaults, ...pricing } = pricingStore;

      const projectStore = useProjectStore.getState();
      const project = projectStore.projects.find(p => p.id === projectId);

      if (!project) {
        console.error("[importProject] Project not found for calculations");
        return {
          success: false,
          error: "Project not found after creation",
        };
      }

      // Get a CONSISTENT QuoteBuilder for ALL room calculations
      // Use default QuoteBuilder to ensure imports are deterministic
      // This matches what RoomEditorScreen will use for active quote
      const defaultQB = getDefaultQuoteBuilder();
      // Re-fetch project to get the active quote's QuoteBuilder if it exists
      const freshProjectStore = useProjectStore.getState();
      const freshProject = freshProjectStore.projects.find(p => p.id === projectId);
      const activeQuote = freshProject?.quotes?.find(q => q.id === freshProject.activeQuoteId);
      const quoteBuilderForCalcs = activeQuote?.quoteBuilder || freshProject?.quoteBuilder || defaultQB;

      console.log("[importProject] Using QuoteBuilder for calculations:", {
        includeWalls: quoteBuilderForCalcs.includeWalls,
        includeCeilings: quoteBuilderForCalcs.includeCeilings,
        includeTrim: quoteBuilderForCalcs.includeTrim,
        includeDoors: quoteBuilderForCalcs.includeDoors,
        includeWindows: quoteBuilderForCalcs.includeWindows,
        includeBaseboards: quoteBuilderForCalcs.includeBaseboards,
        includeClosets: quoteBuilderForCalcs.includeClosets,
      });

      data.rooms.forEach((roomData, index) => {
        console.log(`[importProject] Processing room ${index + 1}:`, roomData.name);

        // Fix typo in ceilingType if present
        let ceilingType: "flat" | "cathedral" = "flat";
        if (roomData.ceilingType === "cathedral" || roomData.ceilingType === "cathhedral") {
          ceilingType = "cathedral";
        }

        // Determine room height from floor heights
        // IMPORTANT: Use the SAME logic as RoomEditorScreen.handleSave() for consistency!
        // RoomEditorScreen always gets height from project.floorHeights[floor-1],
        // so we must do the same here to ensure imported rooms match saved rooms.
        const roomFloor = roomData.floor || 1;
        let roomHeight = 8; // Default fallback

        // Match RoomEditorScreen behavior: Always use floor height from project
        if (freshProject?.floorHeights && freshProject.floorHeights[roomFloor - 1]) {
          roomHeight = freshProject.floorHeights[roomFloor - 1];
        } else if (roomFloor === 2 && freshProject?.secondFloorHeight) {
          roomHeight = freshProject.secondFloorHeight;
        } else if (freshProject?.firstFloorHeight) {
          roomHeight = freshProject.firstFloorHeight;
        }

        // If JSON specifies a height and no floor heights exist, use JSON height
        if (!freshProject?.floorHeights && roomData.height && roomData.height > 0) {
          roomHeight = roomData.height;
        }

        const room: Room = {
          id: roomData.id || uuidv4(), // Preserve existing ID from JSON, or generate new one if missing
          name: roomData.name,
          length: roomData.length,
          width: roomData.width,
          height: roomHeight,
          manualArea: roomData.manualArea || undefined,
          ceilingType: ceilingType,
          cathedralPeakHeight: roomData.cathedralPeakHeight || undefined,
          windowCount: roomData.windowCount,
          doorCount: roomData.doorCount,
          hasCloset: roomData.hasCloset,
          singleDoorClosets: roomData.singleDoorClosets || 0,
          doubleDoorClosets: roomData.doubleDoorClosets || 0,
          // Room-level paint toggles - match global defaults from getDefaultGlobalPaintDefaults()
          // This ensures imported rooms calculate consistently with manually created rooms
          paintWalls: roomData.paintWalls ?? true,
          paintCeilings: roomData.paintCeilings ?? true,
          paintTrim: roomData.paintTrim ?? true,
          paintWindows: roomData.paintWindows ?? false, // Match global default: false
          paintDoors: roomData.paintDoors ?? false, // Match global default: false
          paintJambs: roomData.paintJambs ?? false, // Match global default: false
          paintBaseboard: roomData.paintBaseboard ?? true,
          hasCrownMoulding: roomData.hasCrownMoulding ?? false,
          // Include toggles - default to TRUE (include in calculations)
          included: roomData.included ?? true,
          includeWindows: roomData.includeWindows ?? true,
          includeDoors: roomData.includeDoors ?? true,
          includeTrim: roomData.includeTrim ?? true,
          includeClosetInteriorInQuote: roomData.includeClosetInteriorInQuote ?? true,
          coatsWalls: roomData.coatsWalls,
          coatsCeiling: roomData.coatsCeiling,
          coatsTrim: roomData.coatsTrim,
          coatsDoors: roomData.coatsDoors,
          floor: roomFloor,
        };

        // AUTOMATICALLY CALCULATE GALLON USAGE AND TOTALS
        // Use the SAME QuoteBuilder that RoomEditorScreen will use (active quote's QB)
        // This ensures imported rooms show the SAME totals as when manually saved
        const pricingSummary = computeRoomPricingSummary(
          room,
          quoteBuilderForCalcs,
          pricing,
          freshProject?.projectCoats,
          freshProject?.projectIncludeClosetInteriorInQuote
        );

        // Add calculated data to room
        const roomWithCalculations: Room = {
          ...room,
          gallonUsage: {
            wall: pricingSummary.wallPaintGallons,
            ceiling: pricingSummary.ceilingPaintGallons,
            trim: pricingSummary.trimPaintGallons,
            door: pricingSummary.doorPaintGallons,
          },
          laborTotal: pricingSummary.laborDisplayed,
          materialsTotal: pricingSummary.materialsDisplayed,
          grandTotal: pricingSummary.totalDisplayed,
        };

        console.log(`[importProject] Room ${index + 1} calculated:`, {
          name: roomWithCalculations.name,
          laborTotal: roomWithCalculations.laborTotal,
          materialsTotal: roomWithCalculations.materialsTotal,
          grandTotal: roomWithCalculations.grandTotal,
          gallons: roomWithCalculations.gallonUsage,
          toggles: {
            paintWalls: room.paintWalls,
            paintCeilings: room.paintCeilings,
            paintTrim: room.paintTrim,
            paintWindows: room.paintWindows,
            paintDoors: room.paintDoors,
            paintBaseboard: room.paintBaseboard,
            includeClosetInteriorInQuote: room.includeClosetInteriorInQuote,
          },
        });

        // Add room to project using Zustand's setState
        useProjectStore.setState((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, rooms: [...p.rooms, roomWithCalculations], updatedAt: Date.now() }
              : p
          ),
        }));
        console.log(`[importProject] Room ${index + 1} added successfully with calculations`);
      });
    }

    // Import staircases if provided
    if (data.staircases && data.staircases.length > 0) {
      console.log("[importProject] Importing", data.staircases.length, "staircases");
      data.staircases.forEach((staircaseData, index) => {
        const staircaseId = projectStore.addStaircase(projectId);
        projectStore.updateStaircase(projectId, staircaseId, staircaseData);
        console.log(`[importProject] Staircase ${index + 1} added successfully`);
      });
    }

    // Import fireplaces if provided
    if (data.fireplaces && data.fireplaces.length > 0) {
      console.log("[importProject] Importing", data.fireplaces.length, "fireplaces");
      data.fireplaces.forEach((fireplaceData, index) => {
        const fireplaceId = projectStore.addFireplace(projectId);
        projectStore.updateFireplace(projectId, fireplaceId, fireplaceData);
        console.log(`[importProject] Fireplace ${index + 1} added successfully`);
      });
    }

    console.log("[importProject] Import completed successfully!");
    return {
      success: true,
      projectId,
    };
  } catch (error) {
    console.error("[importProject] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Invalid JSON format";

    // Provide helpful error messages
    if (errorMessage.includes("JSON Parse error")) {
      return {
        success: false,
        error: `Invalid JSON format. Please check that your JSON is properly formatted. Error: ${errorMessage}`,
      };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
