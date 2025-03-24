import React, { ReactNode } from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';


interface ScreenContentProps {
  children: ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  gradient?: boolean;
  noSafeArea?: boolean;
}

/**
 * Wrapper component for screen content with consistent styling
 */
export const ScreenContent: React.FC<ScreenContentProps> = ({
  children,
  scrollable = false,
  padded = true,
  gradient = true,
  noSafeArea = false,
}) => {
  console.log('Rendering ScreenContent');
  const ContentWrapper = scrollable ? ScrollView : View;
  const Container = noSafeArea ? View : SafeAreaView;

  return (
    <>
      {gradient ? (
        <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
          <Container className="flex-1">
            <ContentWrapper
              className={`flex-1 ${padded ? 'px-4' : ''}`}
              contentContainerStyle={scrollable && padded ? { paddingBottom: 20 } : undefined}>
              {children}
            </ContentWrapper>
          </Container>
        </View>
      ) : (
        <Container className="flex-1 bg-white">
          <ContentWrapper
            className={`flex-1 ${padded ? 'px-4' : ''}`}
            contentContainerStyle={scrollable && padded ? { paddingBottom: 20 } : undefined}>
            {children}
          </ContentWrapper>
        </Container>
      )}
    </>
  );
};
