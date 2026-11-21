import { classifyAutoMovieCameraInspection } from "@automovie/engine";
import type {
  IAutoMovieCameraInspection,
  IAutoMovieSubjectBox,
} from "@automovie/interface";
import {
  Box3,
  Camera,
  Frustum,
  Line,
  Material,
  Matrix4,
  Mesh,
  Object3D,
  Plane,
  Points,
  Scene,
  ShaderMaterial,
  Sprite,
  Vector3,
} from "three";

import { sampleAutoMovieCameraOcclusion } from "./sampleAutoMovieCameraOcclusion.js";

/** The delivered camera and one source-resolved requirement, after placement. */
interface IProps {
  /** Original displayed scene, before inspection overlays are installed. */
  scene: Scene;

  /** Output camera with delivery aspect and crop already applied. */
  camera: Camera;

  /** Resolved displayed root of the required subject, when available. */
  target: Object3D | undefined;

  /** Optional independently certified full world envelope of the placed subject. */
  targetBounds?: IAutoMovieSubjectBox;

  /** Source-authored maximum pixel-occlusion ratio. */
  maxOcclusionRatio?: number;

  /** Maximum total triangles admitted to the optional, nine-ray witness pass. */
  triangleBudget?: number;

  /** Matching exact pixel observations, when a delivery audit obtained them. */
  pixels?: IAutoMovieCameraInspection.IPixels;
}

/**
 * Observes required-subject framing from the original delivered projection.
 *
 * @evidence contracts/development/implementation.md#principled-implementation
 * World bounds classify complete exclusion by a delivery clip plane. Box
 * overlap and unsupported or unavailable bounds leave the subject ungraded for
 * exact visibility. Actual projection includes the caller's delivery crop.
 * @evidence contracts/development/implementation.md#efficient-algorithms
 * The framing path visits only target descendants, uses cached rigid geometry
 * bounds, and checks six support points. The optional witness pass is skipped
 * for excluded subjects, unmeasured bounds, and exact pixel observations.
 * @evidence contracts/development/common.md#meaningful-documentation Documents
 * original-frame ownership, projected bounds, and the optional triangle cap.
 */
export function observeAutoMovieCameraInspection(
  props: IProps,
): IAutoMovieCameraInspection.IResult {
  const { camera, scene, target, maxOcclusionRatio, pixels } = props;
  if (target === undefined || !isDisplayed(scene, target))
    return classifyAutoMovieCameraInspection({
      framing: "unavailable",
      maxOcclusionRatio,
      pixels,
    });

  camera.updateWorldMatrix(true, false);
  target.updateWorldMatrix(true, true);
  const bounds: Box3 | undefined =
    props.targetBounds === undefined
      ? scene.overrideMaterial === null
        ? rigidSubjectBounds(target, camera)
        : undefined
      : toBounds(props.targetBounds);
  const projection: Matrix4 = new Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  if (bounds === undefined || !projection.elements.every(Number.isFinite))
    return classifyAutoMovieCameraInspection({
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
    frustum.planes.some(
      (plane: Plane): boolean =>
        ![...plane.normal.toArray(), plane.constant].every(Number.isFinite),
    )
      ? "unavailable"
      : outsidePlane(bounds, frustum.planes[5])
        ? "before-near"
        : outsidePlane(bounds, frustum.planes[4])
          ? "past-far"
          : frustum.planes
                .slice(0, 4)
                .some((plane: Plane): boolean => outsidePlane(bounds, plane))
            ? "outside"
            : "possible";
  const triangleBudget: number = props.triangleBudget ?? 0;
  const witnesses: IAutoMovieCameraInspection.IWitnesses | undefined =
    framing === "possible" &&
    pixels === undefined &&
    Number.isSafeInteger(triangleBudget) &&
    triangleBudget > 0
      ? sampleAutoMovieCameraOcclusion({
          scene,
          camera,
          target,
          bounds,
          projection,
          frustum,
          triangleBudget,
        })
      : undefined;
  return classifyAutoMovieCameraInspection({
    framing,
    maxOcclusionRatio,
    pixels,
    witnesses,
  });
}

/** Requires an unsuppressed chain all the way to the supplied beauty scene. */
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

/** Copies and admits an externally certified enclosing world box. */
function toBounds(input: IAutoMovieSubjectBox): Box3 | undefined {
  const result: Box3 = new Box3(
    new Vector3(input.min.x, input.min.y, input.min.z),
    new Vector3(input.max.x, input.max.y, input.max.z),
  );
  return isFiniteBox(result) ? result : undefined;
}

/** Rejects empty, inverted and non-finite bounds, while allowing flat bounds. */
function isFiniteBox(box: Box3): boolean {
  return (
    !box.isEmpty() &&
    [...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite)
  );
}

/** Encloses the target only if every visible drawable has a trusted rigid bound. */
function rigidSubjectBounds(
  target: Object3D,
  camera: Camera,
): Box3 | undefined {
  const combined: Box3 = new Box3();
  const world: Box3 = new Box3();
  let supported: boolean = true;
  target.traverseVisible((object: Object3D): void => {
    if (!supported || !object.layers.test(camera.layers)) return;
    if (!(object instanceof Mesh)) {
      if (
        object instanceof Line ||
        object instanceof Points ||
        object instanceof Sprite
      )
        supported = false;
      return;
    }
    if (
      object.constructor !== Mesh ||
      object.onBeforeRender !== Object3D.prototype.onBeforeRender ||
      object.onAfterRender !== Object3D.prototype.onAfterRender ||
      object.geometry.morphAttributes.position?.length ||
      object.geometry.getAttribute("position") === undefined ||
      !usesRigidMaterialBounds(object.material)
    ) {
      supported = false;
      return;
    }
    if (object.geometry.boundingBox === null)
      object.geometry.computeBoundingBox();
    const local: Box3 | null = object.geometry.boundingBox;
    if (local === null || !isFiniteBox(local)) {
      supported = false;
      return;
    }
    world.copy(local).applyMatrix4(object.matrixWorld);
    if (isFiniteBox(world)) combined.union(world);
    else supported = false;
  });
  return supported && isFiniteBox(combined) ? combined : undefined;
}

/** Shader hooks and vertex displacement can invalidate geometry-space bounds. */
function usesRigidMaterialBounds(input: Material | Material[]): boolean {
  const materials: Material[] = Array.isArray(input) ? input : [input];
  return materials.every(
    (material: Material): boolean =>
      !(material instanceof ShaderMaterial) &&
      material.onBeforeCompile === Material.prototype.onBeforeCompile &&
      material.onBeforeRender === Material.prototype.onBeforeRender &&
      (!("displacementMap" in material) || material.displacementMap === null),
  );
}

/** Tests the most inward corner with slack scaled to distance arithmetic. */
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
