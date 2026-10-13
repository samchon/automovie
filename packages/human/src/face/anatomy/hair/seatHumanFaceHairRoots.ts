import type { IHumanFaceSkinHost as ImportedIHumanFaceSkinHost } from "../skin/IHumanFaceSkinHost";
import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";
import type { IHumanFaceSkinFrame as ImportedIHumanFaceSkinFrame } from "../skin/IHumanFaceSkinFrame";
import { Vector3, interpolateAutoMovieTrianglePoint } from "@automovie/engine";

import { createHumanFaceSkinHost } from "../skin/createHumanFaceSkinHost";
import type { IHumanFaceHairRootReference } from "./IHumanFaceHairRootReference";
import type { IHumanFaceHairRootSeat } from "./IHumanFaceHairRootSeat";
import type { IHumanFaceHairRootSeatsProps } from "./IHumanFaceHairRootSeatsProps";

/**
 * Carry sampled roots from the neutral scalp onto the face as it now stands. A root is a barycentric seat on one triangle of the shared growth domain, so its posed position uses the engine's canonical represented interpolation of those weights over that triangle's current corners. Its outward normal uses the current scalp host's shared vertex normals with those same weights. The common host resolves coordinate seam aliases before supplying the normal field. Adjacent triangles therefore use one continuous normal field at their common edge, rather than introducing a discontinuity into the rooted stem at each source triangle boundary. This is a smooth shading-surface tangent convention, not a new physical scalp surface: the exact triangle collider still admits every stem and ribbon. The root keeps its sequence identity, chart point and triangle; only the seated position and normal follow the shape. The common host owns finite geometry admission and the fallback to the actual triangle plane when a smooth blend is singular or inward.
 *
 * Positions are metres in the head frame, current and neutral alike. Inputs are read only and the seats own their vectors.
 *
 * @evidence contracts/common.md#principled-implementation Canonical represented barycentric interpolation carries neutral root identities to current triangle coordinates.
 * @evidence contracts/common.md#clear-and-simple-design One compiled current skin host supplies continuous seam-aware shading normals for all roots.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shading-normal continuity does not move the physical triangle collider; singular/inward normal handling belongs to the host.
 * @evidence contracts/common.md#meaningful-documentation Root subtype identity is borrowed while current seated positions and normals are owned head-frame metre/unit vectors.
 * @evidence contracts/performance.md#efficient-algorithms Host compilation follows source topology and each root then performs fixed triangle interpolation/frame work.
 * @evidence contracts/performance.md#reuse-equivalent-work All roots share one skin host rather than recompiling it per seat.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned seats own live vectors and borrow root records; the temporary host becomes collectible after mapping.
 */
export function seatHumanFaceHairRoots<T extends IHumanFaceHairRootReference>(
  props: IHumanFaceHairRootSeatsProps<T>,
): IHumanFaceHairRootSeat<T>[] {
  const { indices, current }: IHumanFaceHairRootSeatsProps<T> = props;
  if (props.roots.length === 0) return [];
  const host: ImportedIHumanFaceSkinHost = createHumanFaceSkinHost(indices, current);
  return props.roots.map((root: T): { root: T; seated: ImportedIAutoMovieVector3; normal: ImportedIAutoMovieVector3; } => {
    const frame: ImportedIHumanFaceSkinFrame = host.frame({
      triangle: root.triangle,
      weights: [root.weights[0], root.weights[1], root.weights[2]],
    });
    const seated: ImportedIAutoMovieVector3 = interpolateAutoMovieTrianglePoint(
      [0, 1, 2].map((corner: number): ImportedIAutoMovieVector3 => {
        const vertex: number = indices[3 * root.triangle + corner];
        return Vector3.create(
          current[3 * vertex],
          current[3 * vertex + 1],
          current[3 * vertex + 2],
        );
      }),
      root.weights,
    );
    const normal: ImportedIAutoMovieVector3 = Vector3.create(
      frame.normal[0],
      frame.normal[1],
      frame.normal[2],
    );
    return { root, seated, normal };
  });
}
