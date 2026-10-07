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
 *    own nearest exterior point, at the registered seating height. This
 *    pointwise construction does not prove that every intervening native
 *    edge or face remains clear; actual hull contact admits them. Its
 *    direction from the globe is kept, so the shape of the aperture is the
 *    source's and the document's.
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
 * The seat removes the margin's penetration and float. It does not thicken a
 * lid: rows above the margin keep their source height above the globe except
 * for the carried displacement.
 *
 * @evidence contracts/common.md#principled-implementation Nearest-point projection preserves each registered margin direction; exact cage displacements and the stationary preseptal boundary constrain one positive source-adjacency Dirichlet field where the publisher supplies its native annulus. This piecewise-linear interpolation makes no first-derivative or injectivity claim.
 * @evidence contracts/common.md#clear-and-simple-design One function owns margin seating for every state; tissue, wet margins and lashes read the seated cage instead of re-deriving contact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every column of both lids takes the same rule; no column, side, document or refused part is special-cased, and no optical or tissue input is changed.
 * @evidence contracts/common.md#meaningful-documentation States the three steps, what is preserved, what does not move and what the seat does not do.
 * @evidence contracts/modeling.md#shared-boundaries The posterior lid margin and the ocular exterior meet at one registered height in every admitted configuration; the join opens only inside the medial bed, by registration.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame metres in and out.
 * @evidence contracts/modeling.md#parameter-channels Shape channels move the cage first and keep their meaning; this seat depends on them only through the positions it receives.
 * @evidence contracts/anatomy.md#anatomical-source That the lid's posterior surface contacts the globe is taken from descriptive statements (Agarwal 2024, Indian J Ophthalmol 72(10):1385, lid wiper; Ferreira et al. 2020, Cancers 12(3):658, palpebral conjunctiva as the posterior layer); no read primary source measures the gap. The seating height and medial bed length are authored, as their constant states.
 * @evidence contracts/anatomy.md#permitted-range Refuses a cage whose margin rows are incomplete or whose column has no length; positions outside the exterior's definition cannot occur because every point has a nearest exterior point.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Moves vertices of the existing skin surface.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The eye assembly owner observes the seated result.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no input.
 */
export function seatHumanFaceLidCage(
  cage: IAutoMovieHumanFacePeriocularCage,
  samples: readonly number[],
  positions: readonly number[],
  surface: IHumanFaceOcularSurface,
  indices: readonly number[] = [],
): number[] {
  const role = (name: string, from: number): number => {
    const at = cage.stations.findIndex((station) => station.role === name);
    if (at < from)
      throw new Error("Lid seating needs its ordered station row: " + name);
    return at;
  };
  const margin = role("posteriorMargin", 0);
  const anchor = role("preseptal", margin + 1);
  const point = (vertex: number): IAutoMovieVector3 =>
    Vector3.create(
      positions[3 * vertex],
      positions[3 * vertex + 1],
      positions[3 * vertex + 2],
    );
  const smoothstep = (value: number): number => {
    const t = Math.min(1, Math.max(0, value));
    return t * t * (3 - 2 * t);
  };
  const aliases = new Map<number, number[]>();
  samples.forEach((sample, vertex) => {
    const group = aliases.get(sample) ?? [];
    group.push(vertex);
    aliases.set(sample, group);
  });
  const result = [...positions];
  const patch = cage.displacementPatch;
  const pins = new Map<number, IAutoMovieVector3>();
  const pin = (vertex: number, delta: IAutoMovieVector3): void => {
    const previous = pins.get(vertex);
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
  const moved = new Set<number>();
  const row = cage.stations[margin].vertices;
  const join = surface.project(point(row[cage.medialColumn]));
  for (const [columns, registered] of [
    [cage.upperColumns, cage.medialBed?.upperColumns],
    [cage.lowerColumns, cage.medialBed?.lowerColumns],
  ] as const) {
    const arc = [0];
    for (let at = 1; at < columns.length; at++)
      arc.push(
        arc[at - 1] +
          Vector3.length(
            Vector3.subtract(
              point(row[columns[at]]),
              point(row[columns[at - 1]]),
            ),
          ),
      );
    const bed =
      registered === undefined
        ? HUMAN_FACE_LID_SEAT.medialBedMetres
        : arc[Math.min(columns.length - 1, Math.max(0, registered - 1))];
    for (let at = 1; at < columns.length; at++) {
      const column = columns[at];
      if (moved.has(column)) continue;
      moved.add(column);
      const start = point(row[column]);
      const hit = surface.project(start);
      // Tessellation error does not alter the authored pointwise seat.
      // The actual native edges remain subject to physical admission.
      const seat = HUMAN_FACE_LID_SEAT.posteriorClearanceMetres;
      const height =
        seat +
        Math.max(0, join.signedDistance - seat) *
          (bed > 0 ? 1 - smoothstep(arc[at] / bed) : 0);
      const shift = Vector3.subtract(
        Vector3.add(hit.point, Vector3.scale(hit.normal, height)),
        start,
      );
      const lengths = [0];
      for (let station = margin + 1; station <= anchor; station++)
        lengths.push(
          lengths[lengths.length - 1] +
            Vector3.length(
              Vector3.subtract(
                point(cage.stations[station].vertices[column]),
                point(cage.stations[station - 1].vertices[column]),
              ),
            ),
        );
      const total = lengths[lengths.length - 1];
      if (!(total > 0) || !Number.isFinite(total))
        throw new Error("Lid seating needs a cage column of finite length.");
      for (let station = margin; station < anchor; station++) {
        const weight = 1 - smoothstep(lengths[station - margin] / total);
        const vertex = cage.stations[station].vertices[column];
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
        (vertex, at) => samples[vertex] !== patch.posteriorSamples[at],
      ) ||
      patch.preseptalBoundary.some(
        (vertex, at) => samples[vertex] !== patch.preseptalSamples[at],
      ) ||
      new Set(patch.triangles).size !== patch.triangles.length ||
      patch.triangles.some(
        (triangle) =>
          !Number.isSafeInteger(triangle) ||
          triangle < 0 ||
          3 * triangle + 2 >= indices.length,
      )
    )
      throw new Error(
        "Lid seating needs its matching registered native displacement patch.",
      );
    for (let station = margin; station <= anchor; station++)
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
    const displacement = interpolateHumanFaceLidDisplacement({
      positions,
      samples,
      pins,
      indices: patch.triangles.flatMap((triangle) =>
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
  if (!result.every((value) => Number.isFinite(Math.fround(value))))
    throw new Error("Lid seating exceeds finite Float32 source coordinates.");
  return result;
}
