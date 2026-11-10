/**
 * The named pnpm catalog of a workspace root that holds each `{{version:<key>}}` dependency.
 *
 * A workspace production writes `catalog:<name>` for every versioned dependency, and the root's `pnpm-workspace.yaml` lists the same names under `catalogs`, grouped like this repository's own catalogs: `automovie` for the CLI and every `@automovie/*` package, `samchon` for the compiler, lint, evidence and test tools, and `typescript`, `three`, `gltf`, `vite`, `media` and `utils` for the rest. Inside a catalog, packages released together share one YAML anchor: `&automovie`, `&ttsc` and `&three`.
 *
 * Principled implementation: The names match the catalogs the root renders, so each `catalog:<name>` specifier resolves through pnpm's named-catalog lookup to the entry the root declares.
 * Clear and simple design: One table owns the key-to-catalog relation for the variable builder; the workspace YAML owns the entries and their anchors.
 * Prohibited implementation shortcuts: Every key of `AUTOMOVIE_TEMPLATE_VERSIONS` has a catalog, so a new version key without one fails rendering instead of silently using the default catalog.
 * Meaningful documentation: The prose names every catalog, its members and the shared anchors.
 * Efficient algorithms: A constant record with no computation.
 * Reuse equivalent work: Every render reads the same immutable record.
 * Bound retention and release resources: One fixed record for the module lifetime.
 */
export const AUTOMOVIE_TEMPLATE_CATALOGS: Readonly<Record<string, string>> = {
  cli: "automovie",
  engine: "automovie",
  evidence: "automovie",
  human: "automovie",
  ingest: "automovie",
  interface: "automovie",
  motions: "automovie",
  recovery: "automovie",
  render: "automovie",
  template: "automovie",
  viewer: "automovie",
  huggingFaceTransformers: "media",
  h264Mp4Encoder: "media",
  ffmpegStatic: "media",
  kokoroJs: "media",
  libopusWasm: "media",
  mp4box: "media",
  onnxruntimeNode: "media",
  playwright: "media",
  playwrightCore: "media",
  pngjs: "media",
  pngjsTypes: "media",
  three: "three",
  threeTypes: "three",
  gltfTransformCore: "gltf",
  vite: "vite",
  nodeTypes: "utils",
  nestiaE2e: "samchon",
  ttsc: "samchon",
  ttscLint: "samchon",
  evidenceCli: "samchon",
  evidenceLint: "samchon",
  typescript: "typescript",
};
