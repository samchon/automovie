import { Vector3 } from "@automovie/engine";

import { createHumanFaceSkinHost } from "../skin/createHumanFaceSkinHost";
import type { IHumanFaceHairRootReference } from "./IHumanFaceHairRootReference";
import type { IHumanFaceHairRootSeat } from "./IHumanFaceHairRootSeat";
import type { IHumanFaceHairRootSeatsProps } from "./IHumanFaceHairRootSeatsProps";

/**
 * Carry sampled roots from the neutral scalp onto the face as it now stands.
 * A root is a barycentric seat on one triangle of the shared growth domain, so
 * its posed position is the same weights over that triangle's current
 * corners, and its outward normal interpolates the current scalp host's shared
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
 *
 * @evidence contracts/common.md#principled-implementation The canonical sampler seat is read through the common skin host, so position, seam-resolved normal interpolation and singular/inward fallback share one definition with other attached parts. Sampler weights sum to one and exact collision geometry remains unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One pure function from roots, indices and current positions to seats, extracted from the builder so that the builder only orders the stages.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case for a subject or shape; every root is seated by the same rule, and degenerate triangles are refused earlier by the root sampler.
 * @evidence contracts/common.md#meaningful-documentation The comment states what a seat is, what follows the shape and what does not, the frame and where a degenerate triangle is refused.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function seats points and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function returns one seat per root it is given and emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Current positions and seats are metres in the head frame of the evaluated face, the weights are dimensionless, and the only conversion is neutral barycentric seat to current point.
 * @evidence contracts/modeling.md#shared-boundaries The seat lies on its exact shared scalp triangle while its normal uses the common skin host's coordinate-seam-resolved normal definition. Edge normal interpolation agrees across adjacent source triangles. Exact triangle collision still certifies the resulting geometry; smooth tangent interpolation supplies no collision exemption.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint and displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a human form through this function; the roots come from the sampler.
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
    const seated = Vector3.create(
      frame.point[0],
      frame.point[1],
      frame.point[2],
    );
    const normal = Vector3.create(
      frame.normal[0],
      frame.normal[1],
      frame.normal[2],
    );
    return { root, seated, normal };
  });
}
