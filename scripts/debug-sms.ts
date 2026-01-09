
import fs from 'fs'
import path from 'path'

// Manually load .env
try {
    const envPath = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf-8')
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=')
            if (key && value) {
                process.env[key.trim()] = value.trim()
            }
        })
    }
} catch (e) {
    console.error('Error loading .env', e)
}

async function main() {
    console.log('--- SMS DEBUG ---')
    const token = process.env.SMSAPI_TOKEN
    const sender = process.env.SMSAPI_SENDER_NAME || 'Test'
    console.log('Token exists:', !!token)
    console.log('Sender Name:', sender)

    // Test number provided by user
    const to = '+48508779864'
    let cleanNumber = to.replace(/\s+/g, '').replace(/-/g, '')
    if (!cleanNumber.startsWith('+') && cleanNumber.length === 9) {
        cleanNumber = '48' + cleanNumber
    } else if (cleanNumber.startsWith('+')) {
        cleanNumber = cleanNumber.substring(1)
    }

    console.log('Original To:', to)
    console.log('Normalized To:', cleanNumber)

    if (!token) {
        console.error('MISSING TOKEN')
        return
    }

    const params = new URLSearchParams({
        to: cleanNumber,
        message: 'test one',
        from: sender,
        format: 'json',
        encoding: 'utf-8',
    })

    console.log('Sending request to SMSAPI with Bearer Token...')
    try {
        const response = await fetch(`https://api.smsapi.pl/sms.do?${params.toString()}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        const data = await response.json()
        console.log('Response Status:', response.status)
        console.log('Response Body:', JSON.stringify(data, null, 2))
    } catch (e) {
        console.error('Fetch Error:', e)
    }
}

main()
