import { Vector3, interpolateAutoMovieTrianglePoint } from "@automovie/engine";

import { createHumanFaceSkinHost } from "../skin/createHumanFaceSkinHost";
import type { IHumanFaceHairRootReference } from "./IHumanFaceHairRootReference";
import type { IHumanFaceHairRootSeat } from "./IHumanFaceHairRootSeat";
import type { IHumanFaceHairRootSeatsProps } from "./IHumanFaceHairRootSeatsProps";

/**
 * Carry sampled roots from the neutral scalp onto the face as it now stands.
 * A root is a barycentric seat on one triangle of the shared growth domain, so
 * its posed position uses the engine's canonical represented interpolation of
 * those weights over that triangle's current corners. Its outward normal uses
 * the current scalp host's shared
 * vertex normals with those same weights. The common host resolves coordinate
 * seam aliases before supplying the normal field. Adjacent triangles therefore
 * use one continuous normal field at their common edge, rather than introducing
 * a discontinuity into the rooted stem at each source triangle boundary.
 * This is a smooth shading-surface tangent convention, not a new physical scalp
 * surface: the exact triangle collider still admits every stem and ribbon.
 * The root keeps its sequence identity,
 * chart point and triangle; only the seated position and normal follow the
 * shape. The common host owns finite geometry admission and the fallback to
 * the actual triangle plane when a smooth blend is singular or inward.
 *
 * Positions are metres in the head frame, current and neutral alike. Inputs
 * are read only and the seats own their vectors.
 */
export function seatHumanFaceHairRoots<T extends IHumanFaceHairRootReference>(
  props: IHumanFaceHairRootSeatsProps<T>,
): IHumanFaceHairRootSeat<T>[] {
  const { indices, current } = props;
  if (props.roots.length === 0) return [];
  const host = createHumanFaceSkinHost(indices, current);
  return props.roots.map((root) => {
    const frame = host.frame({
      triangle: root.triangle,
      weights: [root.weights[0], root.weights[1], root.weights[2]],
    });
    const seated = interpolateAutoMovieTrianglePoint(
      [0, 1, 2].map((corner) => {
        const vertex = indices[3 * root.triangle + corner];
        return Vector3.create(
          current[3 * vertex],
          current[3 * vertex + 1],
          current[3 * vertex + 2],
        );
      }),
      root.weights,
    );
    const normal = Vector3.create(
      frame.normal[0],
      frame.normal[1],
      frame.normal[2],
    );
    return { root, seated, normal };
  });
}
