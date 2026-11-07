import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieVector3 as V,
} from "@automovie/interface";

import { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
import type { AutoMovieHumanSupportFrame as Frame } from "./AutoMovieHumanSupportFrame";

/**
 * The four canonical physical foot boxes as exact rigid corner populations for
 * Human grounding. These are the declared collision envelopes derived from
 * construction dimensions, not vertices of missing generated foot skin.
 * Shape transforms already use the matching Human FK's bind-relative frame.
 * Equipment colliders are excluded; callers declaring shoes must supply their
 * own complete outer geometry to Grounding instead.
 */
export function AutoMovieHumanPhysicalFootPoints(profile: P): Frame.IPoint[] {
  const points: Frame.IPoint[] = [];
  for (const bone of [
    "leftSubtalar",
    "leftMidfoot",
    "rightSubtalar",
    "rightMidfoot",
  ]) {
    const segment: P.ISegment | undefined = profile.segments.find(
      (candidate: P.ISegment): boolean => candidate.bone === bone,
    );
    const shape: P.IShape | undefined = segment?.shapes.find(
      (candidate: P.IShape): boolean => candidate.id === "surface",
    );
    if (!shape || shape.kind !== "box")
      throw new Error(
        `Human grounding requires the declared physical foot envelope: ${bone}`,
      );
    for (const x of [-1, 1])
      for (const y of [-1, 1])
        for (const z of [-1, 1]) {
          const point: V = Vector3.add(
            shape.transform.position,
            Quaternion.rotateVector(shape.transform.rotation, {
              x: x * shape.halfExtents.x,
              y: y * shape.halfExtents.y,
              z: z * shape.halfExtents.z,
            }),
          );
          points.push({
            bone: Controls.joint(bone),
            localPoint: [point.x, point.y, point.z],
          });
        }
  }
  return points;
}
