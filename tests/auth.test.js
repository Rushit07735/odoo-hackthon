import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

const API_URL = 'http://localhost:5000';

describe('Auth API Tests', () => {
  let testUserId;
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test123456',
    role: 'employee'
  };

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const [result] = await pool.execute(
      'INSERT INTO employees (name, email, password, role) VALUES (?, ?, ?, ?)',
      [testUser.name, testUser.email, hashedPassword, testUser.role]
    );
    testUserId = result.insertId;
  });

  afterAll(async () => {
    // Clean up test user
    await pool.execute('DELETE FROM employees WHERE id = ?', [testUserId]);
    await pool.end();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail with missing fields', async () => {
      const response = await request(API_URL)
        .post('/api/auth/login')
        .send({ email: testUser.email });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
