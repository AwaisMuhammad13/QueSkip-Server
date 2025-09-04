const { Client } = require('pg');
require('dotenv').config();

const client = new Client(process.env.DATABASE_URL);

async function checkSchema() {
  try {
    await client.connect();
    
    const tables = ['users', 'businesses', 'referrals', 'queues', 'reviews', 'subscriptions', 'payments', 'notifications'];
    
    for (const tableName of tables) {
      const result = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);
      
      console.log(`\n${tableName.toUpperCase()} table columns:`);
      result.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkSchema();
