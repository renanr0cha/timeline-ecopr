import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';

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
  const containerStyle = [
    styles.container,
    padding && styles.padding,
    style,
  ];

  const renderContent = () => (
    <View style={containerStyle}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {scrollable ? (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={padding && styles.scrollContent}
        >
          {renderContent()}
        </ScrollView>
      ) : (
        renderContent()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  padding: {
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
});
