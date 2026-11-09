import {
  IAutoMovieAssetProvenance,
  IAutoMovieModel,
} from "@automovie/interface";

import { IAutoMovieSceneEnvironmentUse } from "./IAutoMovieSceneEnvironmentUse";
import { IAutoMovieTextureImageFacts } from "./IAutoMovieTextureImageFacts";

/**
 * All authored uses, ledger rows and supplied image facts for texture closure.
 *
 * @evidence contracts/development/design.md#principled-representation The production id binds asset authorization while model materials and shot environments enumerate uses; facts resolves one asset path to byte-header dimensions/media or undefined.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The validator receives an explicit facts callback instead of importing filesystem/network decoding into deterministic closure.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The callback's purity and truthful byte provenance are caller premises; a manifest label or supplied fact alone does not prove complete decoding, pixel content or current GPU adoption.
 * @evidence contracts/development/common.md#meaningful-documentation Documents exact production scope, borrowed model/scene/ledger populations and undefined unreadable-image meaning; callback errors and effects may propagate.
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
   * @evidence contracts/development/implementation.md#principled-implementation The caller supplies media and pixel dimensions from its current bytes; validateTextureAssets checks these facts against ledger authorization, slot media and edge limits. The callback itself is a trusted data seam, not a complete image decoder or byte-digest proof.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Production adapts its indexed content bytes through readAutoMovieImageFacts, while unit callers can supply explicit facts; deterministic closure need not open files or acquire an image host.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Undefined remains an unreadable/missing result rather than an invented image. The signature does not enforce purity, current-byte provenance or stable repeated answers; caller exceptions and effects can propagate.
   * @evidence contracts/development/common.md#meaningful-documentation Defines authored path input, borrowed media/dimension output and undefined meaning, including unregistered environment references and the separation between header facts and full decoding.
   * @evidence contracts/development/implementation.md#efficient-algorithms Callback cost depends on its implementation and is additional to closure traversal; production indexes byte paths and scans a header only on the first request for each distinct path in the attempt.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Closure may request a shared path repeatedly, including scene intent after its asset check. Production memoizes both resolved and unresolved facts against the attempt's fixed byte map; the interface retains no cross-generation cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The callback and returned facts are caller-owned for synchronous validation. Production's local byte/facts maps leave scope afterward; this signature acquires no decoder, stream or task, and arbitrary callback-owned resources remain its caller's responsibility.
   */
  facts: (asset: string) => IAutoMovieTextureImageFacts | undefined;
}
