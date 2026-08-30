// Mock environment variables for tests
process.env.UPSTASH_REDIS_REST_URL = 'http://mock-redis.local'
process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token'
process.env.ADMIN_SECRET = 'test-admin-secret'
process.env.JWT_SECRET = 'test-jwt-secret-min-32-characters-long'
process.env.RESEND_API_KEY = 'mock-resend-key'
process.env.CLICKUP_API_TOKEN = 'mock-clickup-token'
process.env.CLICKUP_WORKSPACE_ID = 'mock-workspace-id'
process.env.CLICKUP_SPACE_ID = 'mock-space-id'
