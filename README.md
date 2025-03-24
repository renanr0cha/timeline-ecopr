# Timeline-ecoPR

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.71.8-blue" alt="React Native">
  <img src="https://img.shields.io/badge/Expo-48.0.0-lightgrey" alt="Expo">
  <img src="https://img.shields.io/badge/Supabase-2.29.0-green" alt="Supabase">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
</p>

A mobile application to help Canadian PR applicants track their immigration journey milestones and view community statistics on processing times.

## 📱 App Preview

<p align="center">
  <i>Screenshots coming soon</i>
</p>

## 🌟 Features

- **🔒 Authentication System**: Secure email-based login, signup, and password recovery
- **📅 Timeline Tracking**: Record key dates in your PR application process:
  - AOR (Acknowledgement of Receipt) date
  - P2 (Portal 2 login) date
  - ecoPR (electronic Confirmation of PR) date
  - PR Card receipt date
- **📊 Community Statistics**: View aggregated processing times from the community
  - Filter by transition type (AOR→P2, P2→ecoPR, etc.)
  - See monthly trends and averages with interactive charts
  - View weekly breakdowns for detailed insights
  - Multiple chart types (Line, Bar, Area) for better data visualization
  - Compare your timeline with community averages
- **🎨 Modern UI**: Clean, intuitive interface with smooth animations and transitions
- **🔒 Privacy-Focused**: No user accounts needed, just anonymous device registration
- **💪 Offline Support**: View your timeline even without an internet connection

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or pnpm
- Expo CLI: `npm install -g expo-cli`
- Supabase account (for backend)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/timeline-ecopr.git
cd timeline-ecopr
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Create a `.env` file in the root directory with your Supabase credentials:

```bash
# Copy from .env.example
cp .env.example .env
```

Then edit the `.env` file to add your Supabase credentials:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-goes-here
```

> **Important**: Never commit your `.env` file to version control. It contains sensitive information.

4. Start the development server:

```bash
npx expo start
```

## 🏗️ Project Structure

```
timeline-ecopr/
├── src/
│   ├── components/        # Reusable UI components
│   ├── lib/               # Core utilities and configurations
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # Screen components
│   ├── services/          # API and data services
│   └── types/             # TypeScript type definitions
├── docs/                  # Documentation
├── .env                   # Environment variables (create this file manually)
└── App.tsx                # Application entry point
```

## 🛠️ Tech Stack

- **Frontend**:
  - [React Native](https://reactnative.dev/) - Core framework
  - [Expo](https://expo.dev/) - Development platform
  - [NativeWind](https://www.nativewind.dev/) - TailwindCSS for React Native

- **Navigation**:
  - [React Navigation](https://reactnavigation.org/) - Screen navigation

- **Data Visualization**:
  - Custom Chart Components - Built on top of react-native-chart-kit
  - Interactive charts with weekly breakdowns
  - Multiple chart types (Line, Bar, Area)

- **UI Components**:
  - [React Native Vector Icons](https://github.com/oblador/react-native-vector-icons) - Icon library
  - [React Native Mask Text](https://github.com/akinncar/react-native-mask-text) - Text input masking
  - Custom themed components with NativeWind

- **Backend**:
  - [Supabase](https://supabase.io/) - Backend-as-a-Service
  - PostgreSQL - Database
  - Row-Level Security - Data protection

## 🔧 Setting Up Supabase

1. Create a new Supabase project
2. Run the following SQL to set up your database:

```sql
-- Create enum type for entry types
CREATE TYPE entry_type AS ENUM ('aor', 'p2', 'ecopr', 'pr_card');

-- Create devices table
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_identifier TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create timeline entries table
CREATE TABLE timeline_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id),
    entry_type entry_type NOT NULL,
    entry_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(device_id, entry_type)
);

-- Create function to set device context
CREATE OR REPLACE FUNCTION set_device_context(device_id TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.device_id', device_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for community statistics
CREATE OR REPLACE FUNCTION get_community_statistics(filter_transition_type TEXT DEFAULT NULL)
RETURNS TABLE (
    transition_type TEXT,
    start_date DATE,
    avg_days FLOAT,
    min_days INTEGER,
    max_days INTEGER,
    count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    -- Your statistics query here
    -- ...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up Row-Level Security
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_entries ENABLE ROW LEVEL SECURITY;

-- Device policies
CREATE POLICY "Devices are viewable by the device owner" 
ON devices FOR SELECT USING (device_identifier = current_setting('app.device_id', true));

CREATE POLICY "Devices can be created by anyone" 
ON devices FOR INSERT WITH CHECK (true);

CREATE POLICY "Devices can be updated by the device owner" 
ON devices FOR UPDATE USING (device_identifier = current_setting('app.device_id', true));

-- Timeline entries policies
CREATE POLICY "Timeline entries are viewable by the device owner" 
ON timeline_entries FOR SELECT USING (
    device_id IN (SELECT id FROM devices WHERE device_identifier = current_setting('app.device_id', true))
);

CREATE POLICY "Timeline entries can be created by the device owner" 
ON timeline_entries FOR INSERT WITH CHECK (
    device_id IN (SELECT id FROM devices WHERE device_identifier = current_setting('app.device_id', true))
);

CREATE POLICY "Timeline entries can be updated by the device owner" 
ON timeline_entries FOR UPDATE USING (
    device_id IN (SELECT id FROM devices WHERE device_identifier = current_setting('app.device_id', true))
);

CREATE POLICY "Timeline entries can be deleted by the device owner" 
ON timeline_entries FOR DELETE USING (
    device_id IN (SELECT id FROM devices WHERE device_identifier = current_setting('app.device_id', true))
);
```

3. Update your `.env` file with the Supabase URL and anon key

## 📝 Documentation

For detailed documentation about the application architecture, components, and services, please see the [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md) file.

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run e2e tests (requires a device or emulator)
npm run test:e2e
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Expo](https://expo.dev/) for their excellent React Native tools
- [Supabase](https://supabase.io/) for the awesome open-source Firebase alternative
- [NativeWind](https://www.nativewind.dev/) for bringing TailwindCSS to React Native
- [React Navigation](https://reactnavigation.org/) for the navigation framework 