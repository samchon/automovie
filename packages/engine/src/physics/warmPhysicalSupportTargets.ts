import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
import { resolvePhysicalSupportRedundancy } from "./resolvePhysicalSupportRedundancy";
import { setPhysicalTargetJointRotation } from "./setPhysicalTargetJointRotation";

/** Carry the previous local support correction through an authored change instead of selecting a fresh straight-chain bend branch, then return its support-task null space to the authored posture so unconstrained swivel or patch yaw cannot accumulate across steps. The original world endpoints, root intent and ROM remain the fitting constraints. */
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
          rotation(input.targets, joint),
          Quaternion.inverse(rotation(input.before, joint)),
        ),
        rotation(input.previous, joint),
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
    seed: targets,
  });
}

/** Read the same parent/child joint frames used by the native motor owner. */
function rotation(
  poses: Readonly<Record<string, P.ITransform>>,
  joint: P.IJoint,
): P.ITransform["rotation"] {
  return Quaternion.multiply(
    Quaternion.inverse(
      Quaternion.multiply(
        poses[joint.parent]!.rotation,
        joint.parentFrame.rotation,
      ),
    ),
    Quaternion.multiply(
      poses[joint.child]!.rotation,
      joint.childFrame.rotation,
    ),
  );
}
