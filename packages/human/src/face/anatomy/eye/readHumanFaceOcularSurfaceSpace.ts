import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanConstructionClearanceReading } from "../../../common/structures/IAutoMovieHumanConstructionClearanceReading";
import { measureHumanFaceClearance } from "../../basis/measureHumanFaceClearance";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import { readHumanFaceOpticalExterior } from "./readHumanFaceOpticalExterior";
import type { IHumanFaceOpticalAssembly } from "./structures/IHumanFaceOpticalAssembly";

/**
 * Measure constructed medial and wet sheets against the same optical hull.
 *
 * Construction retains every requested surface before this reading runs. The
 * condition is unchanged: a sheet vertex deeper than the source tolerance
 * inside the hull, or a non-coplanar triangle crossing, refuses. Every sheet
 * on both sides is measured and reported. A refusal is a physical
 * qualification result, never a request to remove a surface or change its
 * dimensions or tolerance.
 *
 * @evidence contracts/common.md#principled-implementation Signed Float32 distances and the triangle crossing census read every constructed ocular part against the hull of its own eye.
 * @evidence contracts/common.md#clear-and-simple-design The same optical hull qualifies completed medial and wet geometry separately from generation, through the shared instrument.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No surface, radius, tolerance or caller value changes to pass admission, and no sheet is skipped.
 * @evidence contracts/common.md#meaningful-documentation Explains construction retention, the unchanged condition and the complete report.
 * @evidence contracts/modeling.md#shared-boundaries The visible ocular sheets meet the optical exterior; this reads that boundary on the surface the contact stage uses.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame metres and the source metre tolerance.
 * @evidence contracts/anatomy.md#permitted-range Refuses geometric intersection without claiming a physiological interval.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads generator-owned part identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical admission; the eye assembly owner owes the rendered observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Supplies no biological value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no authoring input.
 */
export function readHumanFaceOcularSurfaceSpace(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  parts: IAutoMovieModel["parts"],
  optics: readonly IHumanFaceOpticalAssembly[] | undefined,
  state: "rest" | "performed",
): IAutoMovieHumanConstructionClearanceReading[] {
  const tolerance = basis.contact?.toleranceMetres;
  if (tolerance === undefined || !Number.isFinite(tolerance) || tolerance < 0)
    throw new Error(
      "Ocular visible surface space needs its source contact tolerance.",
    );
  const readings: IAutoMovieHumanConstructionClearanceReading[] = [];
  for (const side of ["left", "right"] as const) {
    const selected = parts.filter(
      (part) =>
        part.id.startsWith("ocular:" + side + ":") &&
        part.geometry.type === "mesh",
    );
    if (selected.length === 0) continue;
    const exterior = readHumanFaceOpticalExterior(
      basis,
      positions,
      optics,
      side,
      state,
    );
    if (exterior === undefined)
      throw new Error(
        "Ocular visible surface lacks its actual optical exterior.",
      );
    for (const part of selected) {
      if (part.geometry.type !== "mesh") continue;
      readings.push(
        measureHumanFaceClearance({
          owner: "ocular-" + state,
          state,
          subject: part.id,
          against: "optics:" + side,
          judged: true,
          mesh: part.geometry.mesh,
          exterior,
          boundary: "closed",
          toleranceMetres: tolerance,
        }),
      );
    }
  }
  return readings;
}
