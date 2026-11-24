const path = require('path')
const { defineConfig } = require('@vue/cli-service')
const SITE = require('./site-config')
const { pageHead, searchEngineFiles, assertFormKeys, validateTheme, isLaunchReady } = require('./build/site-build')

/**
 * Vue CLI configuration for sites built from the nizar-starter-site template.
 * Every client-specific value comes from site-config.js; nothing here should
 * ever need editing for a new client.
 */

// Fail early on a mistyped theme colour or font, whatever the build mode
validateTheme(SITE.theme)

// A launched site with unfinished quote-form keys would publish a form that
// can't send, so stop the build. Preview builds (launchReady false) and the
// template repo are let through; see assertFormKeys in build/site-build.js.
if (process.env.NODE_ENV === 'production') {
  assertFormKeys(SITE)
  // Say which mode this build is in, so a preview is never mistaken for a launch
  /* eslint-disable-next-line no-console */
  console.log(isLaunchReady(SITE)
    ? 'site-config.js: launchReady is true. Building the indexable launch version.'
    : 'site-config.js: launchReady is false. Building a PREVIEW (noindex, robots.txt disallows all, no JSON-LD/sitemap/llms.txt).')
}

/**
 * Webpack plugin that writes robots.txt (and, once launched, sitemap.xml and
 * llms.txt) into the build, generated from site-config.js so they can't
 * drift from the page
 */
class SearchEngineFilesPlugin {
  apply (compiler) {
    const { RawSource } = compiler.webpack.sources
    compiler.hooks.thisCompilation.tap('SearchEngineFilesPlugin', compilation => {
      compilation.hooks.processAssets.tap(
        { name: 'SearchEngineFilesPlugin', stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
        () => {
          const files = searchEngineFiles(SITE)
          Object.keys(files).forEach(name => compilation.emitAsset(name, new RawSource(files[name])))
        }
      )
    })
  }
}

module.exports = defineConfig({
  // Relative asset paths: the same build works at the root of a custom
  // domain and under any GitHub Pages sub-folder (/<Client>-website/),
  // so no per-client base path has to be configured. Safe here because the
  // site is a single page with no client-side router.
  publicPath: './',

  outputDir: 'dist',
  assetsDir: 'assets',

  // No source maps in production: smaller deploy, and nothing gained by
  // publishing them for a brochure site
  productionSourceMap: false,

  configureWebpack: {
    resolve: {
      alias: {
        // Components import the client config as '@site-config'. The alias
        // keeps imports short and makes the config's location obvious.
        '@site-config$': path.resolve(__dirname, 'site-config.js')
      }
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 6,
        cacheGroups: {
          vuetify: {
            name: 'chunk-vuetify',
            test: /[\\/]node_modules[\\/]vuetify[\\/]/,
            priority: 20,
            chunks: 'initial'
          },
          vendors: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial'
          },
          common: {
            name: 'chunk-common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true
          }
        }
      }
    },
    performance: {
      hints: 'warning',
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    },
    plugins: [new SearchEngineFilesPlugin()]
  },

  devServer: {
    host: 'localhost',
    port: 8080,
    open: true
  },

  chainWebpack: config => {
    config.plugin('html').tap(args => {
      // Values public/index.html reads as htmlWebpackPlugin.options.page.*
      // (already HTML-escaped by pageHead)
      args[0].page = pageHead(SITE)

      args[0].minify = {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        collapseBooleanAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        minifyJS: true,
        minifyCSS: true
      }
      return args
    })

    if (process.env.NODE_ENV === 'production') {
      // Strip console.log/info/debug in production but keep console.error and
      // console.warn, so unexpected errors still leave a trace
      config.optimization.minimizer('terser').tap(args => {
        args[0].terserOptions.compress.pure_funcs = ['console.log', 'console.info', 'console.debug']
        return args
      })
    }
  }
})
