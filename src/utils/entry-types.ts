/**
 * Entry type options and display information
 */
export const ENTRY_TYPE_OPTIONS: {
  value: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}[] = [
  {
    value: 'submission',
    label: 'Submission',
    icon: 'paper-plane-outline',
    color: 'bg-purple-500',
    description: 'Application submission date',
  },
  {
    value: 'aor',
    label: 'AOR',
    icon: 'document-text-outline',
    color: 'bg-maple-red',
    description: 'Acknowledgement of Receipt',
  },
  {
    value: 'biometrics_request',
    label: 'Biometrics Request',
    icon: 'finger-print-outline',
    color: 'bg-teal-500',
    description: 'Biometrics request received',
  },
  {
    value: 'biometrics_complete',
    label: 'Biometrics Complete',
    icon: 'checkmark-circle-outline',
    color: 'bg-teal-600',
    description: 'Biometrics appointment completed',
  },
  {
    value: 'medicals_request',
    label: 'Medicals Request',
    icon: 'medical-outline',
    color: 'bg-blue-500',
    description: 'Medical examination request',
  },
  {
    value: 'medicals_complete',
    label: 'Medicals Complete',
    icon: 'medkit-outline',
    color: 'bg-blue-600',
    description: 'Medical examination passed',
  },
  {
    value: 'background_start',
    label: 'Background Check',
    icon: 'shield-outline',
    color: 'bg-yellow-500',
    description: 'Background check started',
  },
  {
    value: 'background_complete',
    label: 'Background Cleared',
    icon: 'shield-checkmark-outline',
    color: 'bg-yellow-600',
    description: 'Background check completed',
  },
  {
    value: 'additional_docs',
    label: 'Additional Docs',
    icon: 'folder-open-outline',
    color: 'bg-orange-500',
    description: 'Additional documents submitted',
  },
  {
    value: 'p1',
    label: 'P1',
    icon: 'person-outline',
    color: 'bg-hope-red',
    description: 'Principal applicant portal access',
  },
  {
    value: 'p2',
    label: 'P2',
    icon: 'people-outline',
    color: 'bg-hope-red',
    description: 'Secondary applicant portal access',
  },
  {
    value: 'ecopr',
    label: 'ecoPR',
    icon: 'mail-outline',
    color: 'bg-success',
    description: 'Electronic Confirmation of PR',
  },
  {
    value: 'pr_card',
    label: 'PR Card',
    icon: 'card-outline',
    color: 'bg-waiting',
    description: 'Permanent Resident Card received',
  },
];

/**
 * Get all entry type options for use in selectors
 * @returns Array of entry type options
 */
export const getEntryTypeOptions = () => {
  return ENTRY_TYPE_OPTIONS;
};

/**
 * Translates an entry type code to a user-friendly label
 * @param entryType - The entry type code to translate
 * @returns The user-friendly label or the original code if not found
 */
export const translateEntryType = (entryType: string): string => {
  const option = ENTRY_TYPE_OPTIONS.find(opt => opt.value === entryType);
  return option ? option.label : entryType;
};

/**
 * Gets the color for a specific entry type
 * @param entryType - The entry type code
 * @returns Tailwind CSS color class for the entry type
 */
export const getEntryTypeColor = (entryType: string): string => {
  const option = ENTRY_TYPE_OPTIONS.find(opt => opt.value === entryType);
  return option ? option.color : 'bg-gray-500';
};

/**
 * Gets the icon name for a specific entry type
 * @param entryType - The entry type code
 * @returns Ionicon name for the entry type
 */
export const getEntryTypeIcon = (entryType: string): string => {
  const option = ENTRY_TYPE_OPTIONS.find(opt => opt.value === entryType);
  return option ? option.icon : 'help-circle-outline';
}; 