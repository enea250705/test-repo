const fs = require('fs');
const path = require('path');
const { importClients } = require('./import-clients');

async function runImport() {
  try {
    console.log('📋 Reading client list from clients-to-import.txt...');
    
    const filePath = path.join(__dirname, 'clients-to-import.txt');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Split by lines and filter out empty lines and comments
    const clientLines = fileContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    if (clientLines.length === 0) {
      console.log('❌ No client data found in clients-to-import.txt');
      console.log('Please add your client list to the file and try again.');
      return;
    }
    
    console.log(`📊 Found ${clientLines.length} clients to import`);
    console.log('');
    
    // Import the clients
    await importClients(clientLines);
    
    console.log('');
    console.log('🎉 Import completed!');
    console.log('Your clients can now login to the system with their credentials.');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    
    if (error.code === 'ENOENT') {
      console.log('');
      console.log('📋 Please make sure the clients-to-import.txt file exists in the scripts folder.');
      console.log('Add your client list to that file and try again.');
    }
  }
}

// Run the import
runImport(); 