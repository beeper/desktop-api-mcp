#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DIST_MCPB_DIR = path.join(__dirname, 'dist-mcpb')

async function main() {
  try {
    console.log('Starting build process for dist-mcpb...')

    // 1. Remove dist-mcpb directory if it exists
    if (fs.existsSync(DIST_MCPB_DIR)) {
      console.log('Removing existing dist-mcpb directory...')
      fs.rmSync(DIST_MCPB_DIR, { recursive: true, force: true })
    }

    // 2. Create dist-mcpb directory
    console.log('Creating dist-mcpb directory...')
    fs.mkdirSync(DIST_MCPB_DIR, { recursive: true })

    // 3. Copy files to dist-mcpb
    console.log('Copying files to dist-mcpb...')

    // Copy manifest.json
    fs.copyFileSync(path.join(__dirname, 'manifest.json'), path.join(DIST_MCPB_DIR, 'manifest.json'))
    console.log('✓ Copied manifest.json')

    // Copy icon.png
    fs.copyFileSync(path.join(__dirname, 'icon.png'), path.join(DIST_MCPB_DIR, 'icon.png'))
    console.log('✓ Copied icon.png')

    // Copy the bundle
    for (const file of fs.readdirSync(path.join(__dirname, 'dist')).filter((f) => f.endsWith('.js'))) {
      fs.copyFileSync(path.join(__dirname, 'dist', file), path.join(DIST_MCPB_DIR, file))
      console.log(`✓ Copied dist/${file}`)
    }

    // 4. Create modified package.json
    console.log('Creating modified package.json...')

    // Read original package.json
    const originalPackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))

    // Create modified package.json
    const modifiedPackageJson = {
      ...originalPackageJson,
      dependencies: {},
      devDependencies: {},
      scripts: {},
      main: 'proxy.js',
    }

    // Remove bin property
    delete modifiedPackageJson.bin

    // Write modified package.json
    fs.writeFileSync(path.join(DIST_MCPB_DIR, 'package.json'), JSON.stringify(modifiedPackageJson, null, 2))
    console.log('✓ Created modified package.json')

    console.log('\n✅ Build process completed successfully!')
    console.log(`📁 Files copied to: ${DIST_MCPB_DIR}`)
    console.log('\nCopied files:')
    console.log('  - manifest.json')
    console.log('  - icon.png')
    console.log('  - proxy.js (from dist/)')
    console.log('  - package.json (modified)')
  } catch (error) {
    console.error('❌ Error during build process:', error.message)
    process.exit(1)
  }
}

main()
