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
 * A performer's physical profile as a simulated window solves it: the segments
 * a reference humanoid gives no joint welded into the segment above them.
 *
 * The weld set is the MuJoCo humanoid's (google-deepmind/mujoco,
 * `model/humanoid/humanoid.xml` at 395129bbd3976e9e6163ab5d3c480234f665d55a,
 * Apache-2.0, "Copyright 2021 DeepMind Technologies Limited"): its `hand_right`
 * and `hand_left` bodies carry no joint and ride their lower arms, its `head`
 * carries none and rides the torso, and its feet are leaf bodies with no toes.
 * So each hand with its fingers is welded into its forearm, each foot's toes
 * into the foot, and the neck with the head into the chest (`WELDS`). Each
 * welded segment's colliders and mass are moved into its carrier's frame at the
 * pose the window starts in, and the combined mass, centre and inertia are the
 * parallel-axis sum (`combinePhysicalMassProperties`). The displayed welded
 * bones keep their articulation at the window's start over the solved carrier
 * (`readHumanSimulatedPose`), the kinematic drive.
 *
 * @param profile The performer's profile.
 * @param displayed The displayed world segment frames at the window's start,
 *   every segment.
 * @returns A fresh profile with the welds applied; the same total mass.
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

  // Each welded bone by the segment that carries it: a weld's root and every
  // bone below it ride the root's parent segment.
  const welded: Map<string, string> = new Map();
  const below: (carrier: string, bone: string) => void = (
    carrier: string,
    bone: string,
  ): void => {
    welded.set(bone, carrier);
    for (const child of children.get(bone) ?? []) below(carrier, child);
  };
  for (const root of WELDS) {
    const joint: IAutoMoviePhysicalJoint | undefined = profile.joints.find(
      (candidate: IAutoMoviePhysicalJoint): boolean => candidate.child === root,
    );
    if (joint !== undefined) below(joint.parent, root);
  }
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
      const riders: string[] = [...welded]
        .filter(
          ([bone, carrier]: [string, string]): boolean =>
            carrier === s.bone &&
            profile.segments.some(
              (candidate: IAutoMoviePhysicalSegment): boolean =>
                candidate.bone === bone,
            ),
        )
        .map(([bone]: [string, string]): string => bone);
      if (riders.length === 0) return s;
      const frame: IAutoMovieRigidTransform = displayed[s.bone]!;
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(frame.rotation);

      // A rider's frame in its carrier's frame at the window's start.
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
      for (const bone of riders) {
        const rider: IAutoMoviePhysicalSegment = segment(bone);
        const at: IAutoMovieRigidTransform = relative(bone);
        parts.push({
          mass: rider.mass,
          centerOfMass: place(at, rider.centerOfMass),
          inertia: rider.inertia,
          inertiaRotation: Quaternion.multiply(
            at.rotation,
            rider.inertiaRotation,
          ),
        });
        for (const shape of rider.shapes)
          shapes.push({
            ...shape,
            id: weldHumanSimulationProfile.shapeId(bone, shape.id),
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
  const exclusions: weldHumanSimulationProfile.Exclusion[] = [];
  for (const pair of profile.collisionExclusions ?? []) {
    const a: string = carrier(pair.a);
    const b: string = carrier(pair.b);
    if (
      a !== b &&
      !exclusions.some(
        (kept: weldHumanSimulationProfile.Exclusion): boolean =>
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
    provenance: `${profile.provenance} Hands with their fingers, toes, and neck with head welded at a simulated window's first pose (MuJoCo humanoid.xml).`,
  };
}

/** Companion readers and types of {@link weldHumanSimulationProfile}. */
export namespace weldHumanSimulationProfile {
  /** A collision exclusion of the solved profile. */
  export type Exclusion = NonNullable<
    IAutoMoviePhysicalProfile["collisionExclusions"]
  >[number];

  /**
   * The id a welded segment's collider takes on its carrier: the welded bone's
   * name, a dot, and the collider's own id.
   *
   * @param bone The welded bone.
   * @param shape The collider's id on that bone's segment.
   * @returns The collider's id on the carrier.
   */
  export function shapeId(bone: string, shape: string): string {
    return `${bone}.${shape}`;
  }

  /**
   * The welded bone a carrier's collider came from, the inverse of `shapeId`.
   *
   * @param shape The collider's id on the carrier.
   * @returns The welded bone's name, or null for the carrier's own collider.
   */
  export function rider(shape: string): string | null {
    const dot: number = shape.indexOf(".");
    return dot < 0 ? null : shape.slice(0, dot);
  }

  /**
   * Each carrier's welded joints in a pose: the joints of the body's segments
   * the solved profile folds into a carrier, by that carrier. A window holds
   * the displayed welded bones at these, the articulation they were welded in.
   *
   * @param body The performer's body.
   * @param profile The welded profile.
   * @param pose The pose at the window's start.
   * @returns The welded joints by carrier bone.
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

/**
 * The roots of the subtrees welded into their parent segment: the MuJoCo
 * humanoid's jointless `hand_right`, `hand_left` and `head`, and the toes its
 * leaf feet do not have (`model/humanoid/humanoid.xml` @395129bb). The rig's
 * neck stands between the chest and the head, where MuJoCo's head rides the
 * torso directly, so the neck is the head's weld root.
 */
const WELDS: readonly string[] = [
  "leftHand",
  "rightHand",
  "leftToes",
  "rightToes",
  "neck",
];
