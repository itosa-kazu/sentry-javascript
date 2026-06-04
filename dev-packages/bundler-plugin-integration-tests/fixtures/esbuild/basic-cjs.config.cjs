const esbuild = require("esbuild");
const { sentryEsbuildPlugin } = require("@sentry/bundler-plugins/esbuild");
const { sentryConfig } = require("../configs/basic.config.cjs");

// no top-level await, so the build promise is intentionally floating.
// on failure, node will crash the same as if we did await it, which is
// the intended behavior, and the build will keep the event loop open
// while it runs.
void esbuild.build({
  entryPoints: ["./src/basic.js"],
  bundle: true,
  outfile: "./out/basic-cjs/basic.js",
  minify: false,
  format: "iife",
  plugins: [sentryEsbuildPlugin(sentryConfig)],
});
