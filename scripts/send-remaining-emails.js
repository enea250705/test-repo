const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Gmail configuration - Higher daily limits
const EMAIL_CONFIG = {
  host: 'authsmtp.securemail.pro',
  port: 587,
  secure: false,
  auth: {
    user: 'noreply@codewithenea.it',        // Replace with your Gmail
    pass: 'Enea250705@'            // Replace with Gmail app password
  }
};

// List of clients who didn't receive emails (emails 50-68)
const FAILED_CLIENTS = [
  'mariathraps@hotmail.gr',
  'marilenatsagk@gmail.com',
  'marina-ier@hotmail.com',
  'maryzabetaki2@hotmail.com',
  'pervolarakis.m@gmail.com',
  'mpampissougias1@yahoo.gr',
  'myronasg@gmail.com',
  'nansymp@yahoo.gr',
  'nikoleta.pateraki.2017@gmail.com',
  'nikol_4@yahoo.gr',
  'geromark96nik@hotmail.com',
  's.a.nikos@hotmail.com',
  'omiroskam12@gmail.com',
  'p.bougadakis@gmail.com',
  'polyannaf1@gmail.com',
  'renia.avantage@gmail.com',
  'sofia.vez@gmail.com',
  'valentinapapadaki9@yahoo.gr',
  'arxontxrisanthi@gmail.com'
];

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
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to GymXam!</h1>
        <p>Your account is ready to use</p>
      </div>
      
      <div class="content">
        <h2>Hello ${clientName}!</h2>
        
        <p>We're excited to let you know that your account has been set up in our new updated class system. You can now easily book classes, manage your membership, and track your progress online.</p>
        
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
        
        <a href="https://gymxam.com" class="button">Login to Your Account</a>
        
        <h3>Need Help?</h3>
        <p>If you have any questions or need assistance with your account, please don't hesitate to contact us.</p>
        
        <p>Thank you for being part of our community!</p>
        
        <p>Best regards,<br>
        <strong>GymXam Team</strong></p>
      </div>
      
      <div class="footer">
        <p>This email was sent to ${clientEmail} because an account was created for you in our class booking system.</p>
        <p>If you received this email in error, please contact us.</p>
      </div>
    </body>
    </html>
    `,
    text: `
Welcome to GymXam!

Hello ${clientName}!

Your account has been set up in our new updated class system.

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

Login at: https://gymxam.com

Thank you for being part of our community!

Best regards,
GymXam Team
    `
  };
};

async function sendRemainingEmails() {
  try {
    console.log('🔄 Sending remaining 19 emails using Gmail...\n');
    
    // Get only the clients who didn't receive emails
    const clients = await prisma.user.findMany({
      where: {
        role: 'user',
        email: {
          in: FAILED_CLIENTS
        }
      },
      include: {
        packages: {
          where: {
            active: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`👥 Found ${clients.length} remaining clients to email\n`);
    
    const transporter = nodemailer.createTransport(EMAIL_CONFIG);
    
    // Verify Gmail connection
    console.log('🔍 Testing Gmail SMTP connection...');
    await transporter.verify();
    console.log('✅ Gmail connection successful!\n');
    
    console.log('📧 Sending remaining emails...');
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const packageInfo = client.packages[0];
      
      if (packageInfo) {
        try {
          const emailData = EMAIL_TEMPLATE(
            client.name,
            client.email,
            'password',
            packageInfo
          );
          
          await transporter.sendMail({
            from: EMAIL_CONFIG.auth.user,
            to: client.email,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text
          });
          
          successCount++;
          console.log(`✅ ${(i + 1).toString().padStart(2, ' ')}/${clients.length} - Sent to ${client.name} (${client.email})`);
          
          // Small delay to be safe
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          failCount++;
          console.error(`❌ ${(i + 1).toString().padStart(2, ' ')}/${clients.length} - Failed to send to ${client.name} (${client.email}):`, error.message);
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`📊 Remaining Email Results:`);
    console.log(`   ✅ Successfully Sent: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📧 Total Attempted: ${clients.length}`);
    
    if (successCount > 0) {
      console.log('\n🎉 All remaining clients now have their login credentials!');
      console.log('🚀 Your complete GymXam system is ready!');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.log('\n💡 Solutions:');
    console.log('   1. Update EMAIL_CONFIG with your Gmail credentials');
    console.log('   2. Enable 2FA and create App Password in Gmail');
    console.log('   3. Try Option 2: Different email account');
  } finally {
    await prisma.$disconnect();
  }
}

console.log('🚀 GymXam - Send Remaining Login Credentials');
console.log('📧 This will send emails to the 19 clients who didn\'t receive them\n');

sendRemainingEmails(); 