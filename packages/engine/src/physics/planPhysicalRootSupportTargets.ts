import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { planPhysicalSupportTargets } from "./planPhysicalSupportTargets";
import { rebasePhysicalTargets } from "./rebasePhysicalTargets";

/** Correct support joint goals for the root's actual placement, so root tracking error does not become foot sliding. */
export function planPhysicalRootSupportTargets(input: {
  /** Provider and finite support-feedback budget. */ body: Simulation.IBody;
  /** Interpolated authored world targets. */ targets: Record<
    string,
    P.ITransform
  >;
  /** Actual root body frame. */ root: { bone: string; pose: P.ITransform };
  /** Joint coordinates already owned by a simultaneous balance posture task. Only disjoint endpoint chains are fitted here. */ excluded?: ReadonlySet<string>;
}): Record<string, P.ITransform> {
  const policy: NonNullable<Simulation.IBody["supportTracking"]> =
    input.body.supportTracking!;
  const limbs: typeof policy.pattern.limbs = policy.pattern.limbs.filter(
    (limb: (typeof policy.pattern.limbs)[number]): boolean =>
      limb.chain.length >= 2 &&
      !limb.chain.some(
        (bone: string): boolean => input.excluded?.has(bone) ?? false,
      ),
  );
  if (!limbs.length || (policy.iterations ?? 24) === 0) return input.targets;
  const targets: Record<string, P.ITransform> = rebasePhysicalTargets(
    input.targets,
    input.root.bone,
    input.root.pose,
  );
  const goals: Record<string, IAutoMovieVector3> = Object.fromEntries(
    limbs.map((limb: (typeof limbs)[number]): [string, IAutoMovieVector3] => [
      limb.bone,
      physicalSupportPoint(input.targets[limb.bone]!, limb.localPoint),
    ]),
  );
  return planPhysicalSupportTargets({
    profile: input.body.profile,
    pattern: { ...policy.pattern, limbs },
    targets,
    goals,
    maximumRootDrop: 0,
    iterations: policy.iterations ?? 24,
    tolerance: policy.tolerance ?? 0.001,
  }).targets;
}
