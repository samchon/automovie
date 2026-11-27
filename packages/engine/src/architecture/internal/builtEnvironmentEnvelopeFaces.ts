import {
  IAutoMovieBuiltBoundary,
  type IAutoMovieBuiltEnvelopeFace,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMoviePlanarPoint,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { compareAutoMovieRenderIds } from "../../render/internal/compareAutoMovieRenderIds";
import { builtEnvironmentBuildingOfSpace } from "./builtEnvironmentBuildingOfSpace";
import { builtSpaceContainsPoint } from "./builtSpaceContainsPoint";
import { AUTOMOVIE_ENVELOPE_FACADE_LIMIT } from "../AUTOMOVIE_ENVELOPE_FACADE_LIMIT";
import { ObservationGeometry } from "./ObservationGeometry";
import { outlineCentroid } from "./outlineCentroid";

/*
 * Every exposed separation of every building unit, placed in world space.
 *
 * A face is exposed when its boundary separates exactly one declared space.
 * Each result carries placed vertices, shoelace centroid, owning building and a
 * computed normal used for roof/underside/facade classification. Authored +Z
 * flips only if the positive-offset centroid probe is inside the space; the
 * opposite side is not tested. Off-volume faces, concave outlines and numerical
 * limitations preclude a general outward-orientation certificate. Results sort
 * by boundary id in code-unit order.
 *
 * Throws when an exposed face's space belongs to no building unit, which
 * validation refuses.
 */
export function builtEnvironmentEnvelopeFaces(
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieBuiltEnvelopeFace[] {
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
    const place = (point: IAutoMoviePlanarPoint): IAutoMovieVector3 =>
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
        Vector3.scale(authored, ObservationGeometry.ProbeMeters),
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
}
