import type { IAutoMovieRigidTransform } from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

/*
 * Rigidly carry a copied articulation from its reference root into a declared
 * root frame, preserving every relative joint transform and fixed anchor.
 */
export function rebasePhysicalTargets(
  targets: Readonly<Record<string, IAutoMovieRigidTransform>>,
  root: string,
  pose: IAutoMovieRigidTransform,
): Record<string, IAutoMovieRigidTransform> {
  const original: IAutoMovieRigidTransform = targets[root]!;
  const delta: IAutoMovieRigidTransform["rotation"] = AutoMovieEngineQuaternion.multiply(
    pose.rotation,
    AutoMovieEngineQuaternion.inverse(original.rotation),
  );
  return Object.fromEntries(
    Object.entries(targets).map(
      ([bone, target]: [string, IAutoMovieRigidTransform]): [
        string,
        IAutoMovieRigidTransform,
      ] => [
        bone,
        {
          position: AutoMovieEngineVector3.add(
            pose.position,
            AutoMovieEngineQuaternion.rotateVector(
              delta,
              AutoMovieEngineVector3.subtract(target.position, original.position),
            ),
          ),
          rotation: AutoMovieEngineQuaternion.multiply(delta, target.rotation),
        },
      ],
    ),
  );
}
