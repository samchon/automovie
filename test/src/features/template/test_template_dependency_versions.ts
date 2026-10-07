import {
  type IAutoMovieWorkspacePackageVersions,
  resolveAutoMovieTemplateDependencyVersions,
} from "@automovie/template";
import { TestValidator } from "@nestia/e2e";

/**
 * Portable scaffold dependencies resolve from their supplied catalog owners.
 *
 * Scenarios:
 * 1. Complete workspace library ranges survive unchanged and every external
 *    dependency resolves from its declared catalog, including YAML aliases.
 * 2. Exact runtime graphs strip caret or tilde markers while an already exact
 *    range remains exact; compiler and evidence tools retain their ranges.
 */
export const test_template_dependency_versions = (): void => {
  const packages: IAutoMovieWorkspacePackageVersions = {
    archetypes: "^2.0.0",
    cli: "^2.0.0",
    engine: "^2.0.0",
    evidence: "^2.0.0",
    human: "^2.0.0",
    ingest: "^2.0.0",
    interface: "^2.0.0",
    mcp: "^2.0.0",
    production: "^2.0.0",
    render: "^2.0.0",
    template: "^2.0.0",
    viewer: "^2.0.0",
  };
  const workspace = `catalogs:
  samchon:
    ttsc: &tools ^1.0.0
    "@ttsc/lint": *tools
    "@wrtnlabs/evidence": ~2.0.0
    "@ttsc/evidence": *tools
  typescript:
    typescript: ^3.0.0
  utils:
    "@types/node": ^4.0.0
  media:
    "@huggingface/transformers": ~5.0.0
    h264-mp4-encoder: ^6.0.0
    kokoro-js: ^7.0.0
    libopus-wasm: ~8.0.0
    mp4box: ^9.0.0
    onnxruntime-node: 10.0.0
    playwright: ~11.0.0
    pngjs: ^12.0.0
    "@types/pngjs": ~13.0.0
  three:
    three: &three ^14.0.0
    "@types/three": *three
  vite:
    vite: ^15.0.0
`;
  TestValidator.equals(
    "complete scaffold dependency inputs",
    resolveAutoMovieTemplateDependencyVersions({ packages, workspace }),
    {
      ...packages,
      huggingFaceTransformers: "5.0.0",
      h264Mp4Encoder: "^6.0.0",
      kokoroJs: "7.0.0",
      libopusWasm: "~8.0.0",
      mp4box: "^9.0.0",
      onnxruntimeNode: "10.0.0",
      playwright: "~11.0.0",
      pngjs: "^12.0.0",
      pngjsTypes: "~13.0.0",
      three: "^14.0.0",
      threeTypes: "^14.0.0",
      vite: "^15.0.0",
      nodeTypes: "^4.0.0",
      ttsc: "^1.0.0",
      ttscLint: "^1.0.0",
      evidenceCli: "~2.0.0",
      evidenceLint: "^1.0.0",
      typescript: "^3.0.0",
    },
  );
};
