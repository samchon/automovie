import type { IAutoMovieHumanFacePeriocular as ImportedIAutoMovieHumanFacePeriocular, IAutoMovieHumanFacePeriocularSide as ImportedIAutoMovieHumanFacePeriocularSide, IAutoMovieHumanFaceCanthusExtreme as ImportedIAutoMovieHumanFaceCanthusExtreme, IAutoMovieHumanFaceCanthusVertex as ImportedIAutoMovieHumanFaceCanthusVertex } from "@automovie/human";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * One canthus of one eye on the build's final surface, found by the periocular registration's definition.
 *
 * An `extreme` definition takes, over the posed vertices of that side's upper and lower margin rows, the vertex with the smallest or largest projection on its axis, so the point is found anew on every shape; it can move to a neighbouring margin vertex when a canthal channel turns the corner. A `vertex` definition reads that registered vertex. Endocanthion and exocanthion are where the upper and lower eye edges meet at the inner and outer corners. A basis without the registration returns its gap.
 *
 * @evidence contracts/common.md#principled-implementation A registered fixed vertex or current margin-axis extremum supplies the requested canthus point.
 * @evidence contracts/common.md#clear-and-simple-design Re-evaluated extrema can change source vertex as authored channels alter the same registered margins.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registration is a source anatomical convention rather than image-derived clinical landmark acquisition; missing/empty margins yield gaps.
 * @evidence contracts/common.md#meaningful-documentation Points are head metres and the supplied axis/sense defines tie-stable first extrema.
 * @evidence contracts/performance.md#efficient-algorithms Fixed vertex lookup is constant; extreme selection scans combined upper/lower margin vertices.
 * @evidence contracts/performance.md#reuse-equivalent-work One context/registration supplies current candidates without a separate cached rest landmark.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the selected owned point escapes and temporary combined margin ids are released.
 *
 * @author Samchon
 */
export function readHumanFaceCanthus(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
  corner: "medial" | "lateral",
): IAutoMovieVector3 | IHumanFaceMeasurementGap {
  const periocular: ImportedIAutoMovieHumanFacePeriocular | undefined = context.basis.periocular;
  if (periocular === undefined)
    return {
      reason: "missing registration: the basis's periocular registration",
    };
  const { margins, canthi }: ImportedIAutoMovieHumanFacePeriocularSide = periocular[side];
  const definition: ImportedIAutoMovieHumanFaceCanthusExtreme | ImportedIAutoMovieHumanFaceCanthusVertex = canthi[corner];
  if (definition.kind === "vertex")
    return context.point(margins.surface, definition.vertex);
  const [ax, ay, az]: [number, number, number] = definition.axis;
  let best: IAutoMovieVector3 | null = null;
  let bestValue: number = 0;
  for (const vertex of [...margins.upper, ...margins.lower]) {
    const p: IAutoMovieVector3 = context.point(margins.surface, vertex);
    const value: number = p.x * ax + p.y * ay + p.z * az;
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
