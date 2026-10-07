import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { HUMAN_FACE_LID_SEAT } from "@automovie/human/face/anatomy/eye/HUMAN_FACE_LID_SEAT";
import { createHumanFaceLidBoundaryPins } from "@automovie/human/face/anatomy/eye/createHumanFaceLidBoundaryPins";
import { interpolateHumanFaceLidDisplacement } from "@automovie/human/face/anatomy/eye/interpolateHumanFaceLidDisplacement";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HUMAN_SOURCE_PERIOCULAR_CAGE_SELECTION } from "./HUMAN_SOURCE_PERIOCULAR_CAGE_SELECTION.ts";
import { compileHumanSourceLidDisplacementPatch } from "./compileHumanSourceLidDisplacementPatch.ts";
import { readHumanSourceMedialBedCount } from "./readHumanSourceMedialBedCount.ts";
import type { IHumanSourceAuthoredSkin } from "./structures/IHumanSourceAuthoredSkin.ts";
import type { IHumanSourceCompactedTopology } from "./structures/IHumanSourceCompactedTopology.ts";
import type { IHumanSourceLidSeatReceipt } from "./structures/IHumanSourceLidSeatReceipt.ts";
import type { IHumanSourceLidSeatSide } from "./structures/IHumanSourceLidSeatSide.ts";
import type { IHumanSourceMirror } from "./structures/IHumanSourceMirror.ts";

/** Cage rows inner to outer; the last two stay where the source put them. */
const ROLES = [
  "posteriorMargin",
  "anteriorMargin",
  "pretarsal",
  "crease",
  "hood",
  "preseptal",
  "outerAttachment",
];
/** Row whose distance from the margin ends the follow weight. */
const HELD_ROW = 5;

/**
 * Re-author the neutral lid cage so its posterior margin sits on the source globe.
 *
 * The sampled lid margin crosses the source eye: along one row it runs from
 * under the surface to well above it. This stage places each posterior margin
 * vertex at the nearest globe point plus an authored height along the outward
 * normal there, and lets the rows of the same column up to the hood follow
 * with a weight that falls to zero at the preseptal row. These exact station
 * constraints drive one continuous native-annulus displacement field through
 * the same positive-weight Dirichlet owner as runtime seating. The preseptal
 * boundary and the medial station column do not move; outside skin is held.
 *
 * The height is `HUMAN_FACE_LID_SEAT.posteriorClearanceMetres`, the same
 * record the runtime lid frame seats on, so source and runtime share one
 * definition. Towards the medial join the height blends from the join's own
 * height to that clearance up to the first actual margin column reaching
 * `medialBedMetres`, using the shared bed-count owner and smoothstep,
 * because the margin leaves the globe there to make room for the
 * caruncle. The follow weight of row `r` in column `k` is one minus the
 * smoothstep of its polyline distance from the margin over the distance of
 * the held preseptal row, both measured along that column on the unedited
 * positions.
 *
 * The globe query combines the published eye and registered collider closure,
 * in the head frame the root shares. Its oriented-open query supplies local
 * feature side, nearest point and normal, refusing unsupported features;
 * this configuration proves no global closed-volume interior. Displacement is authored
 * onto the one root, so both views and every later derivative use the same
 * base; endpoint differences keep their values against that new rest. This is
 * source authoring: it measures no tear film, validates no closed eye and
 * accepts no rendered lid.
 */
