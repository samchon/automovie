import type { IAutoMovieTemplateDependencyVersionsProps } from "./IAutoMovieTemplateDependencyVersionsProps";
import { resolveAutoMovieCatalogVersion } from "./resolveAutoMovieCatalogVersion";

/**
 * Resolve scaffold dependency placeholders from explicitly acquired workspace inputs.
 *
 * Workspace packages keep their authored ranges. Compiler and evidence tools
 * belong to the samchon catalog, while TypeScript retains its own catalog.
 * Runtime graphs that need one exact version remove only a leading range marker.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Carries the workspace package and toolchain versions into a portable scaffold.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Derives all dependency placeholders from supplied package versions and workspace catalog text without host reads.
 */
export const resolveAutoMovieTemplateDependencyVersions = (
  props: IAutoMovieTemplateDependencyVersionsProps,
): Record<string, string> => {
  const catalogVersion = (catalog: string, dependency: string): string =>
    resolveAutoMovieCatalogVersion({catalog, dependency, workspace: props.workspace});
  const exactCatalogVersion = (catalog: string, dependency: string): string =>
    catalogVersion(catalog, dependency).replace(/^[~^]/, "");
  return {
  archetypes: props.packages.archetypes,
  cli: props.packages.cli,
  engine: props.packages.engine,
  evidence: props.packages.evidence,
  human: props.packages.human,
  ingest: props.packages.ingest,
  interface: props.packages.interface,
  mcp: props.packages.mcp,
  production: props.packages.production,
  render: props.packages.render,
  template: props.packages.template,
  viewer: props.packages.viewer,
  huggingFaceTransformers: exactCatalogVersion(
    "media",
    "@huggingface/transformers",
  ),
  h264Mp4Encoder: catalogVersion("media", "h264-mp4-encoder"),
  kokoroJs: exactCatalogVersion("media", "kokoro-js"),
  libopusWasm: catalogVersion("media", "libopus-wasm"),
  mp4box: catalogVersion("media", "mp4box"),
  onnxruntimeNode: exactCatalogVersion("media", "onnxruntime-node"),
  playwright: catalogVersion("media", "playwright"),
  pngjs: catalogVersion("media", "pngjs"),
  pngjsTypes: catalogVersion("media", "@types/pngjs"),
  three: catalogVersion("three", "three"),
  threeTypes: catalogVersion("three", "@types/three"),
  vite: catalogVersion("vite", "vite"),
  nodeTypes: catalogVersion("utils", "@types/node"),
  ttsc: catalogVersion("samchon", "ttsc"),
  ttscLint: catalogVersion("samchon", "@ttsc/lint"),
  evidenceCli: catalogVersion("samchon", "@wrtnlabs/evidence"),
  evidenceLint: catalogVersion("samchon", "@ttsc/evidence"),
  typescript: catalogVersion("typescript", "typescript"),
  };
};
