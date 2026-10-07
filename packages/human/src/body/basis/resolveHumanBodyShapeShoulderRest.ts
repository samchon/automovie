import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { evaluateHumanBodyLandmarks } from "./evaluateHumanBodyLandmarks";
import { humanBodyBasisWeights } from "./humanBodyBasisWeights";
import { resolveHumanBodyShapedShoulderRest } from "./resolveHumanBodyShapedShoulderRest";

/**
 * Read an admitted basis's shoulder rest for one caller-owned shape.
 *
 * The builder and the editor share this shape-only evaluation before reading
 * an omitted TT goal. Channel weights and rest correctives shape the landmark
 * skeleton, without evaluating skin or adding the document's performance.
 * Unsupported or out-of-domain channels retain the weight owner's refusal.
 * Neither argument is mutated. The returned TT degrees describe the source
 * rig's shaped landmark directions, with conventional zero axial rotation;
 * they establish no anatomical bone frame or clinical motion capacity.
 *
 * @evidence contracts/common.md#principled-implementation Evaluates the builder's shape-only weights, their landmarks and the existing shaped-rest readout in that order, so the editor and builder use one omitted-goal definition without a second angular formula.
 * @evidence contracts/common.md#clear-and-simple-design One composition of the three existing owners reads rest without skin, asynchronous state or a cached document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads every supported shape through its weight owner, with no preset or fixed neutral substituted for its landmarks.
 * @evidence contracts/common.md#meaningful-documentation States the shape-only processing order, caller ownership, propagated refusal and source-rig interpretation of the returned degrees.
 * @evidence contracts/modeling.md#parameter-channels Consumes named basis shape channels through humanBodyBasisWeights without introducing another channel or changing paired authorship.
 * @evidence contracts/modeling.md#spatial-conventions The existing landmark owner supplies metre positions in the builder frame and the existing rest readout returns thorax-relative TT degrees; this composition adds no conversion.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It reads existing upper-arm joints and defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It evaluates landmarks without emitting skin primitives.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It constructs no surface boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It transports the numerical rest definition; the builder owns the displayed assembly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It introduces no anatomical constant or observation; basis provenance and the existing readout own their meaning.
 * @evidenceExclude contracts/anatomy.md#permitted-range It propagates the weight owner's domain refusal and adds no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It introduces no authoring input or conversion; the basis's existing shape channels retain their authority.
 */
export function resolveHumanBodyShapeShoulderRest(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
): ReturnType<typeof resolveHumanBodyShapedShoulderRest> {
  return resolveHumanBodyShapedShoulderRest(
    basis,
    evaluateHumanBodyLandmarks(
      basis,
      humanBodyBasisWeights(basis, { shape, pose: undefined }),
    ),
  );
}
