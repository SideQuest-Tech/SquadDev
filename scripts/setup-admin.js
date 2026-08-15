import { Redis } from '@upstash/redis'
import bcrypt from 'bcryptjs'

const [,, email, password] = process.argv
if (!email || !password) {
  console.error('Usage: node scripts/setup-admin.js <email> <password>')
  process.exit(1)
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

console.log('Hashing password...')
const passwordHash = await bcrypt.hash(password, 12)
const record = { email: email.toLowerCase().trim(), passwordHash }

await redis.set('sidequest_admin', JSON.stringify(record))
console.log('Admin record written successfully.')
console.log('Email:', record.email)
