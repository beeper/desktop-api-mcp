import { resolve } from 'node:path'

const authorize = resolve('src/authorize.ts')

const result = await Bun.build({
  entrypoints: ['src/proxy.ts'],
  outdir: 'dist',
  target: 'node',
  format: 'esm',
  minify: true,
  sourcemap: 'none',
  plugins: [
    {
      name: 'beeper-authorize',
      setup(build) {
        build.onResolve({ filter: /^open$/ }, (args) => (args.importer === authorize ? undefined : { path: authorize }))
      },
    },
  ],
})

if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}
