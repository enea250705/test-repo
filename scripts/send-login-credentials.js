const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Email configuration - UPDATED WITH YOUR WORKING SETTINGS
const EMAIL_CONFIG = {
  host: 'authsmtp.securemail.pro', 
  port: 587,
  secure: false,
  auth: {
    user: 'info@codewithenea.it',
    pass: 'Enea2507@'
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
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to GymXam!</h1>
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
        
        <a href="https://gymxam.com" class="button">Login to Your Account</a>
        
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
Welcome to Our Class Booking System!

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

async function prepareEmails() {
  try {
    console.log('📧 Preparing login credential emails for all clients...\n');
    
    // Get all clients with their packages
    const clients = await prisma.user.findMany({
      where: {
        role: 'user',
        email: {
          not: 'test@example.com' // Exclude test user
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
    
    console.log(`👥 Found ${clients.length} clients to email\n`);
    
    const emailList = [];
    let clientsWithPackages = 0;
    let clientsWithoutPackages = 0;
    
    clients.forEach((client, index) => {
      const packageInfo = client.packages[0];
      
      if (packageInfo) {
        clientsWithPackages++;
        const emailData = EMAIL_TEMPLATE(
          client.name,
          client.email,
          'password', // Current password for all users
          packageInfo
        );
        
        emailList.push({
          to: client.email,
          name: client.name,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });
        
        console.log(`✅ ${(index + 1).toString().padStart(2, ' ')}. ${client.name.padEnd(25)} | ${client.email.padEnd(35)} | ${packageInfo.classesRemaining}/${packageInfo.totalClasses} classes`);
      } else {
        clientsWithoutPackages++;
        console.log(`❌ ${(index + 1).toString().padStart(2, ' ')}. ${client.name.padEnd(25)} | ${client.email.padEnd(35)} | NO PACKAGE - SKIPPED`);
      }
    });
    
    console.log('\n' + '='.repeat(100));
    console.log(`📊 Email Preparation Summary:`);
    console.log(`   📧 Emails Ready to Send: ${emailList.length}`);
    console.log(`   ✅ Clients with Packages: ${clientsWithPackages}`);
    console.log(`   ❌ Clients Skipped (No Package): ${clientsWithoutPackages}`);
    
    return emailList;
    
  } catch (error) {
    console.error('❌ Error preparing emails:', error);
    return [];
  }
}

async function sendEmails(emailList, actualSend = false) {
  if (!actualSend) {
    console.log('\n🔄 DRY RUN MODE - No emails will be sent');
    console.log('📋 Email preview for first client:');
    console.log('='.repeat(50));
    if (emailList.length > 0) {
      console.log(`To: ${emailList[0].to}`);
      console.log(`Subject: ${emailList[0].subject}`);
      console.log('\nText Content Preview:');
      console.log(emailList[0].text.substring(0, 300) + '...');
    }
    console.log('='.repeat(50));
    console.log('\n💡 To actually send emails, you need to:');
    console.log('   1. Update EMAIL_CONFIG with your SMTP settings');
    console.log('   2. Run: node scripts/send-login-credentials.js --send');
    console.log('\n⚠️  Make sure to test with one email first!');
    return;
  }
  
  // Create transporter - FIXED: was createTransporter, now createTransport
  const transporter = nodemailer.createTransport(EMAIL_CONFIG);
  
  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.log('\n💡 Please update EMAIL_CONFIG with correct settings');
    return;
  }
  
  console.log('\n📧 Starting to send emails...');
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < emailList.length; i++) {
    const email = emailList[i];
    
    try {
      await transporter.sendMail({
        from: EMAIL_CONFIG.auth.user,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text
      });
      
      successCount++;
      console.log(`✅ ${(i + 1).toString().padStart(2, ' ')}/${emailList.length} - Sent to ${email.name} (${email.to})`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      failCount++;
      console.error(`❌ ${(i + 1).toString().padStart(2, ' ')}/${emailList.length} - Failed to send to ${email.name} (${email.to}):`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(100));
  console.log(`📊 Email Sending Complete:`);
  console.log(`   ✅ Successfully Sent: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📧 Total Attempted: ${emailList.length}`);
  
  if (successCount > 0) {
    console.log('\n🎉 Login credentials have been sent to your clients!');
    console.log('📱 They can now log in and start booking classes.');
  }
}

async function main() {
  const shouldSend = process.argv.includes('--send');
  
  try {
    console.log('🚀 Class Booking System - Login Credential Emailer\n');
    
    const emailList = await prepareEmails();
    
    if (emailList.length > 0) {
      await sendEmails(emailList, shouldSend);
    } else {
      console.log('❌ No emails to send');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 