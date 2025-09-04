const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  // Railway PostgreSQL connection (updated)
  const client = new Client({
    connectionString: 'postgresql://postgres:wTazMhgEfAiBgfkMIWADbrvwccnHPiiQ@gondola.proxy.rlwy.net:57057/railway',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to Railway PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'scripts', 'schema-corrected.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing database schema...');
    await client.query(schema);
    console.log('✅ Database schema created successfully!');

    // Test the connection by listing tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📋 Created tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

setupDatabase();
