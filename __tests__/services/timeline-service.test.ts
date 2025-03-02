/**
 * Tests for the timeline service functionality
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { supabase } from '../../src/lib/supabase';
import { timelineService } from '../../src/services/timeline-service';
import { EntryType, TimelineEntry } from '../../src/types';

// Define mock response types for better type safety
interface MockDeviceResponse {
  data: { id: string };
  error: null | Error;
}

interface MockEntryResponse {
  data: Partial<TimelineEntry>;
  error: null | Error;
}

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock logger to avoid console output during tests
jest.mock('../../src/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Timeline Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addEntry', () => {
    it('should throw error if device ID is not provided', async () => {
      await expect(
        timelineService.addEntry('', 'aor' as EntryType, '2023-06-01')
      ).rejects.toThrow('Device ID is required');
    });

    it('should add an entry successfully', async () => {
      // Mock successful device fetch
      const mockDeviceResponse: MockDeviceResponse = {
        data: { id: 'device-uuid' },
        error: null,
      };

      // Mock successful entry insertion
      const mockEntryResponse: MockEntryResponse = {
        data: { id: 'entry-uuid', entry_type: 'aor', entry_date: '2023-06-01' },
        error: null,
      };

      // Setup mocks with proper type annotations
      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn<() => Promise<MockDeviceResponse>>().mockResolvedValue(mockDeviceResponse);
      const mockUpsert = jest.fn<(data: any, options: any) => Promise<MockEntryResponse>>().mockResolvedValue(mockEntryResponse);

      // Mock supabase chain for device query
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => ({
          select: mockSelect.mockReturnValue({
            eq: mockEq.mockReturnValue({
              single: mockSingle,
            }),
          }),
        }))
        // Mock supabase chain for entry insertion
        .mockImplementationOnce(() => ({
          upsert: mockUpsert,
        }));

      // Call the service method
      const result = await timelineService.addEntry(
        'test-device-id',
        'aor' as EntryType,
        '2023-06-01',
        'Test notes'
      );

      // Verify device query was called correctly
      expect(supabase.from).toHaveBeenCalledWith('devices');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq).toHaveBeenCalledWith('device_identifier', 'test-device-id');
      expect(mockSingle).toHaveBeenCalled();

      // Verify entry insertion was called correctly
      expect(supabase.from).toHaveBeenCalledWith('timeline_entries');
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          device_id: 'device-uuid',
          entry_type: 'aor',
          entry_date: '2023-06-01',
          notes: 'Test notes',
          updated_at: expect.any(String),
        },
        { onConflict: 'device_id,entry_type' }
      );

      // Verify the result
      expect(result).toEqual(mockEntryResponse.data);
    });

    // Additional tests would be added for error cases...
  });

  describe('getUserTimeline', () => {
    it('should return empty array if device ID is not provided', async () => {
      const result = await timelineService.getUserTimeline('');
      expect(result).toEqual([]);
    });

    // Additional tests would be added for success and error cases...
  });
}); 