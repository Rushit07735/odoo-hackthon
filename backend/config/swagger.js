import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DayFlow HR API',
      version: '1.0.0',
      description: 'Employee Productivity & Well-being System API Documentation',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Employee: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['employee', 'manager', 'HR'] },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        WorkLog: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employee_id: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            task_description: { type: 'string' },
            status: { type: 'string', enum: ['planned', 'in-progress', 'completed'] },
            comments: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Skill: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employee_id: { type: 'integer' },
            skill_name: { type: 'string' },
            learning_activity: { type: 'string' },
            progress: { type: 'integer', minimum: 0, maximum: 100 },
            date: { type: 'string', format: 'date' }
          }
        },
        Mood: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            employee_id: { type: 'integer' },
            mood: { type: 'string', enum: ['happy', 'neutral', 'stressed', 'tired'] },
            feedback: { type: 'string' },
            date: { type: 'string', format: 'date' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DayFlow HR API Docs'
  }));
};

export default specs;