export function regenerateHumanSourceLidSeat(
  face: IAutoMovieHumanFaceBasis,
  root: IHumanSourceCompactedTopology,
  skin: IHumanSourceAuthoredSkin,
  mirror: IHumanSourceMirror,
): IHumanSourceLidSeatReceipt {
  const selection = HUMAN_SOURCE_PERIOCULAR_CAGE_SELECTION;
  if (
    selection.stations.length !== ROLES.length ||
    selection.stations.some((station, row) => station.role !== ROLES[row])
  )
    throw new Error(
      "Lid seat authoring needs the registered cage rows in their inner-to-outer order.",
    );
  const globe = face.surfaces.find(
    (surface) => surface.id === "Human.low-poly",
  );
  const collider = face.contact?.colliders.find(
    (entry) => entry.surface === "Human.low-poly",
  );
  if (globe === undefined || collider === undefined)
    throw new Error(
      "Lid seat authoring needs the source globe and its collider closure.",
    );
  const query = createAutoMovieSignedMeshQuery(
    {
      positions: globe.positions,
      indices: [...globe.indices, ...collider.closure],
      normals: null,
      uvs: null,
      skin: null,
    },
    { boundary: "open" },
  );
  const clearance = HUMAN_FACE_LID_SEAT.posteriorClearanceMetres,
    bed = HUMAN_FACE_LID_SEAT.medialBedMetres;
  if (!(clearance > 0) || !(bed > 0))
    throw new Error(
      "Lid seat authoring needs a positive clearance and medial bed length.",
    );
  const smoothstep = (value: number): number => {
    const t = Math.min(1, Math.max(0, value));
    return t * t * (3 - 2 * t);
  };
  const before = Float64Array.from(skin.positions);
  const samples = Array.from(
    { length: before.length / 3 },
    (_, vertex) => vertex,
  );
  const point = (vertex: number): number[] => [
    before[3 * vertex],
    before[3 * vertex + 1],
    before[3 * vertex + 2],
  ];
  const distance = (a: readonly number[], b: readonly number[]): number =>
    Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const height = (position: readonly number[]): ReturnType<typeof query> => {
    const hit = query(position);
    if (hit.boundary)
      throw new Error(
        "A lid margin vertex reads an open globe rim, where no side is defined.",
      );
    return hit;
  };
  const sides: IHumanSourceLidSeatSide[] = [];
  for (const side of ["left", "right"] as const) {
    const rows = selection.stations.map((station) =>
      station.nativeVertices.map((native) => {
        const source =
          root.nativeToSource[side === "left" ? native : mirror.twin[native]];
        if (!Number.isSafeInteger(source) || source < 0)
          throw new Error(
            `Lid seat authoring: ${side}/${station.role} names a retired native vertex.`,
          );
        return source;
      }),
    );
    const margin = rows[0];
    const joinHeight = height(
      point(margin[selection.medialColumn]),
    ).signedDistance;
    const target = new Map<number, number>();
    const bedCounts: number[] = [],
      bedArcs: number[] = [];
    for (const columns of [selection.upperColumns, selection.lowerColumns]) {
      const count = readHumanSourceMedialBedCount(before, margin, columns);
      let actualBed = 0;
      for (let at = 1; at < count; at++)
        actualBed += distance(
          point(margin[columns[at - 1]]),
          point(margin[columns[at]]),
        );
      bedCounts.push(count);
      bedArcs.push(actualBed);
      let length = 0;
      columns.forEach((column, at) => {
        if (at > 0)
          length += distance(
            point(margin[columns[at - 1]]),
            point(margin[column]),
          );
        if (column === selection.medialColumn) return;
        target.set(
          column,
          column === selection.lateralColumn
            ? clearance
            : clearance +
                (joinHeight - clearance) * (1 - smoothstep(length / actualBed)),
        );
      });
    }
    const moved = new Map<number, number[]>();
    for (const [column, wanted] of target) {
      const hit = height(point(margin[column]));
      const origin = point(margin[column]);
      const delta = [0, 1, 2].map(
        (axis) => hit.point[axis] + wanted * hit.normal[axis] - origin[axis],
      );
      const lengths = [0];
      for (let row = 1; row <= HELD_ROW; row++)
        lengths.push(
          lengths[row - 1] +
            distance(point(rows[row - 1][column]), point(rows[row][column])),
        );
      if (!(lengths[HELD_ROW] > 0))
        throw new Error(
          `Lid seat authoring: ${side} column ${column} has no extent up to its held row.`,
        );
      for (let row = 0; row < HELD_ROW; row++) {
        const weight = 1 - smoothstep(lengths[row] / lengths[HELD_ROW]);
        const vertex = rows[row][column];
        if (moved.has(vertex))
          throw new Error(
            `Lid seat authoring: ${side} source vertex ${vertex} belongs to two cage cells.`,
          );
        moved.set(
          vertex,
          delta.map((value) => weight * value),
        );
      }
    }
    // This identity belongs to the unpublished preparation frame. The final
    // generation re-registers the annulus on its head host with its real hash.
    const patch = compileHumanSourceLidDisplacementPatch({
      generation: "unpublished-source-lid-seat-3",
      surface: "canonical-root-skin",
      indices: Array.from(root.topology.triangles),
      samples,
      posteriorStations: rows[0],
      preseptalStations: rows[HELD_ROW],
      interiorStations: rows.slice(1, HELD_ROW).flat(),
    });
    const pins = new Map<number, IAutoMovieVector3>();
    for (let row = 0; row <= HELD_ROW; row++)
      for (const vertex of rows[row]) {
        const delta = moved.get(vertex) ?? [0, 0, 0];
        pins.set(vertex, { x: delta[0], y: delta[1], z: delta[2] });
      }
    const positions = Array.from(before);
    for (const vertex of patch.preseptalBoundary) {
      const previous = pins.get(vertex);
      if (
        previous !== undefined &&
        (previous.x !== 0 || previous.y !== 0 || previous.z !== 0)
      )
        throw new Error(
          "Source lid seating has a nonzero station on its fixed preseptal boundary.",
        );
      pins.set(vertex, { x: 0, y: 0, z: 0 });
    }
    for (const [vertex, delta] of createHumanFaceLidBoundaryPins({
      positions,
      samples,
      boundaryVertices: patch.posteriorBoundary,
      pins,
    }))
      pins.set(vertex, delta);
    const displacement = interpolateHumanFaceLidDisplacement({
      positions,
      samples,
      pins,
      indices: patch.triangles.flatMap((triangle) =>
        Array.from(
          root.topology.triangles.subarray(3 * triangle, 3 * triangle + 3),
        ),
      ),
      boundaryVertices: [
        ...patch.posteriorBoundary,
        ...patch.preseptalBoundary,
      ],
    });
    let maximum = 0;
    const movedSourceVertices: number[] = [];
    for (const [vertex, delta] of displacement) {
      maximum = Math.max(maximum, Math.hypot(delta.x, delta.y, delta.z));
      if (delta.x !== 0 || delta.y !== 0 || delta.z !== 0)
        movedSourceVertices.push(vertex);
      const components = [delta.x, delta.y, delta.z];
      for (let axis = 0; axis < 3; axis++) {
        const value = before[3 * vertex + axis] + components[axis];
        if (!Number.isFinite(value))
          throw new Error(
            "Lid seat authoring produced a nonfinite coordinate.",
          );
        root.topology.positions[3 * vertex + axis] = value;
        skin.positions[3 * vertex + axis] = value;
      }
    }
    sides.push({
      side,
      medialJoinHeightMetres: joinHeight,
      upperBedColumns: bedCounts[0],
      lowerBedColumns: bedCounts[1],
      upperBedArcMetres: bedArcs[0],
      lowerBedArcMetres: bedArcs[1],
      posteriorBeforeMetres: margin.map(
        (vertex) => height(point(vertex)).signedDistance,
      ),
      posteriorAfterMetres: margin.map(
        (vertex) =>
          height(
            Array.from(skin.positions.subarray(3 * vertex, 3 * vertex + 3)),
          ).signedDistance,
      ),
      movedSourceVertices: movedSourceVertices.sort((a, b) => a - b),
      displacementTriangles: patch.triangles,
      posteriorBoundary: patch.posteriorBoundary,
      preseptalBoundary: patch.preseptalBoundary,
      maximumDisplacementMetres: maximum,
    });
  }
  const cut = skin.partition.cut;
  const pick = (samples: Int32Array): Float64Array =>
    Float64Array.from(
      Array.from(samples).flatMap((vertex) =>
        Array.from(skin.positions.subarray(3 * vertex, 3 * vertex + 3)),
      ),
    );
  skin.bodyPositions = pick(cut.p1BodyToG1);
  skin.headPositions = pick(cut.faceToG1);
  return {
    revision: "source-lid-seat-3",
    posteriorClearanceMetres: clearance,
    medialBedMetres: bed,
    frame: "canonical source metres,+Xleft,+Yup,+Zanterior",
    sides,
    qualification:
      "Authored neutral lid margin height on the low-poly source globe; no tear-film measurement, closed-eye correspondence, channel-state seat or rendered acceptance.",
  };
}
