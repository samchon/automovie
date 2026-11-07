import { Quaternion, Vector3 } from "@automovie/engine";
import type { AutoMovieHumanSkeleton as Skeleton } from "@automovie/human";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { FilmBodyRig as Rig } from "../motion/rig/FilmBodyRig";
import { FilmVector as V } from "../motion/rig/FilmVector";

/** Recover the displayed actor frame from the final actual pelvis and the original local clinical pelvis. Floor/approach fitting can move that frame; a later authored clip must start from the displayed result rather than the earlier root request. No segment is modified. */
export function boutPhysicalPlacement(
  hips: P.ITransform,
  reference: Skeleton.IPlacement,
): Rig.Placement {
  const local: P.ITransform["rotation"] = {
    x: reference.rotation[0],
    y: reference.rotation[1],
    z: reference.rotation[2],
    w: reference.rotation[3],
  };
  const rotation: P.ITransform["rotation"] = Quaternion.multiply(
    hips.rotation,
    Quaternion.inverse(local),
  );
  return {
    position: V.tuple(
      Vector3.subtract(
        hips.position,
        Quaternion.rotateVector(rotation, V.vector(reference.position)),
      ),
    ),
    rotation: [rotation.x, rotation.y, rotation.z, rotation.w],
  };
}
