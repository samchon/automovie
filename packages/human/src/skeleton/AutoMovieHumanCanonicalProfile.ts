import {
  DEFAULT_HUMANOID_ROM,
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  combinePhysicalMassProperties,
  rotationBetween,
  toRigAngle,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { AutoMovieHumanCanonicalSolids as Solids } from "./AutoMovieHumanCanonicalSolids";

/**
 * The contact and mass profile of a polygon man, built from the same joints
 * and girth radii its drawing is built from, at the canonical T-pose rest.
 *
 * Colliders are the drawn solids. The trunk, the neck, the head, each limb
 * segment, the palm, the rear foot and every toe phalanx collide as the
 * convex hulls of the very ring points the drawing lofts its mesh through
 * (`AutoMovieHumanCanonicalSolids`), so the collision surface is the drawn
 * surface: no corner stands outside what is seen and no drawn surface lies
 * outside its collider. A rig bone carries the hulls of every drawn module
 * that rides it: the foot its two modules through the subtalar and midfoot
 * joints, the toes bone every toe phalanx, so the toes bend at the ball as
 * drawn. Each phalanx of the hand is a capsule of its girth radius from its
 * joint to its child joint, a distal one ending with its cap on the
 * fingertip, because a curl solves its contact in closed form on capsules
 * and the drawn phalanx is that round.
 *
 * Masses are Dempster's shares of body mass as tabulated by Winter
 * (Biomechanics and Motor Control of Human Movement, 4th ed., table 4.1):
 * hand 0.006, forearm 0.016, upper arm 0.028, thigh 0.100, leg 0.0465, foot
 * 0.0145, thorax 0.216, abdomen 0.139, pelvis 0.142 and head with neck 0.081,
 * the head taking de Leva's (1996) 0.0694 and the neck the rest; the hand's
 * share is split over the palm and the phalanges by collider volume, a
 * uniform density within the hand, and the foot's over the rear foot and the
 * toes the same way. Each segment's centre of mass and inertia are those of
 * its colliders as uniform solids, combined by the parallel-axis theorem,
 * the way physics engines derive inertia from shapes. Joints sit at each
 * child joint with identity frames; every clinical axis of
 * `DEFAULT_HUMANOID_ROM` becomes a physical axis along its
 * `HUMANOID_JOINT_AXES` direction with limits read through
 * `HUMANOID_REST_FRAME`, so the physical zero is the T-pose. Drive gains are
 * placeholders kinematic motion never reads: 50 N m per downstream kilogram.
 */
export namespace AutoMovieHumanCanonicalProfile {
  /** One drawn joint: its canonical rest position, its girth radius and its carrier. */
  export type IJoint = Solids.IJoint;

  /**
   * Build the profile.
   *
   * @param joints Every drawn Human joint by id, parent before child.
   * @param mass Body mass, kilograms.
   * @param id Profile id.
   * @returns The profile on the rig's bones.
   */
  export function build(
    joints: ReadonlyMap<string, IJoint>,
    mass: number,
    id: string,
  ): P {
    const j = (name: string): IJoint => {
      const found: IJoint | undefined = joints.get(name);
      if (found === undefined)
        throw new Error(`The polygon profile needs the joint ${name}`);
      return found;
    };
    const identity: IAutoMovieQuaternion = Quaternion.identity();
    const at = (name: string): IAutoMovieVector3 => j(name).position;
    // A rig bone's origin is its joint; the toes bone sits at the hallux's root.
    const origin = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      at(bone.replace(/Toes$/u, "HalluxProximal"));
    const parts: Map<AutoMovieHumanoidBone, IPart[]> = new Map();
    const put = (bone: AutoMovieHumanoidBone, part: IPart): void => {
      parts.set(bone, [...(parts.get(bone) ?? []), part]);
    };
    for (const solid of Solids.build(joints))
      put(solid.carrier, {
        shape: {
          id: solid.id,
          material: "skin",
          transform: {
            position: Vector3.subtract(solid.centre, origin(solid.carrier)),
            rotation: identity,
          },
          kind: "hull",
          points: solid.points,
        },
        volume: solid.volume,
        inertia: solid.inertia,
        inertiaRotation: solid.inertiaRotation,
      });
    // A phalanx between two joints ends in the joints' balls; a distal one
    // ends with its cap on the fingertip.
    const capsule = (
      bone: AutoMovieHumanoidBone,
      from: IAutoMovieVector3,
      end: IAutoMovieVector3,
      radius: number,
      tip: boolean,
    ): void => {
      const span: number = Vector3.length(Vector3.subtract(end, from));
      const inward: number = tip ? Math.min(radius, span) : 0;
      const to: IAutoMovieVector3 =
        span > 1e-9
          ? Vector3.subtract(
              end,
              Vector3.scale(Vector3.subtract(end, from), inward / span),
            )
          : end;
      const axis: IAutoMovieVector3 = Vector3.subtract(to, from);
      const length: number = Vector3.length(axis);
      const rotation: IAutoMovieQuaternion =
        length > 1e-9 ? rotationBetween({ x: 0, y: 1, z: 0 }, axis) : identity;
      const full: number = length + 2 * radius;
      const transverse: number = (3 * radius * radius + full * full) / 12;
      put(bone, {
        shape: {
          id: "body",
          material: "skin",
          transform: {
            position: Vector3.subtract(
              Vector3.scale(Vector3.add(from, to), 0.5),
              origin(bone),
            ),
            rotation,
          },
          kind: "capsule",
          radius,
          halfLength: length / 2,
        },
        volume:
          Math.PI * radius * radius * length + (4 / 3) * Math.PI * radius ** 3,
        inertia: { x: transverse, y: (radius * radius) / 2, z: transverse },
        inertiaRotation: rotation,
      });
    };

    const parentOf: Partial<
      Record<AutoMovieHumanoidBone, AutoMovieHumanoidBone>
    > = {
      spine: "hips",
      chest: "spine",
      neck: "chest",
      head: "neck",
    };
    // Each group of rig bones shares one Dempster share by collider volume.
    const groups: { share: number; bones: AutoMovieHumanoidBone[] }[] = [
      { share: 0.142, bones: ["hips"] },
      { share: 0.139, bones: ["spine"] },
      { share: 0.216, bones: ["chest"] },
      { share: 0.081 - 0.0694, bones: ["neck"] },
      { share: 0.0694, bones: ["head"] },
    ];
    const hands: AutoMovieHumanoidBone[][] = [];
    for (const side of ["left", "right"] as const) {
      const b = (name: string): AutoMovieHumanoidBone =>
        `${side}${name}` as AutoMovieHumanoidBone;
      const hand: AutoMovieHumanoidBone[] = [b("Hand")];
      for (const chain of DIGITS)
        chain.forEach((name: string, i: number): void => {
          const joint: IJoint = j(b(name));
          const next: string | undefined = chain[i + 1];
          capsule(
            b(name),
            joint.position,
            next === undefined ? (joint.tip ?? joint.position) : at(b(next)),
            joint.radius,
            next === undefined && joint.tip !== null,
          );
          parentOf[b(name)] = i === 0 ? b("Hand") : b(chain[i - 1]!);
          hand.push(b(name));
        });
      hands.push(hand);
      parentOf[b("UpperArm")] = "chest";
      parentOf[b("LowerArm")] = b("UpperArm");
      parentOf[b("Hand")] = b("LowerArm");
      parentOf[b("UpperLeg")] = "hips";
      parentOf[b("LowerLeg")] = b("UpperLeg");
      parentOf[b("Foot")] = b("LowerLeg");
      parentOf[b("Toes")] = b("Foot");
      groups.push(
        { share: 0.028, bones: [b("UpperArm")] },
        { share: 0.016, bones: [b("LowerArm")] },
        { share: 0.006, bones: hand },
        { share: 0.1, bones: [b("UpperLeg")] },
        { share: 0.0465, bones: [b("LowerLeg")] },
        { share: 0.0145, bones: [b("Foot"), b("Toes")] },
      );
    }

    const segments: P.ISegment[] = [];
    for (const group of groups) {
      const members: IPart[][] = group.bones.map(
        (bone: AutoMovieHumanoidBone): IPart[] => {
          const found: IPart[] | undefined = parts.get(bone);
          if (found === undefined)
            throw new Error(`The polygon profile has no collider on ${bone}`);
          return found;
        },
      );
      const density: number =
        (group.share * mass) /
        members
          .flat()
          .reduce((sum: number, part: IPart): number => sum + part.volume, 0);
      group.bones.forEach(
        (bone: AutoMovieHumanoidBone, index: number): void => {
          const whole: combinePhysicalMassProperties.IPart =
            combinePhysicalMassProperties(
              members[index]!.map(
                (part: IPart): combinePhysicalMassProperties.IPart => ({
                  mass: density * part.volume,
                  centerOfMass: part.shape.transform.position,
                  inertia: Vector3.scale(part.inertia, density * part.volume),
                  inertiaRotation: part.inertiaRotation,
                }),
              ),
            );
          segments.push({
            bone,
            neutral: { position: origin(bone), rotation: identity },
            mass: whole.mass,
            centerOfMass: whole.centerOfMass,
            inertia: whole.inertia,
            inertiaRotation: whole.inertiaRotation,
            shapes: members[index]!.map((part: IPart): P.IShape => part.shape),
          });
        },
      );
    }

    const children = (bone: AutoMovieHumanoidBone): AutoMovieHumanoidBone[] =>
      (Object.keys(parentOf) as AutoMovieHumanoidBone[]).filter(
        (c: AutoMovieHumanoidBone): boolean => parentOf[c] === bone,
      );
    const downstream = (bone: AutoMovieHumanoidBone): number =>
      segments.find((s: P.ISegment): boolean => s.bone === bone)!.mass +
      children(bone).reduce(
        (sum: number, c: AutoMovieHumanoidBone): number => sum + downstream(c),
        0,
      );
    const links: P.IJoint[] = (
      Object.keys(parentOf) as AutoMovieHumanoidBone[]
    ).map((child: AutoMovieHumanoidBone): P.IJoint => {
      const parent: AutoMovieHumanoidBone = parentOf[child]!;
      return {
        id: child,
        parent,
        child,
        parentFrame: {
          position: Vector3.subtract(origin(child), origin(parent)),
          rotation: identity,
        },
        childFrame: { position: { x: 0, y: 0, z: 0 }, rotation: identity },
        axes: axesOf(child, 50 * downstream(child)),
      };
    });
    const total: number = segments.reduce(
      (sum: number, s: P.ISegment): number => sum + s.mass,
      0,
    );
    return {
      id,
      mass: total,
      centerOfMass: segments.reduce(
        (sum: IAutoMovieVector3, s: P.ISegment): IAutoMovieVector3 =>
          Vector3.add(
            sum,
            Vector3.scale(
              Vector3.add(s.neutral.position, s.centerOfMass),
              s.mass / total,
            ),
          ),
        { x: 0, y: 0, z: 0 },
      ),
      segments,
      joints: links,
      collisionExclusions: [
        ...links.map(
          (jt: P.IJoint): { a: string; b: string; reason: string } => ({
            a: jt.parent,
            b: jt.child,
            reason: "adjacent polygon modules overlap at their shared joint",
          }),
        ),
        ...hands.flatMap((hand: AutoMovieHumanoidBone[]) =>
          hand.flatMap((a: AutoMovieHumanoidBone, i: number) =>
            hand
              .slice(i + 1)
              .filter(
                (c: AutoMovieHumanoidBone): boolean =>
                  parentOf[c] !== a && parentOf[a] !== c,
              )
              .map(
                (
                  c: AutoMovieHumanoidBone,
                ): { a: string; b: string; reason: string } => ({
                  a,
                  b: c,
                  reason:
                    "the palm and digits of one hand touch at rest; finger contact is the grasp's",
                }),
              ),
          ),
        ),
      ],
      materials: [
        {
          id: "skin",
          friction: 0.7,
          restitution: 0,
          compliance: 0,
          damping: 0,
        },
      ],
      provenance:
        "Polygon-man contact profile: convex hulls of the drawn ring points with capsule phalanges, Dempster segment masses (Winter table 4.1), uniform-solid collider inertia.",
    };
  }
}

/** One collider of a segment with the uniform solid's properties about its own centre. */
interface IPart {
  /** The collider, its transform in the segment's frame. */
  shape: P.IShape;

  /** Volume, cubic metres. */
  volume: number;

  /** Principal moments per unit mass, square metres. */
  inertia: IAutoMovieVector3;

  /** Rotation from the principal frame to the segment's frame. */
  inertiaRotation: IAutoMovieQuaternion;
}

/** The four fingers, by rig name. */
const FINGERS: readonly string[] = ["Index", "Middle", "Ring", "Little"];

/** Every digit's phalanx chain from the hand outward, by rig name. */
const DIGITS: readonly (readonly string[])[] = [
  ["ThumbMetacarpal", "ThumbProximal", "ThumbDistal"],
  ...FINGERS.map((d: string): string[] => [
    `${d}Proximal`,
    `${d}Intermediate`,
    `${d}Distal`,
  ]),
];

/** The physical axes of one joint from its clinical ranges, read onto the T-pose rig. */
function axesOf(bone: AutoMovieHumanoidBone, torque: number): P.IAxis[] {
  const rom = DEFAULT_HUMANOID_ROM[bone];
  const axes: IAutoMovieJointAxes =
    HUMANOID_JOINT_AXES[bone] ?? DEFAULT_JOINT_AXES;
  const out: P.IAxis[] = [];
  for (const clinical of ["flexion", "abduction", "twist"] as const) {
    const range = rom?.[clinical];
    if (range === null || range === undefined) continue;
    const d: IAutoMovieVector3 = axes[clinical];
    const letter: "x" | "y" | "z" =
      Math.abs(d.x) >= Math.abs(d.y) && Math.abs(d.x) >= Math.abs(d.z)
        ? "x"
        : Math.abs(d.y) >= Math.abs(d.z)
          ? "y"
          : "z";
    if (out.some((a: P.IAxis): boolean => a.axis === letter)) continue;
    const sign: number = Math.sign(d[letter]);
    const frame = HUMANOID_REST_FRAME[bone]?.[clinical];
    const physical = (c: number): number =>
      (sign * toRigAngle(c, frame)! * Math.PI) / 180;
    const ends: number[] = [physical(range.min), physical(range.max)].sort(
      (a: number, b: number): number => a - b,
    );
    out.push({
      axis: letter,
      minimum: Math.max(-Math.PI, ends[0]!),
      maximum: Math.min(Math.PI, ends[1]!),
      stiffness: torque,
      damping: torque / 10,
      maximumTorque: torque,
      channel: `${bone}.${clinical}`,
      coordinateSign: (sign * (frame?.sign ?? 1)) as 1 | -1,
    });
  }
  return out;
}
