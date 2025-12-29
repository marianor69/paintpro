// Temporary debug script to read AsyncStorage data
const AsyncStorage = require("@react-native-async-storage/async-storage").default;

async function readProjectData() {
  try {
    const projectData = await AsyncStorage.getItem("project-storage");
    if (projectData) {
      const parsed = JSON.parse(projectData);
      console.log("=== PROJECT STORAGE DATA ===");
      console.log(JSON.stringify(parsed, null, 2));

      if (parsed.state && parsed.state.projects) {
        const projects = parsed.state.projects;
        console.log(`\n=== SUMMARY ===`);
        console.log(`Total Projects: ${projects.length}\n`);

        projects.forEach((project, idx) => {
          console.log(`\nProject ${idx + 1}: ${project.clientInfo?.name || "Unnamed"}`);
          console.log(`  Address: ${project.clientInfo?.address || "N/A"}`);
          console.log(`  Total Rooms: ${project.rooms?.length || 0}`);

          if (project.rooms && project.rooms.length > 0) {
            project.rooms.forEach((room) => {
              console.log(`\n    Room: ${room.name || "Unnamed Room"}`);
              console.log(`      Dimensions: ${room.length}' x ${room.width}' (Height: ${room.height}')`);
              console.log(`      Floor: ${room.floor || 1}`);

              // Calculate a simple total (this is approximate)
              const wallArea = 2 * (room.length + room.width) * room.height;
              const ceilingArea = room.length * room.width;
              console.log(`      Approx Wall Area: ${wallArea.toFixed(2)} sq ft`);
              console.log(`      Approx Ceiling Area: ${ceilingArea.toFixed(2)} sq ft`);
            });
          }
        });
      }
    } else {
      console.log("No project data found in storage");
    }
  } catch (error) {
    console.error("Error reading storage:", error);
  }
}

readProjectData();
