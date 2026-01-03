import pool from '../config/database.js';

// Get analytics data for dashboard
export const getDashboardAnalytics = async (req, res) => {
  try {
    const employeeId = req.user.role === 'employee' ? req.user.id : null;
    const dateRange = req.query.days || 30;

    // Get work log stats
    const workLogQuery = employeeId
      ? `SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
          SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_tasks
         FROM daily_work_logs 
         WHERE employee_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         AND deleted_at IS NULL`
      : `SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
          SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_tasks
         FROM daily_work_logs 
         WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         AND deleted_at IS NULL`;

    const workLogParams = employeeId ? [employeeId, dateRange] : [dateRange];
    const [workLogStats] = await pool.execute(workLogQuery, workLogParams);

    // Get mood trends
    const moodQuery = employeeId
      ? `SELECT mood, COUNT(*) as count 
         FROM mood_feedbacks 
         WHERE employee_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         AND deleted_at IS NULL
         GROUP BY mood`
      : `SELECT mood, COUNT(*) as count 
         FROM mood_feedbacks 
         WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         AND deleted_at IS NULL
         GROUP BY mood`;

    const moodParams = employeeId ? [employeeId, dateRange] : [dateRange];
    const [moodStats] = await pool.execute(moodQuery, moodParams);

    // Get skill progress
    const skillQuery = employeeId
      ? `SELECT skill_name, AVG(progress) as avg_progress 
         FROM skill_developments 
         WHERE employee_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         AND deleted_at IS NULL
         GROUP BY skill_name 
         ORDER BY avg_progress DESC 
         LIMIT 5`
      : `SELECT skill_name, AVG(progress) as avg_progress 
         FROM skill_developments 
         WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         AND deleted_at IS NULL
         GROUP BY skill_name 
         ORDER BY avg_progress DESC 
         LIMIT 10`;

    const skillParams = employeeId ? [employeeId, dateRange] : [dateRange];
    const [skillStats] = await pool.execute(skillQuery, skillParams);

    // Get daily activity for chart
    const activityQuery = employeeId
      ? `SELECT 
          DATE(date) as activity_date,
          COUNT(DISTINCT wl.id) as work_logs,
          COUNT(DISTINCT sd.id) as skills,
          COUNT(DISTINCT mf.id) as moods
         FROM (SELECT DISTINCT date FROM daily_work_logs 
               WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)) dates
         LEFT JOIN daily_work_logs wl ON DATE(wl.date) = dates.date AND wl.employee_id = ? AND wl.deleted_at IS NULL
         LEFT JOIN skill_developments sd ON DATE(sd.date) = dates.date AND sd.employee_id = ? AND sd.deleted_at IS NULL
         LEFT JOIN mood_feedbacks mf ON DATE(mf.date) = dates.date AND mf.employee_id = ? AND mf.deleted_at IS NULL
         GROUP BY activity_date
         ORDER BY activity_date DESC
         LIMIT 30`
      : `SELECT 
          DATE(date) as activity_date,
          COUNT(DISTINCT wl.id) as work_logs,
          COUNT(DISTINCT sd.id) as skills,
          COUNT(DISTINCT mf.id) as moods
         FROM (SELECT DISTINCT date FROM daily_work_logs 
               WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)) dates
         LEFT JOIN daily_work_logs wl ON DATE(wl.date) = dates.date AND wl.deleted_at IS NULL
         LEFT JOIN skill_developments sd ON DATE(sd.date) = dates.date AND sd.deleted_at IS NULL
         LEFT JOIN mood_feedbacks mf ON DATE(mf.date) = dates.date AND mf.deleted_at IS NULL
         GROUP BY activity_date
         ORDER BY activity_date DESC
         LIMIT 30`;

    const activityParams = employeeId 
      ? [dateRange, employeeId, employeeId, employeeId] 
      : [dateRange];
    const [activityStats] = await pool.execute(activityQuery, activityParams);

    res.json({
      workLogs: workLogStats[0],
      moods: moodStats,
      skills: skillStats,
      activity: activityStats.reverse()
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};

// Export data as CSV
export const exportData = async (req, res) => {
  try {
    const { type } = req.params; // work-logs, skills, or moods
    const employeeId = req.user.role === 'employee' ? req.user.id : null;

    let query, params, filename;

    switch (type) {
      case 'work-logs':
        query = employeeId
          ? `SELECT wl.*, e.name as employee_name 
             FROM daily_work_logs wl 
             JOIN employees e ON wl.employee_id = e.id 
             WHERE wl.employee_id = ? AND wl.deleted_at IS NULL 
             ORDER BY wl.date DESC`
          : `SELECT wl.*, e.name as employee_name 
             FROM daily_work_logs wl 
             JOIN employees e ON wl.employee_id = e.id 
             WHERE wl.deleted_at IS NULL 
             ORDER BY wl.date DESC`;
        params = employeeId ? [employeeId] : [];
        filename = 'work_logs_export.csv';
        break;

      case 'skills':
        query = employeeId
          ? `SELECT sd.*, e.name as employee_name 
             FROM skill_developments sd 
             JOIN employees e ON sd.employee_id = e.id 
             WHERE sd.employee_id = ? AND sd.deleted_at IS NULL 
             ORDER BY sd.date DESC`
          : `SELECT sd.*, e.name as employee_name 
             FROM skill_developments sd 
             JOIN employees e ON sd.employee_id = e.id 
             WHERE sd.deleted_at IS NULL 
             ORDER BY sd.date DESC`;
        params = employeeId ? [employeeId] : [];
        filename = 'skills_export.csv';
        break;

      case 'moods':
        query = employeeId
          ? `SELECT mf.*, e.name as employee_name 
             FROM mood_feedbacks mf 
             JOIN employees e ON mf.employee_id = e.id 
             WHERE mf.employee_id = ? AND mf.deleted_at IS NULL 
             ORDER BY mf.date DESC`
          : `SELECT mf.*, e.name as employee_name 
             FROM mood_feedbacks mf 
             JOIN employees e ON mf.employee_id = e.id 
             WHERE mf.deleted_at IS NULL 
             ORDER BY mf.date DESC`;
        params = employeeId ? [employeeId] : [];
        filename = 'moods_export.csv';
        break;

      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }

    // Convert to CSV
    const headers = Object.keys(rows[0]).join(',');
    const csvRows = rows.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    );
    const csv = [headers, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
};
