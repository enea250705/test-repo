# 📧 Email Automation Setup Instructions

## Overview
The `send-welcome-emails.js` script will automatically send beautiful welcome emails to all 73 users with their login credentials and platform information.

## 🚀 Quick Setup Steps

### 1. Install Email Package
```bash
npm install nodemailer
```

### 2. Configure Email Settings
Edit `scripts/send-welcome-emails.js` and update these sections:

#### **EMAIL_CONFIG** (lines 6-12):
```javascript
const EMAIL_CONFIG = {
  service: 'gmail', // Keep as 'gmail' if using Gmail
  auth: {
    user: 'your-actual-email@gmail.com', // ← Replace with YOUR email
    pass: 'your-app-password-here' // ← Replace with app password (see below)
  }
};
```

#### **PLATFORM_CONFIG** (lines 14-20):
```javascript
const PLATFORM_CONFIG = {
  name: 'Your Gym Name', // ← Replace with your gym name
  url: 'https://your-website.com', // ← Replace with your website URL
  supportEmail: 'support@your-website.com', // ← Replace with your support email
  supportPhone: '+30 123 456 7890' // ← Replace with your phone number
};
```

### 3. Gmail App Password Setup (Required for Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to: https://myaccount.google.com/security
   - Turn on 2-Step Verification

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Class Booking System"
   - Copy the 16-character password (like: `abcd efgh ijkl mnop`)

3. **Use the App Password** (NOT your regular Gmail password) in the EMAIL_CONFIG

### 4. Test the Configuration
```bash
node scripts/send-welcome-emails.js
```

If configuration is incomplete, it will show warnings without sending emails.

### 5. Send Emails to All Users
Once configured properly, run:
```bash
node scripts/send-welcome-emails.js
```

## 📧 What Each Email Contains

✅ **Beautiful HTML design** with your branding
✅ **Login credentials** (email + 6-digit password)
✅ **Direct website link** 
✅ **Package status** (20 days remaining)
✅ **Getting started instructions**
✅ **Support contact information**
✅ **Mobile-responsive design**

## 📊 Email Campaign Features

- **73 users** will receive personalized emails
- **Rate limiting** (1 second delay between emails)
- **Error handling** with detailed failure reports
- **Progress tracking** with live status updates
- **Beautiful templates** with your gym branding

## 🛡️ Alternative Email Services

### SendGrid (Recommended for High Volume)
```javascript
const EMAIL_CONFIG = {
  service: 'sendgrid',
  auth: {
    user: 'apikey',
    pass: 'your-sendgrid-api-key'
  }
};
```

### Outlook/Hotmail
```javascript
const EMAIL_CONFIG = {
  service: 'hotmail',
  auth: {
    user: 'your-email@outlook.com',
    pass: 'your-password'
  }
};
```

### Custom SMTP
```javascript
const EMAIL_CONFIG = {
  host: 'smtp.your-provider.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@domain.com',
    pass: 'your-password'
  }
};
```

## 🔍 Troubleshooting

### "Authentication failed"
- Make sure you're using an **App Password**, not your regular password
- Check that 2FA is enabled on your Gmail account
- Verify the email and app password are correct

### "Less secure app access"
- Gmail has disabled this - you MUST use App Passwords
- Regular passwords won't work anymore

### "Rate limiting"
- The script includes 1-second delays
- For faster sending, reduce the delay or use SendGrid

### "Email not delivered"
- Check recipient's spam folder
- Verify email addresses are correct
- Test with your own email first

## 📋 Email Content Preview

Each user will receive an email like this:

**Subject**: 🎉 Welcome to [Your Gym Name] - Your Login Credentials

**Content**:
- Personalized greeting with user's name
- Login credentials (email + password)
- Direct website link with "Login Now" button
- Package status (20 days remaining)
- Feature list (booking, scheduling, etc.)
- Getting started tips
- Support contact information

## 💡 Tips for Success

1. **Test first**: Send to your own email to verify everything looks good
2. **Update branding**: Customize colors, logo, and text to match your gym
3. **Timing**: Send during business hours for better engagement
4. **Follow up**: Be prepared to answer questions after sending
5. **Phone support**: Users may call with login questions

## 🎯 Expected Results

After running the email campaign:
- ✅ All 73 users will have their login credentials
- ✅ Users can immediately log in and start booking
- ✅ Package status shows 20 days remaining
- ✅ Booking system is ready for full operation
- ✅ Professional onboarding experience

## 📞 Support

If you need help with setup:
1. Check this documentation first
2. Verify your email provider's requirements
3. Test with a single email to yourself
4. Check console output for specific error messages

---

**Ready to launch? Update the configuration and run the script!** 🚀 
 
 
 
 