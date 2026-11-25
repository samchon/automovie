import { Box3, BufferAttribute, Matrix4, Mesh, Plane, Vector3 } from "three";

import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";
import { isAutoMovieFloat32Point } from "./isAutoMovieFloat32Point.js";
import { readAutoMovieDisplayedBox } from "./readAutoMovieDisplayedBox.js";
import { readAutoMovieDrawnRanges } from "./readAutoMovieDrawnRanges.js";

/** A required subject's admitted meshes and the delivery frame's planes. */
interface IProps {
  /**
   * Meshes from listAutoMovieCameraSubjectMeshes with current world matrices
   * and poses.
   */
  meshes: readonly Mesh[];

  /**
   * The four normalized inward side planes of the delivery frustum, world
   * metres.
   */
  sides: readonly Plane[];

  /** The normalized inward near plane of the delivery frustum, world metres. */
  near: Plane;

  /** World-to-clip matrix of the delivery camera, crop and aspect included. */
  projection: Matrix4;

  /** Largest number of drawn triangles this call may examine. */
  triangleBudget: number;
}

/**
 * Check a required subject's drawn surface against the sides of the delivered
 * frame.
 *
 * Each drawn triangle of a mesh reaching beyond the near plane is clipped to
 * that plane, because the GPU draws nothing on the camera side of it. A
 * remaining vertex outside a side plane, beyond 32 ulps of the plane arithmetic
 * plus an owned skin's stated float32 tolerance, confirms the cut. The visible
 * fraction is the projected area, in normalized device units, of those clipped
 * triangles further clipped to the four side planes (Sutherland-Hodgman), over
 * their whole projected area. Front and back faces both count, so a closed
 * surface weighs its silhouette twice in both sums. The far plane is not
 * applied.
 *
 * @param props Subject meshes, frustum planes, projection and the triangle
 *   budget.
 * @returns `cut` with the triangles examined, the opacity of the cut surface
 *   and the visible fraction; `clear`; `over-budget` when the triangles to
 *   examine exceed the budget; or `unmeasured` with the reason.
 */
export function measureAutoMovieCameraFrameEdgeSurface(
  props: IProps,
): measureAutoMovieCameraFrameEdgeSurface.IResult {
  const { meshes, sides, near, projection, triangleBudget }: IProps = props;
  if (triangleBudget < 0)
    return {
      status: "unmeasured",
      reason: "Invalid frame-edge triangle budget.",
    };

  // 1. Keep meshes that reach beyond the near plane and count their triangles.
  const selected: {
    mesh: Mesh;
    ranges: readAutoMovieDrawnRanges.IRange[];
    slack: number;
  }[] = [];
  const world: Box3 = new Box3();
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
    if (innermost(world, near) <= 0) continue;
    const ranges: readAutoMovieDrawnRanges.IRange[] =
      readAutoMovieDrawnRanges(mesh);
    for (const range of ranges)
      triangles += Math.floor((range.end - range.start) / 3);
    if (triangles > triangleBudget)
      return {
        status: "over-budget",
        reason: `Frame-edge check needs more than ${triangleBudget} triangles.`,
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

  // 2. Clip each triangle to the near half-space, then to the frame.
  const corners: Vector3[] = [new Vector3(), new Vector3(), new Vector3()];
  const polygon: Vector3[] = Array.from({ length: 10 }, () => new Vector3());
  const inner: Vector3[] = Array.from({ length: 10 }, () => new Vector3());
  const scratch: Vector3[] = Array.from({ length: 10 }, () => new Vector3());
  let total: number = 0;
  let inside: number = 0;
  let cut: { opaque: boolean } | undefined;
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
        const count: number = clip(corners, 3, near, polygon);
        if (count < 3) continue;
        if (
          (cut === undefined || (opaque && !cut.opaque)) &&
          leaves(polygon, count, sides, slack)
        )
          cut = { opaque };
        total += projectedArea(polygon, count, projection, scratch);

        let kept: number = count;
        for (let k: number = 0; k < count; ++k) inner[k]!.copy(polygon[k]!);
        for (const plane of sides) {
          kept = clip(inner, kept, plane, scratch);
          if (kept === 0) break;
          for (let k: number = 0; k < kept; ++k) inner[k]!.copy(scratch[k]!);
        }
        if (kept >= 3)
          inside += projectedArea(inner, kept, projection, scratch);
      }
    }
  }
  if (cut === undefined) return { status: "clear", triangles };
  return {
    status: "cut",
    triangles,
    opaque: cut.opaque,
    ...(total > 0 ? { fraction: Math.min(1, inside / total) } : {}),
  };
}

