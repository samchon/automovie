import type { IAutoMovieHumanFacePeriocularStation } from "../../structures/IAutoMovieHumanFacePeriocularStation";
import type { IAutoMovieHumanFacePeriocularDisplacementPatch } from "../../structures/IAutoMovieHumanFacePeriocularDisplacementPatch";
import type { IHumanFaceOcularSurfaceHit } from "./structures/IHumanFaceOcularSurfaceHit";

import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFacePeriocularCage } from "../../structures/IAutoMovieHumanFacePeriocularCage";
import { HUMAN_FACE_LID_SEAT } from "./HUMAN_FACE_LID_SEAT";
import { createHumanFaceLidBoundaryPins } from "./createHumanFaceLidBoundaryPins";
import { interpolateHumanFaceLidDisplacement } from "./interpolateHumanFaceLidDisplacement";
import type { IHumanFaceOcularSurface } from "./structures/IHumanFaceOcularSurface";

/**
 * Seat one eye's lid skin cage on its ocular exterior.
 *
 * The lid is tissue that lies on the globe, so its margin is defined by the
 * globe and not by wherever a source mesh happened to put it. This owner is
 * the one place that decides that seat, in every shape and optical state:
 *
 * 1. Each posterior margin vertex is placed on the outward normal through its
 *    own selected represented exterior foot, at the registered seating height. This
 *    pointwise construction does not prove that every intervening native
 *    edge or face remains clear; actual hull contact admits them. Its
 *    foot has the exterior reader's numerical uncertainty; the construction
 *    does not preserve every original globe-centred polar direction.
 * 2. Inside the medial bed the height rises smoothly from the seating height
 *    to the height the medial commissure already has, and the commissure
 *    itself does not move: there the margin leaves the globe for the caruncle.
 * 3. The displacement of each margin vertex is carried up its cage column
 *    with a weight that falls smoothly to zero at the preseptal row, measured
 *    by length along the column. When a native annulus is registered, those
 *    exact station displacements pin one positive-weight Dirichlet field over
 *    the complete patch. Its posterior boundary interpolates the existing
 *    margin displacements by native-edge length; its preseptal boundary is
 *    stationary. The orbital skin outside stays source-owned. A legacy source
 *    without this registration retains its sparse station-only definition.
 *
 * Seam copies that share one source sample move together. The supplied
 * buffer is not modified. `HUMAN_FACE_LID_SEAT` owns the dimensions; a
 * registered medial bed on the cage replaces the authored bed length by the
 * arc length of its registered columns.
 *
 * The seat assigns each moved margin sample its requested pointwise height. It does not thicken a
 * lid: rows above the margin keep their source height above the globe except
 * for the carried displacement.
 *
 * @evidence contracts/common.md#principled-implementation Actual analytic exterior feet and source column arc lengths define authored margin seats; exact station pins extend over the registered native annulus by Dirichlet interpolation.
 * @evidence contracts/common.md#clear-and-simple-design One seating owner separates pointwise construction from actual emitted-hull contact and preserves unchanged outer orbital skin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Requested seating floors and source aliases are preserved; pointwise clearance does not prove intervening edges/faces or physiological tissue shape.
 * @evidence contracts/common.md#meaningful-documentation The prose states metre positions, unchanged caller buffer, registered versus legacy patch meaning and separate actual-hull admission.
 * @evidence contracts/performance.md#efficient-algorithms Native alias maps, station/column scans, actual exterior queries and three sparse displacement solves dominate; numeric projection/root work remains included.
 * @evidence contracts/performance.md#reuse-equivalent-work One medial join and source alias map serve both lid paths; the patch shares canonical boundary-pin and graph interpolation owners.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only an owned position array escapes; pin/arc/graph temporaries expire, with no caller mutation or retained tasks on refusal.
 */
