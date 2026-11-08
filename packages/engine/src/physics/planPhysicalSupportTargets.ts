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
