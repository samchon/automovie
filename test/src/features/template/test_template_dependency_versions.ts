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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls resolveAutoMovieTemplateDependencyVersions and compares the complete returned table, detecting an omitted or misowned dependency, changed workspace range, missed scalar alias, or caret and tilde stripping applied to the wrong dependency group.
 * @evidence contracts/testing.md#independent-expectations The expected table is written from the supplied workspace package ranges and literal catalog entries; only the three documented fixed-runtime entries lose a leading caret or tilde. Distinct external version numbers identify catalog mapping mistakes without reading generated versions or resolver output.
 * @evidence contracts/testing.md#distinguishing-cases One complete document covers all ten workspace ranges and eighteen external mappings, shared aliases, caret and tilde exact conversion, an already exact runtime version, and preserved compiler and evidence ranges. Missing or malformed YAML and ownership refusals belong to test_template_catalog_resolution.
 * @evidence contracts/testing.md#execution-ownership The discoverable exported test_template_dependency_versions entry resolves caller-supplied text in-process and asserts one returned record; it reads no workspace file, installs no generated consumer and starts no process or native host.
 */
export function test_template_dependency_versions(): void {
  const packages: IAutoMovieWorkspacePackageVersions = {
    archetypes: "^2.0.0",
    cli: "^2.0.0",
    engine: "^2.0.0",
    human: "^2.0.0",
    ingest: "^2.0.0",
    interface: "^2.0.0",
    recovery: "^2.0.0",
    render: "^2.0.0",
    template: "^2.0.0",
    viewer: "^2.0.0",
  };
  const workspace: string = `catalogs:
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
}
