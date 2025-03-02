import { EntryType, TimelineEntry } from '../types';

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
