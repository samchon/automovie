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
  return (final) => {
    const gaze = final.positions[iris];
    const center = portraitEyeSphereIntersection(
      sphere,
      p(gaze[0], gaze[1], gaze[2]),
      direction,
    );
    const optical = createMetricMeshPart(
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
    for (let i = 0; i < final.groups.length; i++)
      if (
        final.groups[i] === lidGroup ||
        ((performance !== undefined || shape.opticalFrame === "radial") &&
          final.indices
            .slice(3 * i, 3 * i + 3)
            .some((id) => final.positions[id][2] > sphere.center.z))
      )
        indices.push(...final.indices.slice(3 * i, 3 * i + 3));
    // Full triangle overlap catches an optical bulge between
    // clear lid vertices. Retain host IDs so all neighbouring
    // skin receives one shared contact target and normal field.
    const constraints = portraitMinimumDirectionalSurfaceTargets(
      {
        positions: final.positions.flatMap((point) =>
          point.map((v) => v / 1000),
        ),
        indices,
        normals: null,
        uvs: null,
        skin: null,
      },
      optical,
      direction,
      shape.lidThickness / 1000,
    ).map(({ vertex, target }) => ({
      vertex,
      reach: shape.lidContactReach ?? 3,
      target: [target.x * 1000, target.y * 1000, target.z * 1000],
    }));
    // Contact fixes the required points; the same geodesic skin
    // adapter used by initial component fitting carries their
    // movement into surrounding tissue. A pointwise clamp alone
    // leaves a hard platform at the optical footprint boundary.
    const adapted = blendPortraitSkin(
      final.positions.map((point) => [...point]),
      [...final.indices],
      constraints,
    );
    if (performance?.blink === 1) {
      // Both margins start on the same closed seam. Triangle
      // contact on either side may need a different clearance;
      // share the farther forward target rather than reopening
      // their coincident edge during the collision correction.
      const pairs = new Map<string, number[]>();
      const vertices = new Set<number>();
      for (let i = 0; i < final.groups.length; i++)
        if (final.groups[i] === lidGroup)
          final.indices
            .slice(3 * i, 3 * i + 3)
            .forEach((id) => vertices.add(id));
      for (const id of vertices) {
        const key = final.positions[id].join("/");
        pairs.set(key, [...(pairs.get(key) ?? []), id]);
      }
      for (const ids of pairs.values()) {
        const depth = (id: number) =>
          adapted[id][0] * direction.x +
          adapted[id][1] * direction.y +
          adapted[id][2] * direction.z;
        const winner = ids.reduce((best, id) =>
          depth(id) > depth(best) ? id : best,
        );
        for (const id of ids) adapted[id] = [...adapted[winner]];
      }
    }
    return adapted.flatMap((target, vertex) =>
      target.some((value, axis) => value !== final.positions[vertex][axis])
        ? [{ vertex, target }]
        : [],
    );
  };
}
