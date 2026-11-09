import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
import { seedPhysicalChainTarget } from "./seedPhysicalChainTarget";
import { setPhysicalTargetJointRotation } from "./setPhysicalTargetJointRotation";

/**
 * Bounded coordinate descent on the admitted profile's actual joint frames.
 * This changes motor targets, never solved bodies. Each angular update stays
 * inside its source-derived box limit and rotates the complete child subtree.
 * The returned residual explicitly retains an unreachable endpoint goal.
 * Unchanged branches are borrowed; every written pose shell is detached first.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Bounded coordinate descent on the admitted profile's actual joint frames) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Bounded coordinate descent on the admitted profile's actual joint frames) directly over its typed inputs (`input`) as nested iteration of depth 3 (every over [input.goal.x, input.goal.y, input.goal.; for-of over input.profile.joints; filter over input.chain .map((bone: string): P.I), delegating to `Number.isSafeInteger`, `Number.isFinite`, `parents.set`, `children.get`, `list.push`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literals 64, 180, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 138 lines and 14 top-level statements that reuses `Number.isSafeInteger`, `Number.isFinite`, `parents.set`, `children.get`, `list.push` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 11 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 3 (every over [input.goal.x, input.goal.y, input.goal.; for-of over input.profile.joints; filter over input.chain .map((bone: string): P.I), performed once per call with 18 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 18 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function solvePhysicalChainTarget(input: {
  /** Admitted physical tree and angular coordinates. */ profile: P;
  /** Proximal-to-distal support path. */ chain: readonly string[];
  /** Authored world placements to copy, never mutate. */ targets: Readonly<
    Record<string, P.ITransform>
  >;
  /** Actual requested endpoint location, metres. */ goal: IAutoMovieVector3;
  /** Optional terminal bone-local support point, metres. */ localPoint?: IAutoMovieVector3;
  /** Positive fixed coordinate-descent budget. */ iterations: number;
  /** Metre early-out residual; no target is silently relocated. */ tolerance: number;
}): { targets: Record<string, P.ITransform>; residual: number } {
  if (
    !Number.isSafeInteger(input.iterations) ||
    input.iterations < 1 ||
    input.iterations > 64 ||
    !(input.tolerance > 0) ||
    !Number.isFinite(input.tolerance) ||
    input.chain.length < 2 ||
    ![input.goal.x, input.goal.y, input.goal.z].every(Number.isFinite)
  )
    throw new Error("Invalid physical chain target or work budget");
  const targets: Record<string, P.ITransform> = { ...input.targets };
  const owned: Set<string> = new Set();
  const parents: Map<string, P.IJoint> = new Map();
  const children: Map<string, string[]> = new Map();
  for (const joint of input.profile.joints) {
    parents.set(joint.child, joint);
    const list: string[] = children.get(joint.parent) ?? [];
    list.push(joint.child);
    children.set(joint.parent, list);
  }
  const endpoint: string = input.chain.at(-1)!;
  const joints: P.IJoint[] = input.chain
    .map((bone: string): P.IJoint | undefined => parents.get(bone))
    .filter(
      (joint: P.IJoint | undefined): joint is P.IJoint => joint !== undefined,
    )
    .reverse();
  const descendants: Map<string, string[]> = new Map(
    joints.map((joint: (typeof joints)[number]): [string, string[]] => {
      const bones: Set<string> = new Set();
      const pending: string[] = [joint.child];
      while (pending.length) {
        const bone: string = pending.pop()!;
        if (bones.has(bone)) continue;
        bones.add(bone);
        pending.push(...(children.get(bone) ?? []));
      }
      return [joint.id, [...bones]];
    }),
  );
  seedPhysicalChainTarget({ ...input, targets, rotate });
  let residual: number = Vector3.length(
    Vector3.subtract(
      physicalSupportPoint(targets[endpoint]!, input.localPoint),
      input.goal,
    ),
  );
  for (
    let iteration: number = 0;
    iteration < input.iterations && residual > input.tolerance;
    iteration++
  ) {
    for (const joint of joints)
      for (const axis of joint.axes) {
        const parent: P.ITransform = targets[joint.parent]!;
        const frame: P.ITransform["rotation"] = Quaternion.multiply(
          parent.rotation,
          joint.parentFrame.rotation,
        );
        const direction: IAutoMovieVector3 = Quaternion.rotateVector(frame, {
          x: axis.axis === "x" ? 1 : 0,
          y: axis.axis === "y" ? 1 : 0,
          z: axis.axis === "z" ? 1 : 0,
        });
        const pivot: IAutoMovieVector3 = Vector3.add(
          parent.position,
          Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
        );
        const from: IAutoMovieVector3 = Vector3.subtract(
          physicalSupportPoint(targets[endpoint]!, input.localPoint),
          pivot,
        );
        const to: IAutoMovieVector3 = Vector3.subtract(input.goal, pivot);
        const a: IAutoMovieVector3 = Vector3.subtract(
          from,
          Vector3.scale(direction, Vector3.dot(from, direction)),
        );
        const b: IAutoMovieVector3 = Vector3.subtract(
          to,
          Vector3.scale(direction, Vector3.dot(to, direction)),
        );
        if (Vector3.length(a) === 0 || Vector3.length(b) === 0) continue;
        const request: number = Math.atan2(
          Vector3.dot(direction, Vector3.cross(a, b)),
          Vector3.dot(a, b),
        );
        rotate(joint, axis, request);
      }
    residual = Vector3.length(
      Vector3.subtract(
        physicalSupportPoint(targets[endpoint]!, input.localPoint),
        input.goal,
      ),
    );
  }
  return { targets, residual };

  /** Apply one admitted angular update to exactly the joint's descendants. */
  function rotate(joint: P.IJoint, axis: P.IAxis, request: number): void {
    const parent: P.ITransform = targets[joint.parent]!;
    const child: P.ITransform = targets[joint.child]!;
    const frame: P.ITransform["rotation"] = Quaternion.multiply(
      parent.rotation,
      joint.parentFrame.rotation,
    );
    const relative: P.ITransform["rotation"] = Quaternion.multiply(
      Quaternion.inverse(frame),
      Quaternion.multiply(child.rotation, joint.childFrame.rotation),
    );
    // A rotation about one free axis can create a locked quaternion coordinate
    // or move another free coordinate outside its box. Admit all of them.
    const localAxis: IAutoMovieVector3 = {
      x: axis.axis === "x" ? 1 : 0,
      y: axis.axis === "y" ? 1 : 0,
      z: axis.axis === "z" ? 1 : 0,
    };
    const candidate: P.ITransform["rotation"] = Quaternion.multiply(
      Quaternion.fromAxisAngle(localAxis, (request * 180) / Math.PI),
      relative,
    );
    const admitted: P.ITransform["rotation"] = projectPhysicalJointRotation(
      joint,
      candidate,
    );
    for (const bone of descendants.get(joint.id)!)
      if (!owned.has(bone)) {
        targets[bone] = { ...targets[bone]! };
        owned.add(bone);
      }
    setPhysicalTargetJointRotation(
      targets,
      joint,
      descendants.get(joint.id)!,
      admitted,
    );
  }
}
