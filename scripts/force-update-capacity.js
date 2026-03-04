// Direct database update script to force all classes to have a capacity of 5
// To run: node scripts/force-update-capacity.js

// Use raw SQL query for maximum compatibility
const { Pool } = require('pg');
require('dotenv').config();

// Create a connection to the database using the DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for some database providers
  }
});

async function forceUpdateCapacity() {
  console.log('Starting forced capacity update...');
  
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // Start a transaction
      await client.query('BEGIN');
      
      // Execute the update query
      const updateResult = await client.query('UPDATE "Class" SET "capacity" = 5');
      
      // Commit the transaction
      await client.query('COMMIT');
      
      console.log(`Success! Updated ${updateResult.rowCount} classes to have capacity of 5`);
    } catch (error) {
      // If anything goes wrong, rollback the transaction
      await client.query('ROLLBACK');
      console.error('Error executing update:', error);
      throw error;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    // Close the pool
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the function
forceUpdateCapacity().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 