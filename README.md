# @killiandvcz/rest

A modern, lightweight REST API framework built specifically for **Bun** runtime. Fast, type-safe, and developer-friendly.

## ✨ Features

- 🚀 **Built for Bun** - Leverages Bun's native performance and APIs
- 🎯 **Type-safe** - Full TypeScript support with JSDoc annotations
- 🔄 **Middleware system** - Powerful and flexible middleware chain
- 📝 **Request parsing** - Automatic body parsing based on Content-Type
- ✅ **Schema validation** - Built-in Zod integration for data validation
- 🏗️ **App mounting** - Compose applications for better modularity
- 🎨 **Elegant API** - Express-like syntax with modern enhancements

## 🚀 Quick Start

### Installation

```bash
bun add @killiandvcz/rest
```

### Basic Usage

```javascript
import { Rest } from '@killiandvcz/rest';

const app = new Rest();

// Simple route
app.get('/', (c) => {
  return c.json({ message: 'Hello World!' });
});

// Route with parameters
app.get('/users/:id', (c) => {
  const id = c.request.param('id');
  return c.json({ userId: id });
});

// POST with automatic body parsing
app.post('/users', async (c) => {
  const data = await c.request.parse();
  return c.json({ created: data });
});

// Start server
export default {
  port: 3000,
  fetch: app.fetch,
};
```

## 📚 API Reference

### Creating an App

```javascript
import { Rest } from '@killiandvcz/rest';

const app = new Rest();
```

### Route Methods

```javascript
app.get(path, handler)
app.post(path, handler)
app.put(path, handler)
app.delete(path, handler)
app.patch(path, handler)
app.options(path, handler)
```

### Route Parameters

```javascript
// Named parameters
app.get('/users/:id/posts/:postId', (c) => {
  const userId = c.request.param('id');
  const postId = c.request.param('postId');
  return c.json({ userId, postId });
});

// Query parameters
app.get('/search', (c) => {
  const query = c.request.query('q');
  const limit = c.request.query('limit') || '10';
  return c.json({ query, limit });
});
```

### Request Handling

```javascript
app.post('/upload', async (c) => {
  // Automatic parsing based on Content-Type
  const data = await c.request.parse();
  
  // Or manually parse specific formats
  const json = await c.request.json();
  const text = await c.request.text();
  const formData = await c.request.formData();
  
  // Access headers
  const contentType = c.request.header('Content-Type');
  
  // Access cookies
  const sessionId = c.request.cookies.get('session');
  
  return c.json({ received: data });
});
```

### Response Methods

```javascript
app.get('/api/data', (c) => {
  // JSON response
  return c.json({ data: 'value' });
  
  // Text response
  return c.text('Plain text');
  
  // Redirect
  return c.redirect('/new-location');
  
  // Error response
  return c.error('Something went wrong', 400);
  
  // Not found
  return c.notFound();
});
```

## 🔧 Middleware

### Global Middleware

```javascript
// Apply to all routes
app.use('*', async (c, next) => {
  console.log(`${c.request.method} ${c.request.path}`);
  const start = Date.now();
  
  await next(c);
  
  console.log(`Took ${Date.now() - start}ms`);
});
```

### Path-specific Middleware

```javascript
// Apply to specific paths
app.use('/api/*', async (c, next) => {
  // Authentication middleware
  const token = c.request.header('Authorization');
  if (!token) {
    return c.error('Unauthorized', 401);
  }
  
  c.set('user', { id: 'user123' });
  await next(c);
});

// Multiple paths
app.use(['/admin/*', '/dashboard/*'], requireAuth);
```

### CORS Middleware

```javascript
app.use('*', async (c, next) => {
  // Handle preflight requests
  if (c.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  
  await next(c);
  
  // Add CORS headers to response
  c.response.headers.set('Access-Control-Allow-Origin', '*');
});
```

## ✅ Schema Validation

Built-in Zod integration for type-safe request validation:

```javascript
import { Rest, schema, s } from '@killiandvcz/rest';

const app = new Rest();

app.post('/users', async (c) => {
  // Validate request body
  const data = await schema(c, (z) => z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().int().min(18),
  }));
  
  // data is now type-safe and validated
  return c.json({ user: data });
});

// Create reusable schemas
const UserSchema = s.object({
  name: s.string(),
  email: s.string().email(),
});

app.post('/register', async (c) => {
  const data = await schema(c, () => UserSchema);
  return c.json({ registered: data });
});
```

