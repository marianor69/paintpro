/**
 * Project step progression logic
 *
 * Determines which step the user is on based on project state
 *
 * Step 1 (Setup): Complete when client name + floor configuration exists
 * Step 2 (Build Estimate): Complete when ≥1 room OR staircase OR fireplace OR built-in
 * Step 3 (Send): Available after Step 2 complete
 */

import { Project } from '../types/painting';

export type ProjectStep = 1 | 2 | 3;

/**
 * Check if Step 1 (Setup) is complete
 * Requirements:
 * - Client name exists
 * - Floor count > 0
 * - Floor heights array populated
 */
export function isStep1Complete(project: Project | null): boolean {
  if (!project) return false;

  const hasClientName = project.clientInfo?.name && project.clientInfo.name.trim().length > 0;
  const hasFloorConfig = (project.floorCount ?? 0) > 0 && project.floorHeights && project.floorHeights.length === (project.floorCount ?? 0);

  return !!(hasClientName && hasFloorConfig);
}

/**
 * Check if Step 2 (Build Estimate) is complete
 * Requirements:
 * - ≥1 room OR staircase OR fireplace OR built-in
 */
export function isStep2Complete(project: Project | null): boolean {
  if (!project) return false;

  const hasRooms = project.rooms && project.rooms.length > 0;
  const hasStaircases = project.staircases && project.staircases.length > 0;
  const hasFireplaces = project.fireplaces && project.fireplaces.length > 0;
  const hasBuiltIns = project.builtIns && project.builtIns.length > 0;

  return !!(hasRooms || hasStaircases || hasFireplaces || hasBuiltIns);
}

/**
 * Get the array of completed steps
 */
export function getCompletedSteps(project: Project | null): ProjectStep[] {
  const completed: ProjectStep[] = [];

  if (isStep1Complete(project)) {
    completed.push(1);
  }

  if (isStep2Complete(project)) {
    completed.push(2);
  }

  // Step 3 is only complete when actually sent (not tracked here)

  return completed;
}

/**
 * Calculate the current step the user should be on
 * Based on project state and completion requirements
 */
export function calculateCurrentStep(project: Project | null): ProjectStep {
  // Default to step 1
  if (!project) {
    return 1;
  }

  // If step 1 is complete, show step 2
  if (isStep1Complete(project)) {
    // If step 2 is also complete, show step 3
    if (isStep2Complete(project)) {
      return 3;
    }
    return 2;
  }

  // Otherwise show step 1
  return 1;
}

/**
 * Get validation errors for a specific step
 * Returns array of error messages if validation fails
 */
export function getStepValidationErrors(project: Project | null, step: ProjectStep): string[] {
  const errors: string[] = [];

  if (!project) {
    if (step === 1 || step === 2 || step === 3) {
      errors.push('Project not found');
    }
    return errors;
  }

  switch (step) {
    case 1:
      if (!project.clientInfo?.name || project.clientInfo.name.trim().length === 0) {
        errors.push('Client name is required');
      }
      if (!project.floorCount || project.floorCount === 0) {
        errors.push('Number of floors is required');
      }
      if (!project.floorHeights || project.floorHeights.length !== (project.floorCount ?? 0)) {
        errors.push('Floor heights must be specified for all floors');
      }
      break;

    case 2:
      const hasItems =
        (project.rooms && project.rooms.length > 0) ||
        (project.staircases && project.staircases.length > 0) ||
        (project.fireplaces && project.fireplaces.length > 0) ||
        (project.builtIns && project.builtIns.length > 0);

      if (!hasItems) {
        errors.push('Add at least one room, staircase, fireplace, or built-in');
      }
      break;

    case 3:
      // Step 3 (Send) doesn't have specific validation
      // It's a display step after items are added
      break;
  }

  return errors;
}

/**
 * Check if user can advance to a specific step
 * Considers both completion of previous steps and validation of current step
 */
export function canAdvanceToStep(project: Project | null, targetStep: ProjectStep): boolean {
  if (!project) {
    return targetStep === 1; // Can always start at step 1
  }

  switch (targetStep) {
    case 1:
      return true; // Always can go to step 1

    case 2:
      // Can go to step 2 only if step 1 is complete
      return isStep1Complete(project);

    case 3:
      // Can go to step 3 only if step 2 is complete
      return isStep2Complete(project) && isStep1Complete(project);

    default:
      return false;
  }
}

/**
 * Get a user-friendly message about what's needed to complete a step
 */
export function getStepCompletionMessage(project: Project | null, step: ProjectStep): string {
  const errors = getStepValidationErrors(project, step);

  if (errors.length === 0) {
    return `Step ${step} is complete`;
  }

  // Return first error message as the message
  return errors[0];
}

/**
 * Get step label
 */
export function getStepLabel(step: ProjectStep): string {
  const labels: Record<ProjectStep, string> = {
    1: 'Setup',
    2: 'Build Estimate',
    3: 'Send to Client',
  };
  return labels[step];
}

/**
 * Get step description
 */
export function getStepDescription(step: ProjectStep): string {
  const descriptions: Record<ProjectStep, string> = {
    1: 'Set up your project',
    2: 'Add rooms and features',
    3: 'Send to your client',
  };
  return descriptions[step];
}
