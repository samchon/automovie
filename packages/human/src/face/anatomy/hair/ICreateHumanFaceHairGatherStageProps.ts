import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * Current lock geometry and compiled gather direction passed to its tie stage. An ungathered layer omits anchor and gatherDirection; a gathered layer needs both actual resolved values, which the stage admits together before walking.
 *
 * @evidence contracts/common.md#principled-implementation The current root and neutral chart reference remain separate; a gathered layer supplies both its resolved anchor and current scalp tangent field.
 * @evidence contracts/common.md#clear-and-simple-design One per-lock input groups the admitted layer, deterministic root identity and resolved gather context, leaving sphere crossing and tail state to the stage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional anchor and direction denote the supported ungathered mode; the stage refuses their absence for a gathered layer instead of inventing a tie.
 * @evidence contracts/common.md#meaningful-documentation Member prose specifies posed and neutral frames, metre positions, sequence identity and the gather callback's existing undefined-direction refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The gather-stage argument type does no walking; direction evaluation and tie-crossing arithmetic are costs of createHumanFaceHairGatherStage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Compiled gatherDirection can be supplied by the graph owner, but this argument record does not define a new cache or source invalidation scheme.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The layer and direction closure stay owned by their caller; the argument object acquires no independent resource or task.
 *
 * @author Samchon
 */
export interface ICreateHumanFaceHairGatherStageProps {
  /** Existing numerical hairstyle layer. */
  layer: IAutoMovieHumanFaceHair.Layer;

  /** Neutral chart position of the root, the frame the fields are read in. */
  reference: IAutoMovieVector3;

  /** Posed root the lock grows from, in head-frame metres. */
  root: IAutoMovieVector3;

  /** Deterministic source-root sequence identity. */
  sequence: number;

  /** Resolved current scalp tie in head-frame metres, when gathered. */
  anchor?: IAutoMovieVector3;

  /**
   * Compiled current scalp direction field, when gathered. Its owning graph resolver returns the tangent toward the tie and retains its undefined-direction refusal; this callback adds no authoring point.
   *
   * @evidence contracts/common.md#principled-implementation The resolver supplies the current scalp tangent toward the attached tie, retaining undefined-direction refusal instead of authoring a strand control point.
   * @evidence contracts/common.md#clear-and-simple-design An optional compiled field keeps graph transport in its resolver and per-lock tie state in createHumanFaceHairGatherStage.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Absence represents ungathered hair only; a gathered layer without this field refuses construction rather than choosing a substitute direction.
   * @evidence contracts/common.md#meaningful-documentation The member prose identifies the current scalp frame, the owning graph resolver and preservation of its refusal semantics.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The field's callable type does not choose the scalp graph algorithm; the supplied compiled resolver owns directional-query cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A caller may share the compiled graph field for the same current scalp and tie, but this optional member establishes no cache key itself.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns any graph retained by the field closure; this argument member acquires no separate transport task.
   */
  gatherDirection?: (point: IAutoMovieVector3) => IAutoMovieVector3;
}
