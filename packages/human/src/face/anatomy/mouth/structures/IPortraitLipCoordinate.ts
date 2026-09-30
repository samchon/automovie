/**
 * Coordinates within one lip band, independent of a particular mesh's IDs.
 *
 * @evidence contracts/common.md#principled-implementation Three members are the whole position inside one curved lip band: which band, how far along the oral span and how far from the cutaneous border to the aperture. That is a complete, mesh-independent coordinate for a band that is a ruled strip between two boundary curves.
 * @evidence contracts/common.md#clear-and-simple-design Three members and no option; the sampler that produces it owns every decision about how it is measured.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type carries data only: no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation Each member states its range and its zero and one, and the type states that it is independent of mesh identifiers.
 * @evidence contracts/modeling.md#spatial-conventions All three members are unitless. `lateral` runs -1 at the anatomical right inner corner to +1 at the left; `across` runs 0 at the cutaneous border to 1 at the oral aperture; `side` selects the upper or lower band.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type is a coordinate, not a part or a group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The coordinate is derived from a mesh point by `createPortraitLipBandSampler` and is not a channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface; the sampler that produces it takes both boundaries from one socket.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The coordinate carries no anatomical value, only a normalized position.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits and bounds nothing; the sampler and its consumers reject coordinates outside the unit ranges.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Callers do not author this coordinate; it is derived from a mesh point, and no input of the face reaches geometry through it.
 * @author Samchon
 */
export interface IPortraitLipCoordinate {
  /** Upper or lower vermilion band; independent of anatomical left/right. */
  side: "upper" | "lower";

  /** -1 at the anatomical right inner corner, +1 at the left. */
  lateral: number;

  /** Zero at the cutaneous border, one at the oral aperture. */
  across: number;
}
