import type { IAutoMovieRigidTransform } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Rigidly carry a copied articulation from its reference root into a declared
 * root frame, preserving every relative joint transform and fixed anchor.
 */
export function rebasePhysicalTargets(
  targets: Readonly<Record<string, IAutoMovieRigidTransform>>,
  root: string,
  pose: IAutoMovieRigidTransform,
): Record<string, IAutoMovieRigidTransform> {
  const original: IAutoMovieRigidTransform = targets[root]!;
  const delta: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
    pose.rotation,
    Quaternion.inverse(original.rotation),
  );
  return Object.fromEntries(
    Object.entries(targets).map(
      ([bone, target]: [string, IAutoMovieRigidTransform]): [
        string,
        IAutoMovieRigidTransform,
      ] => [
        bone,
        {
          position: Vector3.add(
            pose.position,
            Quaternion.rotateVector(
              delta,
              Vector3.subtract(target.position, original.position),
            ),
          ),
          rotation: Quaternion.multiply(delta, target.rotation),
        },
      ],
    ),
  );
}
