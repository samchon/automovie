import type {
  IAutoMovieStageCamera,
  IAutoMovieVector3,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { Vector3 } from "../../../math/Vector3";
import { describeInvalidValue } from "../../../validation/internal/describeInvalidValue";
import { validateCameraClearanceEnvelope } from "./validateCameraClearanceEnvelope";
import { validateCameraDepthPrecision } from "./validateCameraDepthPrecision";

/** A camera and its target closer than this, in metres, have no look axis. */
const LOOK_DISTANCE_EPSILON: number = 1e-9;

/**
 * Validate one staged camera's lens, depth range, depth precision, aim and
 * clearance envelope, and return the look direction composition aims it along.
 *
 * The position must be a finite vector, the vertical field of view lie in `(0,
 * 180)` degrees, and `0 < near < far` hold in metres, both finite. A `lookAt`
 * node must be a placed actor, set piece or camera, and a point target a finite
 * vector. When the position and the resolved target are both finite, the
 * direction from the camera to the target must have finite components and be at
 * least 1e-9 m long, so a camera naming itself has no look axis. The depth
 * precision is checked by {@link validateCameraDepthPrecision} and an authored
 * clearance envelope by {@link validateCameraClearanceEnvelope}. Violations go
 * to `out` under `path`. The node id's uniqueness is the caller's check,
 * against every placement in the scene.
 *
 * @param camera The staged camera.
 * @param path Violation path of the camera.
 * @param placedPoints The positions a node target resolves against, keyed by
 *   node id.
 * @param out Collector the violations are appended to.
 * @returns The unnormalized direction from the camera to its target, metres, or
 *   `undefined` when the aim was refused or could not be derived.
 */
export function validateStageCamera(
  camera: IAutoMovieStageCamera,
  path: string,
  placedPoints: ReadonlyMap<string, IAutoMovieVector3>,
  out: IAutoMovieViolationCollector,
): IAutoMovieVector3 | undefined {
  if (!(camera.fovDeg > 0 && camera.fovDeg < 180))
    out.push(
      "range",
      `${path}.fovDeg`,
      `vertical field of view must be within (0, 180)°, but was ${describeInvalidValue(camera.fovDeg)}`,
      camera.fovDeg,
    );
  if (camera.near <= 0)
    out.push(
      "range",
      `${path}.near`,
      "camera near distance must be finite and greater than zero metres",
      camera.near,
    );
  if (camera.near > 0 && camera.far <= camera.near)
    out.push(
      "range",
      `${path}.far`,
      "camera far distance must be finite and greater than near",
      camera.far,
    );
  validateCameraDepthPrecision(
    camera.depthPrecision,
    `${path}.depthPrecision`,
    out,
  );
  if (camera.lookAt.kind === "node" && !placedPoints.has(camera.lookAt.node))
    out.push(
      "type",
      `${path}.lookAt.node`,
      `camera target "${describeInvalidValue(camera.lookAt.node)}" must be a placed actor, set piece, or camera`,
      camera.lookAt.node,
    );

  const target: IAutoMovieVector3 | undefined =
    camera.lookAt.kind === "node"
      ? placedPoints.get(camera.lookAt.node)
      : camera.lookAt.point;
  let direction: IAutoMovieVector3 | undefined;
  if (target !== undefined) {
    const offset: IAutoMovieVector3 = Vector3.subtract(target, camera.position);
    if (Vector3.length(offset) < LOOK_DISTANCE_EPSILON)
      out.push(
        "range",
        `${path}.lookAt`,
        "camera lookAt must not equal the camera position",
        camera.lookAt,
      );
    else direction = offset;
  }
  if (camera.clearance !== undefined)
    validateCameraClearanceEnvelope(camera.clearance, `${path}.clearance`, out);
  return direction;
}
