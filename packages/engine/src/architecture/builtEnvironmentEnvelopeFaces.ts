import { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { builtEnvironmentBuildingOfSpace } from "./builtEnvironmentBuildingOfSpace";
import { builtSpaceContainsPoint } from "./builtSpaceContainsPoint";
import { AUTOMOVIE_ENVELOPE_FACADE_LIMIT } from "./AUTOMOVIE_ENVELOPE_FACADE_LIMIT";
import { AUTOMOVIE_OBSERVATION_PROBE } from "./AUTOMOVIE_OBSERVATION_PROBE";
import { IAutoMovieBuiltEnvelopeFace } from "./IAutoMovieBuiltEnvelopeFace";

/**
 * Every exposed separation of every building unit, placed in world space.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Derives the exposed envelope population a facade and roof review is counted over.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Implements the envelope-face derivation shared by the census and the observation population.
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
