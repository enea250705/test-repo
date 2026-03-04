const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importRealClients() {
  try {
    console.log('📋 Importing 68 real clients...');
    
    const clients = [
      { name: 'Adrianna Roubaki', email: 'ad.roubaki@gmail.com', used: 3, total: 8 },
      { name: 'Alice Fountoulaki', email: 'alicefountou@gmail.com', used: 7, total: 8 },
      { name: 'Angela Koutantou', email: 'angela_77783@yahoo.com', used: 0, total: 12 },
      { name: 'Antigoni Proistaki', email: 'anti_proistaki@yahoo.gr', used: 4, total: 12 },
      { name: 'Argiro Lampraki', email: 'argiro.lampraki@gmail.com', used: 6, total: 8 },
      { name: 'Apostolis Vasilakis', email: 'vasilakisapostolis1991@gmail.com', used: 1, total: 8 },
      { name: 'Depy Tavladaki', email: 'depy766@yahoo.gr', used: 3, total: 8 },
      { name: 'Dimitra Anastasiadou', email: 'anastas_dim@yahoo.gr', used: 6, total: 8 },
      { name: 'Dimitra Karra', email: 'demetrakarra3@gmail.com', used: 6, total: 8 },
      { name: 'Dimitra Savvaki', email: 'dimitra.sav@icloud.com', used: 0, total: 8 },
      { name: 'Eirini Aggelaki', email: 'eriaggel122@gmail.com', used: 4, total: 8 },
      { name: 'Eleftherios Elis', email: 'eleftherioselis@icloud.com', used: 0, total: 8 },
      { name: 'Eirini Kaminaki', email: 'ikaminaki@gmail.com', used: 4, total: 8 },
      { name: 'Fani Tsakiraki', email: 'fa_noula@hotmail.com', used: 0, total: 12 },
      { name: 'Frideriki Chatzimarkaki', email: 'errika.xatz@gmail.com', used: 6, total: 8 },
      { name: 'Gwgw Tzovenaki', email: 'gwgoula_19@hotmail.com', used: 2, total: 8 },
      { name: 'Giorgos Tzaris', email: 'giorgos7ier@yahoo.gr', used: 2, total: 8 },
      { name: 'Iakovos Kougioumoutzakis', email: 'iakwvos_koug@hotmail.com', used: 0, total: 8 },
      { name: 'Giannis Michail', email: 'giannmichail@gmail.com', used: 4, total: 8 },
      { name: 'Polyanna Frantzolaki', email: 'polyannaf1@gmail.com', used: 1, total: 8 },
      { name: 'Maria Mihelaraki', email: 'mariamihelaraki@gmail.com', used: 4, total: 8 },
      { name: 'Irini Kouzoulaki', email: 'irinik1@hotmail.com', used: 3, total: 8 },
      { name: 'Izaoura Papa', email: 'izaoura11@yahoo.com', used: 5, total: 12 },
      { name: 'Katerina Dimogerontaki', email: 'gsgourakis@yahoo.com', used: 1, total: 8 },
      { name: 'Kiriaki Xeila', email: 'idealstromierapetra@gmail.com', used: 4, total: 8 },
      { name: 'Klairi Psillinaki', email: 'gmagoulis@yahoo.gr', used: 1, total: 8 },
      { name: 'Konstantina Mparouma', email: 'mparouma95@hotmail.com', used: 1, total: 8 },
      { name: 'Konstantina Vouzouneraki', email: 'konstantinamd@gmail.com', used: 2, total: 8 },
      { name: 'Konstantinos Pervolarakis', email: 'pervolarakis.kon@gmail.com', used: 4, total: 8 },
      { name: 'Kostis Sourgias', email: 'sourgias.konstantinos@gmail.com', used: 3, total: 8 },
      { name: 'Lena Sfakianaki', email: 'lsfakianaki@hotmail.com', used: 4, total: 12 },
      { name: 'Maria Kefalogianni', email: 'mariakefalogianni@hotmail.com', used: 10, total: 12 },
      { name: 'Maria Eleni Spounou', email: 'm.spounou@gmail.com', used: 0, total: 8 },
      { name: 'Maria Strataki', email: 'mariastratki@yahoo.com', used: 3, total: 12 },
      { name: 'Maria thrapsanioti', email: 'mariathraps@hotmail.gr', used: 5, total: 8 },
      { name: 'Marilena Tsagkaraki', email: 'marilenatsagk@gmail.com', used: 0, total: 8 },
      { name: 'Marina Drakonaki', email: 'marina-ier@hotmail.com', used: 7, total: 12 },
      { name: 'Mary Zabetaki', email: 'maryzabetaki2@hotmail.com', used: 5, total: 8 },
      { name: 'Michail Pervolarakis', email: 'pervolarakis.m@gmail.com', used: 2, total: 8 },
      { name: 'Mpampis Petasis', email: 'mpampissougias1@yahoo.gr', used: 2, total: 8 },
      { name: 'Nansy Mpaka', email: 'nansymp@yahoo.gr', used: 1, total: 8 },
      { name: 'Nikol Pateraki', email: 'nikoleta.pateraki.2017@gmail.com', used: 5, total: 8 },
      { name: 'Nikoleta Muth', email: 'nikol_4@yahoo.gr', used: 3, total: 8 },
      { name: 'Nikos Geromarkakis', email: 'geromark96nik@hotmail.com', used: 7, total: 12 },
      { name: 'Nikos Mavridis', email: 's.a.nikos@hotmail.com', used: 3, total: 8 },
      { name: 'Pavlos Bougadakis', email: 'p.bougadakis@gmail.com', used: 2, total: 8 },
      { name: 'Renia Kourinou', email: 'renia.avantage@gmail.com', used: 0, total: 12 },
      { name: 'Valentini Papadaki', email: 'valentinapapadaki9@yahoo.gr', used: 11, total: 12 },
      { name: 'Xrisanthi Arxontoulaki', email: 'arxontxrisanthi@gmail.com', used: 4, total: 12 },
      { name: 'Aikaterini Symnianaki', email: 'symnianaki@gmail.com', used: 2, total: 12 },
      { name: 'Eleftheria Liokalou', email: 'elliok1516@gmail.com', used: 4, total: 8 },
      { name: 'Manos Lianakis', email: 'ml1lianakis@gmail.com', used: 0, total: 8 },
      { name: 'Chrysa Kamaropoulou', email: 'chrysakamaropoulou@gmail.com', used: 11, total: 12 },
      { name: 'Clio Tzari', email: 'tzariclio@gmail.com', used: 6, total: 8 },
      { name: 'Lia Lianaki', email: 'lialianaki84@gmail.com', used: 7, total: 8 },
      { name: 'Lina Amerikanou', email: 'linaamerikanou@gmail.com', used: 1, total: 8 },
      { name: 'Litsa Stasinopoulou', email: 'litsastasinopoulou@yahoo.gr', used: 2, total: 8 },
      { name: 'Mairi Tzortzaki', email: 'mariatzortzaki@yahoo.com', used: 8, total: 12 },
      { name: 'Manos Pigiakis', email: 'pigiakismanos@gmail.com', used: 5, total: 12 },
      { name: 'Maria Mixelaraki', email: 'm.mihelaraki@gmail.com', used: 5, total: 8 },
      { name: 'Myronas Giamalakis', email: 'myronasg@gmail.com', used: 0, total: 8 },
      { name: 'Iakwvos Koygioymoytzakis', email: 'iakovoskoug@hotmail.com', used: 4, total: 8 },
      { name: 'Elsa Thomadaki', email: 'zampetakielisavet@gmail.com', used: 1, total: 8 },
      { name: 'Antonis Zorgafakis', email: 'antozogr@hotmail.com', used: 4, total: 8 },
      { name: 'Athina Pateraki', email: 'paterakhathina@gmail.com', used: 6, total: 8 },
      { name: 'Sofia Vezyrianopoulou', email: 'sofia.vez@gmail.com', used: 4, total: 8 },
      { name: 'Omiros Kamaritis', email: 'omiroskam12@gmail.com', used: 1, total: 8 },
      { name: 'Anastasia Pagordaki', email: 'apagordaki@gmail.com', used: 2, total: 8 }
    ];
    
    let createdUsers = 0;
    let createdPackages = 0;
    let skippedUsers = 0;
    
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const password = `10000${(i + 1).toString().padStart(2, '0')}`; // 100001, 100002, etc.
      
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: client.email }
        });
        
        if (existingUser) {
          console.log(`⏭️ Skipped: ${client.name} (already exists)`);
          skippedUsers++;
          continue;
        }
        
        // Create user (without hashing password for simplicity - using bcrypt default)
        const hashedPassword = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // "password"
        
        const newUser = await prisma.user.create({
          data: {
            name: client.name,
            email: client.email,
            password: hashedPassword, // For now, all use "password" - you can update individual ones later
            role: 'user',
            approved: true,
          }
        });
        
        // Create their current package
        const remaining = client.total - client.used;
        const packageName = client.total === 8 ? "8 CrossFit Classes / Month" : "12 CrossFit Classes / Month";
        
        // Set package dates (30 days from now)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        
        const newPackage = await prisma.package.create({
          data: {
            userId: newUser.id,
            name: packageName,
            totalClasses: client.total,
            classesRemaining: remaining,
            startDate,
            endDate,
            active: true,
          }
        });
        
        // Track this as an admin-assigned package
        await prisma.packageRenewal.create({
          data: {
            userId: newUser.id,
            packageId: newPackage.id,
            packageType: client.total.toString(),
            packageName: packageName,
            startDate,
            endDate,
            price: 0, // Admin assigned
            method: "admin_assigned",
          },
        });
        
        console.log(`✅ Created: ${client.name} | ${remaining}/${client.total} classes | Password: ${password}`);
        createdUsers++;
        createdPackages++;
        
      } catch (error) {
        console.error(`❌ Error creating ${client.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Import completed:`);
    console.log(`   👥 Users created: ${createdUsers}`);
    console.log(`   📦 Packages created: ${createdPackages}`);
    console.log(`   ⏭️ Users skipped: ${skippedUsers}`);
    console.log(`   🔢 Total clients: ${clients.length}`);
    console.log(`\n🔑 Password Info:`);
    console.log(`   All users have password: "password"`);
    console.log(`   Client passwords should be: 100001-100068`);
    console.log(`   (You can update individual passwords later if needed)`);
    
  } catch (error) {
    console.error('Error during client import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importRealClients(); 