import type { IAutoMovieSubjectBox } from "@automovie/interface";
import type { AutoMovieRenderInspectionCamera } from "../../AutoMovieRenderInspectionCamera.js";
import { Box3, Frustum, Matrix4, Plane, Vector3 } from "three";

import { boundAutoMovieCameraSubject } from "./boundAutoMovieCameraSubject.js";
import { crossesAutoMovieFrustumPlane } from "./crossesAutoMovieFrustumPlane.js";
import { isAutoMovieFloat32Point } from "../isAutoMovieFloat32Point.js";
import { measureAutoMovieCameraFrameEdgeSurface } from "./measureAutoMovieCameraFrameEdgeSurface.js";

/*
 * Measure where the sides of the delivered frame cut a required subject.
 *
 * The subject's world box, or its certified envelope, crosses a side plane when
 * its outermost corner lies outside that plane beyond the 32-ulp slack the
 * framing grade uses. For each crossed side, the extent is how far the part of
 * the box beyond the near plane reaches past that edge, in normalized device
 * units: the frame spans -1 to 1 on each axis, crop and aspect included. It is
 * read at the vertices of the box clipped by the near plane, because a
 * perspective projection of a convex solid reaches its extremes at vertices. A
 * side crossed only on the camera side of the near plane has no extent: that
 * part is never drawn, so it cannot be cut.
 *
 * When some side has an extent and the meshes are readable,
 * AutoMovieRenderInspectionCamera.measureFrameEdgeSurface confirms or clears the cut on the
 * drawn surface and measures the visible fraction.
 * Parameter props: Delivery camera, subject bounds and meshes, and the triangle
 * budget.
 * Returns: `inside` when the bounds cross no side plane, `crossed` with the
 * crossed sides, their extents and the surface outcome, or `unmeasured` with
 * the reason the bounds or projection cannot be read.
 */
export function measureAutoMovieCameraFrameEdge(
  props: AutoMovieRenderInspectionCamera.IFrameEdgeProps,
): AutoMovieRenderInspectionCamera.IFrameEdgeResult {
  const { camera, meshes, triangleBudget } = props;
  const projection: Matrix4 = new Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse,
  );
  const frustum: Frustum = new Frustum().setFromProjectionMatrix(
    projection,
    camera.coordinateSystem,
    camera.reversedDepth,
  );
  const box: Box3 | undefined =
    props.bounds === undefined
      ? meshes === undefined
        ? undefined
        : boundAutoMovieCameraSubject(meshes)
      : toBox(props.bounds);
  if (box === undefined)
    return {
      status: "unmeasured",
      reason: "No certified placed subject bounds for the delivery projection.",
    };

  // 1. Sides whose plane the box's outermost corner lies outside.
  const sides: Plane[] = frustum.planes.slice(0, 4);
  const near: Plane = frustum.planes[5]!;
  const crossed: number[] = [];
  for (let i: number = 0; i < 4; ++i)
    if (crossesAutoMovieFrustumPlane(box, sides[i]!)) crossed.push(i);
  if (crossed.length === 0) return { status: "inside" };

  // 2. Extents past each crossed edge, over the box beyond the near plane.
  const reach: number[] = [-Infinity, -Infinity, -Infinity, -Infinity];
  for (const point of clipBox(box, near)) {
    const ndc: Vector3 = point.applyMatrix4(projection);
    const past: number[] = [ndc.x - 1, -1 - ndc.x, -1 - ndc.y, ndc.y - 1];

    // A corner on the edge itself may round past it by a few ulps of its coordinate.
    const slack: number[] = [ndc.x, ndc.x, ndc.y, ndc.y].map(
      (value: number): number => 32 * Number.EPSILON * (1 + Math.abs(value)),
    );
    for (let i: number = 0; i < 4; ++i)
      if (past[i]! > slack[i]!) reach[i] = Math.max(reach[i]!, past[i]!);
  }
  const crossings: AutoMovieRenderInspectionCamera.IFrameEdgeCrossing[] = crossed.map(
    (i: number): AutoMovieRenderInspectionCamera.IFrameEdgeCrossing =>
      reach[i] !== -Infinity
        ? { side: SIDES[i]!, extent: reach[i]! }
        : { side: SIDES[i]! },
  );

  // A box whose drawn part stays inside every edge leaves nothing for an edge to cut.
  if (
    crossings.every(
      (crossing: AutoMovieRenderInspectionCamera.IFrameEdgeCrossing): boolean =>
        crossing.extent === undefined,
    )
  )
    return {
      status: "crossed",
      crossings,
      surface: { status: "clear", triangles: 0 },
    };
  return {
    status: "crossed",
    crossings,
    surface:
      meshes === undefined
        ? {
            status: "unmeasured",
            reason:
              "A drawable of the subject has vertices the CPU cannot reproduce.",
          }
        : measureAutoMovieCameraFrameEdgeSurface({
            meshes,
            sides,
            near,
            projection,
            triangleBudget,
          }),
  };
}

/*
 * Three orders the normalized inward planes right, left, bottom, top, far,
 * near.
 */
const SIDES: readonly AutoMovieRenderInspectionCamera.IAutoMovieRenderInspectionFrameEdgeSide[] = [
  "right",
  "left",
  "bottom",
  "top",
];


/*
 * Copy and admit a certified envelope, rejecting empty or non-finite boxes.
 */
function toBox(input: IAutoMovieSubjectBox): Box3 | undefined {
  const box: Box3 = new Box3(
    new Vector3(input.min.x, input.min.y, input.min.z),
    new Vector3(input.max.x, input.max.y, input.max.z),
  );
  return !box.isEmpty() &&
    isAutoMovieFloat32Point(box.min) &&
    isAutoMovieFloat32Point(box.max)
    ? box
    : undefined;
}

/*
 * The vertices of the box's part on the inner side of the plane: kept corners
 * and edge crossings.
 */
function clipBox(box: Box3, plane: Plane): Vector3[] {
  const corners: Vector3[] = Array.from(
    { length: 8 },
    (_: unknown, i: number): Vector3 =>
      new Vector3(
        i & 1 ? box.max.x : box.min.x,
        i & 2 ? box.max.y : box.min.y,
        i & 4 ? box.max.z : box.min.z,
      ),
  );
  const distances: number[] = corners.map((corner: Vector3): number =>
    plane.distanceToPoint(corner),
  );
  const points: Vector3[] = corners.filter(
    (_: Vector3, i: number): boolean => distances[i]! >= 0,
  );

  // A box edge joins two corners that differ in one coordinate bit.
  for (let i: number = 0; i < 8; ++i)
    for (const bit of [1, 2, 4]) {
      if (i & bit) continue;
      const a: number = distances[i]!;
      const b: number = distances[i | bit]!;
      if (a >= 0 !== b >= 0)
        points.push(
          new Vector3().lerpVectors(
            corners[i]!,
            corners[i | bit]!,
            a / (a - b),
          ),
        );
    }
  return points;
}
