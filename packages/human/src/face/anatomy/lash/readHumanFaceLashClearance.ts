import type {
  IAutoMovieHumanConstructionCrossingWitness as ImportedIAutoMovieHumanConstructionCrossingWitness,
  IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface,
} from "@automovie/human";
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
 * The conditions are the ones the lash contact admission applied shaft by shaft. Against each optical exterior every shaft vertex and every shaft triangle is read. Against the final skin only the free shaft is read: a vertex or transverse crossing point inside the closed ball of the observed root radius around its own root is insertion and is excluded. Every original connecting triangle is tested, including the first band; an insertion witness cannot exempt a free witness elsewhere on that triangle. A free vertex behind the skin by more than the source tolerance, a free vertex whose nearest skin feature is the open rim, or a non-coplanar crossing refuses. Each row is reported whole, with its counts and extrema, where the admission used to stop at the first shaft. The first reported free-skin pair retains the exact strict point, root ring and distance that its unchanged insertion predicate read. Triangle-pair keys associate that observation with the shared instrument's original witness; recording it never selects another intersection or changes the verdict.
 *
 * A shaft is 13 rings of 9 shading vertices (117) and 12 bands of 48 indices (576), the layout `buildHumanFaceLashRows` emits.
 *
 * @evidence contracts/common.md#principled-implementation Every actual shaft vertex/triangle is measured against optical exteriors and every free witness against current skin.
 * @evidence contracts/common.md#clear-and-simple-design The shared clearance instrument reports full row counts/extrema instead of stopping at the first shaft.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only points inside the measured root-ring ball are insertion; whole triangles remain tested, and CPU Float32 publication geometry is not GPU appearance proof.
 * @evidence contracts/common.md#meaningful-documentation Source tolerance is metres, open-rim uncertainty can refuse and fixed 117-vertex/576-index layout follows the actual shaft producer.
 * @evidence contracts/performance.md#efficient-algorithms Ring/free-vertex preparation is linear in shafts; signed queries and triangle-pair census dominate, with complete distance sorting in the shared instrument.
 * @evidence contracts/performance.md#reuse-equivalent-work Optical exteriors are prepared once per call; the shared instrument reuses immutable reference mesh queries by identity and boundary.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Readings and copied witnesses belong to callers; temporary rounded points, insertion balls and classified pair maps are local, while shared reference cache uses weak keys.
 */
export function readHumanFaceLashClearance(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  rows: readonly IHumanFaceLashRow[],
  optics?: readonly IHumanFaceOpticalAssembly[],
): IAutoMovieHumanConstructionClearanceReading[] {
  const tolerance: number | undefined = basis.contact?.toleranceMetres;
  if (tolerance === undefined || !Number.isFinite(tolerance) || tolerance < 0)
    throw new Error("Attached lashes need their source contact tolerance.");
  const owner: string = "lash-clearance";
  const exteriors: [string, IAutoMovieMesh][] = [];
  for (const side of ["left", "right"] as const) {
    if (
      !rows.some((row: IHumanFaceLashRow): boolean => row.side === side) &&
      optics === undefined
    )
      continue;
    const exterior: IAutoMovieMesh | undefined = readHumanFaceOpticalExterior(
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
    const subject: string = "lashes:" + row.side + ":" + row.row;
    const id: string = basis.periocular![row.side].margins.surface;
    const source: ImportedIAutoMovieHumanFaceBasisSurface = basis.surfaces.find(
      (surface: ImportedIAutoMovieHumanFaceBasisSurface): boolean =>
        surface.id === id,
    )!;
    const skin: IAutoMovieMesh = {
      positions: [...positions.get(id)!],
      indices: source.indices,
      normals: null,
      uvs: null,
      skin: null,
    };
    const points: number[] = row.mesh.positions.map(Math.fround);
    const freeVertices: number[] = [];
    const insertions: IHumanFaceLashInsertionBall[] = [];
    for (let shaft: number = 0; shaft < row.centrelines.length; shaft++) {
      const centre: (sample: number) => number[] = (
        sample: number,
      ): number[] => {
        const sum: number[] = [0, 0, 0];
        for (let radial: number = 0; radial < 8; radial++)
          for (let axis: number = 0; axis < 3; axis++)
            sum[axis] +=
              points[3 * (shaft * 117 + sample * 9 + radial) + axis] / 8;
        return sum;
      };
      const distance: (vertex: number, to: readonly number[]) => number = (
        vertex: number,
        to: readonly number[],
      ): number =>
        Math.hypot(
          points[3 * vertex] - to[0],
          points[3 * vertex + 1] - to[1],
          points[3 * vertex + 2] - to[2],
        );
      const root: number[] = centre(0);
      const radius: number = Math.max(
        ...Array.from({ length: 8 }, (_: unknown, radial: number): number =>
          distance(shaft * 117 + radial, root),
        ),
      );
      insertions.push({ centre: root, radius });
      for (let vertex: number = 0; vertex < 117; vertex++)
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
            (_: unknown, vertex: number): number => vertex,
          ),
        }),
      );
    const classified: Map<
      string,
      IAutoMovieHumanConstructionRootInsertionWitness
    > = new Map<string, IAutoMovieHumanConstructionRootInsertionWitness>();
    const freeSkin: IAutoMovieHumanConstructionClearanceReading =
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
        acceptTransversePoint: (
          point: readonly number[],
          triangle: number,
          other: number,
        ): boolean => {
          const shaft: number = Math.floor(triangle / (576 / 3));
          const insertion: IHumanFaceLashInsertionBall = insertions[shaft];
          const distance: number = Math.hypot(
            point[0] - insertion.centre[0],
            point[1] - insertion.centre[1],
            point[2] - insertion.centre[2],
          );
          const free: boolean = distance > insertion.radius;
          const key: string = triangle + ":" + other;
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
    const witness:
      | ImportedIAutoMovieHumanConstructionCrossingWitness
      | null
      | undefined = freeSkin.crossingWitness;
    if (witness !== undefined && witness !== null)
      witness.rootInsertion = classified.get(
        witness.subjectTriangle + ":" + witness.referenceTriangle,
      )!;
    readings.push(freeSkin);
  }
  return readings;
}
