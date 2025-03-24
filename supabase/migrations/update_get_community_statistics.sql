-- Update get_community_statistics function to use user_id instead of device_id
DROP FUNCTION IF EXISTS get_community_statistics(text);
DROP FUNCTION IF EXISTS get_community_statistics(text, uuid);

-- Create new function that uses user_id parameter
CREATE OR REPLACE FUNCTION get_community_statistics(
  filter_transition_type TEXT DEFAULT NULL,
  user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  transition_type TEXT,
  report_date DATE,
  avg_days FLOAT,
  min_days INTEGER,
  max_days INTEGER,
  count INTEGER
) AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if the user exists (basic validation)
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id) INTO user_exists;
  
  IF user_id IS NULL OR NOT user_exists THEN
    RAISE EXCEPTION 'Invalid user_id provided';
  END IF;

  -- Return statistics data
  RETURN QUERY
  WITH transitions AS (
    -- Get transitions between different entry types
    SELECT 
      e1.entry_type AS start_type,
      e2.entry_type AS end_type,
      e1.entry_date AS transition_start_date,
      e2.entry_date AS end_date,
      (e2.entry_date - e1.entry_date)::INTEGER AS days_between  -- Cast to INTEGER explicitly
    FROM 
      timeline_entries e1
      JOIN timeline_entries e2 ON e1.user_id = e2.user_id 
                             AND e1.entry_date < e2.entry_date
    WHERE
      (e1.entry_type = 'aor' AND e2.entry_type = 'p2') OR
      (e1.entry_type = 'p2' AND e2.entry_type = 'ecopr') OR
      (e1.entry_type = 'ecopr' AND e2.entry_type = 'pr_card')
  ),
  transition_types AS (
    -- Map transition types to more readable format
    SELECT 
      days_between,
      transition_start_date,
      CASE 
        WHEN start_type = 'aor' AND end_type = 'p2' THEN 'aor-p2'
        WHEN start_type = 'p2' AND end_type = 'ecopr' THEN 'p2-ecopr'
        WHEN start_type = 'ecopr' AND end_type = 'pr_card' THEN 'ecopr-pr_card'
      END AS transition_name
    FROM 
      transitions
  ),
  monthly_stats AS (
    -- Aggregate statistics by month and transition type
    SELECT
      transition_name,
      date_trunc('month', transition_start_date) AS month_start,
      AVG(days_between) AS avg_days_calc,
      MIN(days_between) AS min_days_calc,
      MAX(days_between) AS max_days_calc,
      COUNT(*)::INTEGER AS entry_count  -- Cast COUNT to INTEGER 
    FROM
      transition_types
    WHERE
      filter_transition_type IS NULL OR transition_name = filter_transition_type
    GROUP BY
      transition_name, date_trunc('month', transition_start_date)
    ORDER BY
      date_trunc('month', transition_start_date) DESC, transition_name
  )
  SELECT
    transition_name AS transition_type,
    month_start::date AS report_date,
    ROUND(avg_days_calc::numeric, 1)::FLOAT AS avg_days,
    min_days_calc AS min_days,
    max_days_calc AS max_days,
    entry_count AS count  -- Already cast to INTEGER in the CTE
  FROM
    monthly_stats
  LIMIT 50; -- Limit results to a reasonable number
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution privileges to authenticated users
GRANT EXECUTE ON FUNCTION get_community_statistics(text, uuid) TO authenticated; 