import {
  Quaternion,
  Vector3,
  combinePhysicalMassProperties,
} from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A performer's physical profile as a simulated window solves it: each hand and
 * every segment below it welded into one rigid body.
 *
 * A ragdoll does not simulate the fingers as their own small bodies: their
 * phalanges weigh grams on joints a hand's own motion whips past their limits,
 * so standard practice welds them to the hand, or drives them kinematically
 * from it (Unity's and Unreal's ragdoll setups put one body on the hand;
 * Unreal's Physics Asset tool skips bones below a minimum size). Here each
 * finger's colliders and mass are moved into its hand's frame at the pose the
 * window starts in, and the combined mass, centre and inertia are the
 * parallel-axis sum (`combinePhysicalMassProperties`). The displayed fingers
 * then keep the performance's own curl over the solved hand
 * (`readHumanSimulatedPose`), the kinematic drive.
 *
 * @param profile The performer's profile.
 * @param displayed The displayed world segment frames at the window's start,
 *   every segment.
 * @returns A fresh profile with the hands welded; the same total mass.
 */
export function weldHumanSimulationProfile(
  profile: IAutoMoviePhysicalProfile,
  displayed: Readonly<Record<string, IAutoMovieRigidTransform>>,
): IAutoMoviePhysicalProfile {
  const children: Map<string, string[]> = new Map();
  for (const joint of profile.joints)
    children.set(joint.parent, [
      ...(children.get(joint.parent) ?? []),
      joint.child,
    ]);
  const welded: Map<string, string> = new Map();
  const below: (hand: string, bone: string) => void = (
    hand: string,
    bone: string,
  ): void => {
    for (const child of children.get(bone) ?? []) {
      welded.set(child, hand);
      below(hand, child);
    }
  };
  for (const hand of HANDS)
    if (
      profile.segments.some(
        (s: IAutoMoviePhysicalSegment): boolean => s.bone === hand,
      )
    )
      below(hand, hand);
  if (welded.size === 0) return profile;
  const segment: (bone: string) => IAutoMoviePhysicalSegment = (
    bone: string,
  ): IAutoMoviePhysicalSegment =>
    profile.segments.find(
      (s: IAutoMoviePhysicalSegment): boolean => s.bone === bone,
    )!;
  const segments: IAutoMoviePhysicalSegment[] = profile.segments
    .filter((s: IAutoMoviePhysicalSegment): boolean => !welded.has(s.bone))
    .map((s: IAutoMoviePhysicalSegment): IAutoMoviePhysicalSegment => {
      const fingers: string[] = [...welded]
        .filter(([, hand]: [string, string]): boolean => hand === s.bone)
        .map(([bone]: [string, string]): string => bone);
      if (fingers.length === 0) return s;
      const frame: IAutoMovieRigidTransform = displayed[s.bone]!;
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(frame.rotation);

      // A finger's frame in the hand's frame at the window's start.
      const relative: (bone: string) => IAutoMovieRigidTransform = (
        bone: string,
      ): IAutoMovieRigidTransform => ({
        position: Quaternion.rotateVector(
          inverse,
          Vector3.subtract(displayed[bone]!.position, frame.position),
        ),
        rotation: Quaternion.multiply(inverse, displayed[bone]!.rotation),
      });
      const place: (
        at: IAutoMovieRigidTransform,
        point: IAutoMovieVector3,
      ) => IAutoMovieVector3 = (
        at: IAutoMovieRigidTransform,
        point: IAutoMovieVector3,
      ): IAutoMovieVector3 =>
        Vector3.add(at.position, Quaternion.rotateVector(at.rotation, point));
      const parts: IAutoMovieCombinePhysicalMassProperties.IPart[] = [
        {
          mass: s.mass,
          centerOfMass: s.centerOfMass,
          inertia: s.inertia,
          inertiaRotation: s.inertiaRotation,
        },
      ];
      const shapes: IAutoMoviePhysicalShape[] = [...s.shapes];
      for (const bone of fingers) {
        const finger: IAutoMoviePhysicalSegment = segment(bone);
        const at: IAutoMovieRigidTransform = relative(bone);
        parts.push({
          mass: finger.mass,
          centerOfMass: place(at, finger.centerOfMass),
          inertia: finger.inertia,
          inertiaRotation: Quaternion.multiply(
            at.rotation,
            finger.inertiaRotation,
          ),
        });
        for (const shape of finger.shapes)
          shapes.push({
            ...shape,
            id: `${bone}.${shape.id}`,
            transform: {
              position: place(at, shape.transform.position),
              rotation: Quaternion.multiply(
                at.rotation,
                shape.transform.rotation,
              ),
            },
          });
      }
      const whole: IAutoMovieCombinePhysicalMassProperties.IPart =
        combinePhysicalMassProperties(parts);
      return {
        ...s,
        mass: whole.mass,
        centerOfMass: whole.centerOfMass,
        inertia: whole.inertia,
        inertiaRotation: whole.inertiaRotation,
        shapes,
      };
    });
  const carrier: (bone: string) => string = (bone: string): string =>
    welded.get(bone) ?? bone;
  const exclusions: NonNullable<
    IAutoMoviePhysicalProfile["collisionExclusions"]
  > = [];
  for (const pair of profile.collisionExclusions ?? []) {
    const a: string = carrier(pair.a);
    const b: string = carrier(pair.b);
    if (
      a !== b &&
      !exclusions.some(
        (kept: (typeof exclusions)[number]): boolean =>
          (kept.a === a && kept.b === b) || (kept.a === b && kept.b === a),
      )
    )
      exclusions.push({ a, b, reason: pair.reason });
  }
  return {
    ...profile,
    centerOfMass: Vector3.scale(
      segments.reduce(
        (
          sum: IAutoMovieVector3,
          s: IAutoMoviePhysicalSegment,
        ): IAutoMovieVector3 =>
          Vector3.add(
            sum,
            Vector3.scale(
              Vector3.add(
                s.neutral.position,
                Quaternion.rotateVector(s.neutral.rotation, s.centerOfMass),
              ),
              s.mass,
            ),
          ),
        { x: 0, y: 0, z: 0 },
      ),
      1 / profile.mass,
    ),
    segments,
    joints: profile.joints.filter(
      (joint: IAutoMoviePhysicalJoint): boolean => !welded.has(joint.child),
    ),
    collisionExclusions: exclusions,
    provenance: `${profile.provenance} Fingers welded to their hands at a simulated window's first pose.`,
  };
}

/** Companion readers of {@link weldHumanSimulationProfile}. */
export namespace weldHumanSimulationProfile {
  /**
   * Each welded hand's finger joints in a pose: the joints of the body's
   * segments the solved profile folds into a hand, by that hand. A window holds
   * the displayed fingers at these, the shape the hand was welded in.
   *
   * @param body The performer's body.
   * @param profile The welded profile.
   * @param pose The pose at the window's start.
   * @returns The finger joints by hand bone.
   */
  export function held(
    body: IAutoMovieMotionHumanBody,
    profile: IAutoMoviePhysicalProfile,
    pose: IAutoMoviePose,
  ): Map<string, IAutoMovieJointPose[]> {
    const solved: ReadonlySet<string> = new Set(
      profile.segments.map(
        (segment: IAutoMoviePhysicalSegment): string => segment.bone,
      ),
    );
    const out: Map<string, IAutoMovieJointPose[]> = new Map();
    for (const joint of pose.joints) {
      if (
        solved.has(joint.bone) ||
        !body.profile.segments.some(
          (segment: IAutoMoviePhysicalSegment): boolean =>
            segment.bone === joint.bone,
        )
      )
        continue;
      let at: IAutoMovieBone = body.bones.get(joint.bone)!;
      while (!solved.has(at.bone) && at.parent !== null)
        at = body.bones.get(at.parent)!;
      out.set(at.bone, [...(out.get(at.bone) ?? []), joint]);
    }
    return out;
  }
}

/** The canonical rig's hand bones, the bodies the fingers weld to. */
const HANDS: readonly string[] = ["leftHand", "rightHand"];
