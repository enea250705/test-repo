// Script to force refresh the frontend display by updating updatedAt timestamps
// To run: node scripts/force-refresh-display.js

const { Pool } = require('pg');
require('dotenv').config();

// Create a connection to the database using the DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for some database providers
  }
});

async function forceRefreshDisplay() {
  console.log('Starting forced display refresh...');
  
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // Start a transaction
      await client.query('BEGIN');
      
      // Update all classes to have capacity = 5
      const capacityResult = await client.query('UPDATE "Class" SET "capacity" = 5');
      console.log(`Updated ${capacityResult.rowCount} classes to have capacity of 5`);
      
      // Update the updatedAt timestamp to force cache invalidation
      const refreshResult = await client.query('UPDATE "Class" SET "updatedAt" = NOW()');
      
      // Commit the transaction
      await client.query('COMMIT');
      
      console.log(`Success! Refreshed ${refreshResult.rowCount} classes to invalidate frontend cache`);
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
forceRefreshDisplay().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 