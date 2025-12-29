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
      {/* Combined circles and labels - each step is a column */}
      <View style={styles.stepsRow}>
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            {/* Step column (circle + label) */}
            <View style={styles.stepColumn}>
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
              <Text style={styles.label}>{labels[step - 1]}</Text>
            </View>

            {/* Connector line (not after last step) */}
            {index < steps.length - 1 && (
              <View style={styles.connectorWrapper}>
                <StepConnector
                  isCompleted={isStepCompleted(step)}
                  nextStepDisabled={isStepDisabled(steps[index + 1])}
                />
              </View>
            )}
          </React.Fragment>
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
  let size = 44;

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
    size = 50;
  } else if (isDisabled) {
    // Gray and dimmed - use mediumGray for visibility
    backgroundColor = Colors.mediumGray;
    borderColor = Colors.mediumGray;
    textColor = Colors.white;
  } else {
    // Incomplete but available - use mediumGray for visibility
    backgroundColor = Colors.mediumGray;
    borderColor = Colors.mediumGray;
    textColor = Colors.white;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
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
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          borderWidth: 2,
          borderColor,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {isCompleted ? (
          <Ionicons name="checkmark" size={24} color={textColor} />
        ) : (
          <Text
            style={{
              color: textColor,
              fontSize: isCurrent ? 18 : 16,
              fontWeight: isCurrent ? '700' : '600',
            }}
          >
            {step}
          </Text>
        )}
      </View>
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
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderBottomColor: Colors.neutralGray,
    borderBottomWidth: 1,
  } as ViewStyle,

  stepsRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start',
    justifyContent: 'center',
  } as ViewStyle,

  stepColumn: {
    alignItems: 'center' as const,
    width: 80,
  } as ViewStyle,

  connectorWrapper: {
    justifyContent: 'center' as const,
    paddingTop: 20, // Align with center of circles
  } as ViewStyle,

  connector: {
    width: 30,
    height: 2,
    marginHorizontal: 2,
  } as ViewStyle,

  label: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.mediumGray,
    textAlign: 'center' as const,
    marginTop: Spacing.xs,
  },
};
