import type { IAutoMovieSpatialQueryEntry } from "@automovie/engine";

import type { IHumanFaceLashSegment } from "./IHumanFaceLashSegment";

/**
 * Actual capsule bounds paired with the shaft segment they conservatively enclose.
 * The original segment remains the narrow-phase input; the box and ordinal
 * serve finite candidate traversal and reproduce the legacy pair order only.
 *
 * @evidence contracts/common.md#principled-implementation Carries the endpoint-extrema box of the observed capsule without substituting box overlap for segment separation.
 * @evidence contracts/common.md#clear-and-simple-design Connects one resident bound directly to its original segment and shared spatial entry contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Radius and source coordinates remain those observed by the contact owner.
 * @evidence contracts/common.md#meaningful-documentation Separates candidate indexing from capsule admission.
 * @evidence contracts/modeling.md#spatial-conventions Box, centre and segment use the same head-frame metres.
 * @evidence contracts/modeling.md#shared-boundaries Indexes the existing conservative inter-shaft bound without changing its contact rule.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Refers to existing shafts and ordinals.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical candidate transport; the lash assembly owns rendered observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no biological measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Introduces no physiological bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Introduces no shaping input.
 * @author Samchon
 */
export interface IHumanFaceLashCapsuleEntry extends IAutoMovieSpatialQueryEntry {
  /** Original observed capsule used for the segment-distance admission. */
  segment: IHumanFaceLashSegment;
}
