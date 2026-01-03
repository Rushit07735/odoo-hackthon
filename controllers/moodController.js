import pool from '../config/database.js';

// Get all mood feedbacks (with access control)
export const getAllMoods = async (req, res) => {
  try {
    let query, params;

    if (req.user.role === 'HR' || req.user.role === 'manager') {
      query = `
        SELECT m.*, e.name as employee_name, e.email as employee_email
        FROM mood_feedbacks m
        JOIN employees e ON m.employee_id = e.id
        ORDER BY m.date DESC, m.created_at DESC
      `;
      params = [];
    } else {
      query = `
        SELECT m.*, e.name as employee_name, e.email as employee_email
        FROM mood_feedbacks m
        JOIN employees e ON m.employee_id = e.id
        WHERE m.employee_id = ?
        ORDER BY m.date DESC, m.created_at DESC
      `;
      params = [req.user.id];
    }

    const [moods] = await pool.execute(query, params);
    res.json(moods);
  } catch (error) {
    console.error('Get moods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single mood feedback
export const getMoodById = async (req, res) => {
  try {
    const { id } = req.params;
    let query, params;

    if (req.user.role === 'HR' || req.user.role === 'manager') {
      query = `
        SELECT m.*, e.name as employee_name, e.email as employee_email
        FROM mood_feedbacks m
        JOIN employees e ON m.employee_id = e.id
        WHERE m.id = ?
      `;
      params = [id];
    } else {
      query = `
        SELECT m.*, e.name as employee_name, e.email as employee_email
        FROM mood_feedbacks m
        JOIN employees e ON m.employee_id = e.id
        WHERE m.id = ? AND m.employee_id = ?
      `;
      params = [id, req.user.id];
    }

    const [moods] = await pool.execute(query, params);

    if (moods.length === 0) {
      return res.status(404).json({ error: 'Mood feedback not found' });
    }

    res.json(moods[0]);
  } catch (error) {
    console.error('Get mood error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create mood feedback
export const createMood = async (req, res) => {
  try {
    const { mood, feedback, date } = req.body;
    const employee_id = req.user.id;

    if (!mood) {
      return res.status(400).json({ error: 'Mood is required' });
    }

    const validMoods = ['happy', 'neutral', 'stressed', 'tired'];
    if (!validMoods.includes(mood)) {
      return res.status(400).json({ error: 'Invalid mood value' });
    }

    const [result] = await pool.execute(
      `INSERT INTO mood_feedbacks (employee_id, mood, feedback, date)
       VALUES (?, ?, ?, ?)`,
      [
        employee_id,
        mood,
        feedback || null,
        date || new Date().toISOString().split('T')[0]
      ]
    );

    const [newMood] = await pool.execute(
      `SELECT m.*, e.name as employee_name, e.email as employee_email
       FROM mood_feedbacks m
       JOIN employees e ON m.employee_id = e.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newMood[0]);
  } catch (error) {
    console.error('Create mood error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update mood feedback
export const updateMood = async (req, res) => {
  try {
    const { id } = req.params;
    const { mood, feedback, date } = req.body;

    let checkQuery, checkParams;
    if (req.user.role === 'HR' || req.user.role === 'manager') {
      checkQuery = 'SELECT * FROM mood_feedbacks WHERE id = ?';
      checkParams = [id];
    } else {
      checkQuery = 'SELECT * FROM mood_feedbacks WHERE id = ? AND employee_id = ?';
      checkParams = [id, req.user.id];
    }

    const [existing] = await pool.execute(checkQuery, checkParams);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Mood feedback not found or access denied' });
    }

    if (mood) {
      const validMoods = ['happy', 'neutral', 'stressed', 'tired'];
      if (!validMoods.includes(mood)) {
        return res.status(400).json({ error: 'Invalid mood value' });
      }
    }

    await pool.execute(
      `UPDATE mood_feedbacks
       SET mood = ?, feedback = ?, date = ?
       WHERE id = ?`,
      [
        mood || existing[0].mood,
        feedback !== undefined ? feedback : existing[0].feedback,
        date || existing[0].date,
        id
      ]
    );

    const [updated] = await pool.execute(
      `SELECT m.*, e.name as employee_name, e.email as employee_email
       FROM mood_feedbacks m
       JOIN employees e ON m.employee_id = e.id
       WHERE m.id = ?`,
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Update mood error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete mood feedback
export const deleteMood = async (req, res) => {
  try {
    const { id } = req.params;

    let checkQuery, checkParams;
    if (req.user.role === 'HR' || req.user.role === 'manager') {
      checkQuery = 'SELECT * FROM mood_feedbacks WHERE id = ?';
      checkParams = [id];
    } else {
      checkQuery = 'SELECT * FROM mood_feedbacks WHERE id = ? AND employee_id = ?';
      checkParams = [id, req.user.id];
    }

    const [existing] = await pool.execute(checkQuery, checkParams);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Mood feedback not found or access denied' });
    }

    await pool.execute('DELETE FROM mood_feedbacks WHERE id = ?', [id]);

    res.json({ message: 'Mood feedback deleted successfully' });
  } catch (error) {
    console.error('Delete mood error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


