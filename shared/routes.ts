import { z } from 'zod';
import { insertUserSchema, insertWorkoutSchema, insertSessionSchema, insertAchievementSchema, type User, type Workout, type Session, type Achievement } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema.omit({ status: true }),
      responses: {
        201: z.custom<User>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    user: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  admin: {
    users: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/users',
        responses: {
          200: z.array(z.custom<User>()),
          401: errorSchemas.unauthorized,
          403: errorSchemas.unauthorized,
        },
      },
      update: {
        method: 'PATCH' as const,
        path: '/api/admin/users/:id',
        input: insertUserSchema.partial().extend({ status: z.string().optional() }),
        responses: {
          200: z.custom<User>(),
          400: errorSchemas.validation,
          403: errorSchemas.unauthorized,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/admin/users/:id',
        responses: {
          200: z.void(),
          403: errorSchemas.unauthorized,
        },
      },
    },
  },
  workouts: {
    list: {
      method: 'GET' as const,
      path: '/api/workouts',
      responses: {
        200: z.array(z.custom<Workout>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/workouts/:id',
      responses: {
        200: z.custom<Workout>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/workouts',
      input: insertWorkoutSchema,
      responses: {
        201: z.custom<Workout>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  sessions: {
    create: {
      method: 'POST' as const,
      path: '/api/sessions',
      input: insertSessionSchema,
      responses: {
        201: z.custom<Session>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/sessions',
      responses: {
        200: z.array(z.custom<Session>()),
      },
    },
  },
  leaderboard: {
    list: {
      method: 'GET' as const,
      path: '/api/leaderboard',
      responses: {
        200: z.array(z.custom<User>()),
      },
    },
  },
  achievements: {
    list: {
      method: 'GET' as const,
      path: '/api/achievements/:userId',
      responses: {
        200: z.array(z.custom<Achievement>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
