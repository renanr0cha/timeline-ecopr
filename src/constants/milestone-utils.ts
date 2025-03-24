import { Ionicons } from '@expo/vector-icons';

import { EntryType } from '../types';

/**
 * Maps entry types to their icon names from Ionicons
 */
export const ENTRY_TYPE_ICONS: Record<EntryType, keyof typeof Ionicons.glyphMap> = {
  submission: 'paper-plane-outline',
  aor: 'document-text-outline',
  biometrics_request: 'finger-print-outline',
  biometrics_complete: 'checkmark-circle-outline',
  medicals_request: 'medical-outline',
  medicals_complete: 'medkit-outline',
  background_start: 'shield-outline',
  background_complete: 'shield-checkmark-outline',
  additional_docs: 'folder-open-outline',
  p1: 'person-outline',
  p2: 'people-outline',
  ecopr: 'mail-outline',
  pr_card: 'card-outline',
};

/**
 * Calculate how many days ago a date was
 */
export const getDaysAgo = (dateString: string): number => {
  if (!dateString) return 0;

  try {
    // Parse the date string manually for more reliability
    // Handle formats like "Nov 7, 2024" or ISO date strings
    let entryDate: Date;

    if (dateString.match(/^[A-Za-z]{3}\s\d{1,2},\s\d{4}$/)) {
      // For format like "Nov 7, 2024"
      const parts = dateString.split(/[\s,]+/); // Split by space or comma
      const month = parts[0];
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      // Map month abbreviation to month number (0-based)
      const monthMap: Record<string, number> = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      };

      entryDate = new Date(year, monthMap[month], day);
    } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // For ISO format dates like "2023-07-15"
      // Parse using UTC to avoid timezone issues
      const [year, month, day] = dateString.split('-').map((num) => parseInt(num, 10));
      entryDate = new Date(Date.UTC(year, month - 1, day));
    } else {
      // Try standard date parsing for other formats
      // Create date as UTC to avoid timezone issues
      const parsedDate = new Date(dateString);
      // Use the UTC components to create a new date
      entryDate = new Date(
        Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate())
      );
    }

    // Check if date is valid
    if (isNaN(entryDate.getTime())) {
      console.warn('Invalid entry date:', dateString);
      return 0;
    }

    // Get today's date in UTC
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    // Calculate difference in days
    const timeDiff = today.getTime() - entryDate.getTime();
    return Math.floor(timeDiff / (1000 * 3600 * 24));
  } catch (error) {
    console.warn('Invalid date format:', dateString, error);
    return 0;
  }
};

/**
 * Provides gradient colors for milestone types
 * Reused across components for consistent styling
 */
export const getMilestoneGradient = (
  milestone: EntryType,
  isCompleted: boolean = true
): readonly [string, string] => {
  if (!isCompleted) {
    return ['#e5e7eb', '#d1d5db'] as const; // neutral gradient for incomplete
  }

  switch (milestone) {
    case 'submission':
      return ['#9333ea', '#a855f7'] as const; // purple gradient
    case 'aor':
      return ['#e11e38', '#ef4444'] as const; // maple red gradient
    case 'biometrics_request':
      return ['#0d9488', '#14b8a6'] as const; // teal gradient
    case 'biometrics_complete':
      return ['#0d9488', '#0f766e'] as const; // dark teal gradient
    case 'medicals_request':
      return ['#3b82f6', '#60a5fa'] as const; // blue gradient
    case 'medicals_complete':
      return ['#2563eb', '#3b82f6'] as const; // darker blue gradient
    case 'background_start':
      return ['#eab308', '#facc15'] as const; // yellow gradient
    case 'background_complete':
      return ['#ca8a04', '#eab308'] as const; // darker yellow gradient
    case 'additional_docs':
      return ['#f97316', '#fb923c'] as const; // orange gradient
    case 'p1':
      return ['#dc2626', '#ef4444'] as const; // hope red gradient
    case 'p2':
      return ['#dc2626', '#b91c1c'] as const; // darker hope red gradient
    case 'ecopr':
      return ['#22c55e', '#4ade80'] as const; // success gradient
    case 'pr_card':
      return ['#f59e0b', '#fbbf24'] as const; // waiting/amber gradient
    default:
      return ['#6b7280', '#9ca3af'] as const; // gray gradient
  }
};

/**
 * Gets the display name for a milestone
 */
export const getMilestoneName = (milestone: EntryType): string => {
  switch (milestone) {
    case 'submission':
      return 'Submission';
    case 'aor':
      return 'AOR';
    case 'biometrics_request':
      return 'Biometrics Request';
    case 'biometrics_complete':
      return 'Biometrics Complete';
    case 'medicals_request':
      return 'Medicals Request';
    case 'medicals_complete':
      return 'Medicals Complete';
    case 'background_start':
      return 'Background Check';
    case 'background_complete':
      return 'Background Cleared';
    case 'additional_docs':
      return 'Additional Docs';
    case 'p1':
      return 'P1';
    case 'p2':
      return 'P2';
    case 'ecopr':
      return 'ecoPR';
    case 'pr_card':
      return 'PR Card';
    default:
      return milestone;
  }
};
