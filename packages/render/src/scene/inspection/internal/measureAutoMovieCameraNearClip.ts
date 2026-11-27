import type { AutoMovieRenderInspectionCamera } from "../../AutoMovieRenderInspectionCamera.js";
import { Box3, BufferAttribute, Frustum, Matrix4, Mesh, Plane, Vector3, WebGLCoordinateSystem } from "three";

import { AutoMovieThreeKind } from "../../AutoMovieThreeKind.js";
import { clipInspectionPolygon } from "./clipInspectionPolygon.js";
import { inspectionPlaneRoundingSlack } from "./inspectionPlaneRoundingSlack.js";
import { isAutoMovieFloat32Point } from "../isAutoMovieFloat32Point.js";
import { readAutoMovieDisplayedBox } from "./readAutoMovieDisplayedBox.js";
import { readAutoMovieDrawnRanges } from "./readAutoMovieDrawnRanges.js";

/*
 * Measure how far a required subject's drawn surface reaches in front of the
 * delivery near plane inside the delivered frame.
 *
 * The GPU clips every triangle against the near plane, so any part of the
 * subject's surface that lies inside the four side planes and on the camera
 * side of the near plane is cut out of the delivered picture: the camera has
 * entered the subject. Each drawn triangle is clipped to the four side planes
 * (Sutherland-Hodgman); signed distance to the near plane is linear over the
 * remaining convex polygon, so its deepest point is a polygon vertex.
 * Parameter props: Delivery camera, admitted subject meshes and the triangle
 * budget.
 * Returns: `clear` when no drawn surface crosses, `clipped` with the deepest
 * intrusion in metres, its world surface point and the near-plane point at
 * the same delivered pixel, `over-budget` when the triangles to examine
 * exceed the budget, or `unmeasured` with the reason the subject cannot be
 * checked.
 */
