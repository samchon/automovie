import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Rigidly carry a copied articulation from its reference root into a declared root frame, preserving every relative joint transform and fixed anchor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Rigidly carry a copied articulation from its reference root into a declared root frame, preserving every relative joint transform and fixed anchor) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Rigidly carry a copied articulation from its reference root into a declared root frame, preserving every relative joint transform and fixed anchor) directly over its typed inputs (`targets`, `root`, `pose`) as a single pass (map over Object.entries(targets)), delegating to `Quaternion.multiply`, `Quaternion.inverse`, `Object.fromEntries`, `Object.entries(targets).map`, `Object.entries`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 24 lines and 3 top-level statements that reuses `Quaternion.multiply`, `Quaternion.inverse`, `Object.fromEntries`, `Object.entries(targets).map`, `Object.entries` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `targets`, `root`, `pose`; the dominant cost is a single pass (map over Object.entries(targets)), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
 */
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
