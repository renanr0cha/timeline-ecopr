import { supabase } from '../lib/supabase';

interface StatisticsFilter {
  transitionType?: 'aor_to_p2' | 'p2_to_ecopr' | 'ecopr_to_prcard' | null;
}

export const statisticsService = {
  /**
   * Gets community statistics with optional filtering
   */
  async getCommunityStats(filter: StatisticsFilter = {}): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_community_statistics', {
        filter_transition_type: filter.transitionType || null,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting community statistics:', error);
      return [];
    }
  },
};
