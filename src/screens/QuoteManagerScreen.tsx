import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProjectStore } from "../state/projectStore";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = NativeStackScreenProps<RootStackParamList, "QuoteManager">;

export default function QuoteManagerScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const insets = useSafeAreaInsets();

  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const addQuote = useProjectStore((s) => s.addQuote);
  const duplicateQuote = useProjectStore((s) => s.duplicateQuote);
  const updateQuote = useProjectStore((s) => s.updateQuote);
  const deleteQuote = useProjectStore((s) => s.deleteQuote);
  const setActiveQuote = useProjectStore((s) => s.setActiveQuote);

  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  if (!project) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-lg text-gray-600">Project not found</Text>
      </View>
    );
  }

  const handleAddQuote = () => {
    const quoteNumber = project.quotes.length + 1;
    const quoteLetter = String.fromCharCode(64 + quoteNumber); // A, B, C, etc.
    addQuote(projectId, `Quote ${quoteLetter}`);
  };

  const handleDuplicateQuote = (quoteId: string) => {
    Alert.alert(
      "Duplicate Quote",
      "Create a copy of this quote?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Duplicate",
          onPress: () => {
            duplicateQuote(projectId, quoteId);
          },
        },
      ]
    );
  };

  const handleDeleteQuote = (quoteId: string) => {
    if (project.quotes.length <= 1) {
      Alert.alert("Cannot Delete", "You must have at least one quote.");
      return;
    }

    Alert.alert(
      "Delete Quote",
      "Are you sure you want to delete this quote? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteQuote(projectId, quoteId);
          },
        },
      ]
    );
  };

  const handleSelectQuote = (quoteId: string) => {
    setActiveQuote(projectId, quoteId);
  };

  const handleEditTitle = (quoteId: string, currentTitle: string) => {
    setEditingQuoteId(quoteId);
    setEditingTitle(currentTitle);
  };

  const handleSaveTitle = () => {
    if (editingQuoteId && editingTitle.trim()) {
      updateQuote(projectId, editingQuoteId, { title: editingTitle.trim() });
      setEditingQuoteId(null);
      setEditingTitle("");
    }
  };

  const handleCancelEdit = () => {
    setEditingQuoteId(null);
    setEditingTitle("");
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <View className="p-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Quote Manager
            </Text>
            <Text className="text-base text-gray-600">
              Manage multiple quotes for this project
            </Text>
          </View>

          {/* Add Quote Button */}
          <Pressable
            onPress={handleAddQuote}
            className="bg-blue-600 rounded-xl p-4 mb-6 active:bg-blue-700"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <Text className="text-white font-bold text-lg ml-2">
                Add New Quote
              </Text>
            </View>
          </Pressable>

          {/* Quotes List */}
          <View className="bg-white rounded-xl p-4 border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Your Quotes ({project.quotes.length})
            </Text>

            {project.quotes.map((quote, index) => {
              const isActive = quote.id === project.activeQuoteId;
              const isEditing = editingQuoteId === quote.id;

              return (
                <View
                  key={quote.id}
                  className={`mb-3 p-4 rounded-lg border-2 ${
                    isActive ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
                  }`}
                >
                  {/* Quote Header */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1">
                      {isEditing ? (
                        <TextInput
                          value={editingTitle}
                          onChangeText={setEditingTitle}
                          className="text-lg font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1"
                          autoFocus
                          onSubmitEditing={handleSaveTitle}
                        />
                      ) : (
                        <Text className="text-lg font-bold text-gray-900">
                          {quote.title}
                        </Text>
                      )}
                    </View>
                    {isActive && (
                      <View className="bg-blue-600 rounded-full px-3 py-1 ml-2">
                        <Text className="text-white text-xs font-bold">
                          ACTIVE
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Quote Info */}
                  {quote.totals && (
                    <Text className="text-sm text-gray-600 mb-3">
                      Total: ${Math.round(quote.totals.grandTotal).toLocaleString()}
                    </Text>
                  )}

                  {/* Action Buttons */}
                  {isEditing ? (
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={handleSaveTitle}
                        className="flex-1 bg-green-600 rounded-lg py-2 active:bg-green-700"
                      >
                        <Text className="text-white font-semibold text-center">
                          Save
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={handleCancelEdit}
                        className="flex-1 bg-gray-400 rounded-lg py-2 active:bg-gray-500"
                      >
                        <Text className="text-white font-semibold text-center">
                          Cancel
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View className="flex-row gap-2 flex-wrap">
                      {!isActive && (
                        <Pressable
                          onPress={() => handleSelectQuote(quote.id)}
                          className="bg-blue-600 rounded-lg px-3 py-2 active:bg-blue-700"
                        >
                          <Text className="text-white font-semibold text-xs">
                            Set Active
                          </Text>
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => {
                          navigation.navigate("QuoteBuilder", { projectId });
                          setActiveQuote(projectId, quote.id);
                        }}
                        className="bg-purple-600 rounded-lg px-3 py-2 active:bg-purple-700"
                      >
                        <Text className="text-white font-semibold text-xs">
                          Edit Settings
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleEditTitle(quote.id, quote.title)}
                        className="bg-gray-600 rounded-lg px-3 py-2 active:bg-gray-700"
                      >
                        <Text className="text-white font-semibold text-xs">
                          Rename
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDuplicateQuote(quote.id)}
                        className="bg-orange-600 rounded-lg px-3 py-2 active:bg-orange-700"
                      >
                        <Text className="text-white font-semibold text-xs">
                          Duplicate
                        </Text>
                      </Pressable>
                      {project.quotes.length > 1 && (
                        <Pressable
                          onPress={() => handleDeleteQuote(quote.id)}
                          className="bg-red-600 rounded-lg px-3 py-2 active:bg-red-700"
                        >
                          <Text className="text-white font-semibold text-xs">
                            Delete
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
