#!/usr/bin/env node

/**
 * Build Script with Terser Minification
 * Minifies JavaScript files and removes console.log statements
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// Configuration
const CONFIG = {
  sourceDir: path.join(__dirname, '../src'),
  outputDir: path.join(__dirname, '../dist'),
  
  // Terser options
  terserOptions: {
    compress: {
      // Remove console.log statements (all console methods)
      drop_console: true,
      // Remove debugger statements
      drop_debugger: true,
      // Remove unused variables
      unused: true,
      // Remove dead code
      dead_code: true,
      // Evaluate constant expressions
      evaluate: true,
      // Join consecutive var statements
      join_vars: true,
      // Collapse single-use variables
      collapse_vars: true,
      // Reduce variables to constants when possible
      reduce_vars: true,
      // Additional console removal
      pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn', 'console.error']
    },
    mangle: {
      // Mangle variable names (except reserved)
      reserved: ['require', 'module', 'exports', 'window', 'document', 'electron']
    },
    format: {
      // Remove comments
      comments: false,
      // Preserve some formatting for readability
      beautify: false,
      // Remove unnecessary semicolons
      semicolons: false
    }
  },

  // Files to exclude from minification (but not from processing)
  excludePatterns: [
    /node_modules/,
    /\.min\.js$/,
    /\.json$/,
    /\.css$/,
    /\.md$/,
    /\.txt$/,
    /\.ico$/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.gif$/,
    /\.svg$/
  ]
};

/**
 * Check if file should be excluded from minification
 */
function shouldExclude(filePath) {
  return CONFIG.excludePatterns.some(pattern => pattern.test(filePath));
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Copy file from source to destination
 */
function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

/**
 * Minify JavaScript file with Terser
 */
async function minifyJSFile(src, dest) {
  try {
    const code = fs.readFileSync(src, 'utf8');
    const result = await minify(code, CONFIG.terserOptions);
    
    if (result.error) {
      console.error(`❌ Error minifying ${src}:`, result.error);
      // Fallback to copying original file
      copyFile(src, dest);
      return false;
    }
    
    // Post-process to fix any remaining console issues
    let finalCode = result.code;
    
    // Fix console fallback patterns that might cause errors
    finalCode = finalCode.replace(/console\[([^\]]+)\]\s*\|\|\s*console\.log/g, '(function(){})');
    finalCode = finalCode.replace(/console\[([^\]]+)\]\s*\|\|\s*"void 0"/g, '(function(){})');
    finalCode = finalCode.replace(/console\[([^\]]+)\]/g, '(function(){})');
    
    // Remove any remaining console references that might cause issues
    finalCode = finalCode.replace(/console\.(log|info|debug|warn|error)/g, '(function(){})');
    
    ensureDir(path.dirname(dest));
    fs.writeFileSync(dest, finalCode);
    
    // Calculate size reduction
    const originalSize = Buffer.byteLength(code, 'utf8');
    const minifiedSize = Buffer.byteLength(finalCode, 'utf8');
    const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ ${path.relative(CONFIG.sourceDir, src)} - ${reduction}% smaller`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${src}:`, error.message);
    // Fallback to copying original file
    copyFile(src, dest);
    return false;
  }
}

/**
 * Remove console.log statements from JavaScript code with proper parentheses matching
 */
function removeConsoleStatements(code) {
  const lines = code.split('\n');
  const result = [];
  
  for (let line of lines) {
    // Skip lines that contain console.log, console.info, etc.
    if (/^\s*console\.(log|info|debug|warn|error)\s*\(/.test(line)) {
      // Skip this entire line
      continue;
    }
    
    // For lines that might have console.log in the middle, try to remove just that part
    let cleanedLine = line;
    
    // Simple case: console.log(...); at the end
    cleanedLine = cleanedLine.replace(/console\.(log|info|debug|warn|error)\s*\([^)]*\)\s*;?\s*$/, '');
    
    // If the line still has content after cleaning, keep it
    if (cleanedLine.trim()) {
      result.push(cleanedLine);
    }
  }
  
  return result.join('\n');
}

/**
 * Process HTML file and remove console.log from inline scripts
 */
async function processHTMLFile(src, dest) {
  try {
    let html = fs.readFileSync(src, 'utf8');
    
    // Process script tags
    html = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (match, scriptContent) => {
      if (scriptContent.trim()) {
        const cleanedScript = removeConsoleStatements(scriptContent);
        return match.replace(scriptContent, cleanedScript);
      }
      return match;
    });
    
    ensureDir(path.dirname(dest));
    fs.writeFileSync(dest, html);
    
    console.log(`✅ ${path.relative(CONFIG.sourceDir, src)} - HTML processed (console.log removed)`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing HTML ${src}:`, error.message);
    copyFile(src, dest);
    return false;
  }
}

/**
 * Process directory recursively
 */
async function processDirectory(srcDir, destDir) {
  const items = fs.readdirSync(srcDir);
  
  for (const item of items) {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      // Process subdirectory
      await processDirectory(srcPath, destPath);
    } else if (stat.isFile()) {
      // Process file
      if (shouldExclude(srcPath)) {
        // Copy without minification
        copyFile(srcPath, destPath);
        console.log(`📄 Copied: ${path.relative(CONFIG.sourceDir, srcPath)}`);
      } else if (path.extname(srcPath) === '.js') {
        // Minify JavaScript file
        await minifyJSFile(srcPath, destPath);
      } else if (path.extname(srcPath) === '.html') {
        // Process HTML file (remove console.log from inline scripts)
        await processHTMLFile(srcPath, destPath);
      } else {
        // Copy other files
        copyFile(srcPath, destPath);
        console.log(`📄 Copied: ${path.relative(CONFIG.sourceDir, srcPath)}`);
      }
    }
  }
}

/**
 * Clean output directory
 */
function cleanOutput() {
  if (fs.existsSync(CONFIG.outputDir)) {
    fs.rmSync(CONFIG.outputDir, { recursive: true, force: true });
  }
  console.log('🧹 Cleaned output directory');
}

/**
 * Main build function
 */
async function build() {
  console.log('🚀 Starting build with Terser minification...');
  console.log(`📁 Source: ${CONFIG.sourceDir}`);
  console.log(`📁 Output: ${CONFIG.outputDir}`);
  console.log('');
  
  try {
    // Clean output directory
    cleanOutput();
    
    // Process all files
    await processDirectory(CONFIG.sourceDir, CONFIG.outputDir);
    
    console.log('');
    console.log('✅ Build completed successfully!');
    console.log('📊 Benefits:');
    console.log('  - Removed console.log statements');
    console.log('  - Removed comments and unnecessary whitespace');
    console.log('  - Minified variable names');
    console.log('  - Removed dead code');
    console.log('  - Smaller file sizes for better performance');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run build if called directly
if (require.main === module) {
  build();
}

module.exports = { build, CONFIG };
