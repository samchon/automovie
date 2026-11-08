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
/** Result shapes of {@link fitPhysicalWholeBodyTarget}. */
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
