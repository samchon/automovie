import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanConstructionClearanceReading } from "../../../common/structures/IAutoMovieHumanConstructionClearanceReading";
import { measureHumanFaceClearance } from "../../basis/measureHumanFaceClearance";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import { readHumanFaceOpticalExterior } from "../eye/readHumanFaceOpticalExterior";
import type { IHumanFaceOpticalAssembly } from "../eye/structures/IHumanFaceOpticalAssembly";
import type { IHumanFaceLashInsertionBall } from "./structures/IHumanFaceLashInsertionBall";
import type { IHumanFaceLashRow } from "./structures/IHumanFaceLashRow";

/**
 * Measure every generated lash row against the optical exteriors and the skin.
 *
 * The conditions are the ones the lash contact admission applied shaft by
 * shaft. Against each optical exterior every shaft vertex and every shaft
 * triangle is read. Against the final skin only the free shaft is read: a
 * vertex or transverse crossing point inside the closed ball of the observed
 * root radius around its own root is insertion and is excluded. Every original
 * connecting triangle is tested, including the first band; an insertion
 * witness cannot exempt a free witness elsewhere on that triangle. A free
 * vertex behind the skin by more than the source tolerance, a free vertex
 * whose nearest skin feature is the open rim,
 * or a non-coplanar crossing refuses. Each row is reported whole, with its
 * counts and extrema, where the admission used to stop at the first shaft.
 *
 * A shaft is 13 rings of 9 shading vertices (117) and 12 bands of 48 indices
 * (576), the layout `buildHumanFaceLashRows` emits.
 *
 * @evidence contracts/common.md#principled-implementation Float32 signed geometry and triangle crossings judge free tissue penetration over the complete row, with the insertion excluded by the measured root radius of each shaft.
 * @evidence contracts/common.md#clear-and-simple-design One reading owner enumerates row relations and delegates to the shared clearance instrument.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No profile, root, count or tolerance changes, and no row or shaft is exempted.
 * @evidence contracts/common.md#meaningful-documentation States the free-shaft rule, the unchanged conditions, the shaft layout it relies on and the complete report.
 * @evidence contracts/modeling.md#shared-boundaries Root insertion uses the same registered skin point; the remaining free shaft must stay outside the final skin and optical exterior.
 * @evidence contracts/modeling.md#spatial-conventions All geometry and tolerances are canonical head-frame metres.
 * @evidence contracts/anatomy.md#permitted-range Free shafts must avoid tissue penetration; this certifies no clinical follicle implantation or population interval.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads the row identities the generator owns.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical admission; the lash assembly owner owes the rendered observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Geometric admission introduces no inferred tissue dimension.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Admits the emitted result without adding a shaping input.
 */
export function readHumanFaceLashClearance(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  rows: readonly IHumanFaceLashRow[],
  optics?: readonly IHumanFaceOpticalAssembly[],
): IAutoMovieHumanConstructionClearanceReading[] {
  const tolerance = basis.contact?.toleranceMetres;
  if (tolerance === undefined || !Number.isFinite(tolerance) || tolerance < 0)
    throw new Error("Attached lashes need their source contact tolerance.");
  const owner = "lash-clearance";
  const exteriors: [string, IAutoMovieMesh][] = [];
  for (const side of ["left", "right"] as const) {
    if (!rows.some((row) => row.side === side) && optics === undefined)
      continue;
    const exterior = readHumanFaceOpticalExterior(
      basis,
      positions,
      optics,
      side,
      "performed",
    );
    if (exterior === undefined)
      throw new Error(
        "Attached lashes need the registered source optical proxy collider: " +
          side,
      );
    exteriors.push(["optics:" + side, exterior]);
  }
  const readings: IAutoMovieHumanConstructionClearanceReading[] = [];
  for (const row of rows) {
    if (row.mesh === null) continue;
    const subject = "lashes:" + row.side + ":" + row.row;
    const id = basis.periocular![row.side].margins.surface;
    const source = basis.surfaces.find((surface) => surface.id === id)!;
    const skin: IAutoMovieMesh = {
      positions: [...positions.get(id)!],
      indices: source.indices,
      normals: null,
      uvs: null,
      skin: null,
    };
    const points = row.mesh.positions.map(Math.fround);
    const freeVertices: number[] = [];
    const insertions: IHumanFaceLashInsertionBall[] = [];
    for (let shaft = 0; shaft < row.centrelines.length; shaft++) {
      const centre = (sample: number): number[] => {
        const sum = [0, 0, 0];
        for (let radial = 0; radial < 8; radial++)
          for (let axis = 0; axis < 3; axis++)
            sum[axis] +=
              points[3 * (shaft * 117 + sample * 9 + radial) + axis] / 8;
        return sum;
      };
      const distance = (vertex: number, to: readonly number[]): number =>
        Math.hypot(
          points[3 * vertex] - to[0],
          points[3 * vertex + 1] - to[1],
          points[3 * vertex + 2] - to[2],
        );
      const root = centre(0);
      const radius = Math.max(
        ...Array.from({ length: 8 }, (_, radial) =>
          distance(shaft * 117 + radial, root),
        ),
      );
      insertions.push({ centre: root, radius });
      for (let vertex = 0; vertex < 117; vertex++)
        if (distance(shaft * 117 + vertex, root) > radius)
          freeVertices.push(shaft * 117 + vertex);
    }
    for (const [against, exterior] of exteriors)
      readings.push(
        measureHumanFaceClearance({
          owner,
          state: "performed",
          subject,
          against,
          judged: true,
          mesh: row.mesh,
          exterior,
          boundary: "closed",
          toleranceMetres: tolerance,
          vertices: Array.from(
            { length: row.mesh.positions.length / 3 },
            (_, vertex) => vertex,
          ),
        }),
      );
    readings.push(
      measureHumanFaceClearance({
        owner,
        state: "performed",
        subject,
        against: id + ":free-skin",
        judged: true,
        mesh: row.mesh,
        exterior: skin,
        boundary: "open",
        toleranceMetres: tolerance,
        vertices: freeVertices,
        acceptTransversePoint: (point, triangle) => {
          const insertion = insertions[Math.floor(triangle / (576 / 3))];
          return (
            Math.hypot(
              point[0] - insertion.centre[0],
              point[1] - insertion.centre[1],
              point[2] - insertion.centre[2],
            ) > insertion.radius
          );
        },
      }),
    );
  }
  return readings;
}
