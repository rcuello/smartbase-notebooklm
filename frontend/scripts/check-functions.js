import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const functionsDir = path.resolve(__dirname, "../supabase/functions");

console.log("🔍 Verificando estructura de funciones...");
console.log("📁 Directorio:", functionsDir);

if (!fs.existsSync(functionsDir)) {
  console.error("❌ El directorio de funciones no existe:", functionsDir);
  process.exit(1);
}

const functions = fs
  .readdirSync(functionsDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

console.log(`\n📊 Funciones encontradas: ${functions.length}`);

let validFunctions = 0;
let invalidFunctions = 0;

functions.forEach((func) => {
  const funcDir = path.join(functionsDir, func);
  const indexPath = path.join(funcDir, "index.ts");
  
  if (fs.existsSync(indexPath)) {
    console.log(`✅ ${func}`);
    console.log(`   📄 ${indexPath}`);
    validFunctions++;
  } else {
    console.log(`❌ ${func}`);
    console.log(`   📄 FALTA: ${indexPath}`);
    invalidFunctions++;
  }
  
  // Listar archivos en el directorio de la función
  try {
    const files = fs.readdirSync(funcDir);
    console.log(`   📂 Archivos: ${files.join(", ")}`);
  } catch (err) {
    console.log(`   📂 Error al leer directorio: ${err.message}`);
  }
  
  console.log("");
});

console.log("═".repeat(50));
console.log(`✅ Funciones válidas: ${validFunctions}`);
console.log(`❌ Funciones inválidas: ${invalidFunctions}`);
console.log("═".repeat(50));

if (invalidFunctions > 0) {
  console.log("\n⚠️  Algunas funciones no tienen index.ts");
  console.log("   Asegúrate de que cada función tenga su archivo index.ts");
  process.exit(1);
} else {
  console.log("\n🎉 Todas las funciones tienen su index.ts");
}