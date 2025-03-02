import { CommunityStatistic, EntryType, TimelineEntry, WeeklyBreakdown } from '../types';

/**
 * Generates a random date between start and end date
 *
 * @param start - Start date
 * @param end - End date
 * @returns Random date between start and end
 */
const randomDate = (start: Date, end: Date): Date => {
  const diff = end.getTime() - start.getTime();
  const newDiff = Math.random() * diff;
  const date = new Date(start.getTime() + newDiff);
  return date;
};

/**
 * Format date to ISO string (YYYY-MM-DD)
 *
 * @param date - Date to format
 * @returns Formatted date string
 */
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Generates random notes for timeline entries
 *
 * @param entryType - Type of entry
 * @returns Random notes relevant to the entry type
 */
const generateNotes = (entryType: EntryType): string => {
  const notesOptions = {
    aor: [
      'Application submitted online',
      'Received confirmation email from IRCC',
      'Application fee paid: $1,325',
      'Included all required documents',
      'Used the new IRCC portal',
      'Medical exam completed before submission',
      'Police certificate included from home country',
    ],
    p2: [
      'Portal access granted',
      'Biometrics appointment scheduled',
      'Additional documents requested',
      'Medical results updated',
      'Status changed to "in progress"',
      'Background check completed',
      'Employment verification received',
    ],
    ecopr: [
      'Received passport request',
      'COPR document arrived',
      'Landing date scheduled',
      'Completed landing process',
      'Proof of residence submitted',
      'Confirmation of PR status in system',
      'SIN number application completed',
    ],
    pr_card: [
      'PR card production in progress',
      'Card shipped via Canada Post',
      'Tracking number received',
      'Card delivered to address',
      'Activated online account',
      'Received welcome package',
      'Updated address with IRCC',
    ],
  };

  const options = notesOptions[entryType];
  return options[Math.floor(Math.random() * options.length)];
};

/**
 * Generates mock timeline entries for testing
 *
 * @param deviceId - Device identifier
 * @param count - Number of devices to generate data for
 * @returns Array of timeline entries
 */
export const generateMockTimelineEntries = (
  deviceId: string,
  count: number = 20
): TimelineEntry[] => {
  const entries: TimelineEntry[] = [];
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

  // Generate entries for multiple devices
  for (let i = 0; i < count; i++) {
    const mockDeviceId = i === 0 ? deviceId : `mock-device-${i.toString().padStart(3, '0')}`;

    // Generate AOR entry (always first in the process)
    const aorDate = randomDate(twoYearsAgo, oneYearAgo);
    entries.push({
      id: `mock-aor-${i}`,
      device_id: mockDeviceId,
      entry_type: 'aor',
      entry_date: formatDate(aorDate),
      notes: generateNotes('aor'),
      created_at: new Date(aorDate.getTime() - Math.random() * 86400000).toISOString(),
    });

    // Some users have progressed to P2
    if (Math.random() > 0.1) {
      const p2Date = new Date(aorDate.getTime() + (30 + Math.random() * 120) * 86400000);
      if (p2Date <= now) {
        entries.push({
          id: `mock-p2-${i}`,
          device_id: mockDeviceId,
          entry_type: 'p2',
          entry_date: formatDate(p2Date),
          notes: generateNotes('p2'),
          created_at: new Date(p2Date.getTime() - Math.random() * 86400000).toISOString(),
        });

        // Some users have progressed to ecoPR
        if (Math.random() > 0.3) {
          const ecoprDate = new Date(p2Date.getTime() + (60 + Math.random() * 180) * 86400000);
          if (ecoprDate <= now) {
            entries.push({
              id: `mock-ecopr-${i}`,
              device_id: mockDeviceId,
              entry_type: 'ecopr',
              entry_date: formatDate(ecoprDate),
              notes: generateNotes('ecopr'),
              created_at: new Date(ecoprDate.getTime() - Math.random() * 86400000).toISOString(),
            });

            // Some users have received PR card
            if (Math.random() > 0.5) {
              const prCardDate = new Date(
                ecoprDate.getTime() + (30 + Math.random() * 90) * 86400000
              );
              if (prCardDate <= now) {
                entries.push({
                  id: `mock-pr-card-${i}`,
                  device_id: mockDeviceId,
                  entry_type: 'pr_card',
                  entry_date: formatDate(prCardDate),
                  notes: generateNotes('pr_card'),
                  created_at: new Date(
                    prCardDate.getTime() - Math.random() * 86400000
                  ).toISOString(),
                });
              }
            }
          }
        }
      }
    }
  }

  return entries;
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
  return allEntries.filter((entry) => entry.device_id === deviceId);
};

/**
 * Generates mock statistics data for the community statistics screen
 * 
 * @param transitionType - Optional transition type filter
 * @returns Array of mock community statistics
 */
export const generateMockStatistics = (
  transitionType?: string
): CommunityStatistic[] => {
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
      const waitingCount = type === 'p2-ecopr' ? count * 3 + Math.floor(Math.random() * 10) : undefined;
      
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
            weekCount = Math.max(1, Math.floor(remainingCount * proportion * (0.7 + Math.random() * 0.6)));
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
            count: weekCount
          });
        }
      }
      
      stats.push({
        transition_type: type,
        avg_days: avgDays,
        min_days: minDays,
        max_days: maxDays,
        count: count,
        month_year: monthYear,
        waiting_count: waitingCount,
        week_breakdown: type === 'p2-ecopr' ? weekBreakdown : undefined
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
