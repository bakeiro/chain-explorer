const fs = require('fs').promises;
const path = require('path');

async function deleteZoneIdentifiers(dirPath) {
  let deletedCount = 0;
  let processedCount = 0;

  async function walk(currentPath) {
    try {
      const items = await fs.readdir(currentPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(currentPath, item.name);
        processedCount++;

        try {
          if (item.isDirectory()) {
            // Recurse into subdirectories
            await walk(fullPath);
          } else if (item.name.endsWith(':Zone.Identifier')) {
            // Delete the Zone.Identifier file
            await fs.unlink(fullPath);
            console.log(`✓ Eliminado: ${fullPath}`);
            deletedCount++;
          }
        } catch (err) {
          console.error(`✗ Error procesando ${fullPath}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error(`✗ Error leyendo directorio ${currentPath}: ${err.message}`);
    }
  }

  console.log(`Iniciando búsqueda en: ${dirPath}\n`);
  const startTime = Date.now();

  await walk(dirPath);

  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n--- Resumen ---`);
  console.log(`Archivos procesados: ${processedCount}`);
  console.log(`Archivos eliminados: ${deletedCount}`);
  console.log(`Tiempo transcurrido: ${duration.toFixed(2)}s`);
}

// Obtener la ruta del directorio desde argumentos de línea de comandos
const targetDir = process.argv[2] || '.';

deleteZoneIdentifiers(targetDir);
