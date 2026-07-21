import fs from 'fs';
let env = '';
if (fs.existsSync('.env')) env = fs.readFileSync('.env', 'utf-8');
else if (fs.existsSync('.env.local')) env = fs.readFileSync('.env.local', 'utf-8');

const envVars = env.split('\n').reduce((acc, line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) acc[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  return acc;
}, {});

process.env = { ...process.env, ...envVars };

import('./src/firebase.js').then(async (firebase) => {
  const { db } = firebase;
  const { collection, getDocs, query, limit } = await import('firebase/firestore');
  
  const snap = await getDocs(query(collection(db, 'tareas')));
  console.log('--- Tareas ---');
  snap.docs.forEach(d => console.log(JSON.stringify({id: d.id, data: d.data()})));
  
  const snap2 = await getDocs(query(collection(db, 'lotes')));
  console.log('--- Lotes y fotos ---');
  for (const lote of snap2.docs) {
    const fotos = await getDocs(collection(db, 'lotes', lote.id, 'fotos'));
    if (!fotos.empty) {
      console.log('Lote:', lote.id, 'Fotos:', fotos.docs.map(f => f.data()));
    }
  }
  process.exit(0);
}).catch(console.error);
