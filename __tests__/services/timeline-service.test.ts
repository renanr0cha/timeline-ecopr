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
      // Mock successful device fetch
      const mockDeviceResponse: MockDeviceResponse = {
        data: { id: 'device-uuid' },
        error: null,
      };

      // Mock successful entry update
      const mockEntryResponse: MockEntryResponse = {
        data: { 
          id: 'entry-uuid', 
          device_id: 'device-uuid',
          entry_type: 'aor', 
          entry_date: '2023-06-01',
          notes: 'Updated notes'
        } as TimelineEntry,
        error: null,
      };

      // Setup mocks with proper type annotations
      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn<() => Promise<MockDeviceResponse>>().mockResolvedValue(mockDeviceResponse);
      
      // The key change - expose the update call to make sure it's called
      const mockUpdateFinal = jest.fn<() => Promise<MockEntryResponse>>().mockResolvedValue(mockEntryResponse);

      // Mock supabase chain for device query
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => ({
          select: mockSelect.mockReturnValue({
            eq: mockEq.mockReturnValue({
              single: mockSingle,
            }),
          }),
        }))
        // Mock supabase chain for entry update
        .mockImplementationOnce(() => ({
          update: mockUpdate.mockReturnThis(),
          eq: mockEq.mockReturnThis(),
        }));

      // Make the update function return the mock response directly
      mockUpdate.mockReturnValue(mockUpdateFinal);

      // Call the service method
      const result = await timelineService.updateEntry(
        'test-device-id',
        'entry-uuid',
        { notes: 'Updated notes' }
      );

      // Verify device query was called correctly
      expect(supabase.from).toHaveBeenCalledWith('devices');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq).toHaveBeenCalledWith('device_identifier', 'test-device-id');
      expect(mockSingle).toHaveBeenCalled();

      // Verify entry update was called correctly
      expect(supabase.from).toHaveBeenCalledWith('timeline_entries');
      expect(mockUpdate).toHaveBeenCalledWith({
        notes: 'Updated notes',
        updated_at: expect.any(String),
      });
      
      // Most importantly, verify the update was called
      expect(mockUpdateFinal).toHaveBeenCalled();

      // Verify the result
      expect(result).toEqual(mockEntryResponse.data);
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
      // Mock successful device fetch
      const mockDeviceResponse: MockDeviceResponse = {
        data: { id: 'device-uuid' },
        error: null,
      };

      // Mock successful entry deletion
      const mockDeleteResponse: MockDeleteResponse = {
        error: null,
      };

      // Setup mocks with proper type annotations
      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn<() => Promise<MockDeviceResponse>>().mockResolvedValue(mockDeviceResponse);
      
      // The key change - expose the delete call to make sure it's called
      const mockDeleteFinal = jest.fn<() => Promise<MockDeleteResponse>>().mockResolvedValue(mockDeleteResponse);

      // Mock supabase chain for device query
      (supabase.from as jest.Mock)
        .mockImplementationOnce(() => ({
          select: mockSelect.mockReturnValue({
            eq: mockEq.mockReturnValue({
              single: mockSingle,
            }),
          }),
        }))
        // Mock supabase chain for entry deletion
        .mockImplementationOnce(() => ({
          delete: mockDelete.mockReturnThis(),
          eq: mockEq.mockReturnThis(),
        }));

      // Make the delete function return the mock response directly
      mockDelete.mockReturnValue(mockDeleteFinal);

      // Call the service method
      await timelineService.deleteEntry(
        'test-device-id',
        'entry-uuid'
      );

      // Verify device query was called correctly
      expect(supabase.from).toHaveBeenCalledWith('devices');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq).toHaveBeenCalledWith('device_identifier', 'test-device-id');
      expect(mockSingle).toHaveBeenCalled();

      // Verify entry deletion was called correctly
      expect(supabase.from).toHaveBeenCalledWith('timeline_entries');
      expect(mockDelete).toHaveBeenCalled();
      
      // Most importantly, verify the delete was called
      expect(mockDeleteFinal).toHaveBeenCalled();
    });
  });
}); 