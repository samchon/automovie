import type {
  IAutoMovieFootfallPattern,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { physicalSupportPoint } from "./physicalSupportPoint";
import { physicalSupportRootDrop } from "./physicalSupportRootDrop";
import { solvePhysicalChainTarget } from "./solvePhysicalChainTarget";

/**
 * Feed a changed support placement back to bounded joint goals. Root lowering
 * follows the actual chain reach sphere and an explicit posture budget; it
 * never teleports a body or moves the requested support to hide a residual.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Feed a changed support placement back to bounded joint goals) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Feed a changed support placement back to bounded joint goals) directly over its typed inputs (`input`) as 2 sequential passes (map over Object.entries(input.targets); for-of over input.pattern.limbs), delegating to `physicalSupportRootDrop`, `Object.fromEntries`, `Object.entries(input.targets).map`, `Object.entries`, `solvePhysicalChainTarget`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 32 lines and 5 top-level statements that reuses `physicalSupportRootDrop`, `Object.fromEntries`, `Object.entries(input.targets).map`, `Object.entries`, `solvePhysicalChainTarget` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is 2 sequential passes (map over Object.entries(input.targets); for-of over input.pattern.limbs), performed once per call with 7 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 7 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function planPhysicalSupportTargets(input: {
  /** Actual generic profile. */ profile: P;
  /** Same support paths as the authored planner. */ pattern: IAutoMovieFootfallPattern;
  /** Authored world goals. */ targets: Readonly<Record<string, P.ITransform>>;
  /** Changed endpoint goals, in world metres. */ goals: Readonly<
    Record<string, IAutoMovieVector3>
  >;
  /** Maximum allowed root lowering, metres. */ maximumRootDrop: number;
  /** Per-chain coordinate-descent budget. */ iterations: number;
  /** Metre early-out residual. */ tolerance: number;
}): {
  targets: Record<string, P.ITransform>;
  rootDrop: number;
  residuals: Record<string, number>;
} {
  const rootDrop: number = physicalSupportRootDrop(input);
  let targets: Record<string, P.ITransform> = Object.fromEntries(
    Object.entries(input.targets).map(
      ([bone, pose]: [string, P.ITransform]): [string, P.ITransform] => [
        bone,
        {
          position: { ...pose.position, y: pose.position.y - rootDrop },
          rotation: { ...pose.rotation },
        },
      ],
    ),
  );
  const residuals: Record<string, number> = {};
  for (const limb of input.pattern.limbs) {
    const result: ReturnType<typeof solvePhysicalChainTarget> =
      solvePhysicalChainTarget({
        profile: input.profile,
        chain: limb.chain,
        targets,
        localPoint: limb.localPoint,
        goal:
          input.goals[limb.bone] ??
          physicalSupportPoint(input.targets[limb.bone]!, limb.localPoint),
        iterations: input.iterations,
        tolerance: input.tolerance,
      });
    targets = result.targets;
    residuals[limb.bone] = result.residual;
  }
  return { targets, rootDrop, residuals };
}
