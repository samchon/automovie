/**
 * Extrude a validated planar region with holes into a centred closed solid.
 * Asset authors call this through proceduralMesh. Canonical triangulation owns
 * ring order and cap connectivity; this module owns metric side/cap UVs and
 * winding. Input rings are untouched, output buffers are new, and depth is
 * positive metres along local Z. Texture placement and topology consume these
 * same emitted coordinates rather than reconstructing the input region.
 */
import { IAutoMovieMesh } from "@automovie/interface";

import { positive } from "./proceduralDimensions";
import { emptyMeshTarget } from "./proceduralMeshBuffers";
import { IAutoMovieProfilePoint } from "./proceduralMeshTypes";
import { triangulateRegion } from "./proceduralRegionTriangulation";

/**
 * Extrude a free-form region, holes and all, into a closed prism along local Z.
 *
 * [extrudeAutoMovieProfile](./proceduralConvexProfile.ts) hulls its profile, so an L-shaped section, a
 * channel, a frame section, and a hollow tube are all refused there. This one
 * takes the region [triangulateAutoMovieRegion](./proceduralRegionTriangulation.ts) accepts, which is what
 * makes it also the arbitrary-shape opening this kernel otherwise lacks: a wall
 * whose outer ring is the panel and whose holes are an arch, a round oculus, or
 * any authored outline is one extrusion, and the opening is a real hole in the
 * solid rather than a rectangle [buildAutoMovieWall](./proceduralWall.ts) could cut.
 *
 * Every triangle owns its corners, so the crease where a cap meets a side stays
 * a crease instead of being averaged into a rounded seam the way the older
 * builders leave it. The atlas is measured in metres and stated rather than
 * guessed: a cap carries its own profile coordinates, and a side carries the
 * distance travelled along its ring against the height along Z. Each ring is
 * cut at its canonical first point, from zero to its full perimeter; the phases
 * meet only when the declared repeat divides that perimeter. That is the
 * developed frame rather than the projected one [buildAutoMoviePolyhedron](./proceduralPolyhedron.ts)
 * uses, because a side that follows an arc is only metric when it is measured
 * along the arc; both are metres, so one declared scale reads the same on both.
 *
 * The result is a closed 2-manifold whose volume is the region's area times the
 * depth, spanning `-depth / 2` to `+depth / 2` like the convex extrusion.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Extrudes a canonical region while retaining every declared hole.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Produces a closed manifold from the region's boundary topology.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-surface-coordinate-convention Emits the developed half of the shared surface coordinate convention.
 */
export const extrudeAutoMovieRegion = (props: {
  outer: readonly IAutoMovieProfilePoint[];
  holes?: ReadonlyArray<readonly IAutoMovieProfilePoint[]>;
  depth: number;
}): IAutoMovieMesh => {
  positive(props.depth, "polygon extrusion depth");
  const plan = triangulateRegion(props.outer, props.holes ?? [], "polygon");
  const half = props.depth / 2;
  const target = emptyMeshTarget();
  for (const [outward, cap] of [
    [1, half],
    [-1, -half],
  ] as ReadonlyArray<readonly [1 | -1, number]>) {
    const base = target.positions.length / 3;
    for (const point of plan.points) {
      target.positions.push(point.x, point.y, cap);
      target.normals.push(0, 0, outward);
      target.uvs.push(point.x, point.y * outward);
    }
    for (let at = 0; at < plan.triangles.length; at += 3)
      target.indices.push(
        base + plan.triangles[at]!,
        base + plan.triangles[at + (outward === 1 ? 1 : 2)]!,
        base + plan.triangles[at + (outward === 1 ? 2 : 1)]!,
      );
  }
  for (const span of plan.rings) {
    let along = 0;
    for (let step = 0; step < span.count; ++step) {
      const from = plan.points[span.start + step]!;
      const to = plan.points[span.start + ((step + 1) % span.count)]!;
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      const normal = {
        x: (to.y - from.y) / length,
        y: (from.x - to.x) / length,
        z: 0,
      };
      const base = target.positions.length / 3;
      for (const [point, z, u] of [
        [from, half, along],
        [from, -half, along],
        [to, -half, along + length],
        [to, half, along + length],
      ] as ReadonlyArray<readonly [IAutoMovieProfilePoint, number, number]>) {
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
