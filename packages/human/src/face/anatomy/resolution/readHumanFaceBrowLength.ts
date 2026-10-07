import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * The medial-to-lateral extent of one eyebrow on the build's final surface,
 * in millimetres: the head-frame X extent of that side's posed brow card
 * vertices, the frontal-projection length of the card that stands for the
 * mature brow hair. A basis without the periocular registration returns its
 * gap.
 *
 * @evidence contracts/common.md#principled-implementation Reads the registered posed card, so the extent follows every brow channel.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the side's vertices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads only the registered brow vertices; a missing registration returns its gap.
 * @evidence contracts/common.md#meaningful-documentation States the projection, the card approximation and the gap.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres along head-frame X.
 * @evidence contracts/anatomy.md#anatomical-source Follows the brow-length definition the brow parameter type cites, on the card that stands for the hair envelope.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The periocular registration names the parts; the reader names none.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reader is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reader emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The reader builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Measurements report what it reads.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reader bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reader is not an input.
 *
 * @author Samchon
 */
export function readHumanFaceBrowLength(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
): number | IHumanFaceMeasurementGap {
  const periocular = context.basis.periocular;
  if (periocular === undefined)
    return {
      reason: "missing registration: the basis's periocular registration",
    };
  const brow = periocular[side].brow;
  const xs = brow.vertices.map(
    (vertex) => context.point(brow.surface, vertex).x,
  );
  if (xs.length === 0)
    return { reason: `missing registration: the ${side} brow has no vertices` };
  return (Math.max(...xs) - Math.min(...xs)) * 1000;
}
