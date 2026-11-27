import { Quaternion, Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieFitHumanPhysicalStandingPose,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalSegment,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/** The arm opening's resolution, degrees. */
const RESOLUTION: number = 1e-9;

/** A probe turn that tells outward from inward, degrees. */
const PROBE: number = 1;

/** The profile one standing transfer reads. */
type Profile = IAutoMovieFitHumanPhysicalStandingPose.IInput["profile"];

/**
 * Opening a standing Human's arms at the physics handoff
 * (`AutoMovieHumanPhysicalStandingPose.fit`) so no arm collider starts inside the body.
 *
 * A displayed arm hangs with its forearm resting on the waist: the motion
 * audit admits 10 mm of self-penetration there as the skin's give, and the
 * relaxed stance leaves the forearm 2 mm inside the spine's hull (m-average;
 * 10 mm m-large, none f-small or m-tall). Rigid colliders have no give, and
 * an overlapping pair the profile does not exclude is pushed apart on the
 * first substep. So each arm turns about its shoulder's native abduction
 * axis, outward, by the least angle at which every collider of the arm stands
 * the fit's tolerance clear of every collider outside it, the profile's
 * declared pivot overlaps excepted: 0.5 degrees (m-average; 2.1 degrees
 * m-large). The tolerance keeps the pair apart in the native world: left
 * touching, its single-precision placement sets the forearm in contact with
 * the spine and m-average loses its quiet stance. The arm keeps its own shape
 * and the rest of the body is untouched.
 */
export namespace HumanPhysicalArmRoom {
  /**
   * Open both arms in place.
   *
   * @param profile The canonical Human profile.
   * @param poses The seeded segment frames, changed in place.
   * @param clearance The gap the arm keeps from every other collider, metres: the fit's contact tolerance.
   * @returns False when an arm stays inside the body across its shoulder's abduction range.
   */
  export function open(
    profile: Profile,
    poses: Record<string, IAutoMovieRigidTransform>,
    clearance: number,
  ): boolean {
    for (const side of ["left", "right"] as const)
      if (!openArm(profile, poses, side, clearance)) return false;
    return true;
  }
}

/** Open one arm; false when no abduction in range clears it. */
function openArm(
  profile: Profile,
  poses: Record<string, IAutoMovieRigidTransform>,
  side: "left" | "right",
  clearance: number,
): boolean {
  const root: string = `${side}UpperArm`;
  const arm: Set<string> = carried(profile, root);
  const limbs: IAutoMoviePhysicalSegment[] = profile.segments.filter(
    (segment: IAutoMoviePhysicalSegment): boolean => arm.has(segment.bone),
  );
  const rest: IAutoMoviePhysicalSegment[] = profile.segments.filter(
    (segment: IAutoMoviePhysicalSegment): boolean => !arm.has(segment.bone),
  );
  const original: Record<string, IAutoMovieRigidTransform> = Object.fromEntries(
    limbs.map(
      (
        segment: IAutoMoviePhysicalSegment,
      ): [string, IAutoMovieRigidTransform] => [
        segment.bone,
        poses[segment.bone]!,
      ],
    ),
  );
  const clear = (turned: Readonly<Record<string, IAutoMovieRigidTransform>>) =>
    limbs.every((limb: IAutoMoviePhysicalSegment): boolean =>
      rest.every(
        (other: IAutoMoviePhysicalSegment): boolean =>
          AutoMovieEnginePhysics.isPhysicalProfilePairExcluded(profile, limb.bone, other.bone) ||
          limb.shapes.every((a): boolean =>
            other.shapes.every(
              (b): boolean =>
                AutoMovieEnginePhysics.physicalShapePairDistance(
                  turned[limb.bone]!,
                  a,
                  poses[other.bone]!,
                  b,
                ) >= clearance,
            ),
          ),
      ),
    );
  if (clear(original)) return true;

  const joint: IAutoMoviePhysicalJoint = profile.joints.find(
    (candidate: IAutoMoviePhysicalJoint): boolean => candidate.child === root,
  )!;
  const channel: IAutoMoviePhysicalJointAxis | undefined = joint.axes.find(
    (axis: IAutoMoviePhysicalJointAxis): boolean =>
      axis.channel === `${root}.abduction`,
  );
  if (channel === undefined) return false;
  const pivot: IAutoMovieVector3 = AutoMovieEnginePhysics.physicalSupportPoint(
    poses[root]!,
    joint.childFrame.position,
  );
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(
      poses[joint.parent]!.rotation,
      joint.parentFrame.rotation,
    ),
    { x: 0, y: 0, z: 0, [channel.axis]: 1 },
  );
  const turn = (degrees: number): Record<string, IAutoMovieRigidTransform> => {
    const by: IAutoMovieQuaternion = Quaternion.fromAxisAngle(axis, degrees);
    return Object.fromEntries(
      limbs.map(
        (
          segment: IAutoMoviePhysicalSegment,
        ): [string, IAutoMovieRigidTransform] => {
          const from: IAutoMovieRigidTransform = original[segment.bone]!;
          return [
            segment.bone,
            {
              position: Vector3.add(
                pivot,
                Quaternion.rotateVector(
                  by,
                  Vector3.subtract(from.position, pivot),
                ),
              ),
              rotation: Quaternion.multiply(by, from.rotation),
            },
          ];
        },
      ),
    );
  };

  // Outward is the sense that carries the elbow away from the pelvis's
  // vertical line; the bracket is the abduction range on that side.
  const elbow = (
    turned: Readonly<Record<string, IAutoMovieRigidTransform>>,
  ) => {
    const at: IAutoMovieVector3 = AutoMovieEnginePhysics.physicalSupportPoint(
      turned[`${side}LowerArm`]!,
      profile.joints.find(
        (candidate: IAutoMoviePhysicalJoint): boolean =>
          candidate.child === `${side}LowerArm`,
      )!.childFrame.position,
    );
    return Math.hypot(
      at.x - poses.hips!.position.x,
      at.z - poses.hips!.position.z,
    );
  };
  const sense: number = elbow(turn(PROBE)) > elbow(turn(-PROBE)) ? 1 : -1;
  let high: number =
    ((sense > 0 ? channel.maximum : -channel.minimum) * 180) / Math.PI;
  if (!(high > 0) || !clear(turn(sense * high))) return false;
  let low: number = 0;
  while (high - low > RESOLUTION) {
    const middle: number = (low + high) / 2;
    if (clear(turn(sense * middle))) high = middle;
    else low = middle;
  }
  Object.assign(poses, turn(sense * high));
  return true;
}

/** The bones a joint's child carries: itself and every bone below it. */
function carried(profile: Profile, root: string): Set<string> {
  const out: Set<string> = new Set([root]);
  for (let grown: boolean = true; grown; ) {
    grown = false;
    for (const joint of profile.joints)
      if (out.has(joint.parent) && !out.has(joint.child)) {
        out.add(joint.child);
        grown = true;
      }
  }
  return out;
}
