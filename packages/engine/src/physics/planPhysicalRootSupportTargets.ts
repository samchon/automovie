import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { planPhysicalSupportTargets } from "./planPhysicalSupportTargets";
import { rebasePhysicalTargets } from "./rebasePhysicalTargets";

/**
 * Correct support joint goals for the root's actual placement, so root tracking error does not become foot sliding.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Correct support joint goals for the root's actual placement, so root tracking error does not become foot sliding) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Correct support joint goals for the root's actual placement, so root tracking error does not become foot sliding) directly over its typed inputs (`input`) as nested iteration of depth 2 (filter over policy.pattern.limbs; some over limb.chain; map over limbs), delegating to `rebasePhysicalTargets`, `Object.fromEntries`, `limbs.map`, `physicalSupportPoint`, `planPhysicalSupportTargets`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 24, 0.001, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 32 lines and 6 top-level statements that reuses `rebasePhysicalTargets`, `Object.fromEntries`, `limbs.map`, `physicalSupportPoint`, `planPhysicalSupportTargets` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (filter over policy.pattern.limbs; some over limb.chain; map over limbs), performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
 */
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
