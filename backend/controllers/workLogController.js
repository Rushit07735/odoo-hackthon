import pool from '../config/database.js';

// Get all work logs (with access control)
export const getAllWorkLogs = async (req, res) => {
  try {
    let query, params;

    // HR and Managers can see all logs, employees see only their own
    if (req.user.role === 'HR' || req.user.role === 'manager') {
      query = `
        SELECT wl.*, e.name as employee_name, e.email as employee_email
        FROM daily_work_logs wl
        JOIN employees e ON wl.employee_id = e.id
        ORDER BY wl.date DESC, wl.created_at DESC
      `;
      params = [];
    } else {
      query = `
        SELECT wl.*, e.name as employee_name, e.email as employee_email
        FROM daily_work_logs wl
        JOIN employees e ON wl.employee_id = e.id
        WHERE wl.employee_id = ?
        ORDER BY wl.date DESC, wl.created_at DESC
      `;
      params = [req.user.id];
    }

    const [logs] = await pool.execute(query, params);
    res.json(logs);
  } catch (error) {
    console.error('Get work logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single work log
export const getWorkLogById = async (req, res) => {
  try {
    const { id } = req.params;
    let query, params;

    if (req.user.role === 'HR' || req.user.role === 'manager') {
      query = `
        SELECT wl.*, e.name as employee_name, e.email as employee_email
        FROM daily_work_logs wl
        JOIN employees e ON wl.employee_id = e.id
        WHERE wl.id = ?
      `;
      params = [id];
    } else {
      query = `
        SELECT wl.*, e.name as employee_name, e.email as employee_email
        FROM daily_work_logs wl
        JOIN employees e ON wl.employee_id = e.id
        WHERE wl.id = ? AND wl.employee_id = ?
      `;
      params = [id, req.user.id];
    }

    const [logs] = await pool.execute(query, params);

    if (logs.length === 0) {
      return res.status(404).json({ error: 'Work log not found' });
    }

    res.json(logs[0]);
  } catch (error) {
    console.error('Get work log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create work log
export const createWorkLog = async (req, res) => {
  try {
    const { date, task_description, status, comments } = req.body;
    const employee_id = req.user.id;

    if (!task_description) {
      return res.status(400).json({ error: 'Task description is required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO daily_work_logs (employee_id, date, task_description, status, comments)
       VALUES (?, ?, ?, ?, ?)`,
      [
        employee_id,
        date || new Date().toISOString().split('T')[0],
        task_description,
        status || 'planned',
        comments || null
      ]
    );

    const [newLog] = await pool.execute(
      `SELECT wl.*, e.name as employee_name, e.email as employee_email
       FROM daily_work_logs wl
       JOIN employees e ON wl.employee_id = e.id
       WHERE wl.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newLog[0]);
  } catch (error) {
    console.error('Create work log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update work log
export const updateWorkLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, task_description, status, comments } = req.body;

    // Check if log exists and user has permission
    let checkQuery, checkParams;
    if (req.user.role === 'HR' || req.user.role === 'manager') {
      checkQuery = 'SELECT * FROM daily_work_logs WHERE id = ?';
      checkParams = [id];
    } else {
      checkQuery = 'SELECT * FROM daily_work_logs WHERE id = ? AND employee_id = ?';
      checkParams = [id, req.user.id];
    }

    const [existing] = await pool.execute(checkQuery, checkParams);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Work log not found or access denied' });
    }

    await pool.execute(
      `UPDATE daily_work_logs
       SET date = ?, task_description = ?, status = ?, comments = ?
       WHERE id = ?`,
      [
        date || existing[0].date,
        task_description || existing[0].task_description,
        status || existing[0].status,
        comments !== undefined ? comments : existing[0].comments,
        id
      ]
    );

    const [updated] = await pool.execute(
      `SELECT wl.*, e.name as employee_name, e.email as employee_email
       FROM daily_work_logs wl
       JOIN employees e ON wl.employee_id = e.id
       WHERE wl.id = ?`,
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Update work log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete work log
export const deleteWorkLog = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if log exists and user has permission
    let checkQuery, checkParams;
    if (req.user.role === 'HR' || req.user.role === 'manager') {
      checkQuery = 'SELECT * FROM daily_work_logs WHERE id = ?';
      checkParams = [id];
    } else {
      checkQuery = 'SELECT * FROM daily_work_logs WHERE id = ? AND employee_id = ?';
      checkParams = [id, req.user.id];
    }

    const [existing] = await pool.execute(checkQuery, checkParams);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Work log not found or access denied' });
    }

    await pool.execute('DELETE FROM daily_work_logs WHERE id = ?', [id]);

    res.json({ message: 'Work log deleted successfully' });
  } catch (error) {
    console.error('Delete work log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


