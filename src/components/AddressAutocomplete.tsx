import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius, TextInputStyles } from "../utils/designSystem";

interface AddressPrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text?: string;
}

interface AddressDetailsResult {
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface AddressAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectAddress: (address: string, city?: string, country?: string) => void;
  placeholder?: string;
  editable?: boolean;
  returnKeyType?: "next" | "done" | "search" | "send" | "go";
  onSubmitEditing?: () => void;
  nextFieldRef?: React.RefObject<TextInput>;
  onFocus?: (ref: React.RefObject<View>) => void;
  inputAccessoryViewID?: string;
  ref?: React.RefObject<TextInput>;
}

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export const AddressAutocomplete = React.forwardRef<TextInput, AddressAutocompleteProps>(
  (
    {
      value,
      onChangeText,
      onSelectAddress,
      placeholder = "Enter address",
      editable = true,
      returnKeyType = "next",
      onSubmitEditing,
      nextFieldRef,
      onFocus,
      inputAccessoryViewID,
    },
    ref
  ) => {
    const [suggestions, setSuggestions] = useState<AddressPrediction[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<View>(null);

    // Fetch address predictions from Google Places API
    const fetchSuggestions = async (input: string) => {
      if (!input.trim() || !API_KEY) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            input
          )}&key=${API_KEY}&components=country:us`
        );

        const data = await response.json();

        if (data.predictions) {
          setSuggestions(data.predictions.slice(0, 8)); // Limit to 8 suggestions
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Address autocomplete error:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounced search
    const handleAddressChange = (text: string) => {
      onChangeText(text);

      // Clear previous timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new timer
      debounceTimer.current = setTimeout(() => {
        if (text.length >= 3) {
          fetchSuggestions(text);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }, 400); // 400ms debounce
    };

    // Fetch place details to get city and country
    const handleSelectSuggestion = async (placeId: string, description: string) => {
      setShowSuggestions(false);
      onChangeText(description);

      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=address_components&key=${API_KEY}`
        );

        const data = (await response.json()) as { result?: AddressDetailsResult };
        const result = data.result;

        if (result?.address_components) {
          let city = "";
          let country = "";

          result.address_components.forEach((component) => {
            if (component.types.includes("locality")) {
              city = component.long_name;
            }
            if (component.types.includes("country")) {
              country = component.long_name;
            }
          });

          onSelectAddress(description, city, country);
        } else {
          onSelectAddress(description);
        }
      } catch (error) {
        console.error("Place details error:", error);
        onSelectAddress(description);
      }
    };

    // Clean up timer on unmount
    useEffect(() => {
      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    }, []);

    return (
      <View ref={containerRef} style={{ position: "relative" }}>
        {/* Input Field */}
        <View style={TextInputStyles.container}>
          <TextInput
            ref={ref}
            value={value}
            onChangeText={handleAddressChange}
            placeholder={placeholder}
            placeholderTextColor={Colors.mediumGray}
            editable={editable}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            onFocus={() => {
              if (onFocus) onFocus(containerRef);
              if (value.length >= 3 && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay hiding to allow selection
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            blurOnSubmit={false}
            style={TextInputStyles.base}
            inputAccessoryViewID={Platform.OS === "ios" ? inputAccessoryViewID : undefined}
            cursorColor={Colors.primaryBlue}
            selectionColor={Colors.primaryBlue}
            accessibilityLabel="Address input"
          />
          {loading && (
            <View style={{ position: "absolute", right: 12, top: 12 }}>
              <ActivityIndicator size="small" color={Colors.primaryBlue} />
            </View>
          )}
        </View>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <View
            style={{
              position: "absolute",
              top: 52,
              left: 0,
              right: 0,
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.default,
              borderWidth: 1,
              borderColor: Colors.neutralGray,
              zIndex: 1000,
              maxHeight: 250,
              shadowColor: Colors.darkCharcoal,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <ScrollView scrollEnabled={suggestions.length > 4}>
              {suggestions.map((suggestion, index) => (
                <Pressable
                  key={suggestion.place_id}
                  onPress={() =>
                    handleSelectSuggestion(suggestion.place_id, suggestion.description)
                  }
                  style={{
                    paddingVertical: Spacing.md,
                    paddingHorizontal: Spacing.md,
                    borderBottomWidth: index < suggestions.length - 1 ? 1 : 0,
                    borderBottomColor: Colors.neutralGray,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm }}>
                    <Ionicons
                      name="location"
                      size={16}
                      color={Colors.mediumGray}
                      style={{ marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: Typography.body.fontSize,
                          fontWeight: "500" as any,
                          color: Colors.darkCharcoal,
                        }}
                        numberOfLines={1}
                      >
                        {suggestion.main_text}
                      </Text>
                      {suggestion.secondary_text && (
                        <Text
                          style={{
                            fontSize: Typography.caption.fontSize,
                            color: Colors.mediumGray,
                            marginTop: 2,
                          }}
                          numberOfLines={1}
                        >
                          {suggestion.secondary_text}
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Empty state */}
        {showSuggestions && value.length >= 3 && suggestions.length === 0 && !loading && (
          <View
            style={{
              position: "absolute",
              top: 52,
              left: 0,
              right: 0,
              backgroundColor: Colors.white,
              borderRadius: BorderRadius.default,
              borderWidth: 1,
              borderColor: Colors.neutralGray,
              zIndex: 1000,
              paddingVertical: Spacing.md,
              paddingHorizontal: Spacing.md,
            }}
          >
            <Text style={{ fontSize: Typography.body.fontSize, color: Colors.mediumGray }}>
              No addresses found
            </Text>
          </View>
        )}
      </View>
    );
  }
);

AddressAutocomplete.displayName = "AddressAutocomplete";
