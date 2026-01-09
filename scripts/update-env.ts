
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env')
const token = 'L9AP1zBDeeojdqxmXsYSlrQtHrWhczf2NVS6qb2q'

let content = ''
if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf-8')
}

// Check if SMSAPI_TOKEN exists
if (content.includes('SMSAPI_TOKEN=')) {
    content = content.replace(/SMSAPI_TOKEN=.*/g, `SMSAPI_TOKEN=${token}`)
} else {
    content += `\nSMSAPI_TOKEN=${token}\n`
}

if (!content.includes('SMSAPI_SENDER_NAME=')) {
    content += `SMSAPI_SENDER_NAME=Test\n`
}

fs.writeFileSync(envPath, content)
console.log('Updated .env successfully')
