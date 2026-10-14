import type { IPortraitFinalSurfaceHost } from "../../surface/structures/IPortraitFinalSurfaceHost";

/**
 * Final skin-contact provider used by the eye component after shared refinement.
 * Rebuild the same fixed optical/canthal support used for drawing, measure
 * complete triangle deficits along the observation ray in engine metres, then
 * return head-millimetre proposals without mutating the supplied final mesh.
 * Geodesic skin propagation follows the joint minimum-travel targets. Closed
 * rim correspondences share the foremost result before proposals are returned.
 * This establishes directional clearance, not anatomical section shape.
 */
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { createMetricMeshPart } from "../../mesh/createMetricMeshPart";
import { millimetrePoint as p } from "../../mesh/millimetrePoint";
import { portraitEyeSphereIntersection } from "../../surface/portraitEyeSphereIntersection";
import { portraitMinimumDirectionalSurfaceTargets } from "../../surface/portraitMinimumDirectionalSurfaceTargets";
import { type IPortraitEyeSphere } from "../../surface/structures/IPortraitEyeSphere";
import type { IPortraitFinalSurface } from "../../surface/structures/IPortraitFinalSurface";
import { blendPortraitSkin } from "../skin/blendPortraitSkin";
import { buildPortraitEyeContactBasis } from "./buildPortraitEyeContactBasis";
import type { IPortraitEyePerformance } from "./structures/IPortraitEyePerformance";
import type { IPortraitEyeShape } from "./structures/IPortraitEyeShape";

/**
 * Resolve final shared skin against this eye's actual optical volume.
 * Closed margins share the foremost correction along the observation ray,
 * so independent triangle contacts cannot reopen their coincident seam.
 *
 * The provider is called once per finished mesh. It rebuilds the contact basis
 * from the eye's own optical support at the current iris position, tests every
 * skin triangle of the eyelid group (and, with performance or the radial frame,
 * every triangle with a vertex in front of the globe centre) against it along the
 * observation ray with `lidThickness` clearance, spreads each required
 * movement to neighbouring skin by the geodesic adapter over `lidContactReach`
 * millimetres (3 when omitted), and at full closure moves both coincident
 * margins to the more forward of their two targets. Head millimetres are the
 * unit of the mesh and of the returned proposals; the contact query itself runs
 * in engine metres, with the explicit division by 1000 on the way in and the
 * multiplication on the way out. Only vertices whose target differs from their
 * position are returned, and the supplied mesh is not modified.
 *
 * @evidence contracts/common.md#principled-implementation Actual refined skin triangles are measured against the canonical optical volume along the recorded ray, then shared geodesic targets preserve closed-margin coincidence.
 * @evidence contracts/common.md#clear-and-simple-design One final-surface callback owns contact proposals while optical construction and skin propagation stay canonical helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Directional clearance is not anatomical section acquisition; missed support and dependent failures propagate without mutating the input final mesh.
 * @evidence contracts/common.md#meaningful-documentation The prose states head millimetres, engine metre queries, retained full-globe membership and closure sharing.
 * @evidence contracts/performance.md#efficient-algorithms Selected skin/support triangle contact and sparse skin propagation dominate, with full incident populations and solver costs included.
 * @evidence contracts/performance.md#reuse-equivalent-work One actual optical support feeds all final triangle queries; closed aliases share the most forward resulting target.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The callback retains its eye inputs for plan lifetime; returned proposals own their arrays and per-call meshes/solver state expire.
 */
export function createPortraitEyeSurfaceContact({
  iris,
  sphere,
  shape,
  direction,
  lidGroup,
  performance,
  canthal,
}: {
  iris: number;
  sphere: IPortraitEyeSphere;
  shape: IPortraitEyeShape;
  direction: IAutoMovieVector3;
  lidGroup: number;
  performance?: IPortraitEyePerformance;
  canthal?: IAutoMovieMesh;
}): IPortraitFinalSurface {
  return (final: IPortraitFinalSurfaceHost): { vertex: number; target: number[]; }[]  => {
    const gaze: readonly number[] = final.positions[iris];
    const center: IAutoMovieVector3 = portraitEyeSphereIntersection(
      sphere,
      p(gaze[0], gaze[1], gaze[2]),
      direction,
    );
    const optical: IAutoMovieMesh = createMetricMeshPart(
      "corneal-contact-basis",
      buildPortraitEyeContactBasis(
        center,
        sphere,
        shape,
        [],
        performance,
        canthal,
      ),
      "skin",
    ).geometry.mesh;
    const indices: number[] = [];
    for (let i: number = 0; i < final.groups.length; i++)
      if (
        final.groups[i] === lidGroup ||
        ((performance !== undefined || shape.opticalFrame === "radial") &&
          final.indices
            .slice(3 * i, 3 * i + 3)
            .some((id: number): boolean  => final.positions[id][2] > sphere.center.z))
      )
        indices.push(...final.indices.slice(3 * i, 3 * i + 3));
    // Full triangle overlap catches an optical bulge between
    // clear lid vertices. Retain host IDs so all neighbouring
    // skin receives one shared contact target and normal field.
    const constraints: { vertex: number; reach: number; target: number[]; }[] = portraitMinimumDirectionalSurfaceTargets(
      {
        positions: final.positions.flatMap((point: readonly number[]): number[]  =>
          point.map((v: number): number  => v / 1000),
        ),
        indices,
        normals: null,
        uvs: null,
        skin: null,
      },
      optical,
      direction,
      shape.lidThickness / 1000,
    ).map(({ vertex, target }: { vertex: number; target: IAutoMovieVector3; }): { vertex: number; reach: number; target: number[]; }  => ({
      vertex,
      reach: shape.lidContactReach ?? 3,
      target: [target.x * 1000, target.y * 1000, target.z * 1000],
    }));
    // Contact fixes the required points; the same geodesic skin
    // adapter used by initial component fitting carries their
    // movement into surrounding tissue. A pointwise clamp alone
    // leaves a hard platform at the optical footprint boundary.
    const adapted: number[][] = blendPortraitSkin(
      final.positions.map((point: readonly number[]): number[]  => [...point]),
      [...final.indices],
      constraints,
    );
    if (performance?.blink === 1) {
      // Both margins start on the same closed seam. Triangle
      // contact on either side may need a different clearance;
      // share the farther forward target rather than reopening
      // their coincident edge during the collision correction.
      const pairs: Map<string, number[]> = new Map<string, number[]>();
      const vertices: Set<number> = new Set<number>();
      for (let i: number = 0; i < final.groups.length; i++)
        if (final.groups[i] === lidGroup)
          final.indices
            .slice(3 * i, 3 * i + 3)
            .forEach((id: number): Set<number>  => vertices.add(id));
      for (const id of vertices) {
        const key: string = final.positions[id].join("/");
        pairs.set(key, [...(pairs.get(key) ?? []), id]);
      }
      for (const ids of pairs.values()) {
        const depth: (id: number) => number = (id: number): number  =>
          adapted[id][0] * direction.x +
          adapted[id][1] * direction.y +
          adapted[id][2] * direction.z;
        const winner: number = ids.reduce((best: number, id: number): number  =>
          depth(id) > depth(best) ? id : best,
        );
        for (const id of ids) adapted[id] = [...adapted[winner]];
      }
    }
    return adapted.flatMap((target: number[], vertex: number): { vertex: number; target: number[]; }[]  =>
      target.some((value: number, axis: number): boolean  => value !== final.positions[vertex][axis])
        ? [{ vertex, target }]
        : [],
    );
  };
}
