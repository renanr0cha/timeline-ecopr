import { PostgrestError } from '@supabase/supabase-js';

import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import { CommunityStatistic, TransitionStatistics } from '../types';
import { getMockTransitionStatistics, loadMockStatisticsData } from '../utils/mock-data';

/**
 * Service for retrieving and processing community statistics
 * Handles querying Supabase for aggregated timeline data
 */
export const statisticsService = {
  /**
   * Flag to toggle use of mock data for statistics
   */
  useMockData: true,

  /**
   * Toggle mock data on/off
   */
  toggleMockData() {
    this.useMockData = !this.useMockData;
    logger.info('Mock data for statistics', { enabled: this.useMockData });
    return this.useMockData;
  },

  /**
   * Retrieves personal user statistics for the authenticated user
   * 
   * @param transitionType - Optional transition type to focus the statistics on
   * @returns Promise resolving to user transition statistics
   */
  async getUserStatistics(transitionType?: string): Promise<TransitionStatistics | null> {
    try {
      logger.info('Fetching user statistics', { transitionType });
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        logger.warn('No authenticated user found when getting statistics');
        return null;
      }
      
      const userId = session.user.id;
      
      // Currently using mock data
      if (this.useMockData) {
        logger.info('Using mock statistics data for user', { userId, transitionType });
        const mockData = getMockTransitionStatistics(transitionType || 'p1');
        return mockData;
      }
      
      // TODO: Implement real data retrieval from Supabase
      // This would query a view or function that calculates statistics based on the user's timeline
      // const { data, error } = await supabase.rpc('get_user_statistics', {
      //   user_id: userId,
      //   transition_type: transitionType || null
      // });
      
      // For now, return mock data
      return getMockTransitionStatistics(transitionType || 'p1');
    } catch (error) {
      // Specific handling for different error types
      if (error instanceof PostgrestError) {
        logger.error('Supabase error retrieving user statistics', {
          code: error.code,
          message: error.message,
          hint: error.hint,
        });
      } else if (error instanceof Error) {
        logger.error('Error retrieving user statistics', { message: error.message });
      } else {
        logger.error('Unknown error retrieving user statistics', { error });
      }
      return null;
    }
  },

  /**
   * Retrieves community statistics with optional filtering
   *
   * @param transitionType - Optional transition type filter (e.g. 'aor-p2', 'p2-ecopr')
   * @returns Promise resolving to an array of community statistics
   */
  async getCommunityStats(transitionType?: string): Promise<CommunityStatistic[]> {
    try {
      // Validate parameters
      if (transitionType && !['aor-p2', 'p2-ecopr', 'ecopr-pr_card'].includes(transitionType)) {
        logger.warn('Invalid transition type provided', { transitionType });
        throw new Error('Invalid transition type');
      }

      // Use mock data if enabled
      if (this.useMockData) {
        logger.info('Using mock statistics data', { transitionType });
        const mockData = loadMockStatisticsData(transitionType);
        logger.info('Mock statistics loaded successfully', { count: mockData.length });
        return mockData;
      }

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        logger.warn('No authenticated user found when getting community statistics');
        return [];
      }

      // Call the stored procedure
      logger.info('Fetching community statistics', { transitionType });
      const { data, error } = await supabase.rpc('get_community_statistics', {
        filter_transition_type: transitionType || null,
      });

      if (error) {
        logger.error('Error retrieving community statistics', { error });
        throw error;
      }

      if (!data) {
        logger.info('No community statistics found');
        return [];
      }

      // Format and structure the data for visualization
      const formattedData = this._formatStatisticsData(data);
      logger.info('Community statistics retrieved successfully', {
        count: formattedData.length,
        transitionType,
      });

      return formattedData;
    } catch (error) {
      // Specific handling for different error types
      if (error instanceof PostgrestError) {
        logger.error('Supabase error retrieving statistics', {
          code: error.code,
          message: error.message,
          hint: error.hint,
        });
      } else if (error instanceof Error) {
        logger.error('Error retrieving statistics', { message: error.message });
      } else {
        logger.error('Unknown error retrieving statistics', { error });
      }
      return [];
    }
  },

  /**
   * Format raw statistics data for visualization
   *
   * @param rawData - Raw statistics data from the database
   * @returns Formatted statistics data
   * @private
   */
  _formatStatisticsData(rawData: any[]): CommunityStatistic[] {
    try {
      if (!Array.isArray(rawData) || rawData.length === 0) {
        return [];
      }

      // Add month-year formatting for better display
      return rawData.map((stat) => {
        let monthYear = '';
        if (stat.start_date) {
          const date = new Date(stat.start_date);
          monthYear = date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          });
        }

        return {
          transition_type: stat.transition_type,
          avg_days: Number(stat.avg_days) || 0,
          min_days: Number(stat.min_days) || 0,
          max_days: Number(stat.max_days) || 0,
          count: Number(stat.count) || 0,
          month_year: monthYear,
        };
      });
    } catch (error) {
      logger.error('Error formatting statistics data', { error });
      return [];
    }
  },
};
