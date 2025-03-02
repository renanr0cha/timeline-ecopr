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
  data: Partial<TimelineEntry> | Partial<TimelineEntry>[];
  error: null | Error;
}

interface MockDeleteResponse {
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

  describe('updateEntry', () => {
    it('should throw error if device ID is not provided', async () => {
      await expect(
        timelineService.updateEntry('', 'entry-id', { notes: 'Updated notes' })
      ).rejects.toThrow('Device ID is required');
    });

    it('should throw error if entry ID is not provided', async () => {
      await expect(
        timelineService.updateEntry('device-id', '', { notes: 'Updated notes' })
      ).rejects.toThrow('Entry ID is required');
    });

    it('should update an entry successfully', async () => {
      // We need to mock both calls to supabase.from() - one for device lookup and one for update
      const deviceResponse: MockDeviceResponse = {
        data: { id: 'device-uuid' },
        error: null,
      };
      const updateResponse: MockEntryResponse = {
        data: { id: 'entry-uuid', entry_type: 'aor', entry_date: '2023-06-01', notes: 'Updated notes' },
        error: null,
      };
      
      // Mock the chained calls in order with explicit types
      const mockSingle = jest.fn<() => Promise<MockDeviceResponse>>().mockResolvedValue(deviceResponse);
      const mockDeviceEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockDeviceSelect = jest.fn().mockReturnValue({ eq: mockDeviceEq });
      
      const mockUpdateEq2 = jest.fn<() => Promise<MockEntryResponse>>().mockResolvedValue(updateResponse);
      const mockUpdateEq1 = jest.fn().mockReturnValue({ eq: mockUpdateEq2 });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq1 });
      
      // First call to from() returns device query chain
      // Second call returns update chain
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => ({ select: mockDeviceSelect }))
        .mockImplementationOnce(() => ({ update: mockUpdate }));

      // Call the function being tested
      const result = await timelineService.updateEntry('device-id', 'entry-uuid', { notes: 'Updated notes' });
      
      // Verify correct calls were made
      expect(supabase.from).toHaveBeenCalledTimes(2);
      expect(supabase.from).toHaveBeenNthCalledWith(1, 'devices');
      expect(supabase.from).toHaveBeenNthCalledWith(2, 'timeline_entries');
      
      // Verify the result
      expect(result).toEqual(updateResponse.data);
    });
  });

  describe('deleteEntry', () => {
    it('should throw error if device ID is not provided', async () => {
      await expect(
        timelineService.deleteEntry('', 'entry-id')
      ).rejects.toThrow('Device ID is required');
    });

    it('should throw error if entry ID is not provided', async () => {
      await expect(
        timelineService.deleteEntry('device-id', '')
      ).rejects.toThrow('Entry ID is required');
    });

    it('should delete an entry successfully', async () => {
      // We need to mock both calls to supabase.from() - one for device lookup and one for delete
      const deviceResponse: MockDeviceResponse = {
        data: { id: 'device-uuid' },
        error: null,
      };
      const deleteResponse: MockDeleteResponse = {
        error: null,
      };
      
      // Mock the chained calls in order with explicit types
      const mockSingle = jest.fn<() => Promise<MockDeviceResponse>>().mockResolvedValue(deviceResponse);
      const mockDeviceEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockDeviceSelect = jest.fn().mockReturnValue({ eq: mockDeviceEq });
      
      const mockDeleteEq2 = jest.fn<() => Promise<MockDeleteResponse>>().mockResolvedValue(deleteResponse);
      const mockDeleteEq1 = jest.fn().mockReturnValue({ eq: mockDeleteEq2 });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq1 });
      
      // First call to from() returns device query chain
      // Second call returns delete chain
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => ({ select: mockDeviceSelect }))
        .mockImplementationOnce(() => ({ delete: mockDelete }));

      // Call the function being tested
      await timelineService.deleteEntry('device-id', 'entry-uuid');
      
      // Verify correct calls were made
      expect(supabase.from).toHaveBeenCalledTimes(2);
      expect(supabase.from).toHaveBeenNthCalledWith(1, 'devices');
      expect(supabase.from).toHaveBeenNthCalledWith(2, 'timeline_entries');
    });
  });
}); 