### Schema Options

```javascript
app.post('/sensitive', async (c) => {
  const data = await schema(c, UserSchema, {
    strict: true,           // Strict validation
    redact: true,          // Hide validation errors in response
    crossData: {           // Add extra data to validation
      timestamp: Date.now()
    }
  });
  
  return c.json({ data });
});
```

## 🏗️ App Mounting

Compose applications for better modularity:

```javascript
// auth.js
const auth = new Rest();
auth.post('/login', loginHandler);
auth.post('/register', registerHandler);

// api.js
const api = new Rest();
api.get('/users', getUsersHandler);
api.get('/posts', getPostsHandler);

// main.js
const app = new Rest();

// Mount sub-applications
app.mount('/auth', auth);
app.mount('/api/v1', api);

// Routes become:
// POST /auth/login
// POST /auth/register
// GET /api/v1/users
// GET /api/v1/posts
```

## 🗂️ Context & State

Share data between middlewares and handlers:

```javascript
app.use('/protected/*', async (c, next) => {
  const user = await authenticateUser(c.request.header('Authorization'));
  c.set('currentUser', user);
  await next(c);
});

app.get('/protected/profile', (c) => {
  const user = c.get('currentUser');
  return c.json({ profile: user });
});

// Context methods
c.set(key, value)     // Set value
c.get(key, default)   // Get value with optional default
c.has(key)           // Check if key exists
c.delete(key)        // Remove key
```

## 🐛 Error Handling

```javascript
// Global error handling middleware
app.use('*', async (c, next) => {
  try {
    await next(c);
  } catch (error) {
    console.error('Route error:', error);
    
    if (error.status) {
      return c.error(error.message, error.status);
    }
    
    return c.error('Internal Server Error', 500);
  }
});

// Custom error responses
app.get('/error', (c) => {
  return c.error('Custom error message', 422, {
    code: 'VALIDATION_FAILED',
    details: ['Field is required']
  });
});
```

## 🔍 Debugging

View your routes and middlewares:

```javascript
// Show all registered routes
app.showRoutes();
```

Output:
```
🧭 REST API Routes Overview:

📄 GET     /              (0)
📄 POST    /users         cors (1)
🔀 GET     /users/:id     cors, auth (2)

📊 Total: 3 routes
```

## 🚀 Deployment

### With Bun

```javascript
// server.js
import { Rest } from '@killiandvcz/rest';

const app = new Rest();

// Your routes here...

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};
```

```bash
bun run server.js
```

### Docker

```dockerfile
FROM oven/bun:latest

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install

COPY . .

EXPOSE 3000
CMD ["bun", "run", "server.js"]
```

## 📋 Examples

### Complete CRUD API

```javascript
import { Rest, schema, s } from '@killiandvcz/rest';

const app = new Rest();

// In-memory store (use a real database in production)
let users = [];
let nextId = 1;

const UserSchema = s.object({
  name: s.string().min(1),
  email: s.string().email(),
});

// List all users
app.get('/users', (c) => {
  return c.json({ users });
});

// Get user by ID
app.get('/users/:id', (c) => {
  const id = parseInt(c.request.param('id'));
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return c.error('User not found', 404);
  }
  
  return c.json({ user });
});

// Create user
app.post('/users', async (c) => {
  const data = await schema(c, () => UserSchema);
  
  const user = {
    id: nextId++,
    ...data,
    createdAt: new Date().toISOString(),
  };
  
  users.push(user);
  return c.json({ user }, { status: 201 });
});

// Update user
app.put('/users/:id', async (c) => {
  const id = parseInt(c.request.param('id'));
  const data = await schema(c, () => UserSchema);
  
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return c.error('User not found', 404);
  }
  
  users[userIndex] = { ...users[userIndex], ...data };
  return c.json({ user: users[userIndex] });
});

// Delete user
app.delete('/users/:id', (c) => {
  const id = parseInt(c.request.param('id'));
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return c.error('User not found', 404);
  }
  
  users.splice(userIndex, 1);
  return c.json({ message: 'User deleted' });
});

export default {
  port: 3000,
  fetch: app.fetch,
};
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Bun Documentation](https://bun.sh/docs)
- [Zod Documentation](https://zod.dev)

---

Built with ❤️ for the Bun ecosystem