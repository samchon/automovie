import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieMeshTarget } from "./IAutoMovieMeshTarget";
import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { IAutoMovieRegionTriangulation } from "./IAutoMovieRegionTriangulation";
import { emptyMeshTarget } from "./emptyMeshTarget";
import { positive } from "./positive";
import { triangulateRegion } from "./triangulateRegion";

/**
 * Extrude a free-form planar region, holes and all, into a closed prism along
 * local Z spanning `-depth / 2` to `+depth / 2`.
 *
 * `extrudeAutoMovieProfile` hulls its profile, so an L-shaped section, a
 * channel, a frame section and a hollow tube are all refused there. This
 * operation takes any region `triangulateAutoMovieRegion` accepts, which also
 * makes it the kernel's arbitrary-shape opening: a wall whose outer ring is the
 * panel and whose holes are an arch, an oculus or any authored outline is one
 * extrusion with real holes, where `buildAutoMovieWall` cuts only rectangles.
 *
 * Every triangle owns its corners, so the crease where a cap meets a side stays
 * sharp. The atlas is metric: a cap carries its own profile XY, mirrored in V
 * on the bottom cap so it reads the right way round from below, and a side
 * carries the distance travelled along its ring as U against Z as V. Each ring
 * is developed from its canonical first point, from zero to its full
 * perimeter, so the side's texture phases meet at that point only when the
 * declared repeat divides the perimeter. That developed frame differs from
 * `buildAutoMoviePolyhedron`'s projected one because a side following an arc is
 * metric only when measured along the arc; both are metres, so one declared
 * scale reads the same on both.
 *
 * The result is a closed 2-manifold whose volume is the region's area times the
 * depth. Inputs are only read; every output buffer is new. A nonpositive depth
 * and an invalid region throw, the latter with the triangulator's diagnostic
 * labelled `polygon`.
 *
 * @param props.outer Outer boundary in local XY metres.
 * @param props.holes Voids through the whole depth.
 * @param props.depth Positive extrusion depth along local Z, in metres.
 * @returns A closed mesh with flat normals and metric UVs.
 *
 * @evidence contracts/common.md#principled-implementation Caps reuse the canonical counter-clockwise triangulation, reversed for the bottom so both face outward, and each ring edge becomes one outward quad whose normal is the edge direction rotated by -90 degrees in the plane, which is outward for a counter-clockwise outer ring and a clockwise hole alike.
 * @evidence contracts/common.md#clear-and-simple-design Ring validation, winding and triangles come from `triangulateRegion`; this function owns only the lift to 3D, the face normals and the metric atlas, appending to an `emptyMeshTarget`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Vertices are deliberately not shared between caps and sides so creases stay sharp instead of being averaged, and invalid regions are refused rather than repaired.
 * @evidence contracts/common.md#meaningful-documentation States what this accepts that the convex extruder refuses, the crease rule, the cap and side atlas with the seam condition, why the frame is developed, the closure and volume, ownership, and the refusals.
 * @evidence contracts/performance.md#efficient-algorithms After triangulation, whose cost is answered on the triangulator, emission is linear in the point count n: two caps of n vertices and one four-vertex quad per ring edge.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One mesh per authored region and depth; a caller that places the same solid repeatedly can keep the returned mesh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the target's four arrays, holding 6n vertices for n region points, as the mesh's own buffers; the triangulation is released on return.
 */
export const extrudeAutoMovieRegion = (props: {
  /** Outer boundary in local XY metres. */
  outer: readonly IAutoMovieProfilePoint[];

  /** Voids through the whole depth. */
  holes?: ReadonlyArray<readonly IAutoMovieProfilePoint[]>;

  /** Positive extrusion depth along local Z, in metres. */
  depth: number;
}): IAutoMovieMesh => {
  positive(props.depth, "polygon extrusion depth");
  const plan: IAutoMovieRegionTriangulation = triangulateRegion(
    props.outer,
    props.holes ?? [],
    "polygon",
  );
  const half: number = props.depth / 2;
  const target: IAutoMovieMeshTarget = emptyMeshTarget();
  for (const [outward, cap] of CAPS) {
    const base: number = target.positions.length / 3;
    const z: number = cap * half;
    for (const point of plan.points) {
      target.positions.push(point.x, point.y, z);
      target.normals.push(0, 0, outward);
      target.uvs.push(point.x, point.y * outward);
    }
    for (let at: number = 0; at < plan.triangles.length; at += 3)
      target.indices.push(
        base + plan.triangles[at]!,
        base + plan.triangles[at + (outward === 1 ? 1 : 2)]!,
        base + plan.triangles[at + (outward === 1 ? 2 : 1)]!,
      );
  }
  for (const span of plan.rings) {
    let along: number = 0;
    for (let step: number = 0; step < span.count; ++step) {
      const from: IAutoMovieProfilePoint = plan.points[span.start + step]!;
      const to: IAutoMovieProfilePoint =
        plan.points[span.start + ((step + 1) % span.count)]!;
      const length: number = Math.hypot(to.x - from.x, to.y - from.y);
      const normal: IAutoMovieVector3 = {
        x: (to.y - from.y) / length,
        y: (from.x - to.x) / length,
        z: 0,
      };
      const base: number = target.positions.length / 3;
      const corners: ReadonlyArray<
        readonly [IAutoMovieProfilePoint, number, number]
      > = [
        [from, half, along],
        [from, -half, along],
        [to, -half, along + length],
        [to, half, along + length],
      ];
      for (const [point, z, u] of corners) {
        target.positions.push(point.x, point.y, z);
        target.normals.push(normal.x, normal.y, normal.z);
        target.uvs.push(u, z);
      }
      target.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
      along += length;
    }
  }
  return { ...target, skin: null };
};

/** The top and bottom caps: outward normal sign and the Z side it sits on. */
const CAPS: ReadonlyArray<readonly [outward: 1 | -1, side: 1 | -1]> = [
  [1, 1],
  [-1, -1],
];
