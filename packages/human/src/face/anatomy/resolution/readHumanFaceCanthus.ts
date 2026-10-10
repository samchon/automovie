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
 * @author Samchon
 */
export function readHumanFaceCanthus(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
  corner: "medial" | "lateral",
): IAutoMovieVector3 | IHumanFaceMeasurementGap {
  const periocular = context.basis.periocular;
  if (periocular === undefined)
    return {
      reason: "missing registration: the basis's periocular registration",
    };
  const { margins, canthi } = periocular[side];
  const definition = canthi[corner];
  if (definition.kind === "vertex")
    return context.point(margins.surface, definition.vertex);
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
  return (
    best ?? {
      reason: `missing registration: the ${side} margin rows are empty`,
    }
  );
}
