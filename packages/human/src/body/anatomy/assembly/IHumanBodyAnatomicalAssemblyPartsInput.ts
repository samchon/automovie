import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodySourceRigResult } from "../articulation/rig/IAutoMovieHumanBodySourceRigResult";
import type { IHumanBodyExteriorRestReference } from "../binding/IHumanBodyExteriorRestReference";
import type { AutoMovieHumanBodyPartId } from "../identity/AutoMovieHumanBodyPartId";

/**
 * One body evaluation and its consumer-owned anatomical exterior reference.
 *
 * The body consumer supplies its own rest skin. A held-neutral person can additionally supply the exterior its two partitions form together, so the same assembly consumes head and body controls through one displacement.
 *
 * @evidence contracts/common.md#principled-implementation The admitted basis, solved document and same FK graph meet the consumer's rest skin; an optional joined exterior keeps person head/body displacement under one authority.
 * @evidence contracts/common.md#clear-and-simple-design A single assembly boundary carries actual evaluation inputs and progress observers while the consumer owns its anatomical exterior reference.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Joined exterior samples come from the actual neutral person consumer, and observer exceptions propagate instead of masking a failed construction.
 * @evidence contracts/common.md#meaningful-documentation Comments identify immutable basis, effective solved document, common metres, body fallback and progress-callback failure effects.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Assembly inputs specify rest populations and callbacks without performing source deformation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The supplied FK result is reusable within this evaluation, while this input type owns no cross-document follower cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Callbacks and skin references are borrowed construction inputs; this declaration schedules no background observation task.
 * @author Samchon
 */
export interface IHumanBodyAnatomicalAssemblyPartsInput {
  /** Actual admitted immutable body basis carrying the exact registered assembly. */
  basis: IAutoMovieHumanBodyBasis;

  /** Effective solved document whose shape/pose produced this graph evaluation. */
  document: IAutoMovieHumanBodyBasisDocument;

  /** Same source FK result used by skin and public projections, in common body metres. */
  rig: IAutoMovieHumanBodySourceRigResult;

  /** The skin's native vertices at rest under the document's shape, in metres; the parts of a bound assembly follow its departure from the neutral skin. */
  restSkin: readonly number[];

  /**
   * A neutral whole-person consumer's complete exterior, after its head and
   * body fields meet on the shared samples. Omission uses the body exterior.
   */
  exteriorRestReference?: IHumanBodyExteriorRestReference;

  /**
   * Actual completed source part; completed and total count source anatomical owners. Observer exceptions propagate to the original construction.
   *
   * @evidence contracts/common.md#principled-implementation A synchronous callback reports the actual completed anatomical owner and progress counts after construction, preserving the caller's chosen observation effects.
   * @evidence contracts/common.md#clear-and-simple-design Optional part progress remains a construction input rather than a global listener or separate background task.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Completion reports come from actual produced source parts; observer exceptions propagate without claiming success or silently retrying side effects.
   * @evidence contracts/common.md#meaningful-documentation The callback comment identifies anatomical-owner progress counts and exception propagation to the initiating construction.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback signature declares progress arguments without choosing the consumer's observer implementation or algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Part-completion callbacks may have caller effects, and this signature coordinates no shared delivery or repeated-event cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The callback type acquires no subscription handle; the invoking construction borrows the optional observer for its own lifetime.
   */
  observePartComplete?: (
    part: AutoMovieHumanBodyPartId,
    completed: number,
    total: number,
  ) => void;

  /**
   * Actual consumed source quantity path without the anatomy prefix; observer exceptions propagate to the quantity construction.
   *
   * @evidence contracts/common.md#principled-implementation The quantity observer receives the source anatomical owner and actual consumed record path after its quantity reading, without converting raw observations into shape targets.
   * @evidence contracts/common.md#clear-and-simple-design Quantity progress has a distinct optional callback because one anatomical owner can consume multiple bound paths independently.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback follows actual source-bound quantity completion and preserves observer failures instead of inventing a finished measurement.
   * @evidence contracts/common.md#meaningful-documentation The member explains the prefix-free consumed path and propagation of observer exceptions to quantity construction.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The quantity-completion signature performs no path search, volume measurement or observer algorithm itself.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Quantity notifications can carry effects, while the signature defines neither equivalent observer requests nor deduplicated deliveries.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources An optional quantity callback is borrowed input without a separately acquired listener, timer or cancellable task.
   */
  observeQuantityComplete?: (
    part: AutoMovieHumanBodyPartId,
    path: string,
  ) => void;
}
