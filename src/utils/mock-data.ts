import { format, subDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

import {
  CommunityStatistic,
  EntryType,
  TimelineEntry,
  TransitionStatistics,
  WeeklyBreakdown,
} from '../types';

/**
 * Generate a set of mock timeline entries for testing
 * @param userId - User identifier
 * @param count - Number of entries to generate
 * @returns Array of mock timeline entries
 */
export const generateMockTimelineEntries = (userId: string, count = 10): TimelineEntry[] => {
  const entries: TimelineEntry[] = [];
  const entryTypes: EntryType[] = [
    'submission',
    'aor',
    'biometrics_request',
    'biometrics_complete',
    'medicals_request',
    'medicals_complete',
    'background_start',
    'background_complete',
    'p1',
    'p2',
    'ecopr',
    'pr_card',
  ];

  for (let i = 0; i < count; i++) {
    const mockUserId = i === 0 ? userId : `mock-user-${i.toString().padStart(3, '0')}`;
    const randomEntryType = entryTypes[Math.floor(Math.random() * entryTypes.length)];
    const randomDaysAgo = Math.floor(Math.random() * 365);
    const createdDate = subDays(new Date(), randomDaysAgo);
    const entryDate = subDays(createdDate, Math.floor(Math.random() * 7)); // Entry date up to a week before created date

    entries.push({
      id: uuidv4(),
      user_id: mockUserId,
      entry_type: randomEntryType,
      entry_date: format(entryDate, 'yyyy-MM-dd'),
      notes: `Mock entry for ${randomEntryType}`,
      created_at: createdDate.toISOString(),
      updated_at: createdDate.toISOString(),
    });
  }

  // Sort by created date, newest first
  return entries.sort(
    (a, b) =>
      new Date(b.created_at || new Date()).getTime() -
      new Date(a.created_at || new Date()).getTime()
  );
};

/**
 * Load mock data for the current device
 *
 * @param deviceId - Current device identifier
 * @returns Mock timeline entries for current device
 */
export const loadMockDataForCurrentDevice = (deviceId: string): TimelineEntry[] => {
  // Generate mock data for multiple devices, but only return entries for current device
  const allEntries = generateMockTimelineEntries(deviceId, 50);
  return allEntries.filter((entry) => entry.user_id === deviceId);
};

/**
 * Generates mock statistics data for the community statistics screen
 *
 * @param transitionType - Optional transition type filter
 * @returns Array of mock community statistics
 */
export const generateMockStatistics = (transitionType?: string): CommunityStatistic[] => {
  const stats: CommunityStatistic[] = [];
  const now = new Date();

  // Generate monthly data for the past 12 months
  for (let i = 0; i < 12; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthYear = month.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    // Generate statistics for each transition type
    const transitionTypes = ['aor-p2', 'p2-ecopr', 'ecopr-pr_card'];

    for (const type of transitionTypes) {
      // Skip if filtering by type and this isn't the requested type
      if (transitionType && type !== transitionType) continue;

      // Create realistic-looking data with a trend
      // More recent months have higher counts (growing community)
      const count = Math.max(5, Math.floor(30 - i * 2 + Math.random() * 10));

      // Generate realistic processing times
      let avgDays = 0;
      let minDays = 0;
      let maxDays = 0;

      switch (type) {
        case 'aor-p2':
          // AOR to P2 typically takes 30-90 days
          avgDays = 60 + Math.floor(Math.random() * 30);
          minDays = avgDays - 15 - Math.floor(Math.random() * 15);
          maxDays = avgDays + 30 + Math.floor(Math.random() * 30);
          break;
        case 'p2-ecopr':
          // P2 to ecoPR typically takes 90-240 days
          avgDays = 150 + Math.floor(Math.random() * 50);
          minDays = avgDays - 30 - Math.floor(Math.random() * 30);
          maxDays = avgDays + 60 + Math.floor(Math.random() * 30);
          break;
        case 'ecopr-pr_card':
          // ecoPR to PR Card typically takes 30-120 days
          avgDays = 60 + Math.floor(Math.random() * 30);
          minDays = avgDays - 20 - Math.floor(Math.random() * 10);
          maxDays = avgDays + 40 + Math.floor(Math.random() * 20);
          break;
      }

      // Create statistics with waiting counts for the P2-ecoPR transition
      const waitingCount =
        type === 'p2-ecopr' ? count * 3 + Math.floor(Math.random() * 10) : undefined;

      // Create weekly breakdown data for P2-ecoPR transition (for detailed view)
      const weekBreakdown: WeeklyBreakdown[] = [];

      if (type === 'p2-ecopr') {
        // Generate 4 weeks of data with realistic distribution
        const totalCount = waitingCount || count;
        const weeksInMonth = 4;
        let remainingCount = totalCount;

        for (let w = 0; w < weeksInMonth; w++) {
          // Distribute the count across weeks, with randomness
          // Last week gets the remainder
          let weekCount;
          if (w === weeksInMonth - 1) {
            weekCount = remainingCount;
          } else {
            // Each week gets roughly proportional amount with some randomness
            const proportion = 1 / (weeksInMonth - w);
            weekCount = Math.max(
              1,
              Math.floor(remainingCount * proportion * (0.7 + Math.random() * 0.6))
            );
            weekCount = Math.min(weekCount, remainingCount - 1);
          }

          remainingCount -= weekCount;

          // Use high values for some weeks to simulate "full" bars
          if (i === 0 && w === 1) {
            weekCount = 25; // High value for a specific week to show a full bar
          }

          const weekStart = w * 7 + 1;
          const weekEnd = Math.min((w + 1) * 7, 31); // Cap at month end

          weekBreakdown.push({
            week_range: `${monthYear} ${weekStart}-${weekEnd}`,
            count: weekCount,
          });
        }
      }

      stats.push({
        transition_type: type,
        avg_days: avgDays,
        min_days: minDays,
        max_days: maxDays,
        count,
        month_year: monthYear,
        waiting_count: waitingCount,
        week_breakdown: type === 'p2-ecopr' ? weekBreakdown : undefined,
      });
    }
  }

  return stats;
};

/**
 * Load mock statistics data
 *
 * @param transitionType - Optional transition type filter
 * @returns Mock community statistics
 */
export const loadMockStatisticsData = (transitionType?: string): CommunityStatistic[] => {
  return generateMockStatistics(transitionType);
};

/**
 * Generates mock data for a user
 * Similar to loadMockDataForCurrentDevice but uses userId instead
 */
export const loadMockDataForCurrentUser = (userId: string): TimelineEntry[] => {
  // Use the same mock data structure as loadMockDataForCurrentDevice
  // but replace device_id with user_id
  const mockEntries: TimelineEntry[] = [
    {
      id: '1',
      user_id: userId,
      entry_type: 'submission',
      entry_date: subDays(new Date(), 120).toISOString().split('T')[0],
      notes: 'Submitted PR application through online portal',
      created_at: subDays(new Date(), 120).toISOString(),
      updated_at: subDays(new Date(), 120).toISOString(),
    },
    {
      id: '2',
      user_id: userId,
      entry_type: 'aor',
      entry_date: subDays(new Date(), 115).toISOString().split('T')[0],
      notes: 'Received acknowledgment of receipt via email',
      created_at: subDays(new Date(), 115).toISOString(),
      updated_at: subDays(new Date(), 115).toISOString(),
    },
    {
      id: '3',
      user_id: userId,
      entry_type: 'biometrics_request',
      entry_date: subDays(new Date(), 100).toISOString().split('T')[0],
      notes: 'Received request to complete biometrics',
      created_at: subDays(new Date(), 100).toISOString(),
      updated_at: subDays(new Date(), 100).toISOString(),
    },
    {
      id: '4',
      user_id: userId,
      entry_type: 'biometrics_complete',
      entry_date: subDays(new Date(), 95).toISOString().split('T')[0],
      notes: 'Completed biometrics appointment at local office',
      created_at: subDays(new Date(), 95).toISOString(),
      updated_at: subDays(new Date(), 95).toISOString(),
    },
    {
      id: '5',
      user_id: userId,
      entry_type: 'medicals_request',
      entry_date: subDays(new Date(), 85).toISOString().split('T')[0],
      notes: 'Requested to complete medical examination',
      created_at: subDays(new Date(), 85).toISOString(),
      updated_at: subDays(new Date(), 85).toISOString(),
    },
    {
      id: '6',
      user_id: userId,
      entry_type: 'medicals_complete',
      entry_date: subDays(new Date(), 80).toISOString().split('T')[0],
      notes: 'Completed medical examination, results sent to IRCC',
      created_at: subDays(new Date(), 80).toISOString(),
      updated_at: subDays(new Date(), 80).toISOString(),
    },
    {
      id: '7',
      user_id: userId,
      entry_type: 'background_start',
      entry_date: subDays(new Date(), 65).toISOString().split('T')[0],
      notes: 'Background check initiated',
      created_at: subDays(new Date(), 65).toISOString(),
      updated_at: subDays(new Date(), 65).toISOString(),
    },
    {
      id: '8',
      user_id: userId,
      entry_type: 'background_complete',
      entry_date: subDays(new Date(), 40).toISOString().split('T')[0],
      notes: 'Background check completed successfully',
      created_at: subDays(new Date(), 40).toISOString(),
      updated_at: subDays(new Date(), 40).toISOString(),
    },
    {
      id: '9',
      user_id: userId,
      entry_type: 'p1',
      entry_date: subDays(new Date(), 30).toISOString().split('T')[0],
      notes: 'Principal applicant granted access to online portal',
      created_at: subDays(new Date(), 30).toISOString(),
      updated_at: subDays(new Date(), 30).toISOString(),
    },
    {
      id: '10',
      user_id: userId,
      entry_type: 'p2',
      entry_date: subDays(new Date(), 28).toISOString().split('T')[0],
      notes: 'Secondary applicant granted portal access',
      created_at: subDays(new Date(), 28).toISOString(),
      updated_at: subDays(new Date(), 28).toISOString(),
    },
  ];

  return mockEntries;
};

/**
 * Generate mock transition statistics for a user
 *
 * @param transitionType - Optional transition type to focus on
 * @returns TransitionStatistics object with mock data
 */
export const getMockTransitionStatistics = (transitionType?: string): TransitionStatistics => {
  // Generate some random but realistic values
  return {
    submissionToAOR: Math.floor(Math.random() * 10) + 30, // 30-40 days
    aorToBiometrics: Math.floor(Math.random() * 20) + 40, // 40-60 days
    biometricsToMedicals: Math.floor(Math.random() * 15) + 10, // 10-25 days
    backgroundCheckDuration: Math.floor(Math.random() * 30) + 50, // 50-80 days
    totalProcessingTime: Math.floor(Math.random() * 100) + 200, // 200-300 days
    applicationProgress: Math.floor(Math.random() * 30) + 60, // 60-90%
    estimatedDaysRemaining: Math.floor(Math.random() * 50) + 50, // 50-100 days
    milestoneNotes: [
      {
        title: 'Submission → AOR',
        description: 'Your application was processed faster than 60% of similar applications.',
      },
      {
        title: 'Biometrics Processing',
        description: 'Biometrics were processed within the expected timeframe.',
      },
      {
        title: 'Medical Examination',
        description: 'Medical results were confirmed quickly, faster than average.',
      },
      {
        title: 'Background Check',
        description: 'Your background check is progressing as expected for your profile.',
      },
    ],
  };
};
