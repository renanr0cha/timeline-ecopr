import { PostgrestError } from '@supabase/supabase-js';

import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import { CommunityStatistic } from '../types';

/**
 * Service for retrieving and processing community statistics
 * Handles querying Supabase for aggregated timeline data
 */
export const statisticsService = {
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
