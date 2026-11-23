const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const inputDir = path.join(__dirname, "public", "assets");

async function compressImages() {
  if (!fs.existsSync(inputDir)) {
    console.log("Folder public/assets tidak ditemukan!");
    return;
  }

  const files = fs.readdirSync(inputDir);

  for (const file of files) {
    if (file.match(/\.(png|jpg|jpeg)$/i)) {
      const filePath = path.join(inputDir, file);
      const ext = path.extname(file).toLowerCase();

      console.log(`Mengompres: ${file}...`);

      if (ext === ".png") {
        // Kompres PNG tanpa merusak detail dengan kuantisasi warna 8-bit berkualitas tinggi
        await sharp(filePath)
          .png({ quality: 80, palette: true, effort: 7 })
          .toBuffer()
          .then((data) => fs.writeFileSync(filePath, data));
      } else {
        // Kompres JPG/JPEG ke kualitas 82% (sangat optimal dan jernih)
        await sharp(filePath)
          .jpeg({ quality: 82, mozjpeg: true })
          .toBuffer()
          .then((data) => fs.writeFileSync(filePath, data));
      }
    }
  }
  console.log("Semua aset berhasil dikompres dan dipercepat!");
}

compressImages();
