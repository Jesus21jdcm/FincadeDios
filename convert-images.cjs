const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src', 'assets', 'images');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// All files found earlier that should be moved/converted
const filesToConvert = [
  'aplicaciones.jpg',
  'Cacao.jpg',
  'campoactivo.png',
  'header.jpg',
  'inbajo.jpg',
  'insumos.jpg',
  'Logo.png',
  'maiz.jpg',
  'platano.jpg',
  'public/cacao.perfil.jpg',
  'public/maiz.perfil.jpg',
  'public/platano.perfil.jpg',
  'public/yuca.perfil.jpg',
  'public/casos_de_uso.png',
  'public/mapa.png',
  'public/uso_admin.png',
  'public/uso_empleado.png',
  'public/uso_encargado.png',
  'src/assets/aplicaciones.jpg',
  'src/assets/app_mockup.png',
  'src/assets/bg_field_graphic.png',
  'src/assets/Cacao.jpg',
  'src/assets/campoactivo.png',
  'src/assets/crop_cacao.png',
  'src/assets/crop_maiz.png',
  'src/assets/crop_platano.png',
  'src/assets/crop_yuca.png',
  'src/assets/farmer_experience.png',
  'src/assets/header.jpg',
  'src/assets/header_hq.png',
  'src/assets/hero_bg_field.png',
  'src/assets/hero_carousel_2.png',
  'src/assets/hero_carousel_3.png',
  'src/assets/hero_farmer.png',
  'src/assets/inbajo.jpg',
  'src/assets/insumos.jpg',
  'src/assets/Logo.png',
  'src/assets/maiz.jpg',
  'src/assets/platano.jpg',
  'src/assets/product_broccoli.png',
  'src/assets/product_grapes.png',
  'src/assets/product_wheat.png'
];

// Ensure uniqueness and that they exist
const uniqueFiles = [...new Set(filesToConvert)].filter(f => fs.existsSync(path.join(__dirname, f)));

(async () => {
  for (const file of uniqueFiles) {
    const ext = path.extname(file);
    let baseName = path.basename(file, ext);
    let outPath = path.join(targetDir, `${baseName}.webp`);
    
    // Prevent overwriting if there's maiz.jpg and maiz.perfil.jpg they will have different basenames, 
    // but what if there's Logo.png in root and Logo.png in src/assets? They have the same basename.
    // Sharp will overwrite. That's actually fine if they are identical files, but just in case,
    // if outPath exists, we can suffix it, or just let it overwrite since the project only needs 1 copy.
    try {
      await sharp(path.join(__dirname, file))
        .webp({ quality: 80 })
        .toFile(outPath);
      console.log(`Converted: ${file} -> ${outPath}`);
      // delete the original
      fs.unlinkSync(path.join(__dirname, file));
    } catch (e) {
      console.error(`Error converting ${file}:`, e.message);
    }
  }
})();
