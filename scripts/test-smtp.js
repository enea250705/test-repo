/**
 * Script to test SMTP connection with various configurations
 * Run this script directly: node scripts/test-smtp.js
 */

const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables from .env file

const originalConfig = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// Configuration variants to test
const configVariants = [
  {
    name: "Original config",
    config: { ...originalConfig }
  },
  {
    name: "Using SSL without secure flag",
    config: { 
      ...originalConfig,
      secure: false,
      port: 465
    }
  },
  {
    name: "Using port 587 (TLS)",
    config: { 
      ...originalConfig,
      secure: false,
      port: 587
    }
  },
  {
    name: "With TLS settings",
    config: { 
      ...originalConfig,
      tls: {
        rejectUnauthorized: false
      }
    }
  },
  {
    name: "With ignoreTLS option",
    config: { 
      ...originalConfig,
      ignoreTLS: true
    }
  }
];

// Test each configuration
async function runTests() {
  console.log('Starting SMTP configuration tests...\n');
  
  for (const variant of configVariants) {
    console.log(`\n----- Testing: ${variant.name} -----`);
    console.log('Config:', JSON.stringify(variant.config, null, 2));
    
    const transporter = nodemailer.createTransport(variant.config);
    
    try {
      console.log('Verifying connection...');
      const verified = await transporter.verify();
      console.log('✅ Connection verified:', verified);
      
      // If we get here, try sending a test email
      console.log('Sending test email...');
      
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || 'GymXam <info@codewithenea.it>',
        to: 'test@example.com', // Replace with a real test email
        subject: 'SMTP Test Email',
        text: `This is a test email from configuration: ${variant.name}`,
        html: `<p>This is a test email from configuration: <strong>${variant.name}</strong></p>`
      });
      
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', info.messageId);
      console.log('Response:', info.response);
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (error.code) console.error('Error code:', error.code);
      if (error.command) console.error('Failed command:', error.command);
      if (error.response) console.error('Server response:', error.response);
    }
  }
  
  console.log('\nAll tests completed.');
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 