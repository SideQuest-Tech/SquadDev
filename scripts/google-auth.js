import { google } from 'googleapis'
import http from 'http'
import { exec } from 'child_process'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:4242/callback'
)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/calendar'],
  prompt: 'consent'
})

console.log('\nOpening browser for Google authorisation...')
const open = cmd => exec(cmd)
open(`start "${authUrl}"`) // Windows

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:4242')
  const code = url.searchParams.get('code')
  if (!code) { res.end('No code found.'); return }

  try {
    const { tokens } = await oauth2Client.getToken(code)
    res.end('<h2>Authorised! You can close this tab.</h2>')
    server.close()
    console.log('\n✅ Add this to your .env:\n')
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`)
    console.log()
  } catch (err) {
    res.end('Error: ' + err.message)
    server.close()
  }
})

server.listen(4242, () => {
  console.log('Waiting for Google to redirect to http://localhost:4242/callback ...')
  console.log('\nIf the browser did not open, visit this URL manually:')
  console.log(authUrl)
})
