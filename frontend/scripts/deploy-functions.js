import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Obtener el directorio actual del script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas relativas al directorio del script
const functionsDir = path.resolve(__dirname, "../supabase/functions");
const workdirPath = path.resolve(__dirname, "../supabase");

console.log("📁 Directorio de funciones:", functionsDir);
console.log("📁 Directorio de trabajo:", workdirPath);

// Verificar que Docker está ejecutándose
try {
  execSync("docker --version", { stdio: "pipe" });
} catch (err) {
  console.error("❌ Docker no está ejecutándose o no está instalado.");
  console.error("   Por favor, inicia Docker Desktop y vuelve a intentar.");
  process.exit(1);
}

// Verificar que existe el directorio de funciones
if (!fs.existsSync(functionsDir)) {
  console.error("❌ El directorio de funciones no existe:", functionsDir);
  process.exit(1);
}

// Verificar que existe el directorio de trabajo de Supabase
if (!fs.existsSync(workdirPath)) {
  console.error("❌ El directorio de Supabase no existe:", workdirPath);
  process.exit(1);
}

// Verificar si Supabase CLI está disponible
try {
  execSync("npx supabase --version", { stdio: "pipe" });
} catch (err) {
  console.error("❌ Supabase CLI no está disponible.");
  console.error("   Instálalo con: npm install -g @supabase/cli");
  process.exit(1);
}

// Leer el project_id desde config.toml
let projectId = null;
const configPath = path.join(workdirPath, "config.toml");

if (fs.existsSync(configPath)) {
  try {
    const configContent = fs.readFileSync(configPath, "utf8");
    const projectMatch = configContent.match(/project_id\s*=\s*"([^"]+)"/);
    if (projectMatch) {
      projectId = projectMatch[1];
      console.log(`🔗 Proyecto encontrado en config.toml: ${projectId}`);
    }
  } catch (err) {
    console.warn("⚠️  No se pudo leer config.toml:", err.message);
  }
}

// Verificar si el proyecto está linkeado
try {
  const statusOutput = execSync("npx supabase status", { 
    cwd: workdirPath, 
    stdio: "pipe",
    encoding: "utf8"
  });
  
  if (!statusOutput.includes("Project ref:") && projectId) {
    console.log("🔗 Vinculando proyecto automáticamente...");
    execSync(`npx supabase link --project-ref ${projectId}`, {
      cwd: workdirPath,
      stdio: "inherit"
    });
  }
} catch (err) {
  if (projectId) {
    console.log("🔗 Intentando vincular proyecto...");
    try {
      execSync(`npx supabase link --project-ref ${projectId}`, {
        cwd: workdirPath,
        stdio: "inherit"
      });
    } catch (linkErr) {
      console.warn("⚠️  No se pudo vincular automáticamente el proyecto");
    }
  }
}

// Obtener todas las funciones disponibles
const functions = fs
  .readdirSync(functionsDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

console.log(`\n🔍 Se encontraron ${functions.length} funciones:`, functions.join(", "));

if (functions.length === 0) {
  console.log("ℹ️  No se encontraron funciones para desplegar.");
  process.exit(0);
}

let successCount = 0;
let errorCount = 0;
const errors = [];

console.log("\n🚀 Iniciando despliegue de funciones...\n");

for (const func of functions) {
  const indexPath = path.join(functionsDir, func, "index.ts");

  if (!fs.existsSync(indexPath)) {
    console.warn(`⚠️  index.ts no encontrado para la función: ${func}`);
    console.warn(`   Ruta esperada: ${indexPath}`);
    console.warn(`   Saltando...\n`);
    continue;
  }

  console.log(`📦 Desplegando función: ${func}...`);
  console.log(`   Archivo: ${indexPath}`);
  
  try {
    // Cambiar al directorio de Supabase antes de ejecutar el comando
    process.chdir(workdirPath);
    
    // Ejecutar el comando de despliegue con más opciones
    const deployCommand = `npx supabase functions deploy ${func} --no-verify-jwt`;
    console.log(`   Ejecutando: ${deployCommand}`);
    
    // Primero intentar con timeout más largo y verbose
    execSync(deployCommand, {
      stdio: "inherit",
      cwd: workdirPath,
      timeout: 300000, // 5 minutos
      env: {
        ...process.env,
        DENO_DIR: path.join(process.cwd(), '.deno_cache'),
        NO_PROXY: 'deno.land,esm.sh',
        HTTPS_PROXY: '',
        HTTP_PROXY: ''
      }
    });
    
    console.log(`✅ Función ${func} desplegada exitosamente\n`);
    successCount++;
    
  } catch (err) {
    console.error(`❌ Error al desplegar la función: ${func}`);
    console.error(`   Detalles: ${err.message}`);
    
    // Intentar con debug para más información
    console.log(`🔍 Intentando con --debug para más información...`);
    try {
      execSync(`npx supabase functions deploy ${func} --debug`, {
        stdio: "inherit",
        cwd: workdirPath,
        timeout: 180000 // 3 minutos
      });
      console.log(`✅ Función ${func} desplegada exitosamente (segundo intento)\n`);
      successCount++;
    } catch (debugErr) {
      console.error(`❌ Error persistente: ${debugErr.message}\n`);
      errorCount++;
      errors.push({ function: func, error: err.message });
    }
  } finally {
    // Restaurar el directorio original
    process.chdir(path.dirname(__dirname));
  }
}

// Resumen final
console.log("═".repeat(50));
console.log("📊 RESUMEN DEL DESPLIEGUE:");
console.log(`✅ Funciones desplegadas exitosamente: ${successCount}`);
console.log(`❌ Funciones con errores: ${errorCount}`);

if (errors.length > 0) {
  console.log("\n🔍 ERRORES DETALLADOS:");
  errors.forEach(({ function: func, error }, index) => {
    console.log(`${index + 1}. ${func}: ${error}`);
  });
}

console.log("═".repeat(50));

// Salir con código de error si hubo problemas
if (errorCount > 0) {
  console.log("\n⚠️  El despliegue completó con errores. Revisa los detalles arriba.");
  process.exit(1);
} else {
  console.log("\n🎉 ¡Todas las funciones se desplegaron exitosamente!");
  process.exit(0);
}