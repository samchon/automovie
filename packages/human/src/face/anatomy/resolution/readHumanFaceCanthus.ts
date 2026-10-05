import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * One canthus of one eye on the build's final surface, found by the
 * periocular registration's definition.
 *
 * An `extreme` definition takes, over the posed vertices of that side's upper
 * and lower margin rows, the vertex with the smallest or largest projection on
 * its axis, so the point is found anew on every shape; it can move to a
 * neighbouring margin vertex when a canthal channel turns the corner. A
 * `vertex` definition reads that registered vertex. Endocanthion and
 * exocanthion are where the upper and lower eye edges meet at the inner and
 * outer corners. A basis without the registration returns its gap.
 *
 * @evidence contracts/common.md#principled-implementation Applies the registered definition to the posed margin rows on each build, so the canthus follows the shape rather than a frozen vertex.
 * @evidence contracts/common.md#clear-and-simple-design One pass over two rows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads only the producer's registration; a missing one returns its gap.
 * @evidence contracts/common.md#meaningful-documentation States both definition forms, the vertex hop and the gap.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the basis head frame; the axis is a head-frame direction.
 * @evidence contracts/anatomy.md#anatomical-source Follows the endocanthion and exocanthion definitions of the periocular studies the eye parameter type cites.
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
export function readHumanFaceCanthus(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
  corner: "medial" | "lateral",
): IAutoMovieVector3 | IHumanFaceMeasurementGap {
  const periocular = context.basis.periocular;
  if (periocular === undefined)
    return { reason: "missing registration: the basis's periocular registration" };
  const { margins, canthi } = periocular[side];
  const definition = canthi[corner];
  if (definition.kind === "vertex") return context.point(margins.surface, definition.vertex);
  const [ax, ay, az] = definition.axis;
  let best: IAutoMovieVector3 | null = null;
  let bestValue = 0;
  for (const vertex of [...margins.upper, ...margins.lower]) {
    const p = context.point(margins.surface, vertex);
    const value = p.x * ax + p.y * ay + p.z * az;
    if (
      best === null ||
      (definition.sense === "minimum" ? value < bestValue : value > bestValue)
    ) {
      best = p;
      bestValue = value;
    }
  }
  return best ?? { reason: `missing registration: the ${side} margin rows are empty` };
}
