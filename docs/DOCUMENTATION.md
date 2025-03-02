# Timeline-ecoPR Application Documentation

## Table of Contents

1. [Application Overview](#application-overview)
2. [Architecture](#architecture)
3. [Screens](#screens)
4. [Components](#components)
5. [Services](#services)
6. [Libraries](#libraries)
7. [Data Flow](#data-flow)
8. [Supabase Integration](#supabase-integration)
9. [Environment Configuration](#environment-configuration)
10. [Development Guidelines](#development-guidelines)

## Application Overview

Timeline-ecoPR is a mobile application designed to help Canadian Permanent Residency (PR) applicants track their immigration journey milestones and view community statistics on processing times. The application allows users to record key dates in their PR application process and view aggregate processing times from other users, providing valuable insights into current trends.

The app is built with React Native and uses Supabase as its backend service. It follows a mobile-first design approach and implements secure device identification to ensure user privacy while still allowing for anonymous data aggregation.

## Architecture

The application follows a typical React Native architecture with the following structure:

```
timeline-ecopr/
├── src/
│   ├── components/        # Reusable UI components
│   ├── lib/               # Core utilities and configurations
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # Screen components
│   ├── services/          # API and data services
│   └── types/             # TypeScript type definitions
├── .env                   # Environment variables
└── App.tsx                # Application entry point
```

### Key Architectural Concepts:

1. **Device-based Authentication**: Instead of user accounts, the app uses unique device identifiers to track entries.
2. **Service Layer Pattern**: All API calls are abstracted into service modules.
3. **Row-Level Security**: Uses Supabase RLS policies to ensure data privacy.
4. **Stateless Components**: Screens use React hooks for state management.

## Screens

### Home Screen (`src/screens/home-screen.tsx`)

The main screen of the application that displays the user's timeline entries in chronological order.

**Functionality:**
- Fetches and displays timeline entries using `timelineService`
- Provides navigation to add or edit entries
- Shows loading states during data fetching
- Displays empty states when no entries exist

**State Management:**
- Uses `useState` for local state management
- Uses `useEffect` for data fetching on mount and when dependencies change

**Code Example:**
```typescript
const [entries, setEntries] = useState<TimelineEntry[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadEntries();
}, [deviceId]);

const loadEntries = async () => {
  try {
    setLoading(true);
    const data = await timelineService.getUserTimeline(deviceId);
    setEntries(data);
  } catch (error) {
    console.error('Error loading entries:', error);
  } finally {
    setLoading(false);
  }
};
```

### Add Entry Screen (`src/screens/add-entry-screen.tsx`)

Screen for adding new timeline entries with date selection and notes.

**Functionality:**
- Allows selection of entry type (AOR, P2, ecoPR, PR Card)
- Provides date input with both manual entry (masked input) and date picker
- Validates input before submission
- Submits data to Supabase via `timelineService`

**User Interface Features:**
- Type selection buttons
- Date input with mask (MM/DD/YYYY format)
- Calendar icon for date picker
- Optional notes field
- Submit button with loading state

**Input Handling:**
- Uses masked text input for formatted date entry
- Validates date format and validity
- Shows appropriate error messages

### Statistics Screen (`src/screens/statistics-screen.tsx`)

Displays community statistics on processing times with filtering options.

**Functionality:**
- Fetches aggregate statistics using `statisticsService`
- Provides filtering by transition type
- Displays data in both chart and detailed list formats
- Handles loading and empty states

**Data Visualization:**
- Uses `BarChart` from react-native-chart-kit
- Groups data by month for trend visualization
- Shows detailed statistics in card layout

## Components

### ScreenContent

A wrapper component that provides consistent styling and behavior for screen content.

**Props:**
- `children`: React nodes to render
- `style`: Optional additional styles

**Usage Example:**
```tsx
<ScreenContent>
  <Text>Screen content goes here</Text>
</ScreenContent>
```

### DatePickerWithInput

Custom component that combines masked text input with a date picker button.

**Props:**
- `value`: Current date value
- `onChange`: Function called when date changes
- `placeholder`: Optional placeholder text

**Features:**
- Supports both keyboard input and picker selection
- Validates date format and range
- Visual feedback for invalid dates

## Services

### Timeline Service (`src/services/timeline-service.ts`)

Handles all timeline entry operations through the Supabase API.

**Methods:**
- `addEntry`: Adds or updates a timeline entry
- `getUserTimeline`: Retrieves timeline entries for a specific device
- `updateEntry`: Updates an existing entry
- `deleteEntry`: Removes an entry

**Implementation Details:**
- Uses device ID to link entries to specific devices
- Implements optimistic UI updates for better user experience
- Handles error cases gracefully

**Code Example:**
```typescript
async addEntry(
  deviceId: string,
  entryType: EntryType,
  entryDate: string,
  notes: string = ''
): Promise<any> {
  try {
    // Get device record to link to
    const { data: deviceData, error: deviceError } = await supabase
      .from('devices')
      .select('id')
      .eq('device_identifier', deviceId)
      .single();

    if (deviceError) throw deviceError;
    if (!deviceData?.id) {
      throw new Error('Device not found');
    }

    // Add the entry
    const { data, error } = await supabase.from('timeline_entries').upsert(
      {
        device_id: deviceData.id,
        entry_type: entryType,
        entry_date: entryDate,
        notes,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'device_id,entry_type',
      }
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding timeline entry:', error);
    throw error;
  }
}
```

### Statistics Service (`src/services/statistics-service.ts`)

Handles fetching and processing of community statistics data.

**Methods:**
- `getCommunityStats`: Retrieves aggregated statistics with optional filtering

**Implementation Details:**
- Uses Supabase stored procedures for efficient data aggregation
- Supports filtering by transition type
- Returns structured data for visualization

## Libraries

### Core Libraries

- **React Native**: Framework for building native apps using React
- **Expo**: Platform for developing and deploying React Native apps
- **NativeWind**: TailwindCSS for React Native styling

### Navigation

- **React Navigation**: Handles screen navigation and routing
  - **@react-navigation/native**: Core navigation library
  - **@react-navigation/native-stack**: Stack navigator for screen transitions

### Backend Integration

- **Supabase JS Client**: SDK for interacting with Supabase backend
  - Handles authentication, data storage, and realtime features
  - Manages Row-Level Security policies

### UI Components

- **React Native Vector Icons**: Icon library for UI elements
- **React Native Mask Text**: Text input masking for formatted entry
- **React Native Chart Kit**: Data visualization library for statistics screen

### Device Integration

- **Expo Application**: Access to device application information
- **Expo Secure Store**: Secure storage for device ID
- **React Native URL Polyfill**: URL compatibility for React Native

## Data Flow

### Device Registration Flow

1. App starts and checks for existing device ID in secure storage
2. If not found, generates a new unique device ID
3. Registers device with Supabase
4. Sets device context for Row-Level Security

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│   Start   │────▶│Check Secure│────▶│ Generate  │────▶│ Register  │
│           │     │  Storage   │     │ Device ID │     │with Supabase│
└───────────┘     └───────────┘     └───────────┘     └───────────┘
```

### Timeline Entry Flow

1. User selects entry type and date
2. App validates input
3. On submission, app fetches device ID
4. Entry is stored in Supabase linked to device
5. UI updates to reflect the new entry

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  User     │────▶│  Validate │────▶│ Get Device│────▶│  Store in │
│  Input    │     │   Input   │     │    ID     │     │  Supabase │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
```

### Statistics Retrieval Flow

1. User selects filter options
2. App requests statistics from Supabase RPC
3. Results are processed for visualization
4. UI updates with chart and detailed data

## Supabase Integration

### Database Schema

#### Tables

**devices**
- `id` (primary key)
- `device_identifier` (unique)
- `created_at` (timestamp)
- `last_active` (timestamp)

**timeline_entries**
- `id` (primary key)
- `device_id` (foreign key to devices.id)
- `entry_type` (enum: 'aor', 'p2', 'ecopr', 'pr_card')
- `entry_date` (date)
- `notes` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Row-Level Security Policies

**devices**
- Insert: Public (allows device registration)
- Select: Only own device
- Update: Only own device
- Delete: Disabled

**timeline_entries**
- Insert: Only for own device
- Select: Only own entries
- Update: Only own entries
- Delete: Only own entries

### Stored Procedures

**get_community_statistics**
- Aggregates anonymous timeline data
- Calculates average, min, max processing times
- Supports filtering by transition type

## Environment Configuration

The application uses environment variables for configuration:

- `SUPABASE_URL`: URL of the Supabase project
- `SUPABASE_ANON_KEY`: Anonymous API key for Supabase

Environment variables are loaded using react-native-dotenv and defined in types for TypeScript support.

## Development Guidelines

### Code Style

- Kebab-case for file names (e.g., `home-screen.tsx`)
- CamelCase for variables and functions
- PascalCase for component names
- Clear and descriptive naming

### Best Practices

- Use TypeScript interfaces for props and state
- Implement error handling for all async operations
- Avoid direct DOM manipulation
- Use functional components with hooks
- Extract reusable logic into custom hooks

### Testing

- Write unit tests for service functions
- Test UI components with React Testing Library
- Create integration tests for critical user flows
- Test on both Android and iOS platforms 