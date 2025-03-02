import React from 'react';
import { SafeAreaView, ScrollView, View, ViewStyle } from 'react-native';

interface ScreenContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  padding?: boolean;
}

/**
 * Wrapper component for screen content
 * Provides consistent styling and behavior for all screens
 *
 * @param children - Child components to render
 * @param style - Additional style to apply
 * @param scrollable - Whether content should be scrollable
 * @param padding - Whether to apply default padding
 */
export function ScreenContent({
  children,
  style,
  scrollable = false,
  padding = true,
}: ScreenContentProps) {
  const renderContent = () => (
    <View className={`flex-1 ${padding ? 'p-4' : ''}`} style={style}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {scrollable ? <ScrollView className="flex-1">{renderContent()}</ScrollView> : renderContent()}
    </SafeAreaView>
  );
}
