import { type IAutoMovieSceneEnvironmentUse, readAutoMovieImageFacts, validateTextureAssets } from "@automovie/engine";
import type { IAutoMovieAssetProvenance, IAutoMovieBuiltEnvironment, IAutoMovieDiagnostic, IAutoMovieModel, IAutoMovieValidation, IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * Close material and lighting image uses over either timed or library output.
 *
 * Built environments own models too. Reading only a shot's model list or a library's standalone model contributions leaves those material uses unpaid. Keep every occurrence: equal ids across environments must not hide different material records behind a last-writer-wins map.
 *
 * @evidence contracts/common.md#principled-implementation Joins every standalone and environment-owned model occurrence plus scene environment uses to the supplied asset ledger and content bytes, delegating media/dimension/authorization/color-intent checks to validateTextureAssets. Current engine findings are blocking errors; asset byte digests are admitted separately by the asset inventory.
 * @evidence contracts/common.md#clear-and-simple-design One bridge serves timed build review and library compilation, flattening model occurrences without deduplicating IDs and adapting content bytes to the engine's image-facts callback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal model IDs do not hide distinct material occurrences; missing or unreadable image bytes remain unresolved facts. Content path duplicates retain Map's last-value behavior, while the production content inventory owns path uniqueness.
 * @evidence contracts/common.md#meaningful-documentation States actual consumers, occurrence retention, delegated image checks and separate digest admission; returned findings use the asset-manifest diagnostic address rather than independently publishing or repairing assets.
 * @evidence contracts/performance.md#efficient-algorithms Indexes C content entries and flattens M model references once, then pays engine material/use validation costs; image headers are inspected once per distinct requested path, avoiding repeated JPEG header scans for shared textures. Maps and model references take O(C+M+U) space for U requested paths plus engine/output storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Within this synchronous attempt, a path names the same indexed byte buffer and pure header result; the facts map also retains unresolved results so repeat occurrences reuse work without losing their separate findings. No cache crosses calls or mutable content generations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Content references, model flattening and facts are local until validation finishes; the caller owns returned diagnostics, and buffers are not copied or retained across attempts. This bridge opens no file, image decoder, handle or task.
 */
export function productionTextureClosureDiagnostics(props: {
  /** Namespace whose declared asset-consumer authorization is checked. */
  production: string;

  /** Standalone model occurrences; equal ids remain distinct uses. */
  models: readonly IAutoMovieModel[];

  /** Every building-owned model occurrence admitted to the output. */
  environments: readonly Pick<IAutoMovieBuiltEnvironment, "models">[];

  /** Shot-scene environment image uses, absent for the library caller. */
  scenes: readonly IAutoMovieSceneEnvironmentUse[];

  /** Previously admitted asset provenance and explicit consumer uses. */
  assets: readonly IAutoMovieAssetProvenance[];

  /** Current content buffers used for image-header facts, with null denoting unavailable bytes. */
  content: readonly { path: string; bytes: Uint8Array | null }[];
}): IAutoMovieDiagnostic[] {
  const bytes: Map<string, Uint8Array | null> = new Map(
    props.content.map((entry: typeof props.content[number]): [string, Uint8Array | null] => [entry.path, entry.bytes]),
  );
  const facts: Map<string, ReturnType<typeof readAutoMovieImageFacts>> = new Map();
  const result: IAutoMovieValidation = validateTextureAssets({
    production: props.production,
    models: [
      ...props.models,
      ...props.environments.flatMap((entry: typeof props.environments[number]): IAutoMovieModel[] => entry.models),
    ],
    scenes: props.scenes,
    assets: props.assets,
    facts: (asset: string): NonNullable<ReturnType<typeof readAutoMovieImageFacts>> | undefined => {
      if (facts.has(asset) === false)
        facts.set(asset, readAutoMovieImageFacts(bytes.get(asset)));
      return facts.get(asset) ?? undefined;
    },
  });
  return result.success
    ? []
    : result.violations.map((violation: IAutoMovieConstraintViolation): IAutoMovieDiagnostic => ({
        code: "asset-texture-unclosed",
        category: "error",
        phase: "compile",
        target: "asset-manifest",
        path: "automovie/assets.json",
        message: `${violation.path} ${violation.expected}. Register the image, correct its typed use, or stop binding it before compiling.`,
      }));
}
