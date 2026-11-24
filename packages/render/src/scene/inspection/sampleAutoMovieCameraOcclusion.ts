import type { IAutoMovieCameraInspection } from "@automovie/interface";
import {
  Box3,
  Camera,
  Frustum,
  type Intersection,
  LessEqualDepth,
  Line,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  NoBlending,
  NormalBlending,
  Object3D,
  Points,
  Raycaster,
  Scene,
  Sprite,
  Vector3,
  Vector4,
  WebGLCoordinateSystem,
} from "three";
import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";

/** A fixed projection-space sample grid inside the admitted bounds rectangle. */
const SAMPLE_OFFSETS: readonly number[] = [0.2, 0.5, 0.8];

/** Actual delivery camera and one required subject passing coarse framing. */
interface IProps {
  /** Original scene including candidate blockers. */
  scene: Scene;

  /** Output camera with crop, viewport shape and world transform realized. */
  camera: Camera;

  /** Resolved displayed root of the required subject. */
  target: Object3D;

  /** Admitted enclosing world bounds of the required subject. */
  bounds: Box3;

  /** Combined world-to-delivery clip projection. */
  projection: Matrix4;

  /** Six delivery clip planes. */
  frustum: Frustum;

  /** Total candidate triangle count allowed for this witness pass. */
  triangleBudget: number;
}

/** Finds bounded depth-order witnesses on ordinary rigid, opaque mesh surfaces. */
export function sampleAutoMovieCameraOcclusion(
  props: IProps,
): IAutoMovieCameraInspection.IWitnesses | undefined {
  const { scene, camera, target, bounds, projection, frustum, triangleBudget } =
    props;
  if (scene.overrideMaterial !== null) return undefined;

  const rectangle: IRectangle = projectedRectangle(bounds, projection);
  const candidates: Mesh[] = [];
  const targetMeshes: Set<Object3D> = new Set();
  target.traverse((object: Object3D): void => {
    targetMeshes.add(object);
  });

  scene.updateMatrixWorld();
  const world: Box3 = new Box3();
  let triangles: number = 0;
  let supportedTarget: boolean = true;
  let unsupportedBlocker: boolean = false;
  scene.traverseVisible((object: Object3D): void => {
    if (triangles > triangleBudget || !object.layers.test(camera.layers))
      return;
    if (
      !(AutoMovieThreeKind.isMesh(object)) &&
      !(AutoMovieThreeKind.isLine(object)) &&
      !(AutoMovieThreeKind.isPoints(object)) &&
      !(AutoMovieThreeKind.isSprite(object))
    )
      return;
    const onTarget: boolean = targetMeshes.has(object);
    if (!(AutoMovieThreeKind.isMesh(object)) || !supportsRay(object)) {
      if (onTarget) supportedTarget = false;
      else unsupportedBlocker = true;
      return;
    }
    const entries: number =
      object.geometry.index?.count ??
      object.geometry.getAttribute("position").count;
    const cost: number = Math.ceil(entries / 3);
    if (object.geometry.boundingBox === null) {
      if (triangles + cost > triangleBudget) {
        triangles += cost;
        return;
      }
      object.geometry.computeBoundingBox();
    }
    const local: Box3 | null = object.geometry.boundingBox;
    if (local === null || local.isEmpty()) return;
    world.copy(local).applyMatrix4(object.matrixWorld);
    if (!frustum.intersectsBox(world)) return;
    const region: IRectangle = projectedRectangle(world, projection);
    if (
      region.maxX < rectangle.minX ||
      region.minX > rectangle.maxX ||
      region.maxY < rectangle.minY ||
      region.minY > rectangle.maxY
    )
      return;
    triangles += cost;
    candidates.push(object);
  });
  if (!supportedTarget || triangles > triangleBudget || candidates.length === 0)
    return undefined;

  const raycaster: Raycaster = new Raycaster();
  raycaster.layers.mask = camera.layers.mask;
  const inverse: Matrix4 = new Matrix4().copy(projection).invert();
  const nearDepth: number = camera.reversedDepth
    ? 1
    : camera.coordinateSystem === WebGLCoordinateSystem
      ? -1
      : 0;
  const innerDepth: number = nearDepth === 1 ? 0.5 : (1 + nearDepth) / 2;
  const interior: Vector3 = new Vector3();
  const witnesses: IAutoMovieCameraInspection.IWitnesses = {
    blocked: 0,
    clear: 0,
  };
  for (const u of SAMPLE_OFFSETS)
    for (const v of SAMPLE_OFFSETS) {
      const x: number = rectangle.minX + u * (rectangle.maxX - rectangle.minX);
      const y: number = rectangle.minY + v * (rectangle.maxY - rectangle.minY);
      raycaster.ray.origin.set(x, y, nearDepth).applyMatrix4(inverse);
      interior.set(x, y, innerDepth).applyMatrix4(inverse);
      raycaster.ray.direction
        .subVectors(interior, raycaster.ray.origin)
        .normalize();
      if (raycaster.ray.direction.lengthSq() === 0) continue;
      const intersections: Intersection[] = raycaster
        .intersectObjects(candidates, false)
        .filter((hit: Intersection): boolean =>
          frustum.containsPoint(hit.point),
        );
      const subject: Intersection | undefined = intersections.find(
        (hit: Intersection): boolean => targetMeshes.has(hit.object),
      );
      if (subject === undefined) continue;
      const blocker: Intersection | undefined = intersections.find(
        (hit: Intersection): boolean => !targetMeshes.has(hit.object),
      );
      const epsilon: number =
        32 * Number.EPSILON * Math.max(1, subject.distance);
      if (
        blocker !== undefined &&
        blocker.distance < subject.distance - epsilon
      ) {
        ++witnesses.blocked;
        witnesses.blocker ??= {
          x: blocker.point.x,
          y: blocker.point.y,
          z: blocker.point.z,
        };
      } else if (
        !unsupportedBlocker &&
        (blocker === undefined || blocker.distance > subject.distance + epsilon)
      ) {
        ++witnesses.clear;
      }
    }
  return witnesses;
}

