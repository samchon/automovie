import type {
  IAutoMovieFitPhysicalWholeBodyTarget,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieRigidTransform,
  IAutoMovieSolvePhysicalArticulationTargets,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { rerootPhysicalProfile } from "./rerootPhysicalProfile";
import { solvePhysicalArticulationTargets } from "./solvePhysicalArticulationTargets";

/**
 * Fit a whole articulated body to one endpoint goal while a support segment
 * stays held, turning only about its contact.
 *
 * The tree is held from the support ({@link rerootPhysicalProfile}), and a
 * virtual base hinges onto it at the contact point about the contact normal
 * within the declared turn, so the old root (a pelvis) rotates, tilts and
 * translates through the support chain's own joints while the reaching chain
 * reaches. Every coordinate stays inside its own declared ROM, the contact
 * point never moves, and the bounded articulation solver
 * ({@link solvePhysicalArticulationTargets}) accepts only residual decreases.
 * The residual is the goal point's world error in metres and, when an approach
 * is declared, the weighted difference between the endpoint's local direction
 * carried to world and the approach direction.
 *
 * @returns World poses of every original segment, and the residual report.
 */
export function fitPhysicalWholeBodyTarget(
  input: IAutoMovieFitPhysicalWholeBodyTarget.IInput,
): IAutoMovieFitPhysicalWholeBodyTarget.IResult {
  const pivot: string = `${input.support.bone}:pivot`;
  if (
    input.profile.segments.some(
      (s: IAutoMoviePhysicalSegment): boolean => s.bone === pivot,
    )
  )
    throw new Error(`Physical pivot name ${pivot} is taken`);
  const held: IAutoMovieRigidTransform = input.targets[input.support.bone]!;
  const frame: IAutoMovieRigidTransform["rotation"] = along(
    input.support.normal,
  );
  const rerooted: IAutoMoviePhysicalProfile = rerootPhysicalProfile(
    input.profile,
    input.support.bone,
  );
  const inverted: Set<string> = new Set(
    rerooted.joints
      .filter(
        (joint: IAutoMoviePhysicalJoint, k: number): boolean =>
          joint !== input.profile.joints[k],
      )
      .map((joint: IAutoMoviePhysicalJoint): string => joint.id),
  );

  // A virtual base hinged onto the support at its contact, about its normal.
  const profile: IAutoMoviePhysicalProfile = {
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
      .filter((joint: IAutoMoviePhysicalJoint): boolean =>
        input.bones.includes(joint.child),
      )
      .map((joint: IAutoMoviePhysicalJoint): string =>
        inverted.has(joint.id) ? joint.parent : joint.child,
      ),
  ];
  const measure = (
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  ): number[] => {
    const pose: IAutoMovieRigidTransform = poses[input.goal.bone]!;
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
  const solved: IAutoMovieSolvePhysicalArticulationTargets.IResult =
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
  const targets: Record<string, IAutoMovieRigidTransform> = {
    ...solved.targets,
  };
  delete targets[pivot];
  return {
    targets,
    residual: solved.residual,
    position: Math.hypot(rows[0]!, rows[1]!, rows[2]!),
    approach: Math.hypot(rows[3]!, rows[4]!, rows[5]!),
  };
}

/** The rotation taking +x to a unit direction by the shortest arc. */
function along(
  direction: IAutoMovieVector3,
): IAutoMovieRigidTransform["rotation"] {
  const d: IAutoMovieVector3 = Vector3.normalize(direction);
  if (d.x < -1 + 1e-12) return { x: 0, y: 0, z: 1, w: 0 };
  const half: number = Math.sqrt((1 + d.x) / 2);
  const s: number = 1 / (2 * half);
  return { x: 0, y: -d.z * s, z: d.y * s, w: half };
}
