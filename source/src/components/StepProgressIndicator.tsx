import React, { useMemo } from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../utils/designSystem';
import { ProjectStep } from '../utils/projectStepLogic';

interface StepProgressIndicatorProps {
  currentStep: ProjectStep;
  completedSteps?: ProjectStep[];
  onStepPress?: (step: ProjectStep) => void;
  disabledSteps?: ProjectStep[];
  style?: ViewStyle;
}

/**
 * Visual component showing 3-step progress indicator
 *
 * Design:
 * - Incomplete: Gray circle with number
 * - Current: Blue circle with number (larger, highlighted)
 * - Complete: Green circle with white checkmark
 *
 * Layout: Horizontal with connecting lines
 */
export default function StepProgressIndicator({
  currentStep,
  completedSteps = [],
  onStepPress,
  disabledSteps = [],
  style,
}: StepProgressIndicatorProps) {
  const steps: ProjectStep[] = [1, 2, 3];
  const labels = ['Setup', 'Build Estimate', 'Send to Client'];

  const isStepCompleted = (step: ProjectStep) => completedSteps.includes(step);
  const isStepDisabled = (step: ProjectStep) => disabledSteps.includes(step);

  return (
    <View style={[styles.container, style]}>
      {/* Main progress bar */}
      <View style={styles.progressBar}>
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            {/* Step circle */}
            <StepCircle
              step={step}
              isCurrent={step === currentStep}
              isCompleted={isStepCompleted(step)}
              isDisabled={isStepDisabled(step)}
              onPress={() => {
                if (!isStepDisabled(step) && onStepPress) {
                  onStepPress(step);
                }
              }}
            />

            {/* Connector line (not after last step) */}
            {index < steps.length - 1 && (
              <StepConnector
                isCompleted={isStepCompleted(step)}
                nextStepDisabled={isStepDisabled(steps[index + 1])}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Step labels below */}
      <View style={styles.labelsContainer}>
        {steps.map((step) => (
          <View key={step} style={styles.labelWrapper}>
            <Text style={styles.label}>{labels[step - 1]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface StepCircleProps {
  step: ProjectStep;
  isCurrent: boolean;
  isCompleted: boolean;
  isDisabled: boolean;
  onPress: () => void;
}

/**
 * Individual step circle (numbered or checkmark)
 */
function StepCircle({
  step,
  isCurrent,
  isCompleted,
  isDisabled,
  onPress,
}: StepCircleProps) {
  let backgroundColor: string;
  let borderColor: string;
  let textColor: string;
  let size = 50;

  if (isCompleted) {
    // Green with checkmark
    backgroundColor = Colors.success;
    borderColor = Colors.success;
    textColor = Colors.white;
  } else if (isCurrent) {
    // Blue, larger and highlighted
    backgroundColor = Colors.primaryBlue;
    borderColor = Colors.primaryBlue;
    textColor = Colors.white;
    size = 56;
  } else if (isDisabled) {
    // Gray and dimmed
    backgroundColor = Colors.neutralGray;
    borderColor = Colors.neutralGray;
    textColor = Colors.white;
  } else {
    // Incomplete but available - light gray
    backgroundColor = Colors.neutralGray;
    borderColor = Colors.neutralGray;
    textColor = Colors.white;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.stepCircle,
        {
          width: size,
          height: size,
          backgroundColor,
          borderColor,
          opacity: pressed && !isDisabled ? 0.8 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Step ${step}`}
      accessibilityHint={
        isCompleted
          ? `Step ${step} completed`
          : isCurrent
            ? `Step ${step} current`
            : isDisabled
              ? `Step ${step} locked`
              : `Step ${step} available`
      }
    >
      {isCompleted ? (
        <Ionicons name="checkmark" size={24} color={textColor} />
      ) : (
        <Text
          style={[
            styles.stepNumber,
            {
              color: textColor,
              fontSize: isCurrent ? 20 : 16,
              fontWeight: isCurrent ? '700' : '600',
            },
          ]}
        >
          {step}
        </Text>
      )}
    </Pressable>
  );
}

interface StepConnectorProps {
  isCompleted: boolean;
  nextStepDisabled: boolean;
}

/**
 * Connecting line between steps
 */
function StepConnector({ isCompleted, nextStepDisabled }: StepConnectorProps) {
  const lineColor = isCompleted ? Colors.success : Colors.neutralGray;

  return (
    <View
      style={[
        styles.connector,
        {
          backgroundColor: lineColor,
          opacity: nextStepDisabled ? 0.5 : 1,
        },
      ]}
    />
  );
}

const styles = {
  container: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomColor: Colors.neutralGray,
    borderBottomWidth: 1,
  } as ViewStyle,

  progressBar: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  } as ViewStyle,

  stepCircle: {
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    minWidth: 50,
    minHeight: 50,
  } as ViewStyle,

  stepNumber: {
    fontWeight: '600' as const,
  },

  connector: {
    width: 40,
    height: 2,
    marginHorizontal: Spacing.xs,
  } as ViewStyle,

  labelsContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around',
  } as ViewStyle,

  labelWrapper: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  } as ViewStyle,

  label: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.mediumGray,
    textAlign: 'center' as const,
  },
};
