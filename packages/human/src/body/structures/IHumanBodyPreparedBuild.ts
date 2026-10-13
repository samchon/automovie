import type { IAutoMovieHumanBodyUnderwearRest } from "./IAutoMovieHumanBodyUnderwearRest";
import type { IAutoMovieHumanBodyUnderwearParts } from "./IAutoMovieHumanBodyUnderwearParts";
import type { IHumanBodyExteriorRestReference } from "../anatomy/binding/IHumanBodyExteriorRestReference";
import type { IAutoMovieHumanBodyBuild } from "./IAutoMovieHumanBodyBuild";
import type { IHumanBodySkinEvaluation } from "./IHumanBodySkinEvaluation";

/**
 * One prepared exterior and its internal assembly completion step.
 *
 * Completing uses the prepared document and pose against the caller's
 * chosen exterior authority. Omission uses the standalone body's rest skin;
 * a held-neutral person supplies its joined rest exterior. The completion
 * never recomputes the skin or solves a preliminary internal target.
 *
 * @evidence contracts/common.md#principled-implementation Prepared exterior state and completion callbacks let person composition choose its shared exterior before internal layers are solved.
 * @evidence contracts/common.md#clear-and-simple-design Preparation, finishing and garment composition remain explicit stages on one admitted document snapshot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Completion uses the selected exterior authority rather than solving a preliminary internal target against another skin.
 * @evidence contracts/common.md#meaningful-documentation The comment states deferred layers and garment coverage ownership; it does not enforce single-use calls.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The prepared body construction contract declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The prepared body construction contract declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The prepared body construction contract type has no runtime acquisition, retention or release operation.
 *
 * @author Samchon
 */
export interface IHumanBodyPreparedBuild {
  /** Exterior and pose state available before any internal target solve. */
  skin: IHumanBodySkinEvaluation;

  /**
   * Construct the full source assembly against its selected exterior authority. Default completion constructs registered layers after final root placement. A person uses `defer` until its actual render skin carries joined physical incidence, then completes layers through `appendHumanBodyLayers` once. The separate garment defer preserves original region corner correspondence until the Person's final skin placement and layer readings are complete.
   *
   * @evidence contracts/common.md#principled-implementation Complete source assembly against an optional exterior reference, with explicit layer and garment deferral choices.
   * @evidence contracts/common.md#clear-and-simple-design The composition owner chooses the exterior authority and the stage at which joined layers and fabric are appended.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A deferred stage preserves original source correspondence instead of silently completing against an obsolete exterior.
   * @evidence contracts/common.md#meaningful-documentation The comment states default completion, both deferral effects and joined-skin ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The prepared assembly completion method is an interface signature with no algorithm body.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The prepared assembly completion method signature implements no cross-call reuse policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The prepared assembly completion method acquires no handles or retained allocations itself.
   */
  finish(
    reference?: IHumanBodyExteriorRestReference,
    layers?: "defer",
    garment?: "defer",
  ): IAutoMovieHumanBodyBuild;

  /**
   * Prepare the admitted garment's rest coverage for its final skin consumer. Omitted rest retains the prepared shape's rest coverage reference; a supplied rest uses the same native surface order in the common frame. No garment choice returns undefined. The source document remains owned.
   *
   * @evidence contracts/common.md#principled-implementation Return the admitted garment's prepared rest coverage, or recompute it from explicitly supplied source-ordered rest data; no garment returns undefined.
   * @evidence contracts/common.md#clear-and-simple-design The coverage callback retains the admitted garment choice separately from final mesh composition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A supplied rest must use the same native surface order and frame, without replacing the document's clothing choice.
   * @evidence contracts/common.md#meaningful-documentation The comment states omission, explicit rest input and undefined garment behavior.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The prepared coverage method is an interface signature with no algorithm body.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The prepared coverage method signature implements no cross-call reuse policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The prepared coverage method acquires no handles or retained allocations itself.
   */
  dress(
    rest?: IAutoMovieHumanBodyUnderwearRest,
  ): IAutoMovieHumanBodyUnderwearParts | undefined;

  /**
   * Compose the same garment on a completed, still-undressed standalone Body.
   *
   * @evidence contracts/common.md#principled-implementation Compose the admitted garment onto a completed still-undressed standalone body.
   * @evidence contracts/common.md#clear-and-simple-design The method owns final garment composition after anatomical completion and placement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The input remains the actual completed skin authority instead of a separate fitted garment asset.
   * @evidence contracts/common.md#meaningful-documentation The method names its required construction stage and standalone scope.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The standalone dressing method is an interface signature with no algorithm body.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The standalone dressing method signature implements no cross-call reuse policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The standalone dressing method acquires no handles or retained allocations itself.
   */
  wear(build: IAutoMovieHumanBodyBuild): IAutoMovieHumanBodyBuild;
}
