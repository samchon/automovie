import type { AutoMovieRenderInspectionCamera } from "../../AutoMovieRenderInspectionCamera";
import { AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieCameraInspection,
  IAutoMovieSubjectBox,
} from "@automovie/interface";
import { Box3, Frustum, Matrix4, Mesh, Object3D, Plane, Scene, Vector3 } from "three";

import { boundCameraSubject } from "./boundCameraSubject";
import { crossesFrustumPlane } from "./crossesFrustumPlane";
import { listCameraSubjectMeshes } from "./listCameraSubjectMeshes";
import { sampleCameraOcclusion } from "./sampleCameraOcclusion";

/*
 * Observes required-subject framing from the original delivered projection.
 */
export function observeCameraInspection(
  props: AutoMovieRenderInspectionCamera.IObserveProps,
): IAutoMovieCameraInspection.IResult {
  const { camera, scene, target, maxOcclusionRatio, pixels } = props;
  if (target === undefined || !isDisplayed(scene, target))
    return AutoMovieEngineValidation.classifyAutoMovieCameraInspection({
      framing: "unavailable",
      maxOcclusionRatio,
      pixels,
    });

  camera.updateWorldMatrix(true, false);
  target.updateWorldMatrix(true, true);
  const meshes: Mesh[] | undefined =
    props.targetBounds === undefined && scene.overrideMaterial === null
      ? listCameraSubjectMeshes(target, camera)
      : undefined;
  const bounds: Box3 | undefined =
    props.targetBounds === undefined
      ? meshes === undefined
        ? undefined
        : boundCameraSubject(meshes)
      : toBounds(props.targetBounds);
  const projection: Matrix4 = new Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  if (bounds === undefined)
    return AutoMovieEngineValidation.classifyAutoMovieCameraInspection({
      framing: "unavailable",
      maxOcclusionRatio,
      pixels,
    });

  const frustum: Frustum = new Frustum().setFromProjectionMatrix(
    projection,
    camera.coordinateSystem,
    camera.reversedDepth,
  );
  const framing: IAutoMovieCameraInspection.Framing =
    // Three orders the normalized inward planes right, left, bottom, top, far, near.
    outsidePlane(bounds, frustum.planes[5])
      ? "before-near"
      : outsidePlane(bounds, frustum.planes[4])
        ? "past-far"
        : frustum.planes
              .slice(0, 4)
              .some((plane: Plane): boolean => outsidePlane(bounds, plane))
          ? "outside"
          : frustum.planes
                .slice(0, 4)
                .some((plane: Plane): boolean =>
                  crossesFrustumPlane(bounds, plane),
                )
            ? "crosses-side"
            : "possible";
  const triangleBudget: number = props.triangleBudget ?? 0;
  const witnesses: IAutoMovieCameraInspection.IWitnesses | undefined =
    (framing === "possible" || framing === "crosses-side") &&
    pixels === undefined &&
    triangleBudget > 0
      ? sampleCameraOcclusion({
          scene,
          camera,
          target,
          bounds,
          projection,
          frustum,
          triangleBudget,
        })
      : undefined;
  return AutoMovieEngineValidation.classifyAutoMovieCameraInspection({
    framing,
    maxOcclusionRatio,
    pixels,
    witnesses,
  });
}

/*
 * Requires an unsuppressed chain all the way to the supplied beauty scene.
 */
function isDisplayed(scene: Scene, target: Object3D): boolean {
  for (
    let object: Object3D | null = target;
    object !== null;
    object = object.parent
  ) {
    if (!object.visible) return false;
    if (object === scene) return true;
  }
  return false;
}

/*
 * Copies and admits an externally certified enclosing world box.
 */
function toBounds(input: IAutoMovieSubjectBox): Box3 | undefined {
  const result: Box3 = new Box3(
    new Vector3(input.min.x, input.min.y, input.min.z),
    new Vector3(input.max.x, input.max.y, input.max.z),
  );
  return isFiniteBox(result) ? result : undefined;
}

/*
 * Rejects empty, inverted and non-finite bounds, while allowing flat bounds.
 */
function isFiniteBox(box: Box3): boolean {
  return !box.isEmpty();
}

/*
 * Tests the most inward corner with slack scaled to distance arithmetic.
 */
function outsidePlane(box: Box3, plane: Plane): boolean {
  const { x, y, z } = plane.normal;
  const xx: number = x * (x >= 0 ? box.max.x : box.min.x);
  const yy: number = y * (y >= 0 ? box.max.y : box.min.y);
  const zz: number = z * (z >= 0 ? box.max.z : box.min.z);
  const tolerance: number =
    32 *
    Number.EPSILON *
    (1 + Math.abs(xx) + Math.abs(yy) + Math.abs(zz) + Math.abs(plane.constant));
  return xx + yy + zz + plane.constant < -tolerance;
}
