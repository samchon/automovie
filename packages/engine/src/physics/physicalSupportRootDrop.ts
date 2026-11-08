import type {
  IAutoMovieFootfallPattern,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { physicalJointPoint } from "./physicalJointPoint";
import { physicalSupportPoint } from "./physicalSupportPoint";

/** Compute the unchanged reach-sphere root-lowering request without running endpoint IK whose poses would be discarded. This is a bounded motor intent, never a correction to an actual root. */
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
