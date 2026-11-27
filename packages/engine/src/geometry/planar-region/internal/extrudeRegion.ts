import {
  IAutoMovieMesh,
  type IAutoMovieMeshTarget,
  type IAutoMoviePlanarRegionExtrusion,
  type IAutoMovieProfilePoint,
  type IAutoMovieRegionTriangulation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { emptyMeshTarget } from "../../internal/emptyMeshTarget";
import { positive } from "../../internal/positive";
import { triangulateRegion } from "./triangulateRegion";

/*
 * Extrude a free-form planar region, holes and all, into a closed prism along
 * local Z spanning `-depth / 2` to `+depth / 2`.
 *
 * `extrudeProfile` hulls its profile, so an L-shaped section, a
 * channel, a frame section and a hollow tube are all refused there. This
 * operation takes any region `AutoMovieEnginePlanarRegion.triangulate` accepts,
 * which also makes it the kernel's arbitrary-shape opening: a wall whose outer
 * ring is the panel and whose holes are an arch, an oculus or any authored
 * outline is one extrusion with real holes, where `buildWall` cuts
 * only rectangles.
 *
 * Every triangle owns its corners, so the crease where a cap meets a side stays
 * sharp. The atlas is metric: a cap carries its own profile XY, mirrored in V
 * on the bottom cap so it reads the right way round from below, and a side
 * carries the distance travelled along its ring as U against Z as V. Each ring
 * is developed from its canonical first point, from zero to its full perimeter,
 * so the side's texture phases meet at that point only when the declared repeat
 * divides the perimeter. That developed frame differs from
 * `buildPolyhedron`'s projected one because a side following an arc is
 * metric only when measured along the arc; both are metres, so one declared
 * scale reads the same on both.
 *
 * The result is a closed 2-manifold whose volume is the region's area times the
 * depth. Inputs are only read; every output buffer is new. A nonpositive depth
 * and an invalid region throw, the latter with the triangulator's diagnostic
 * labelled `polygon`.
 * Parameter props.outer: Outer boundary in local XY metres.
 * Parameter props.holes: Voids through the whole depth.
 * Parameter props.depth: Positive extrusion depth along local Z, in metres.
 * Returns: A closed mesh with flat normals and metric UVs.
 */
export function extrudeRegion(
  props: IAutoMoviePlanarRegionExtrusion,
): IAutoMovieMesh {
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
}

/*
 * The top and bottom caps: outward normal sign and the Z side it sits on.
 */
const CAPS: ReadonlyArray<readonly [outward: 1 | -1, side: 1 | -1]> = [
  [1, 1],
  [-1, -1],
];
