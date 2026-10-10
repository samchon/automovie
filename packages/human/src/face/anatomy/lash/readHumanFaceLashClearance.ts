import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanConstructionClearanceReading } from "../../../common/structures/IAutoMovieHumanConstructionClearanceReading";
import type { IAutoMovieHumanConstructionRootInsertionWitness } from "../../../common/structures/IAutoMovieHumanConstructionRootInsertionWitness";
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
 * The first reported free-skin pair retains the exact strict point, root ring
 * and distance that its unchanged insertion predicate read. Triangle-pair keys
 * associate that observation with the shared instrument's original witness;
 * recording it never selects another intersection or changes the verdict.
 *
 * A shaft is 13 rings of 9 shading vertices (117) and 12 bands of 48 indices
 * (576), the layout `buildHumanFaceLashRows` emits.
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
    const classified = new Map<
      string,
      IAutoMovieHumanConstructionRootInsertionWitness
    >();
    const freeSkin = measureHumanFaceClearance({
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
      acceptTransversePoint: (point, triangle, other) => {
        const shaft = Math.floor(triangle / (576 / 3));
        const insertion = insertions[shaft];
        const distance = Math.hypot(
          point[0] - insertion.centre[0],
          point[1] - insertion.centre[1],
          point[2] - insertion.centre[2],
        );
        const free = distance > insertion.radius;
        const key = triangle + ":" + other;
        if (free)
          classified.set(key, {
            point: [...point],
            shaft,
            centre: [...insertion.centre],
            radiusMetres: insertion.radius,
            distanceMetres: distance,
          });
        return free;
      },
    });
    const witness = freeSkin.crossingWitness;
    if (witness !== undefined && witness !== null)
      witness.rootInsertion = classified.get(
        witness.subjectTriangle + ":" + witness.referenceTriangle,
      )!;
    readings.push(freeSkin);
  }
  return readings;
}