/** Outcomes of one frame-edge surface check. */
export namespace measureAutoMovieCameraFrameEdgeSurface {
  /** The subject's drawn surface against the sides of the frame. */
  export type IResult =
    | {
        /** Some drawn surface beyond the near plane lies outside a side plane. */
        status: "cut";

        /** Drawn triangles examined. */
        triangles: number;

        /**
         * Whether a cut vertex lies on an opaque stock surface; false means the
         * cut part may be invisible anyway.
         */
        opaque: boolean;

        /**
         * Projected area inside the frame over the whole projected area, in [0,
         * 1]; absent when the surface projects to no area.
         */
        fraction?: number;
      }
    | {
        /**
         * Every examined triangle beyond the near plane stays inside the four
         * side planes.
         */
        status: "clear";

        /** Drawn triangles examined. */
        triangles: number;
      }
    | {
        /**
         * The drawn triangles exceed the caller's budget; a larger budget
         * completes the check.
         */
        status: "over-budget";

        /** How far the budget fell short. */
        reason: string;
      }
    | {
        /**
         * The surface cannot be checked: an unreadable drawable, a non-finite
         * vertex or an invalid budget.
         */
        status: "unmeasured";

        /** Why the check cannot run. */
        reason: string;
      };
}

/** Signed distance from the plane to the box corner furthest inside it. */
function innermost(box: Box3, plane: Plane): number {
  const { x, y, z }: Vector3 = plane.normal;
  return (
    x * (x >= 0 ? box.max.x : box.min.x) +
    y * (y >= 0 ? box.max.y : box.min.y) +
    z * (z >= 0 ? box.max.z : box.min.z) +
    plane.constant
  );
}

/**
 * Whether a polygon vertex lies outside a side plane beyond the arithmetic and
 * skin slack.
 */
function leaves(
  polygon: readonly Vector3[],
  count: number,
  sides: readonly Plane[],
  slack: number,
): boolean {
  for (let k: number = 0; k < count; ++k)
    for (const plane of sides)
      if (
        plane.distanceToPoint(polygon[k]!) <
        -(slack + rounding(plane, polygon[k]!))
      )
        return true;
  return false;
}

/**
 * Absolute area of the polygon's projection in normalized device units
 * (shoelace formula).
 */
function projectedArea(
  polygon: readonly Vector3[],
  count: number,
  projection: Matrix4,
  scratch: Vector3[],
): number {
  for (let k: number = 0; k < count; ++k)
    scratch[k]!.copy(polygon[k]!).applyMatrix4(projection);
  let twice: number = 0;
  for (let k: number = 0; k < count; ++k) {
    const a: Vector3 = scratch[k]!;
    const b: Vector3 = scratch[(k + 1) % count]!;
    twice += a.x * b.y - b.x * a.y;
  }
  return Math.abs(twice) / 2;
}

/** Rounding slack of one plane evaluation, 32 ulps of its largest term. */
function rounding(plane: Plane, point: Vector3): number {
  return (
    32 *
    Number.EPSILON *
    (1 +
      Math.abs(plane.normal.x * point.x) +
      Math.abs(plane.normal.y * point.y) +
      Math.abs(plane.normal.z * point.z) +
      Math.abs(plane.constant))
  );
}

/**
 * Keep the part of a convex polygon on the plane's inner side
 * (Sutherland-Hodgman). A triangle clipped by the near plane and then the four
 * sides has at most eight vertices.
 */
function clip(
  polygon: readonly Vector3[],
  count: number,
  plane: Plane,
  output: Vector3[],
): number {
  let written: number = 0;
  for (let k: number = 0; k < count; ++k) {
    const current: Vector3 = polygon[k]!;
    const next: Vector3 = polygon[(k + 1) % count]!;
    const a: number = plane.distanceToPoint(current);
    const b: number = plane.distanceToPoint(next);
    if (a >= 0) output[written++]!.copy(current);
    if (a >= 0 !== b >= 0)
      output[written++]!.lerpVectors(current, next, a / (a - b));
  }
  return written;
}
