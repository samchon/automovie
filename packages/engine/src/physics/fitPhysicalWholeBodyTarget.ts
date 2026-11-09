import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { rerootPhysicalProfile } from "./rerootPhysicalProfile";
import { solvePhysicalArticulationTargets } from "./solvePhysicalArticulationTargets";

/**
 * Fit a whole articulated body to one endpoint goal while a support segment
 * stays held, turning only about its contact.
 *
 * The tree is held from the support ({@link rerootPhysicalProfile}), and a
 * virtual base hinges onto it at the contact point about the contact normal
 * within the declared turn, so the old root (a pelvis) rotates, tilts and
 * translates through the support chain's own joints while the reaching
 * chain reaches. Every coordinate stays inside its own declared ROM, the
 * contact point never moves, and the bounded articulation solver
 * ({@link solvePhysicalArticulationTargets}) accepts only residual
 * decreases. The residual is the goal point's world error in metres and,
 * when an approach is declared, the weighted difference between the
 * endpoint's local direction carried to world and the approach direction.
 *
 * @returns World poses of every original segment, and the residual report.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Fit a whole articulated body to one endpoint goal while a support segment stays held, turning only about its contact) and documents the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Fit a whole articulated body to one endpoint goal while a support segment stays held, turning only about its contact) directly over its typed inputs (`input`) as nested iteration of depth 2 (some over input.profile.segments; map over rerooted.joints .filter( (; filter over rerooted.joints), delegating to `along`, `rerootPhysicalProfile`, `Quaternion.rotateVector`, `Quaternion.inverse`, `Vector3.subtract`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literals 3, 4, 5, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 119 lines and 14 top-level statements that reuses `along`, `rerootPhysicalProfile`, `Quaternion.rotateVector`, `Quaternion.inverse`, `Vector3.subtract` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 8 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (some over input.profile.segments; map over rerooted.joints .filter( (; filter over rerooted.joints), performed once per call with 30 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 30 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function fitPhysicalWholeBodyTarget(input: {
  /** Admitted fixed-pivot tree. */ profile: P;
  /** Current world pose of every segment. */ targets: Readonly<
    Record<string, P.ITransform>
  >;
  /** The held support and its bounded turn about the contact normal. */ support: {
    /** Held segment. */ bone: string;
    /** World contact point, metres. */ point: IAutoMovieVector3;
    /** Unit world contact normal the support may turn about. */ normal: IAutoMovieVector3;
    /** Lower turn, radians. */ minimum: number;
    /** Upper turn, radians. */ maximum: number;
  };
  /** Segments whose joint toward the old root may move: the support chain, the trunk and the reaching chain. */ bones: readonly string[];
  /** The endpoint goal. */ goal: {
    /** Segment carrying the endpoint. */ bone: string;
    /** Endpoint in that segment's frame, metres. */ localPoint: IAutoMovieVector3;
    /** World goal point, metres. */ point: IAutoMovieVector3;
    /** Optional arrival direction: the segment's local direction should point along it. */ approach?: {
      /** Unit direction in the segment's frame. */ localDirection: IAutoMovieVector3;
      /** Unit world direction. */ direction: IAutoMovieVector3;
      /** Metres of residual per unit of direction difference; positive. */ weight: number;
    };
  };
  /** Positive update budget, at most 64. */ iterations: number;
  /** Positive residual early-out, metres. */ tolerance: number;
}): fitPhysicalWholeBodyTarget.IResult {
  const pivot: string = `${input.support.bone}:pivot`;
  if (input.profile.segments.some((s: P.ISegment): boolean => s.bone === pivot))
    throw new Error(`Physical pivot name ${pivot} is taken`);
  const held: P.ITransform = input.targets[input.support.bone]!;
  const frame: P.ITransform["rotation"] = along(input.support.normal);
  const rerooted: P = rerootPhysicalProfile(input.profile, input.support.bone);
  const inverted: Set<string> = new Set(
    rerooted.joints
      .filter(
        (joint: P.IJoint, k: number): boolean =>
          joint !== input.profile.joints[k],
      )
      .map((joint: P.IJoint): string => joint.id),
  );

  // A virtual base hinged onto the support at its contact, about its normal.
  const profile: P = {
    ...rerooted,
    segments: [
      ...rerooted.segments,
      {
        bone: pivot,
        neutral: { position: { ...input.support.point }, rotation: frame },
        mass: 0,
        centerOfMass: { x: 0, y: 0, z: 0 },
        inertia: { x: 0, y: 0, z: 0 },
        inertiaRotation: { x: 0, y: 0, z: 0, w: 1 },
        shapes: [],
      },
    ],
    joints: [
      ...rerooted.joints,
      {
        id: pivot,
        parent: pivot,
        child: input.support.bone,
        parentFrame: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        childFrame: {
          position: Quaternion.rotateVector(
            Quaternion.inverse(held.rotation),
            Vector3.subtract(input.support.point, held.position),
          ),
          rotation: Quaternion.multiply(
            Quaternion.inverse(held.rotation),
            frame,
          ),
        },
        axes: [
          {
            axis: "x",
            minimum: input.support.minimum,
            maximum: input.support.maximum,
            stiffness: 0,
            damping: 0,
            maximumTorque: 0,
            channel: `${pivot}.turn`,
          },
        ],
      },
    ],
  };

  // A listed segment moves by its joint toward the old root, which after
  // inversion is the joint whose child is its old parent.
  const moving: string[] = [
    input.support.bone,
    ...input.profile.joints
      .filter((joint: P.IJoint): boolean => input.bones.includes(joint.child))
      .map((joint: P.IJoint): string =>
        inverted.has(joint.id) ? joint.parent : joint.child,
      ),
  ];
  const measure = (poses: Readonly<Record<string, P.ITransform>>): number[] => {
    const pose: P.ITransform = poses[input.goal.bone]!;
    const error: IAutoMovieVector3 = Vector3.subtract(
      Vector3.add(
        pose.position,
        Quaternion.rotateVector(pose.rotation, input.goal.localPoint),
      ),
      input.goal.point,
    );
    const approach: typeof input.goal.approach = input.goal.approach;
    const turned: IAutoMovieVector3 = approach
      ? Vector3.scale(
          Vector3.subtract(
            Quaternion.rotateVector(pose.rotation, approach.localDirection),
            approach.direction,
          ),
          approach.weight,
        )
      : { x: 0, y: 0, z: 0 };
    return [error.x, error.y, error.z, turned.x, turned.y, turned.z];
  };
  const solved: ReturnType<typeof solvePhysicalArticulationTargets> =
    solvePhysicalArticulationTargets({
      profile,
      bones: [...new Set(moving)],
      targets: {
        ...input.targets,
        [pivot]: { position: { ...input.support.point }, rotation: frame },
      },
      measure,
      iterations: input.iterations,
      tolerance: input.tolerance,
    });
  const rows: number[] = measure(solved.targets);
  const targets: Record<string, P.ITransform> = { ...solved.targets };
  delete targets[pivot];
  return {
    targets,
    residual: solved.residual,
    position: Math.hypot(rows[0]!, rows[1]!, rows[2]!),
    approach: Math.hypot(rows[3]!, rows[4]!, rows[5]!),
  };
}
/**
 * Result shapes of {@link fitPhysicalWholeBodyTarget}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Result shapes of ) and documents 1 documented member as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Result shapes of : companion namespace of 1 member (`IResult`); units and frames named in its text: world, metres. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `fitPhysicalWholeBodyTarget` in packages/engine/src/physics/fitPhysicalWholeBodyTarget.ts; its surface is the 1 member listed and the text shows 3 other files naming it, mostly packages/engine (2), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace fitPhysicalWholeBodyTarget {
  /** A whole-body fit and its residual report. */
  export interface IResult {
    /** World pose of every original segment. */
    targets: Record<string, P.ITransform>;

    /** Total residual norm, metres. */
    residual: number;

    /** Endpoint point error, metres. */
    position: number;

    /** Weighted approach direction error, metres; zero without an approach. */
    approach: number;
  }
}

/** The rotation taking +x to a unit direction by the shortest arc. */
function along(direction: IAutoMovieVector3): P.ITransform["rotation"] {
  const d: IAutoMovieVector3 = Vector3.normalize(direction);
  if (d.x < -1 + 1e-12) return { x: 0, y: 0, z: 1, w: 0 };
  const half: number = Math.sqrt((1 + d.x) / 2);
  const s: number = 1 / (2 * half);
  return { x: 0, y: -d.z * s, z: d.y * s, w: half };
}
