/**
 * Compiler package version captured once from this package's own manifest.
 *
 * The static relative require stays in the same production directory in both source and emitted layouts and remains a statically resolvable bundler input. Module initialization reads the manifest through Node's ordinary require cache; the version field is trusted as a string, and later package edits do not refresh this resident value.
 *
 * Build identity producers consume that same value. Node owns manifest-cache lifetime; this scalar acquires no descriptor or task and is not a function/type Evidence host.
 */
export const AUTOMOVIE_PRODUCTION_BUILD_VERSION: string = (
  require("../../package.json") as {
    version: string;
  }
).version;
