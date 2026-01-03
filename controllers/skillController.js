import pool from '../config/database.js';

// Get all skill developments (with access control)
export const getAllSkills = async (req, res) => {
  try {
    let query, params;

    if (req.user.role === 'HR' || req.user.role === 'manager') {
      query = `
        SELECT s.*, e.name as employee_name, e.email as employee_email
        FROM skill_developments s
        JOIN employees e ON s.employee_id = e.id
        ORDER BY s.date DESC, s.created_at DESC
      `;
      params = [];
    } else {
      query = `
        SELECT s.*, e.name as employee_name, e.email as employee_email
        FROM skill_developments s
        JOIN employees e ON s.employee_id = e.id
        WHERE s.employee_id = ?
        ORDER BY s.date DESC, s.created_at DESC
      `;
      params = [req.user.id];
    }

    const [skills] = await pool.execute(query, params);
    res.json(skills);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single skill
export const getSkillById = async (req, res) => {
  try {
    const { id } = req.params;
    let query, params;

    if (req.user.role === 'HR' || req.user.role === 'manager') {
      query = `
        SELECT s.*, e.name as employee_name, e.email as employee_email
        FROM skill_developments s
        JOIN employees e ON s.employee_id = e.id
        WHERE s.id = ?
      `;
      params = [id];
    } else {
      query = `
        SELECT s.*, e.name as employee_name, e.email as employee_email
        FROM skill_developments s
        JOIN employees e ON s.employee_id = e.id
        WHERE s.id = ? AND s.employee_id = ?
      `;
      params = [id, req.user.id];
    }

    const [skills] = await pool.execute(query, params);

    if (skills.length === 0) {
      return res.status(404).json({ error: 'Skill development not found' });
    }

    res.json(skills[0]);
  } catch (error) {
    console.error('Get skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create skill development
export const createSkill = async (req, res) => {
  try {
    const { skill_name, learning_activity, progress, date } = req.body;
    const employee_id = req.user.id;

    if (!skill_name) {
      return res.status(400).json({ error: 'Skill name is required' });
    }

    const progressValue = progress !== undefined ? Math.max(0, Math.min(100, parseInt(progress))) : 0;

    const [result] = await pool.execute(
      `INSERT INTO skill_developments (employee_id, skill_name, learning_activity, progress, date)
       VALUES (?, ?, ?, ?, ?)`,
      [
        employee_id,
        skill_name,
        learning_activity || null,
        progressValue,
        date || new Date().toISOString().split('T')[0]
      ]
    );

    const [newSkill] = await pool.execute(
      `SELECT s.*, e.name as employee_name, e.email as employee_email
       FROM skill_developments s
       JOIN employees e ON s.employee_id = e.id
       WHERE s.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newSkill[0]);
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update skill development
export const updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { skill_name, learning_activity, progress, date } = req.body;

    let checkQuery, checkParams;
    if (req.user.role === 'HR' || req.user.role === 'manager') {
      checkQuery = 'SELECT * FROM skill_developments WHERE id = ?';
      checkParams = [id];
    } else {
      checkQuery = 'SELECT * FROM skill_developments WHERE id = ? AND employee_id = ?';
      checkParams = [id, req.user.id];
    }

    const [existing] = await pool.execute(checkQuery, checkParams);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Skill development not found or access denied' });
    }

    const progressValue = progress !== undefined ? Math.max(0, Math.min(100, parseInt(progress))) : existing[0].progress;

    await pool.execute(
      `UPDATE skill_developments
       SET skill_name = ?, learning_activity = ?, progress = ?, date = ?
       WHERE id = ?`,
      [
        skill_name || existing[0].skill_name,
        learning_activity !== undefined ? learning_activity : existing[0].learning_activity,
        progressValue,
        date || existing[0].date,
        id
      ]
    );

    const [updated] = await pool.execute(
      `SELECT s.*, e.name as employee_name, e.email as employee_email
       FROM skill_developments s
       JOIN employees e ON s.employee_id = e.id
       WHERE s.id = ?`,
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete skill development
export const deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;

    let checkQuery, checkParams;
    if (req.user.role === 'HR' || req.user.role === 'manager') {
      checkQuery = 'SELECT * FROM skill_developments WHERE id = ?';
      checkParams = [id];
    } else {
      checkQuery = 'SELECT * FROM skill_developments WHERE id = ? AND employee_id = ?';
      checkParams = [id, req.user.id];
    }

    const [existing] = await pool.execute(checkQuery, checkParams);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Skill development not found or access denied' });
    }

    await pool.execute('DELETE FROM skill_developments WHERE id = ?', [id]);

    res.json({ message: 'Skill development deleted successfully' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


