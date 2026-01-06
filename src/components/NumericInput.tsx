import React, { RefObject } from "react";
import { TextInput, TextInputProps } from "react-native";
import { FormInput } from "./FormInput";

interface NumericInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  unit?: string;
  error?: string;
  className?: string;
  previousFieldRef?: RefObject<TextInput>;
  nextFieldRef?: RefObject<TextInput>;
  inputRef?: RefObject<TextInput>;
  onFocus?: TextInputProps["onFocus"];
}

export function NumericInput({
  label,
  value,
  onChangeText,
  placeholder = "0",
  unit,
  error,
  className,
  previousFieldRef,
  nextFieldRef,
  inputRef,
  onFocus,
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
      previousFieldRef={previousFieldRef}
      nextFieldRef={nextFieldRef}
      onFocus={onFocus}
    />
  );
}
