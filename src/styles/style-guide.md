# PR Timeline Style Guide

## Color Palette

### Primary Colors
- `maple-red`: #FF1E38 
  - Represents determination and the Canadian identity
  - Used for primary actions and key milestones
  - Conveys energy and progress

- `pure-white`: #FFFFFF
  - Represents clarity and new beginnings
  - Used for backgrounds and clean spaces
  - Conveys transparency and simplicity

### Secondary Colors
- `hope-red`: #FF6B7D
  - A softer red for supporting elements
  - Used for secondary actions and progress indicators
  - Conveys warmth and encouragement

- `snow-white`: #F8F9FA
  - Subtle off-white for layered surfaces
  - Used for cards and section backgrounds
  - Conveys calmness and organization

### Accent Colors
- `maple-leaf`: #E31837
  - Deep red for emphasis
  - Used for important notifications and highlights
  - Conveys significance and achievement

- `frost`: #E9ECEF
  - Light gray with a hint of coolness
  - Used for borders and separators
  - Conveys structure and reliability

### Status Colors
- `success`: #2E8540
  - Forest green for completed steps
  - Represents achievement and progress
  - Conveys positive outcomes

- `waiting`: #FDB813
  - Warm yellow for in-progress states
  - Represents patience and ongoing processes
  - Conveys active waiting

- `inactive`: #8C9196
  - Neutral gray for incomplete or inactive states
  - Represents future steps
  - Conveys calmness and reduced stress

### Text Colors
- `text-primary`: #1A1D1F
  - Near-black for primary text
  - Used for headings and important content
  - Conveys clarity and readability

- `text-secondary`: #4A4F54
  - Dark gray for secondary text
  - Used for descriptions and supporting content
  - Conveys hierarchy and balance

- `text-tertiary`: #6C757D
  - Medium gray for less emphasis
  - Used for hints and auxiliary information
  - Conveys supplementary information

## Typography

### Font Family
- Primary: "Inter"
- Fallback: System default sans-serif

### Font Sizes
- `text-xs`: 12px (0.75rem)
- `text-sm`: 14px (0.875rem)
- `text-base`: 16px (1rem)
- `text-lg`: 18px (1.125rem)
- `text-xl`: 20px (1.25rem)
- `text-2xl`: 24px (1.5rem)
- `text-3xl`: 30px (1.875rem)

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

## Spacing System

### Base Unit
- Base: 4px
- All spacing should be multiples of the base unit

### Spacing Scale
- `space-1`: 4px (0.25rem)
- `space-2`: 8px (0.5rem)
- `space-3`: 12px (0.75rem)
- `space-4`: 16px (1rem)
- `space-5`: 20px (1.25rem)
- `space-6`: 24px (1.5rem)
- `space-8`: 32px (2rem)
- `space-10`: 40px (2.5rem)
- `space-12`: 48px (3rem)

## Border Radius

### Scale
- `radius-sm`: 4px
- `radius-md`: 8px
- `radius-lg`: 12px
- `radius-xl`: 16px
- `radius-2xl`: 24px
- `radius-full`: 9999px

## Shadows

### Elevation Levels
- `shadow-sm`: Subtle shadow for cards
- `shadow-md`: Medium shadow for floating elements
- `shadow-lg`: Large shadow for modals
- `shadow-xl`: Extra large shadow for overlays

## Layout

### Container Widths
- `container-sm`: 640px
- `container-md`: 768px
- `container-lg`: 1024px
- `container-xl`: 1280px

### Z-Index Scale
- `z-0`: Base layer
- `z-10`: Elevated elements
- `z-20`: Overlays
- `z-30`: Modals
- `z-40`: Tooltips
- `z-50`: Notifications

## Components

### Cards
- Background: snow-white
- Border: 1px frost
- Border Radius: radius-lg
- Shadow: shadow-sm

### Buttons
- Primary:
  - Background: maple-red
  - Text: pure-white
  - Hover: hope-red
  - Border Radius: radius-full
  - Padding: space-4 space-6

- Secondary:
  - Background: pure-white
  - Border: 1px frost
  - Text: text-primary
  - Hover Background: snow-white
  - Border Radius: radius-full
  - Padding: space-4 space-6

### Progress Indicators
- Active Step: maple-red
- Completed Step: success
- Waiting Step: waiting
- Future Step: inactive
- Connection Line: frost

### Input Fields
- Border: 1px frost
- Border Radius: radius-lg
- Background: pure-white
- Focus Border: maple-red
- Error Border: maple-red
- Padding: space-4

## Animation

### Durations
- `duration-fast`: 150ms
- `duration-normal`: 300ms
- `duration-slow`: 500ms

### Timing Functions
- `ease-default`: cubic-bezier(0.4, 0, 0.2, 1)
- `ease-in`: cubic-bezier(0.4, 0, 1, 1)
- `ease-out`: cubic-bezier(0, 0, 0.2, 1)
- `ease-in-out`: cubic-bezier(0.4, 0, 0.2, 1)

## Accessibility

### Touch Targets
- Minimum size: 44x44px for interactive elements
- Spacing between targets: minimum 8px

### Color Contrast
- All text colors must maintain minimum contrast ratios:
  - Regular text: 4.5:1
  - Large text: 3:1
  - UI components: 3:1 