import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { twoBoneChainArticulation } from "../kinematics/twoBoneChainArticulation";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalJointPoint } from "./physicalJointPoint";
import { physicalSupportPoint } from "./physicalSupportPoint";

/**
 * Seed a straight-chain singularity with the shared triangle solver, through bounded coordinates only.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Seed a straight-chain singularity with the shared triangle solver, through bounded coordinates only) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Seed a straight-chain singularity with the shared triangle solver, through bounded coordinates only) directly over its typed inputs (`input`) as nested iteration of depth 2 (for-of over input.chain; find over input.profile.joints; map over joint.axes) plus a sort, delegating to `Vector3.length`, `Vector3.subtract`, `point`, `distinct.at`, `distinct.push`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 3, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 155 lines and 31 top-level statements that reuses `Vector3.length`, `Vector3.subtract`, `point`, `distinct.at`, `distinct.push` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 14 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (for-of over input.chain; find over input.profile.joints; map over joint.axes) plus a sort, performed once per call with 9 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 9 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function seedPhysicalChainTarget(input: {
  /** Admitted tree and coordinate bounds. */ profile: P;
  /** Declared proximal-to-distal chain. */ chain: readonly string[];
  /** Working motor goals, mutated only through rotate. */ targets: Record<
    string,
    P.ITransform
  >;
  /** Requested support endpoint. */ goal: IAutoMovieVector3;
  /** Bone-local terminal endpoint, metres. */ localPoint?: IAutoMovieVector3;
  /** Metre degeneracy threshold. */ tolerance: number;
  /** The caller's range-limited subtree update. */ rotate: (
    joint: P.IJoint,
    axis: P.IAxis,
    request: number,
  ) => void;
}): void {
  const distinct: string[] = [];
  for (const bone of input.chain)
    if (
      !distinct.length ||
      Vector3.length(Vector3.subtract(point(bone), point(distinct.at(-1)!))) >
        input.tolerance
    )
      distinct.push(bone);
  const endpoint: IAutoMovieVector3 = physicalSupportPoint(
    input.targets[input.chain.at(-1)!]!,
    input.localPoint,
  );
  const virtual: boolean =
    distinct.length === 2 &&
    Vector3.length(Vector3.subtract(endpoint, point(distinct[1]!))) >
      input.tolerance;
  if (distinct.length < 3 && !virtual) return;
  const first: string = distinct[0]!;
  const middle: string = distinct[1]!;
  const tip: string | undefined = virtual ? undefined : distinct[2]!;
  const tipPoint: IAutoMovieVector3 = tip ? point(tip) : endpoint;
  const upper: IAutoMovieVector3 = Vector3.subtract(
    point(middle),
    point(first),
  );
  const lower: IAutoMovieVector3 = Vector3.subtract(tipPoint, point(middle));
  if (Vector3.length(Vector3.cross(upper, lower)) > input.tolerance ** 2)
    return;
  const joint: P.IJoint | undefined = input.profile.joints.find(
    (candidate: (typeof input.profile.joints)[number]): boolean =>
      candidate.child === middle,
  );
  if (!joint?.axes.length) return;
  const frame: P.ITransform["rotation"] = Quaternion.multiply(
    input.targets[joint.parent]!.rotation,
    joint.parentFrame.rotation,
  );
  const goal: IAutoMovieVector3 = Vector3.subtract(
    input.goal,
    Vector3.subtract(endpoint, tipPoint),
  );
  const plane: IAutoMovieVector3 = Vector3.cross(
    Vector3.subtract(goal, point(first)),
    upper,
  );
  const axes: { axis: P.IAxis; direction: IAutoMovieVector3; score: number }[] =
    joint.axes
      .map(
        (
          axis: (typeof joint.axes)[number],
        ): { axis: P.IAxis; direction: IAutoMovieVector3; score: number } => {
          const direction: IAutoMovieVector3 = Quaternion.rotateVector(frame, {
            x: axis.axis === "x" ? 1 : 0,
            y: axis.axis === "y" ? 1 : 0,
            z: axis.axis === "z" ? 1 : 0,
          });
          return {
            axis,
            direction,
            score:
              Vector3.length(plane) > 0
                ? Math.abs(Vector3.dot(direction, plane))
                : axis.maximum - axis.minimum,
          };
        },
      )
      .sort(
        (
          a: { axis: P.IAxis; direction: IAutoMovieVector3; score: number },
          b: { axis: P.IAxis; direction: IAutoMovieVector3; score: number },
        ): number => b.score - a.score,
      );
  const chosen: (typeof axes)[number] = axes[0]!;
  const originalUpper: P.ITransform["rotation"] = {
    ...input.targets[first]!.rotation,
  };
  const originalLower: P.ITransform["rotation"] = {
    ...input.targets[middle]!.rotation,
  };
  const originalTip: P.ITransform["rotation"] | undefined = tip
    ? { ...input.targets[tip]!.rotation }
    : undefined;
  const solution: ReturnType<typeof twoBoneChainArticulation> =
    twoBoneChainArticulation({
      upper: { worldPosition: point(first), worldRotation: originalUpper },
      lower: { worldPosition: point(middle), worldRotation: originalLower },
      end: tipPoint,
      target: goal,
      bendNormal: Vector3.scale(
        chosen.direction,
        chosen.axis.maximum >= -chosen.axis.minimum ? -1 : 1,
      ),
    });
  if (!solution) return;
  const upperWorld: P.ITransform["rotation"] = Quaternion.multiply(
    originalUpper,
    solution.upper,
  );
  const delta: P.ITransform["rotation"] = Quaternion.multiply(
    upperWorld,
    Quaternion.inverse(originalUpper),
  );
  fit(first, upperWorld);
  fit(
    middle,
    Quaternion.multiply(
      Quaternion.multiply(delta, originalLower),
      solution.lower,
    ),
  );
  if (tip && originalTip) fit(tip, originalTip);

  /** Resolve actual anchors, including off-centre primitive origins. */
  function point(bone: string): IAutoMovieVector3 {
    return physicalJointPoint(input.profile, bone, input.targets);
  }

  /** Project the analytic orientation through only the declared bounded motor axes. */
  function fit(bone: string, world: P.ITransform["rotation"]): void {
    const targetJoint: P.IJoint | undefined = input.profile.joints.find(
      (candidate: (typeof input.profile.joints)[number]): boolean =>
        candidate.child === bone,
    );
    if (!targetJoint) return;
    for (let pass: number = 0; pass < 3; pass++)
      for (const axis of targetJoint.axes) {
        const parentFrame: P.ITransform["rotation"] = Quaternion.multiply(
          input.targets[targetJoint.parent]!.rotation,
          targetJoint.parentFrame.rotation,
        );
        const inverse: P.ITransform["rotation"] =
          Quaternion.inverse(parentFrame);
        const current: P.ITransform["rotation"] = Quaternion.multiply(
          inverse,
          Quaternion.multiply(
            input.targets[bone]!.rotation,
            targetJoint.childFrame.rotation,
          ),
        );
        const desired: P.ITransform["rotation"] = Quaternion.multiply(
          inverse,
          Quaternion.multiply(world, targetJoint.childFrame.rotation),
        );
        const angle: number =
          2 * Math.atan2(desired[axis.axis], desired.w) -
          2 * Math.atan2(current[axis.axis], current.w);
        input.rotate(
          targetJoint,
          axis,
          Math.atan2(Math.sin(angle), Math.cos(angle)),
        );
      }
  }
}
