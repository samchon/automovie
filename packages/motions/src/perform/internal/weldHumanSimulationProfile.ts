import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
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
 * profile's neutral pose, as a MuJoCo body without a joint keeps the pose its
 * model defines relative to its parent, and the combined mass, centre and
 * inertia are the parallel-axis sum (`combinePhysicalMassProperties`). The
 * displayed welded bones keep the kinematic pose's articulation over the solved
 * carrier (`readHumanSimulatedPose`).
 * Parameter profile: The performer's profile.
 * Returns: A fresh profile with the welds applied; the same total mass.
 */
export function weldHumanSimulationProfile(
  profile: IAutoMoviePhysicalProfile,
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
      const frame: IAutoMovieRigidTransform = s.neutral;
      const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(frame.rotation);

      // A rider's frame in its carrier's frame at the neutral pose.
      const relative: (bone: string) => IAutoMovieRigidTransform = (
        bone: string,
      ): IAutoMovieRigidTransform => ({
        position: AutoMovieEngineQuaternion.rotateVector(
          inverse,
          AutoMovieEngineVector3.subtract(segment(bone).neutral.position, frame.position),
        ),
        rotation: AutoMovieEngineQuaternion.multiply(inverse, segment(bone).neutral.rotation),
      });
      const place: (
        at: IAutoMovieRigidTransform,
        point: IAutoMovieVector3,
      ) => IAutoMovieVector3 = (
        at: IAutoMovieRigidTransform,
        point: IAutoMovieVector3,
      ): IAutoMovieVector3 =>
        AutoMovieEngineVector3.add(at.position, AutoMovieEngineQuaternion.rotateVector(at.rotation, point));
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
          inertiaRotation: AutoMovieEngineQuaternion.multiply(
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
              rotation: AutoMovieEngineQuaternion.multiply(
                at.rotation,
                shape.transform.rotation,
              ),
            },
          });
      }
      const whole: IAutoMovieCombinePhysicalMassProperties.IPart =
        AutoMovieEnginePhysics.combineMassProperties(parts);
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
    centerOfMass: AutoMovieEngineVector3.scale(
      segments.reduce(
        (
          sum: IAutoMovieVector3,
          s: IAutoMoviePhysicalSegment,
        ): IAutoMovieVector3 =>
          AutoMovieEngineVector3.add(
            sum,
            AutoMovieEngineVector3.scale(
              AutoMovieEngineVector3.add(
                s.neutral.position,
                AutoMovieEngineQuaternion.rotateVector(s.neutral.rotation, s.centerOfMass),
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
    provenance: `${profile.provenance} Hands with their fingers, toes, and neck with head welded at the neutral pose (MuJoCo humanoid.xml).`,
  };
}

/*
 * Companion readers and types of weldHumanSimulationProfile.
 */
export namespace weldHumanSimulationProfile {
  /*
   * A collision exclusion of the solved profile.
   */
  export type Exclusion = NonNullable<
    IAutoMoviePhysicalProfile["collisionExclusions"]
  >[number];

  /*
   * The id a welded segment's collider takes on its carrier: the welded bone's
   * name, a dot, and the collider's own id.
   * Parameter bone: The welded bone.
   * Parameter shape: The collider's id on that bone's segment.
   * Returns: The collider's id on the carrier.
   */
  export function shapeId(bone: string, shape: string): string {
    return `${bone}.${shape}`;
  }

  /*
   * The welded bone a carrier's collider came from, the inverse of `shapeId`.
   * Parameter shape: The collider's id on the carrier.
   * Returns: The welded bone's name, or null for the carrier's own collider.
   */
  export function rider(shape: string): string | null {
    const dot: number = shape.indexOf(".");
    return dot < 0 ? null : shape.slice(0, dot);
  }
}

/*
 * The roots of the subtrees welded into their parent segment: the MuJoCo
 * humanoid's jointless `hand_right`, `hand_left` and `head`, and the toes its
 * leaf feet do not have (`model/humanoid/humanoid.xml`
 */
const WELDS: readonly string[] = [
  "leftHand",
  "rightHand",
  "leftToes",
  "rightToes",
  "neck",
];
