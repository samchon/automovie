import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/** Rigidly carry a copied articulation from its reference root into a declared root frame, preserving every relative joint transform and fixed anchor. */
export function rebasePhysicalTargets(
  targets: Readonly<Record<string, P.ITransform>>,
  root: string,
  pose: P.ITransform,
): Record<string, P.ITransform> {
  const original: P.ITransform = targets[root]!;
  const delta: P.ITransform["rotation"] = Quaternion.multiply(
    pose.rotation,
    Quaternion.inverse(original.rotation),
  );
  return Object.fromEntries(
    Object.entries(targets).map(
      ([bone, target]: [string, P.ITransform]): [string, P.ITransform] => [
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
