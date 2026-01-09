import nodemailer from 'nodemailer'

type EmailPayload = {
    to: string
    subject: string
    html: string
}

type SmsPayload = {
    to: string
    message: string
}

// === EMAIL CONFIGURATION ===
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

export async function sendEmail({ to, subject, html }: EmailPayload) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ SMTP not configured. Email NOT sent:', subject)
        return false
    }

    try {
        const info = await transporter.sendMail({
            from: `"Urodziny Gemini" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        })
        console.log('📧 Email sent:', info.messageId)
        return true
    } catch (error) {
        console.error('❌ Email sending failed:', error)
        return false
    }
}

// === SMS CONFIGURATION (SMSAPI) ===
export async function sendSMS({ to, message }: SmsPayload) {
    if (!process.env.SMSAPI_TOKEN) {
        console.warn('⚠️ SMSAPI token missing. SMS NOT sent.')
        return false
    }

    try {
        // Normalize phone number: Remove spaces, dashes. Ensure it has a prefix (assuming PL +48 for now if missing)
        let cleanNumber = to.replace(/\s+/g, '').replace(/-/g, '')
        if (!cleanNumber.startsWith('+') && cleanNumber.length === 9) {
            cleanNumber = '48' + cleanNumber
        } else if (cleanNumber.startsWith('+')) {
            cleanNumber = cleanNumber.substring(1)
        }

        const params = new URLSearchParams({
            to: cleanNumber,
            message: message,
            from: process.env.SMSAPI_SENDER_NAME || 'Test',
            format: 'json',
            encoding: 'utf-8',
        })

        const response = await fetch(`https://api.smsapi.pl/sms.do?${params.toString()}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.SMSAPI_TOKEN!}`
            }
        })

        const result = await response.json()

        if (result.error) {
            console.error('❌ SMSAPI Error:', result.error)
            return false
        }

        console.log(`📱 SMS sent to ${cleanNumber}:`, result.list?.[0]?.id || 'Success')
        return true

    } catch (error) {
        console.error('❌ SMS sending failed:', error)
        return false
    }
}
