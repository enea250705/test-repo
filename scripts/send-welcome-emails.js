const { PrismaClient } = require('@prisma/client');
// Uncomment the line below after installing nodemailer: npm install nodemailer
// const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Email configuration - Using your SMTP settings
const EMAIL_CONFIG = {
  host: "authsmtp.securemail.pro",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "info@codewithenea.it",
    pass: "Enea2507@"
  }
};

// Platform details - UPDATE THESE
const PLATFORM_CONFIG = {
  name: 'GymXam CrossFit Booking System',
  url: 'https://gymxam.com',
};

// Email template function
function createEmailTemplate(user, password) {
  return {
    subject: `🎉 Welcome to ${PLATFORM_CONFIG.name} - Your Login Credentials`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .feature-item { margin: 10px 0; padding-left: 20px; }
          .footer { text-align: center; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ${PLATFORM_CONFIG.name}!</h1>
            <p>Your account is ready to use</p>
          </div>
          
          <div class="content">
            <h2>Hello ${user.name}! 👋</h2>
            
            <p>We're excited to welcome you to our new digital platform! Your account has been created and is ready to use.</p>
            
            <div class="credentials">
              <h3>🔐 Your Login Credentials</h3>
              <p><strong>Website:</strong> <a href="${PLATFORM_CONFIG.url}">${PLATFORM_CONFIG.url}</a></p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Password:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px; font-size: 16px;">${password}</code></p>
            </div>
            
            <div style="text-align: center;">
              <a href="${PLATFORM_CONFIG.url}" class="button">🚀 Login Now</a>
            </div>
            
            <div class="features">
              <h3>✨ What you can do with your account:</h3>
              <div class="feature-item">✅ View your class package status (20 days remaining)</div>
              <div class="feature-item">✅ Book new classes using your credits</div>
              <div class="feature-item">✅ Check your class schedule and history</div>
              <div class="feature-item">✅ Manage your profile and preferences</div>
              <div class="feature-item">✅ Receive booking confirmations and reminders</div>
            </div>
            
            <div style="background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4>📦 Your Package Status</h4>
              <p>Your class package is active with <strong>20 days remaining</strong>. Start booking your classes today!</p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4>💡 Getting Started Tips</h4>
              <ul>
                <li>Login with your email and the password above</li>
                <li>Check the calendar to see available classes</li>
                <li>Cancel bookings up to 8 hours before class start</li>
              </ul>
            </div>

          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to ${PLATFORM_CONFIG.name}!

Hello ${user.name},

Your account is ready! Here are your login credentials:

Website: ${PLATFORM_CONFIG.url}
Email: ${user.email}
Password: ${password}

Your class package is active with 20 days remaining.

What you can do:
- View your package status
- Book new classes
- Check your schedule
- Manage your profile


Welcome aboard!
    `
  };
}

async function sendWelcomeEmails() {
  try {
    console.log('📧 Starting automated welcome email campaign...\n');
    
    // Check if nodemailer is available
    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch (error) {
      console.log('❌ Nodemailer not installed. Please run: npm install nodemailer');
      return;
    }
    
    // Create email transporter
    const transporter = nodemailer.createTransport(EMAIL_CONFIG);
    
    // Get all regular users (not admins)
    const users = await prisma.user.findMany({
      where: { role: 'user' },
      select: { 
        id: true,
        name: true, 
        email: true, 
        createdAt: true 
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`👥 Found ${users.length} users to email\n`);

    let emailsSent = 0;
    let emailsFailed = 0;
    const results = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const userIndex = i + 1;
      
      // Generate the same password as in the password file
      const password = userIndex > 99 ? `10${userIndex.toString().padStart(4, '0')}` : `10000${userIndex.toString().padStart(1, '0')}`;
      
      try {
        console.log(`📤 Sending email to ${user.name} (${user.email})...`);
        
        const emailContent = createEmailTemplate(user, password);
        
        await transporter.sendMail({
          from: `"${PLATFORM_CONFIG.name}" <${EMAIL_CONFIG.auth.user}>`,
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text
        });
        
        console.log(`✅ Email sent successfully to ${user.email}`);
        emailsSent++;
        
        results.push({
          email: user.email,
          name: user.name,
          status: 'sent',
          password: password
        });
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to send email to ${user.email}:`, error.message);
        emailsFailed++;
        
        results.push({
          email: user.email,
          name: user.name,
          status: 'failed',
          error: error.message,
          password: password
        });
      }
    }

    console.log('\n📊 Email Campaign Summary:');
    console.log('=' .repeat(50));
    console.log(`✅ Emails sent successfully: ${emailsSent}`);
    console.log(`❌ Emails failed: ${emailsFailed}`);
    console.log(`📋 Total users: ${users.length}`);
    console.log('=' .repeat(50));

    if (emailsFailed > 0) {
      console.log('\n❌ Failed emails:');
      results.filter(r => r.status === 'failed').forEach(result => {
        console.log(`   • ${result.name} (${result.email}) - ${result.error}`);
      });
    }

    console.log('\n🎉 Welcome email campaign completed!');
    
    if (emailsSent > 0) {
      console.log('\n💡 What happens next:');
      console.log('   • Users will receive their login credentials');
      console.log('   • They can immediately log in and start booking');
      console.log('   • All accounts are pre-approved with packages ready');
      console.log('   • Users have 20 days remaining on their packages');
    }

  } catch (error) {
    console.error('❌ Email campaign failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Configuration check
function checkConfiguration() {
  console.log('🔧 Checking email configuration...\n');
  
  // Check if email config is properly set
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    console.log('⚠️  WARNING: Email configuration is incomplete');
    console.log('   • Check EMAIL_CONFIG.auth.user and EMAIL_CONFIG.auth.pass\n');
    return false;
  }
  
  // Check if platform config is properly set
  if (!PLATFORM_CONFIG.url || PLATFORM_CONFIG.url === 'https://your-website.com') {
    console.log('⚠️  WARNING: Please update PLATFORM_CONFIG with your website details');
    console.log('   • Replace the URL with your actual website');
    console.log('   • Update support email and phone number\n');
    return false;
  }
  
  console.log('✅ Configuration looks good!');
  console.log(`   • Email: ${EMAIL_CONFIG.auth.user}`);
  console.log(`   • Website: ${PLATFORM_CONFIG.url}`);
  console.log(`   • Support: ${PLATFORM_CONFIG.supportEmail}\n`);
  
  return true;
}

// Run the email campaign
if (require.main === module) {
  if (checkConfiguration()) {
    sendWelcomeEmails().catch(console.error);
  } else {
    console.log('❌ Please update the configuration before running the email campaign.');
  }
}

module.exports = { sendWelcomeEmails };