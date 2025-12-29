import React, { RefObject } from "react";
import { TextInput } from "react-native";
import { FormInput } from "./FormInput";

interface NumericInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  unit?: string;
  error?: string;
  className?: string;
  nextFieldRef?: RefObject<TextInput>;
  inputRef?: RefObject<TextInput>;
}

export function NumericInput({
  label,
  value,
  onChangeText,
  placeholder = "0",
  unit,
  error,
  className,
  nextFieldRef,
  inputRef,
}: NumericInputProps) {
  return (
    <FormInput
      ref={inputRef}
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      unit={unit}
      error={error}
      className={className}
      keyboardType="numeric"
      nextFieldRef={nextFieldRef}
    />
  );
}
