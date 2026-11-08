import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { physicalJointRelativeRotation } from "./physicalJointRelativeRotation";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
import { resolvePhysicalSupportRedundancy } from "./resolvePhysicalSupportRedundancy";
import { setPhysicalTargetJointRotation } from "./setPhysicalTargetJointRotation";

/**
 * Carry the previous local support correction through an authored change instead of selecting a fresh straight-chain bend branch, then return its support-task null space to the authored posture so unconstrained swivel or patch yaw cannot accumulate across steps. The original world endpoints, root intent and ROM remain the fitting constraints.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Carry the previous local support correction through an authored change instead of selecting a fresh straight-chain bend branch, then return its support-task null space to the authored posture so unconstrained swivel or patch yaw cannot accumulate across steps) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Carry the previous local support correction through an authored change instead of selecting a fresh straight-chain bend branch, then return its support-task null space to the authored posture so unconstrained swivel or patch yaw cannot accumulate across steps) directly over its typed inputs (`input`) as nested iteration of depth 2 (for-of over input.order; for-of over descendants), delegating to `projectPhysicalJointRotation`, `Quaternion.multiply`, `physicalJointRelativeRotation`, `Quaternion.inverse`, `owned.has`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 38 lines and 4 top-level statements that reuses `projectPhysicalJointRotation`, `Quaternion.multiply`, `physicalJointRelativeRotation`, `Quaternion.inverse`, `owned.has` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (for-of over input.order; for-of over descendants), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function warmPhysicalSupportTargets(input: {
  /** Parent-first, run-owned tree order. */ order: readonly P.ISegment[];
  /** Declared parent joints, indexed once. */ joints: ReadonlyMap<
    string,
    P.IJoint
  >;
  /** Run-owned exact descendant sets. */ descendants: ReadonlyMap<
    string,
    readonly string[]
  >;
  /** Coordinates actually owned by this support fit. */ selected: ReadonlySet<string>;
  /** Current authored placements before fitting. */ targets: Readonly<
    Record<string, P.ITransform>
  >;
  /** Authored placements at the preceding completed reference boundary. */ before: Readonly<
    Record<string, P.ITransform>
  >;
  /** The fitted reference at that same boundary. */ previous: Readonly<
    Record<string, P.ITransform>
  >;
  /** Support endpoints and witnesses defining the fit task. */ pattern: IAutoMovieFootfallPattern;
  /** Endpoints whose floor witnesses are planted in this fit. */ planted: ReadonlySet<string>;
  /** The support fit's metre residual tolerance, bounding how far returning posture may move the task. */ tolerance: number;
}): Record<string, P.ITransform> {
  const targets: Record<string, P.ITransform> = { ...input.targets };
  const owned: Set<string> = new Set();
  for (const segment of input.order) {
    const joint: P.IJoint | undefined = input.joints.get(segment.bone);
    if (!joint || !input.selected.has(segment.bone)) continue;
    const relative: P.ITransform["rotation"] = projectPhysicalJointRotation(
      joint,
      Quaternion.multiply(
        Quaternion.multiply(
          physicalJointRelativeRotation(input.targets, joint),
          Quaternion.inverse(
            physicalJointRelativeRotation(input.before, joint),
          ),
        ),
        physicalJointRelativeRotation(input.previous, joint),
      ),
    );
    const descendants: readonly string[] = input.descendants.get(joint.child)!;
    for (const bone of descendants)
      if (!owned.has(bone)) {
        targets[bone] = { ...targets[bone]! };
        owned.add(bone);
      }
    setPhysicalTargetJointRotation(targets, joint, descendants, relative);
  }
  return resolvePhysicalSupportRedundancy({
    order: input.order,
    joints: input.joints,
    descendants: input.descendants,
    selected: input.selected,
    pattern: input.pattern,
    planted: input.planted,
    authored: input.targets,
    tolerance: input.tolerance,
    seed: targets,
  });
}