export function seatHumanFaceLidCage(
  cage: IAutoMovieHumanFacePeriocularCage,
  samples: readonly number[],
  positions: readonly number[],
  surface: IHumanFaceOcularSurface,
  indices: readonly number[] = [],
): number[] {
  const role: (name: string, from: number) => number = (name: string, from: number): number => {
    const at: number = cage.stations.findIndex((station: IAutoMovieHumanFacePeriocularStation): boolean  => station.role === name);
    if (at < from)
      throw new Error("Lid seating needs its ordered station row: " + name);
    return at;
  };
  const margin: number = role("posteriorMargin", 0);
  const anchor: number = role("preseptal", margin + 1);
  const point: (vertex: number) => IAutoMovieVector3 = (vertex: number): IAutoMovieVector3 =>
    Vector3.create(
      positions[3 * vertex],
      positions[3 * vertex + 1],
      positions[3 * vertex + 2],
    );
  const smoothstep: (value: number) => number = (value: number): number => {
    const t: number = Math.min(1, Math.max(0, value));
    return t * t * (3 - 2 * t);
  };
  const aliases: Map<number, number[]> = new Map<number, number[]>();
  samples.forEach((sample: number, vertex: number): void  => {
    const group: number[] = aliases.get(sample) ?? [];
    group.push(vertex);
    aliases.set(sample, group);
  });
  const result: number[] = [...positions];
  const patch: IAutoMovieHumanFacePeriocularDisplacementPatch | undefined = cage.displacementPatch;
  const pins: Map<number, IAutoMovieVector3> = new Map<number, IAutoMovieVector3>();
  const pin: (vertex: number, delta: IAutoMovieVector3) => void = (vertex: number, delta: IAutoMovieVector3): void => {
    const previous: IAutoMovieVector3 | undefined = pins.get(vertex);
    if (
      previous !== undefined &&
      (previous.x !== delta.x ||
        previous.y !== delta.y ||
        previous.z !== delta.z)
    )
      throw new Error(
        "Lid seating has contradictory registered station displacements.",
      );
    pins.set(vertex, delta);
  };
  const moved: Set<number> = new Set<number>();
  const row: number[] = cage.stations[margin].vertices;
  const join: IHumanFaceOcularSurfaceHit = surface.project(point(row[cage.medialColumn]));
  for (const [columns, registered] of [
    [cage.upperColumns, cage.medialBed?.upperColumns],
    [cage.lowerColumns, cage.medialBed?.lowerColumns],
  ] as const) {
    const arc: number[] = [0];
    for (let at: number = 1; at < columns.length; at++)
      arc.push(
        arc[at - 1] +
          Vector3.length(
            Vector3.subtract(
              point(row[columns[at]]),
              point(row[columns[at - 1]]),
            ),
          ),
      );
    const bed: number =
      registered === undefined
        ? HUMAN_FACE_LID_SEAT.medialBedMetres
        : arc[Math.min(columns.length - 1, Math.max(0, registered - 1))];
    for (let at: number = 1; at < columns.length; at++) {
      const column: number = columns[at];
      if (moved.has(column)) continue;
      moved.add(column);
      const start: IAutoMovieVector3 = point(row[column]);
      const hit: IHumanFaceOcularSurfaceHit = surface.project(start);
      // Tessellation error does not alter the authored pointwise seat.
      // The actual native edges remain subject to physical admission.
      const seat: number = HUMAN_FACE_LID_SEAT.posteriorClearanceMetres;
      const height: number =
        seat +
        Math.max(0, join.signedDistance - seat) *
          (bed > 0 ? 1 - smoothstep(arc[at] / bed) : 0);
      const shift: IAutoMovieVector3 = Vector3.subtract(
        Vector3.add(hit.point, Vector3.scale(hit.normal, height)),
        start,
      );
      const lengths: number[] = [0];
      for (let station: number = margin + 1; station <= anchor; station++)
        lengths.push(
          lengths[lengths.length - 1] +
            Vector3.length(
              Vector3.subtract(
                point(cage.stations[station].vertices[column]),
                point(cage.stations[station - 1].vertices[column]),
              ),
            ),
        );
      const total: number = lengths[lengths.length - 1];
      if (!(total > 0) || !Number.isFinite(total))
        throw new Error("Lid seating needs a cage column of finite length.");
      for (let station: number = margin; station < anchor; station++) {
        const weight: number = 1 - smoothstep(lengths[station - margin] / total);
        const vertex: number = cage.stations[station].vertices[column];
        if (patch !== undefined) pin(vertex, Vector3.scale(shift, weight));
        for (const alias of aliases.get(samples[vertex]) ?? [vertex]) {
          result[3 * alias] += weight * shift.x;
          result[3 * alias + 1] += weight * shift.y;
          result[3 * alias + 2] += weight * shift.z;
        }
      }
    }
  }
  if (patch !== undefined) {
    if (
      patch.generation !== cage.generation ||
      patch.surface !== cage.surface ||
      patch.posteriorBoundary.length !== patch.posteriorSamples.length ||
      patch.preseptalBoundary.length !== patch.preseptalSamples.length ||
      patch.posteriorBoundary.some(
        (vertex: number, at: number): boolean  => samples[vertex] !== patch.posteriorSamples[at],
      ) ||
      patch.preseptalBoundary.some(
        (vertex: number, at: number): boolean  => samples[vertex] !== patch.preseptalSamples[at],
      ) ||
      new Set(patch.triangles).size !== patch.triangles.length ||
      patch.triangles.some(
        (triangle: number): boolean  =>
          !Number.isSafeInteger(triangle) ||
          triangle < 0 ||
          3 * triangle + 2 >= indices.length,
      )
    )
      throw new Error(
        "Lid seating needs its matching registered native displacement patch.",
      );
    for (let station: number = margin; station <= anchor; station++)
      for (const vertex of cage.stations[station].vertices)
        if (!pins.has(vertex)) pin(vertex, Vector3.create(0, 0, 0));
    for (const vertex of patch.preseptalBoundary)
      pin(vertex, Vector3.create(0, 0, 0));
    for (const [vertex, delta] of createHumanFaceLidBoundaryPins({
      positions,
      samples,
      boundaryVertices: patch.posteriorBoundary,
      pins,
    }))
      pin(vertex, delta);
    const displacement: Map<number, IAutoMovieVector3> = interpolateHumanFaceLidDisplacement({
      positions,
      samples,
      pins,
      indices: patch.triangles.flatMap((triangle: number): number[]  =>
        indices.slice(3 * triangle, 3 * triangle + 3),
      ),
      boundaryVertices: [
        ...patch.posteriorBoundary,
        ...patch.preseptalBoundary,
      ],
    });
    for (const [vertex, delta] of displacement) {
      result[3 * vertex] = positions[3 * vertex] + delta.x;
      result[3 * vertex + 1] = positions[3 * vertex + 1] + delta.y;
      result[3 * vertex + 2] = positions[3 * vertex + 2] + delta.z;
    }
  }
  if (!result.every((value: number): boolean  => Number.isFinite(Math.fround(value))))
    throw new Error("Lid seating exceeds finite Float32 source coordinates.");
  return result;
}
