import {
  IAutoMovieBuiltEnvironment,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { IAutoMovieBuiltEnvelopeFace } from "./IAutoMovieBuiltEnvelopeFace";
import { builtEnvironmentBuildingOfSpace } from "./builtEnvironmentBuildingOfSpace";
import { builtSpaceContainsPoint } from "./builtSpaceContainsPoint";
import { AUTOMOVIE_ENVELOPE_FACADE_LIMIT } from "./constants/AUTOMOVIE_ENVELOPE_FACADE_LIMIT";
import { AUTOMOVIE_OBSERVATION_EPSILON } from "./constants/AUTOMOVIE_OBSERVATION_EPSILON";
import { AUTOMOVIE_OBSERVATION_PROBE } from "./constants/AUTOMOVIE_OBSERVATION_PROBE";

/** Area-weighted centroid of a planar outline, or its vertex mean when flat. */
const outlineCentroid = (
  outline: readonly IAutoMoviePlanarPoint[],
): IAutoMoviePlanarPoint => {
  let doubleArea = 0;
  let x = 0;
  let y = 0;
  for (let index = 0; index < outline.length; index++) {
    const from = outline[index]!;
    const to = outline[(index + 1) % outline.length]!;
    const cross = from.x * to.y - to.x * from.y;
    doubleArea += cross;
    x += (from.x + to.x) * cross;
    y += (from.y + to.y) * cross;
  }
  if (Math.abs(doubleArea) <= AUTOMOVIE_OBSERVATION_EPSILON)
    return {
      x: outline.reduce((sum, point) => sum + point.x, 0) / outline.length,
      y: outline.reduce((sum, point) => sum + point.y, 0) / outline.length,
    };
  return { x: x / (3 * doubleArea), y: y / (3 * doubleArea) };
};

/**
 * Every exposed separation of every building unit, placed in world space.
 *
 * A boundary is exposed when it declares a face and separates exactly one
 * space. Each face carries its world vertices, its area-weighted centroid, an
 * outward unit normal that is the authored `+Z` flipped when a probe along it
 * lands inside the space, its owning building, and an aspect of roof,
 * underside, or facade read from the normal's vertical component against
 * `AUTOMOVIE_ENVELOPE_FACADE_LIMIT`. Sorted by boundary id in code-unit order.
 *
 * @evidence contracts/common.md#principled-implementation Places outline vertices and the area-weighted centroid through the face's TRS, flips the authored normal when an `AUTOMOVIE_OBSERVATION_PROBE` step along it lands inside the one space, and classifies aspect from the normal's `y`.
 * @evidence contracts/common.md#clear-and-simple-design Defect: `outlineCentroid` is copied in `builtSpaceObservationStations`; the query returns one flat sorted list that corners and the census filter by building.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A probe landing outside keeps the authored direction, which also covers a face standing off the volume by its wall thickness; a zero-area outline falls back to its vertex mean, and a faceless or unknown-space boundary is skipped.
 * @evidence contracts/common.md#meaningful-documentation States the exposure rule, the outward-normal correction, the aspect classification and its limit, the world frame, the per-face fields, and the sort order.
 * @evidence contracts/performance.md#cost-and-resources Defect: each exposed face calls `builtEnvironmentBuildingOfSpace`, which rebuilds every building's descendant set, making the call `O(F B S D)` where a space-to-building map built once would be linear; the space index is built once per call, vertex placement is linear in outline points, and nothing is cached.
 */
export const builtEnvironmentEnvelopeFaces = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvelopeFace[] => {
  const spaces = new Map(
    environment.spaces.map((space) => [space.id, space] as const),
  );
  const faces: IAutoMovieBuiltEnvelopeFace[] = [];
  for (const boundary of environment.boundaries) {
    const face = boundary.face;
    const [spaceId, ...rest] = boundary.spaces;
    if (face === undefined || spaceId === undefined || rest.length !== 0)
      continue;
    const space = spaces.get(spaceId);
    if (space === undefined) continue;
    const vertices = face.outline.map((point) =>
      Vector3.add(
        face.origin,
        Quaternion.rotateVector(face.rotation, {
          x: point.x,
          y: point.y,
          z: 0,
        }),
      ),
    );
    const local = outlineCentroid(face.outline);
    const centroid = Vector3.add(
      face.origin,
      Quaternion.rotateVector(face.rotation, {
        x: local.x,
        y: local.y,
        z: 0,
      }),
    );
    const authored = Vector3.normalize(
      Quaternion.rotateVector(face.rotation, { x: 0, y: 0, z: 1 }),
    );
    // The frame states its own outward direction, and a face wound the other
    // way would aim every derived camera into the wall. Ask the space which
    // side the frame points at instead: a probe that lands inside means the
    // authored direction points in. A probe that lands outside is kept, which
    // covers both the ordinary outward frame and a face standing off the volume
    // by its own wall thickness, where neither side of it is in the room.
    const normal = builtSpaceContainsPoint(
      space,
      Vector3.add(
        centroid,
        Vector3.scale(authored, AUTOMOVIE_OBSERVATION_PROBE),
      ),
    )
      ? Vector3.scale(authored, -1)
      : authored;
    faces.push({
      boundary: boundary.id,
      building: builtEnvironmentBuildingOfSpace(environment, space.id),
      space: space.id,
      kind: boundary.kind,
      aspect:
        normal.y > AUTOMOVIE_ENVELOPE_FACADE_LIMIT
          ? "roof"
          : normal.y < -AUTOMOVIE_ENVELOPE_FACADE_LIMIT
            ? "underside"
            : "facade",
      normal,
      centroid,
      vertices,
      thickness: face.thickness,
    });
  }
  return faces.sort((left, right) =>
    compareAutoMovieRenderIds(left.boundary, right.boundary),
  );
};