export function measureAutoMovieCameraNearClip(
  props: AutoMovieRenderInspectionCamera.INearClipProps,
): AutoMovieRenderInspectionCamera.INearClipResult {
  const { camera, meshes, triangleBudget } = props;
  if (triangleBudget < 0)
    return {
      status: "unmeasured",
      reason: "Invalid near-clip triangle budget.",
    };
  const projection: Matrix4 = new Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  const frustum: Frustum = new Frustum().setFromProjectionMatrix(
    projection,
    camera.coordinateSystem,
    camera.reversedDepth,
  );

  // Three orders the normalized inward planes right, left, bottom, top, far, near.
  const sides: Plane[] = frustum.planes.slice(0, 4);
  const near: Plane = frustum.planes[5]!;
  const world: Box3 = new Box3();
  const excluded: (box: Box3) => boolean = (box: Box3): boolean =>
    leastDistance(box, near) >= 0 ||
    sides.some((plane: Plane): boolean => leastDistance(box, flip(plane)) > 0);

  // 0. A certified envelope beyond the near plane or out of frame settles it.
  if (props.bounds !== undefined) {
    const { min, max } = props.bounds;
    world.min.set(min.x, min.y, min.z);
    world.max.set(max.x, max.y, max.z);
    if (
      isAutoMovieFloat32Point(world.min) &&
      isAutoMovieFloat32Point(world.max) &&
      !world.isEmpty() &&
      excluded(world)
    )
      return { status: "clear", triangles: 0 };
  }
  if (meshes === undefined)
    return {
      status: "unmeasured",
      reason:
        "A drawable of the subject has vertices the CPU cannot reproduce.",
    };

  // 1. Keep meshes whose world box can reach in front of the near plane in view.
  const selected: {
    mesh: Mesh;
    ranges: readAutoMovieDrawnRanges.IRange[];
    slack: number;
  }[] = [];
  let triangles: number = 0;
  for (const mesh of meshes) {
    if (AutoMovieThreeKind.isAutoMovieSkinnedMesh(mesh))
      mesh.computeBoundingBox();
    else if (mesh.geometry.boundingBox === null)
      mesh.geometry.computeBoundingBox();
    const local: Box3 | null = AutoMovieThreeKind.isAutoMovieSkinnedMesh(mesh)
      ? mesh.boundingBox
      : mesh.geometry.boundingBox;
    if (local === null || local.isEmpty()) continue;
    world.copy(local).applyMatrix4(mesh.matrixWorld);
    if (excluded(world)) continue;
    const ranges: readAutoMovieDrawnRanges.IRange[] =
      readAutoMovieDrawnRanges(mesh);
    for (const range of ranges)
      triangles += Math.floor((range.end - range.start) / 3);
    if (triangles > triangleBudget)
      return {
        status: "over-budget",
        reason: `Near-clip check needs more than ${triangleBudget} triangles.`,
      };

    // The owned skin's GPU result may differ by its rounding bound, in mesh units.
    const e: readonly number[] = mesh.matrixWorld.elements;
    const scale: number = Math.max(
      Math.hypot(e[0]!, e[4]!, e[8]!),
      Math.hypot(e[1]!, e[5]!, e[9]!),
      Math.hypot(e[2]!, e[6]!, e[10]!),
    );
    const slack: number = AutoMovieThreeKind.isAutoMovieSkinnedMesh(mesh)
      ? mesh.tolerance() * scale
      : 0;
    selected.push({ mesh, ranges, slack });
  }

  // 2. Clip each drawn triangle to the frame and find its deepest near intrusion.
  const deepestPoint: Vector3 = new Vector3();
  let deepest: { depth: number; point: Vector3; opaque: boolean } | undefined;
  const corners: Vector3[] = [new Vector3(), new Vector3(), new Vector3()];
  const polygon: Vector3[] = Array.from({ length: 8 }, () => new Vector3());
  const scratch: Vector3[] = Array.from({ length: 8 }, () => new Vector3());
  for (const { mesh, ranges, slack } of selected) {
    const index: BufferAttribute | null = mesh.geometry.index;
    for (const range of ranges) {
      const opaque: boolean =
        AutoMovieThreeKind.isAutoMovieSkinnedMesh(mesh) ||
        readAutoMovieDisplayedBox.supportsStockSurface(range.material);
      for (let i: number = range.start; i + 2 < range.end; i += 3) {
        for (let k: number = 0; k < 3; ++k) {
          const vertex: number = index === null ? i + k : index.getX(i + k);
          mesh
            .getVertexPosition(vertex, corners[k]!)
            .applyMatrix4(mesh.matrixWorld);
          if (!isAutoMovieFloat32Point(corners[k]!))
            return {
              status: "unmeasured",
              reason: "A drawn subject vertex is not finite.",
            };
        }
        let count: number = 3;
        for (let k: number = 0; k < 3; ++k) polygon[k]!.copy(corners[k]!);
        for (const plane of sides) {
          count = clipInspectionPolygon(polygon, count, plane, scratch);
          if (count === 0) break;
          for (let k: number = 0; k < count; ++k) polygon[k]!.copy(scratch[k]!);
        }
        for (let k: number = 0; k < count; ++k) {
          const point: Vector3 = polygon[k]!;
          const distance: number = near.distanceToPoint(point);
          const tolerance: number =
            slack + inspectionPlaneRoundingSlack(near, point);
          if (distance >= -tolerance) continue;
          const depth: number = -distance;
          if (
            deepest === undefined ||
            (opaque && !deepest.opaque) ||
            (opaque === deepest.opaque && depth > deepest.depth)
          )
            deepest = { depth, point: deepestPoint.copy(point), opaque };
        }
      }
    }
  }
  if (deepest === undefined) return { status: "clear", triangles };

  // The same delivered pixel on the near plane: unproject at near-plane depth.
  const nearDepth: number = camera.reversedDepth
    ? 1
    : camera.coordinateSystem === WebGLCoordinateSystem
      ? -1
      : 0;
  const pixel: Vector3 = deepest.point.clone().applyMatrix4(projection);
  pixel.z = nearDepth;
  const cut: Vector3 = pixel.applyMatrix4(
    new Matrix4().copy(projection).invert(),
  );
  return {
    status: "clipped",
    triangles,
    depth: deepest.depth,
    point: { x: deepest.point.x, y: deepest.point.y, z: deepest.point.z },
    cut: { x: cut.x, y: cut.y, z: cut.z },
    opaque: deepest.opaque,
  };
}

/*
 * Signed distance from the plane to the box corner deepest against its normal.
 */
function leastDistance(box: Box3, plane: Plane): number {
  const { x, y, z } = plane.normal;
  return (
    x * (x >= 0 ? box.min.x : box.max.x) +
    y * (y >= 0 ? box.min.y : box.max.y) +
    z * (z >= 0 ? box.min.z : box.max.z) +
    plane.constant
  );
}

/*
 * The same plane facing the other way.
 */
function flip(plane: Plane): Plane {
  return plane.clone().negate();
}
