/**
 * Compile this production's typed browser entry points into generated ESM.
 * Existing native scene endpoints and public source assets stay with the
 * server. Three.js and its controls resolve through the existing import map.
 * Generated code stays in memory; it is never an authored project input.
 * Every call reads current TypeScript so a fresh browser load does not receive
 * a stale source module. Normal source lint remains the typed acceptance gate.
 */
import { resolve } from "node:path";

/** Build actual browser consumers with the production's existing Vite compiler. */
export async function buildViewerBrowser(root: string): Promise<Map<string, string | Uint8Array>> {
  const { build } = await import("vite");
  const result = await build({
    configFile: false,
    root,
    resolve: { extensions: [".mts", ".ts", ".tsx", ".mjs", ".js", ".jsx", ".json"] },
    logLevel: "error",
    build: {
      write: false,
      minify: false,
      rollupOptions: {
        input: { client: resolve(root, "src/viewer/client.ts"), modelBoard: resolve(root, "src/viewer/model-board.ts") },
        external: ["three", "three/addons/controls/OrbitControls.js"],
        output: {
          format: "es",
          entryFileNames: "assets/[name].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
        },
      },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  const files = new Map<string, string | Uint8Array>();
  for (const output of outputs) {
    if (!("output" in output)) throw new Error("Browser source compilation did not return generated files.");
    for (const item of output.output)
      files.set("/" + item.fileName, item.type === "chunk" ? item.code : item.source);
  }
  return files;
}