/** Admits the native raycast only for the matching ordinary opaque depth path. */
function supportsRay(mesh: Mesh): boolean {
  if (
    mesh.constructor !== Mesh ||
    mesh.raycast !== Mesh.prototype.raycast ||
    mesh.getVertexPosition !== Mesh.prototype.getVertexPosition ||
    mesh.onBeforeRender !== Object3D.prototype.onBeforeRender ||
    mesh.onAfterRender !== Object3D.prototype.onAfterRender ||
    mesh.geometry.morphAttributes.position?.length ||
    mesh.geometry.getAttribute("position") === undefined
  )
    return false;
  const material: Material | Material[] = mesh.material;
  if (
    !(
      AutoMovieThreeKind.isMeshBasicMaterial(material) ||
      AutoMovieThreeKind.isMeshStandardMaterial(material) ||
      AutoMovieThreeKind.isMeshLambertMaterial(material) ||
      AutoMovieThreeKind.isMeshPhongMaterial(material)
    ) ||
    ![
      MeshBasicMaterial,
      MeshStandardMaterial,
      MeshLambertMaterial,
      MeshPhongMaterial,
    ].some((type): boolean => type === material.constructor)
  )
    return false;
  return (
    material.onBeforeCompile === Material.prototype.onBeforeCompile &&
    material.onBeforeRender === Material.prototype.onBeforeRender &&
    material.precision === null &&
    (material.blending === NormalBlending ||
      material.blending === NoBlending) &&
    material.visible &&
    !material.transparent &&
    material.opacity === 1 &&
    material.alphaTest === 0 &&
    !material.alphaHash &&
    !material.alphaToCoverage &&
    !material.wireframe &&
    !material.polygonOffset &&
    !material.stencilWrite &&
    material.depthWrite &&
    material.depthTest &&
    material.depthFunc === LessEqualDepth &&
    material.colorWrite &&
    !material.clippingPlanes?.length &&
    (!("displacementMap" in material) || material.displacementMap === null)
  );
}

/** Axis-aligned interval in normalized delivery coordinates. */
interface IRectangle {
  /** Left, bottom, right and top coordinates, respectively. */
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * The delivery rectangle enclosing box corners, with a safe whole-frame
 * fallback.
 */
function projectedRectangle(bounds: Box3, projection: Matrix4): IRectangle {
  const corner: Vector4 = new Vector4();
  let minX: number = 1;
  let minY: number = 1;
  let maxX: number = -1;
  let maxY: number = -1;
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        corner.set(x, y, z, 1).applyMatrix4(projection);
        if (corner.w <= 0) return { minX: -1, minY: -1, maxX: 1, maxY: 1 };
        minX = Math.min(minX, corner.x / corner.w);
        minY = Math.min(minY, corner.y / corner.w);
        maxX = Math.max(maxX, corner.x / corner.w);
        maxY = Math.max(maxY, corner.y / corner.w);
      }
  return {
    minX: Math.max(-1, minX),
    minY: Math.max(-1, minY),
    maxX: Math.min(1, maxX),
    maxY: Math.min(1, maxY),
  };
}
