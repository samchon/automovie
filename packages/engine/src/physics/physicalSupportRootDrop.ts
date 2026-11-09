import type {
  IAutoMovieFootfallPattern,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { physicalJointPoint } from "./physicalJointPoint";
import { physicalSupportPoint } from "./physicalSupportPoint";

/**
 * Compute the unchanged reach-sphere root-lowering request without running endpoint IK whose poses would be discarded. This is a bounded motor intent, never a correction to an actual root.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Compute the unchanged reach-sphere root-lowering request without running endpoint IK whose poses would be discarded) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Compute the unchanged reach-sphere root-lowering request without running endpoint IK whose poses would be discarded) directly over its typed inputs (`input`) as nested iteration of depth 2 (for-of over input.pattern.limbs; for loop bounded by i < path.length), delegating to `physicalSupportPoint`, `Vector3.subtract`, `physicalJointPoint`, `Vector3.length`, `path.at`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 53 lines and 3 top-level statements that reuses `physicalSupportPoint`, `Vector3.subtract`, `physicalJointPoint`, `Vector3.length`, `path.at` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 5 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (for-of over input.pattern.limbs; for loop bounded by i < path.length), performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
 */
export function physicalSupportRootDrop(input: {
  /** Actual provider joint frames. */ profile: P;
  /** Declared support paths and optional reach landmarks. */ pattern: IAutoMovieFootfallPattern;
  /** Root-intent frame and coherent articulated placements. */ targets: Readonly<
    Record<string, P.ITransform>
  >;
  /** Explicit world endpoint intent. */ goals: Readonly<
    Record<string, IAutoMovieVector3>
  >;
  /** Nonnegative lowering cap in metres. */ maximumRootDrop: number;
}): number {
  let rootDrop: number = 0;
  for (const limb of input.pattern.limbs) {
    const endpoint: IAutoMovieVector3 = physicalSupportPoint(
      input.targets[limb.bone]!,
      limb.localPoint,
    );
    let goal: IAutoMovieVector3 = input.goals[limb.bone] ?? endpoint;
    const path: readonly string[] = limb.reach
      ? [limb.reach.root, limb.reach.middle, limb.reach.tip]
      : limb.chain;
    if (limb.reach)
      goal = Vector3.subtract(
        goal,
        Vector3.subtract(
          endpoint,
          physicalJointPoint(input.profile, limb.reach.tip, input.targets),
        ),
      );
    const proximal: IAutoMovieVector3 = physicalJointPoint(
      input.profile,
      path[0]!,
      input.targets,
    );
    let length: number = 0;
    for (let i: number = 1; i < path.length; i++)
      length += Vector3.length(
        Vector3.subtract(
          physicalJointPoint(input.profile, path[i]!, input.targets),
          physicalJointPoint(input.profile, path[i - 1]!, input.targets),
        ),
      );
    if (!limb.reach)
      length += Vector3.length(
        Vector3.subtract(
          endpoint,
          physicalJointPoint(input.profile, path.at(-1)!, input.targets),
        ),
      );
    const horizontal: number = Math.hypot(
      goal.x - proximal.x,
      goal.z - proximal.z,
    );
    if (horizontal < length)
      rootDrop = Math.max(
        rootDrop,
        proximal.y -
          goal.y -
          Math.sqrt(length * length - horizontal * horizontal),
      );
  }
  return Math.min(input.maximumRootDrop, Math.max(0, rootDrop));
}
