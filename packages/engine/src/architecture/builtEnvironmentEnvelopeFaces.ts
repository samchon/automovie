import {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMoviePlanarPoint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { IAutoMovieBuiltEnvelopeFace } from "./IAutoMovieBuiltEnvelopeFace";
import { builtEnvironmentBuildingOfSpace } from "./builtEnvironmentBuildingOfSpace";
import { builtSpaceContainsPoint } from "./builtSpaceContainsPoint";
import { AUTOMOVIE_ENVELOPE_FACADE_LIMIT } from "./constants/AUTOMOVIE_ENVELOPE_FACADE_LIMIT";
import { AUTOMOVIE_OBSERVATION_PROBE } from "./constants/AUTOMOVIE_OBSERVATION_PROBE";
import { outlineCentroid } from "./outlineCentroid";

/**
 * Every exposed separation of every building unit, placed in world space.
 *
 * A face is exposed when its boundary separates exactly one declared space. Each result carries placed vertices, shoelace centroid, owning building and a computed normal used for roof/underside/facade classification. Authored +Z flips only if the positive-offset centroid probe is inside the space; the opposite side is not tested. Off-volume faces, concave outlines and numerical limitations preclude a general outward-orientation certificate. Results sort by boundary id in code-unit order.
 *
 * Throws when an exposed face's space belongs to no building unit, which
 * validation refuses.
 *
 * @evidence contracts/common.md#principled-implementation Places the outline and shoelace centroid with the face frame. Flips authored +Z only when the positive-offset centroid probe passes the space containment predicate; otherwise preserves it. This is a finite-distance orientation heuristic, not proof that the entire face borders the volume or points outward.
 * @evidence contracts/common.md#clear-and-simple-design Composes the shared centroid, containment and building-owner queries, so this query owns only the exposure rule, the orientation probe and the aspect classification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no boundary, space or building; the aspect threshold and probe distance are shared contract constants, and an unowned space is refused by the owner query rather than skipped.
 * @evidence contracts/common.md#meaningful-documentation States the exposure rule, every carried field, how the outward normal is chosen and when it is kept, the aspect rule and its constant, the sort order, and the throw for an unowned space.
 * @evidence contracts/performance.md#efficient-algorithms Builds an O(S) space index and scans B boundaries. Each of D distinct exposed spaces pays a full owner lookup over S spaces, U building units and its ancestry depth. Adds summed outline vertices, one delegated containment probe per face and O(F log F) face sorting; containment cost depends on each space's volume representation.
 * @evidence contracts/performance.md#reuse-equivalent-work Each space's owning building is resolved once per call and reused by every face of that space; nothing persists across calls because the record is the caller's.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The space index and owner memo live for one call, bounded by the space count; the caller owns the returned faces.
 */
export const builtEnvironmentEnvelopeFaces: (
  environment: IAutoMovieBuiltEnvironment,
) => IAutoMovieBuiltEnvelopeFace[] = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvelopeFace[] => {
  const spaces: Map<string, IAutoMovieBuiltSpace> = new Map(
    environment.spaces.map(
      (space: IAutoMovieBuiltSpace): [string, IAutoMovieBuiltSpace] => [
        space.id,
        space,
      ],
    ),
  );
  const owners: Map<string, string> = new Map();
  const faces: IAutoMovieBuiltEnvelopeFace[] = [];
  for (const boundary of environment.boundaries) {
    const face: IAutoMovieBuiltBoundary["face"] = boundary.face;
    if (face === undefined || boundary.spaces.length !== 1) continue;
    const space: IAutoMovieBuiltSpace | undefined = spaces.get(
      boundary.spaces[0]!,
    );
    if (space === undefined) continue;
    const place: (point: IAutoMoviePlanarPoint) => IAutoMovieVector3 = (
      point: IAutoMoviePlanarPoint,
    ): IAutoMovieVector3 =>
      Vector3.add(
        face.origin,
        Quaternion.rotateVector(face.rotation, {
          x: point.x,
          y: point.y,
          z: 0,
        }),
      );
    const centroid: IAutoMovieVector3 = place(outlineCentroid(face.outline));
    const authored: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(face.rotation, { x: 0, y: 0, z: 1 }),
    );
    const normal: IAutoMovieVector3 = builtSpaceContainsPoint(
      space,
      Vector3.add(
        centroid,
        Vector3.scale(authored, AUTOMOVIE_OBSERVATION_PROBE),
      ),
    )
      ? Vector3.scale(authored, -1)
      : authored;
    let building: string | undefined = owners.get(space.id);
    if (building === undefined) {
      building = builtEnvironmentBuildingOfSpace(environment, space.id);
      owners.set(space.id, building);
    }
    faces.push({
      boundary: boundary.id,
      building,
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
      vertices: face.outline.map(
        (point: IAutoMoviePlanarPoint): IAutoMovieVector3 => place(point),
      ),
      thickness: face.thickness,
    });
  }
  return faces.sort(
    (
      left: IAutoMovieBuiltEnvelopeFace,
      right: IAutoMovieBuiltEnvelopeFace,
    ): number => compareAutoMovieRenderIds(left.boundary, right.boundary),
  );
};
