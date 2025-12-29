/**
 * Test script to investigate closet area discrepancy
 *
 * This script will:
 * 1. Read the Master Bedroom data from storage
 * 2. Calculate expected closet area based on room height
 * 3. Compare with displayed value (140 sq ft)
 */

import { useProjectStore } from './src/state/projectStore';

// Get the project data
const projectId = '019a9f49-43b0-77aa-a511-19898c13a1e7';
const state = useProjectStore.getState();
const project = state.projects.find(p => p.id === projectId);

if (!project) {
  console.log('❌ Project not found');
  process.exit(1);
}

console.log('\n=== PROJECT ANALYSIS ===\n');
console.log('Project ID:', project.id);
console.log('Client:', project.clientInfo?.name);
console.log('\n--- Floor Configuration ---');
console.log('Floor Count:', project.floorCount || 1);
console.log('Floor Heights:', project.floorHeights || [project.firstFloorHeight || 8]);
console.log('Legacy: First Floor:', project.firstFloorHeight || 'N/A');
console.log('Legacy: Second Floor:', project.secondFloorHeight || 'N/A');

console.log('\n=== ROOM ANALYSIS ===\n');

project.rooms.forEach((room, idx) => {
  console.log(`\n--- Room ${idx + 1}: ${room.name} ---`);
  console.log('Floor Assignment:', room.floor || 1);
  console.log('Dimensions:', `${room.length} × ${room.width}`);
  console.log('Height:', room.height);
  console.log('Ceiling Type:', room.ceilingType);
  console.log('Single Door Closets:', room.singleDoorClosets || 0);
  console.log('Double Door Closets:', room.doubleDoorClosets || 0);

  const singleCount = room.singleDoorClosets || 0;
  const doubleCount = room.doubleDoorClosets || 0;

  if (singleCount > 0 || doubleCount > 0) {
    const height = room.height || 8;

    // Calculate closet wall area using formula from code
    const CLOSET_DEPTH_FT = 2;
    const CLOSET_SINGLE_OPENING_FT = 2.5;
    const CLOSET_DOUBLE_OPENING_FT = 5;

    const singleWallAreaPer = (CLOSET_SINGLE_OPENING_FT + 2 * CLOSET_DEPTH_FT) * height;
    const doubleWallAreaPer = (CLOSET_DOUBLE_OPENING_FT + 2 * CLOSET_DEPTH_FT) * height;

    const totalClosetWallArea = (singleCount * singleWallAreaPer) + (doubleCount * doubleWallAreaPer);

    console.log('\n  📏 CLOSET CALCULATIONS:');
    console.log('  Room Height Used:', height, 'ft');
    console.log('  Single Closet Wall Area:', singleWallAreaPer.toFixed(2), 'sq ft each');
    console.log('  Double Closet Wall Area:', doubleWallAreaPer.toFixed(2), 'sq ft each');
    console.log('  Total Closet Wall Area:', totalClosetWallArea.toFixed(2), 'sq ft');
    console.log('  Formula: Single = (2.5 + 2×2) × h = 6.5 × h');
    console.log('  Formula: Double = (5 + 2×2) × h = 9 × h');

    // Ceiling area
    const singleCeilingPer = CLOSET_SINGLE_OPENING_FT * CLOSET_DEPTH_FT;
    const doubleCeilingPer = CLOSET_DOUBLE_OPENING_FT * CLOSET_DEPTH_FT;
    const totalClosetCeilingArea = (singleCount * singleCeilingPer) + (doubleCount * doubleCeilingPer);
    console.log('  Total Closet Ceiling Area:', totalClosetCeilingArea.toFixed(2), 'sq ft');
  }

  // Show gallon usage if available
  if (room.gallonUsage) {
    console.log('\n  🎨 PAINT GALLONS:');
    console.log('  Wall:', room.gallonUsage.wall?.toFixed(2) || '0.00', 'gal');
    console.log('  Ceiling:', room.gallonUsage.ceiling?.toFixed(2) || '0.00', 'gal');
    console.log('  Trim:', room.gallonUsage.trim?.toFixed(2) || '0.00', 'gal');
    console.log('  Door:', room.gallonUsage.door?.toFixed(2) || '0.00', 'gal');
  }

  // Show totals if available
  if (room.laborTotal !== undefined) {
    console.log('\n  💰 COSTS:');
    console.log('  Labor:', '$' + room.laborTotal?.toFixed(2) || '0.00');
    console.log('  Materials:', '$' + room.materialsTotal?.toFixed(2) || '0.00');
    console.log('  Total:', '$' + room.grandTotal?.toFixed(0) || '0');
  }
});

console.log('\n\n=== SUMMARY ===\n');
console.log('Total Rooms:', project.rooms.length);

// Count total closets across all rooms
let totalSingleClosets = 0;
let totalDoubleClosets = 0;
let totalClosetWallArea = 0;

project.rooms.forEach(room => {
  const singleCount = room.singleDoorClosets || 0;
  const doubleCount = room.doubleDoorClosets || 0;
  totalSingleClosets += singleCount;
  totalDoubleClosets += doubleCount;

  if (singleCount > 0 || doubleCount > 0) {
    const height = room.height || 8;
    const CLOSET_DEPTH_FT = 2;
    const CLOSET_SINGLE_OPENING_FT = 2.5;
    const CLOSET_DOUBLE_OPENING_FT = 5;

    const singleWallAreaPer = (CLOSET_SINGLE_OPENING_FT + 2 * CLOSET_DEPTH_FT) * height;
    const doubleWallAreaPer = (CLOSET_DOUBLE_OPENING_FT + 2 * CLOSET_DEPTH_FT) * height;

    totalClosetWallArea += (singleCount * singleWallAreaPer) + (doubleCount * doubleWallAreaPer);
  }
});

console.log('Total Single Door Closets:', totalSingleClosets);
console.log('Total Double Door Closets:', totalDoubleClosets);
console.log('📊 TOTAL CLOSET WALL AREA:', totalClosetWallArea.toFixed(2), 'sq ft');
console.log('\n');

if (Math.abs(totalClosetWallArea - 140) < 1) {
  console.log('✅ MATCH! Calculated area matches displayed value of 140 sq ft');
  console.log('   The discrepancy was due to floor height being different than assumed 8 ft.');
} else {
  console.log('❌ MISMATCH! Displayed: 140 sq ft, Calculated:', totalClosetWallArea.toFixed(2), 'sq ft');
  console.log('   Difference:', (140 - totalClosetWallArea).toFixed(2), 'sq ft');
}
