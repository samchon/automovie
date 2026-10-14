import type { IAutoMovieTemplateDependencyVersionsProps } from "./IAutoMovieTemplateDependencyVersionsProps";
import { createAutoMovieCatalogVersionResolver } from "./createAutoMovieCatalogVersionResolver";

/**
 * Build the version table behind the scaffold's `{{version:<key>}}` tokens.
 *
 * Workspace package ranges are copied unchanged. Every external dependency is read from the pnpm catalog that owns it: `media` for the media and runtime libraries, `three`, `vite`, `utils` for `@types/node`, `samchon` for the compiler, lint, and evidence tools, and `typescript`. For `@huggingface/transformers`, `kokoro-js`, and `onnxruntime-node`, whose runtime graphs must agree on one exact version, a leading `^` or `~` is removed; any other range form is kept as written.
 *
 * @param props The manifest text and the workspace package ranges.
 * @returns The table keyed by token name, such as `engine` or `kokoroJs`.
 * @throws When any catalog entry is missing or invalid, naming it.
 *
 * @evidence contracts/common.md#principled-implementation Removing only a leading caret or tilde turns an npm range anchored on one version into that exact version, which is the semver meaning of both markers; the premise is that those three catalog entries are written as `^x.y.z`, `~x.y.z`, or `x.y.z`, which the workspace manifest does.
 * @evidence contracts/common.md#clear-and-simple-design The function owns only the mapping from token names to catalog entries; YAML reading belongs to `createAutoMovieCatalogVersionResolver`, and file access to the build script.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The exact-version rule applies to the three named runtime packages by their catalog names because their graphs need one version, and no value is hard-coded; every version comes from the inputs.
 * @evidence contracts/common.md#meaningful-documentation The comment states which catalog owns each group, which entries become exact and how, the keys of the result, and what throws.
 * @evidence contracts/performance.md#efficient-algorithms The manifest is parsed once; each of eighteen lookups scans the direct keys of the root, catalogs mapping and requested catalog, including alias resolution where needed. The fixed lookup count keeps total work linear in manifest size, with one parsed document and twenty-seven result strings.
 * @evidence contracts/performance.md#reuse-equivalent-work All eighteen lookups share one resolver and therefore one parsed document of `props.workspace`, the only input they depend on; nothing outlives the call, so no invalidation is needed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The resolver and its parsed document are released when the function returns; only the result table, twenty-seven strings, is retained by the caller.
 */
export const resolveAutoMovieTemplateDependencyVersions: (
  props: IAutoMovieTemplateDependencyVersionsProps,
) => Record<string, string> = (
  props: IAutoMovieTemplateDependencyVersionsProps,
): Record<string, string> => {
  const catalogVersion: (catalog: string, dependency: string) => string =
    createAutoMovieCatalogVersionResolver(props.workspace);
  const exactCatalogVersion: (catalog: string, dependency: string) => string = (
    catalog: string,
    dependency: string,
  ): string => catalogVersion(catalog, dependency).replace(/^[~^]/u, "");
  return {
    archetypes: props.packages.archetypes,
    cli: props.packages.cli,
    engine: props.packages.engine,
    human: props.packages.human,
    ingest: props.packages.ingest,
    interface: props.packages.interface,
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
