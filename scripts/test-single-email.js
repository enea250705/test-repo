const nodemailer = require('nodemailer');

// Email configuration - UPDATE THESE WITH YOUR SETTINGS
const EMAIL_CONFIG = {
  host: 'authsmtp.securemail.pro',
  port: 587,
  secure: false,
  auth: {
    user: 'info@codewithenea.it',     // ← CHANGE THIS: Your Gmail address
    pass: 'Enea2507@'         // ← CHANGE THIS: Your Gmail app password
  }
};

// Sample client data for testing
const SAMPLE_CLIENT = {
  name: 'Adrianna Roubaki',
  email: 'ad.roubaki@gmail.com',
  packageInfo: {
    totalClasses: 8,
    classesRemaining: 5,
    endDate: new Date('2025-01-10')
  }
};

const EMAIL_TEMPLATE = (clientName, clientEmail, password, packageInfo) => {
  return {
    subject: 'Welcome to Our Class Booking System - Your Login Credentials',
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .credentials-box { background-color: #f9f9f9; border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .package-info { background-color: #e8f5e8; border: 1px solid #4CAF50; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .button { background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        .test-notice { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="test-notice">
        <h3>🧪 TEST EMAIL - This is how your clients will see their login credentials</h3>
        <p>This sample shows the email for: <strong>${clientName}</strong></p>
      </div>
      
      <div class="header">
        <h1>Welcome to Our Class Booking System!</h1>
        <p>Your account is ready to use</p>
      </div>
      
      <div class="content">
        <h2>Hello ${clientName}!</h2>
        
        <p>We're excited to let you know that your account has been set up in our new online class booking system. You can now easily book classes, manage your membership, and track your progress online.</p>
        
        <div class="credentials-box">
          <h3>🔑 Your Login Credentials:</h3>
          <p><strong>Email:</strong> ${clientEmail}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p><em>Please keep these credentials safe and consider changing your password after your first login.</em></p>
        </div>
        
        <div class="package-info">
          <h3>📦 Your Current Package:</h3>
          <p><strong>Package Type:</strong> ${packageInfo.totalClasses}-Class Package</p>
          <p><strong>Classes Remaining:</strong> ${packageInfo.classesRemaining} out of ${packageInfo.totalClasses}</p>
          <p><strong>Package Expires:</strong> ${new Date(packageInfo.endDate).toLocaleDateString()}</p>
        </div>
        
        <h3>🚀 What you can do now:</h3>
        <ul>
          <li>📅 Book your classes online</li>
          <li>📊 View your remaining class balance</li>
          <li>🔄 Renew your membership anytime</li>
          <li>📱 Access from any device</li>
          <li>📧 Receive booking confirmations</li>
        </ul>
        
        <a href="http://localhost:3000/login" class="button">Login to Your Account</a>
        
        <h3>Need Help?</h3>
        <p>If you have any questions or need assistance with your account, please don't hesitate to contact us.</p>
        
        <p>Thank you for being part of our community!</p>
        
        <p>Best regards,<br>
        <strong>The Class Booking Team</strong></p>
      </div>
      
      <div class="footer">
        <p>This email was sent to ${clientEmail} because an account was created for you in our class booking system.</p>
        <p>If you received this email in error, please contact us.</p>
      </div>
    </body>
    </html>
    `,
    text: `
🧪 TEST EMAIL - This is how your clients will see their login credentials

Welcome to Our Class Booking System!

Hello ${clientName}!

Your account has been set up in our new online class booking system.

LOGIN CREDENTIALS:
Email: ${clientEmail}
Password: ${password}

YOUR CURRENT PACKAGE:
Package Type: ${packageInfo.totalClasses}-Class Package
Classes Remaining: ${packageInfo.classesRemaining} out of ${packageInfo.totalClasses}
Package Expires: ${new Date(packageInfo.endDate).toLocaleDateString()}

You can now:
- Book your classes online
- View your remaining class balance  
- Renew your membership anytime
- Access from any device
- Receive booking confirmations

Login at: http://localhost:3000/login

Thank you for being part of our community!

Best regards,
The Class Booking Team
    `
  };
};

async function sendTestEmail() {
  console.log('🧪 Preparing to send test email to ilirionai@gmail.com...\n');
  
  // Create email content using sample client data
  const emailData = EMAIL_TEMPLATE(
    SAMPLE_CLIENT.name,
    SAMPLE_CLIENT.email,
    'password',
    SAMPLE_CLIENT.packageInfo
  );
  
  console.log('📧 Email Details:');
  console.log(`   To: ilirionai@gmail.com`);
  console.log(`   Subject: ${emailData.subject}`);
  console.log(`   Sample Client: ${SAMPLE_CLIENT.name}`);
  console.log(`   Package: ${SAMPLE_CLIENT.packageInfo.classesRemaining}/${SAMPLE_CLIENT.packageInfo.totalClasses} classes\n`);
  
  // Create transporter
  const transporter = nodemailer.createTransport(EMAIL_CONFIG);
  
  try {
    // Verify SMTP connection
    console.log('🔍 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
    
    // Send the test email
    console.log('📤 Sending test email...');
    const result = await transporter.sendMail({
      from: EMAIL_CONFIG.auth.user,
      to: 'ilirionai@gmail.com',
      subject: `[TEST] ${emailData.subject}`,
      html: emailData.html,
      text: emailData.text
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Check your inbox at ilirionai@gmail.com`);
    console.log('\n🎉 This is exactly how your 68 clients will receive their login credentials!');
    
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    console.log('\n💡 Make sure to update EMAIL_CONFIG with your settings:');
    console.log('   1. Replace "your-email@gmail.com" with your Gmail address');
    console.log('   2. Replace "your-app-password" with your Gmail app password');
    console.log('   3. Enable 2-Factor Authentication on Gmail');
    console.log('   4. Generate an App Password in Gmail settings');
  }
}

console.log('🚀 Class Booking System - Test Email Sender');
console.log('📧 This will send ONE test email to ilirionai@gmail.com\n');

sendTestEmail(); 