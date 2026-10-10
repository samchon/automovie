import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * The medial-to-lateral extent of one eyebrow on the build's final surface,
 * in millimetres: the head-frame X extent of that side's posed brow card
 * vertices, the frontal-projection length of the card that stands for the
 * mature brow hair. A basis without the periocular registration returns its
 * gap.
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
