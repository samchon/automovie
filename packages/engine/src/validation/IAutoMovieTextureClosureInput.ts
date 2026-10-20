import {
  IAutoMovieAssetProvenance,
  IAutoMovieModel,
} from "@automovie/interface";

import { IAutoMovieSceneEnvironmentUse } from "./IAutoMovieSceneEnvironmentUse";
import { IAutoMovieTextureImageFacts } from "./IAutoMovieTextureImageFacts";

/**
 * All authored uses, ledger rows and supplied image facts for texture closure.
 *
 * @evidence contracts/common.md#principled-implementation The production id binds asset authorization while model materials and shot environments enumerate uses; facts resolves one asset path to byte-header dimensions/media or undefined.
 * @evidence contracts/common.md#clear-and-simple-design The validator receives an explicit facts callback instead of importing filesystem/network decoding into deterministic closure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback's purity and truthful byte provenance are caller premises; a manifest label or supplied fact alone does not prove complete decoding, pixel content or current GPU adoption.
 * @evidence contracts/common.md#meaningful-documentation Documents exact production scope, borrowed model/scene/ledger populations and undefined unreadable-image meaning; callback errors and effects may propagate.
 * @evidence contracts/performance.md#efficient-algorithms The input record computes nothing; closure scans uses/ledger and pays supplied callback cost, which can repeat for repeated references.
 * @evidence contracts/performance.md#reuse-equivalent-work One shared closure representation serves builder bytes and unit facts without retaining a cross-call cache of mutable files or ledger entries.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All lists and callback are caller-owned for synchronous validation; this record acquires no stream, image decoder, network task or GPU resource.
 */
export interface IAutoMovieTextureClosureInput {
  /** Exact production id whose ledger entries authorize these uses. */
  production: string;

  /** Compiled models whose materials bind PBR images. */
  models: readonly IAutoMovieModel[];

  /** Compiled shots whose scenes bind image lighting. */
  scenes: readonly IAutoMovieSceneEnvironmentUse[];

  /** The project asset ledger, exactly as the manifest holds it. */
  assets: readonly IAutoMovieAssetProvenance[];

  /**
   * Resolve supplied image-header facts for an authored asset path, including
   * an unregistered scene reference, or return undefined for unavailable facts.
   *
   * @evidence contracts/common.md#principled-implementation The caller supplies media and pixel dimensions from its current bytes; validateTextureAssets checks these facts against ledger authorization, slot media and edge limits. The callback itself is a trusted data seam, not a complete image decoder or byte-digest proof.
   * @evidence contracts/common.md#clear-and-simple-design Production adapts its indexed content bytes through readAutoMovieImageFacts, while unit callers can supply explicit facts; deterministic closure need not open files or acquire an image host.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Undefined remains an unreadable/missing result rather than an invented image. The signature does not enforce purity, current-byte provenance or stable repeated answers; caller exceptions and effects can propagate.
   * @evidence contracts/common.md#meaningful-documentation Defines authored path input, borrowed media/dimension output and undefined meaning, including unregistered environment references and the separation between header facts and full decoding.
   * @evidence contracts/performance.md#efficient-algorithms Callback cost depends on its implementation and is additional to closure traversal; production indexes byte paths and scans a header only on the first request for each distinct path in the attempt.
   * @evidence contracts/performance.md#reuse-equivalent-work Closure may request a shared path repeatedly, including scene intent after its asset check. Production memoizes both resolved and unresolved facts against the attempt's fixed byte map; the interface retains no cross-generation cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The callback and returned facts are caller-owned for synchronous validation. Production's local byte/facts maps leave scope afterward; this signature acquires no decoder, stream or task, and arbitrary callback-owned resources remain its caller's responsibility.
   */
  facts: (asset: string) => IAutoMovieTextureImageFacts | undefined;
}
