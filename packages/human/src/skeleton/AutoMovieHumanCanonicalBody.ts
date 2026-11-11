import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolvePose,
  rotationBetween,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMoviePhysicalProfile,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanSkeletonLaw } from "../generation/AutoMovieHumanSkeletonLaw";
import type { IAutoMovieHumanBodyMeasures } from "../generation/IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanCanonicalProfile as Profile } from "./AutoMovieHumanCanonicalProfile";
import type { AutoMovieHumanSkeleton } from "./AutoMovieHumanSkeleton";

/**
 * A Human's polygon man on the engine's canonical humanoid rig, so a motion
 * written as canonical clinical poses drives the polygon man exactly as it
 * drives any other VRM humanoid.
 *
 * The canonical rig is the one `HUMANOID_JOINT_AXES` and `HUMANOID_REST_FRAME`
 * read: the VRM 1.0 T-pose, right-handed, +Y up, the body facing +Z with its
 * left toward +X, identity rest rotations. Human registers +X forward, +Y up
 * and +Z toward its left-named limbs, a left-handed frame, so every point is
 * reflected by `(x, y, z) -> (z, y, x)` and a left-named limb then lies on the
 * anatomical left.
 *
 * The polygon man is built from joints and girth radii only, so the body is
 * prepared at the skeleton level, without Human's skin, lofts or head
 * surfaces. The canonical rig has no scapulohumeral rhythm, pelvic share or
 * resting abduction, which Human's own evaluator adds; a canonical pose moves
 * the polygon man by the rig's angles alone.
 */
export namespace AutoMovieHumanCanonicalBody {
  /** A Human on the canonical rig. */
  export interface IBody {
    /** The canonical rig at its T-pose rest; consumers read it with `HUMANOID_JOINT_AXES` and `HUMANOID_REST_FRAME`. */
    skeleton: IAutoMovieSkeleton;

    /** The polygon man's contact and mass profile on the rig's bones, segment frames at the rest. */
    profile: IAutoMoviePhysicalProfile;

    /** Every Human joint at the rest, canonical frame, parent before child, with its carrier. */
    joints: IJoint[];
  }

  /** One Human joint on the canonical rig. */
  export interface IJoint {
    /** Human joint id, including joints the humanoid vocabulary lacks. */
    bone: string;

    /** Parent Human joint, or null at the root. */
    parent: string | null;

    /** The rig bone that carries this joint rigidly. */
    carrier: AutoMovieHumanoidBone;

    /** Rest joint centre, canonical metres. */
    position: [number, number, number];

    /** Rest tip of a leaf segment, canonical metres; null when children end it. */
    tip: [number, number, number] | null;

    /** Girth radius of the segment leaving the joint, metres. */
    radius: number;
  }

  /** One Human joint's placement under a canonical pose. */
  export interface IPlacement {
    /** Human joint id. */
    bone: string;

    /** World joint centre, canonical metres. */
    position: IAutoMovieVector3;

    /** Rotation from the T-pose rest. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * Prepare a Human's polygon man on the canonical rig from its parameters,
   * at the skeleton level: no skin, loft or head surface is built.
   *
   * The bind joints come from Human's own source preparation and skeleton
   * law (`AutoMovieHumanBodyLaw.prepareSources`, its head source and
   * `AutoMovieHumanSkeletonLaw.complete`), about 2 s a body. Each joint's girth
   * radius is perimeter / 2π of the person's own resolved circumference
   * (`AutoMovieHumanBodyAnatomy.resolve`): hip, waist, chest, neck and head
   * for the trunk and head, the arm at the axilla, the forearm, the hand, the
   * thigh, the calf, the ankle and the ball of the foot (0.8 of it at the
   * midfoot, as Human's rig has it); the jaw is 0.12 of the head radius as
   * Human's rig has it, the eye a 12 mm globe (Bekerman et al. 2014), and a
   * digit the stature girth Human uses for an unlofted digit (finger and
   * lesser toe 0.03, hallux 0.04 of stature).
   *
   * The joints then move onto the canonical rig: reflected from Human's
   * registered frame, each arm straightened along ±X by shortest arcs about
   * the shoulder, the elbow and the wrist and pronated until the palm faces
   * -Y, each thigh and shank straightened along -Y with the foot keeping its
   * bind orientation, and the whole body raised or lowered so its lowest foot
   * joint sphere touches the floor. Every humanoid-named joint becomes a rig
   * bone with an identity rest rotation, the toes bone at the hallux's
   * metatarsophalangeal joint, and every other joint rides its nearest
   * humanoid ancestor. The contact profile is built from the same joints and
   * radii (`AutoMovieHumanCanonicalProfile`), so contacts meet what is drawn.
   *
   * @param params The Human's parameters.
   * @param options Body mass in kilograms and the skeleton id.
   * @returns The canonical body.
   */
  export function prepare(
    params: IAutoMovieHumanParameters,
    options: { mass: number; id: string },
  ): IBody {
    const original: AutoMovieHumanBodyLaw.IOriginal =
      AutoMovieHumanBodyLaw.prepareSources(params);
    const anatomy: AutoMovieHumanSkeletonLaw.IOutput =
      AutoMovieHumanSkeletonLaw.complete(
        original.bodyAnatomy(),
        original.headSource(),
        original.stature,
      );
    const measures: IAutoMovieHumanBodyMeasures =
      AutoMovieHumanBodyAnatomy.resolve(params);
    const scale: number = measures.stature / original.stature / 1000;
    const girth = (millimetres: number): number =>
      millimetres / 1000 / (2 * Math.PI);
    const headRadius: number = girth(params.head.circumference);
    const radius = (bone: string): number => {
      const part: string = bone.replace(/^(left|right)/u, "");
      if (bone === "hips") return girth(measures.hipCircumference);
      if (bone === "spine") return girth(measures.waistCircumference);
      if (bone === "chest") return girth(measures.chestCircumference);
      if (bone === "neck" || bone === "atlas")
        return girth(measures.neckCircumference);
      if (bone === "head") return headRadius;
      if (bone === "jaw") return 0.12 * headRadius;
      if (part === "Eye") return 0.012;
      if (part === "Shoulder" || part === "Scapula" || part === "UpperArm")
        return girth(measures.axillaryArmCircumference);
      if (part === "LowerArm") return girth(measures.forearmCircumference);
      if (part === "Hand") return girth(measures.handCircumference);
      if (part === "UpperLeg") return girth(measures.thighCircumference);
      if (part === "LowerLeg") return girth(measures.calfCircumference);
      if (part === "Foot" || part === "Subtalar")
        return girth(measures.ankleCircumference);
      if (part === "Midfoot")
        return 0.8 * girth(measures.ballOfFootCircumference);
      if (part.startsWith("Hallux")) return girth(0.04 * measures.stature);
      return girth(0.03 * measures.stature);
    };
    return canonical(
      anatomy.bones.map((b) => ({
        bone: b.bone,
        parent: b.parent,
        position: Vector3.scale(vector(b.position), scale),
        tip: b.tip === null ? null : Vector3.scale(vector(b.tip), scale),
        radius: radius(b.bone),
      })),
      options,
    );
  }

  /**
   * Place every Human joint under a canonical pose: forward kinematics of the
   * rig with `HUMANOID_JOINT_AXES` and `HUMANOID_REST_FRAME`, each joint
   * carried rigidly by its carrier bone.
   *
   * @param body The canonical body.
   * @param pose A canonical pose of its skeleton.
   * @returns Placements in the order of `body.joints`.
   */
  export function place(body: IBody, pose: IAutoMoviePose): IPlacement[] {
    const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      new Map(
        resolvePose(
          pose,
          body.skeleton,
          HUMANOID_JOINT_AXES,
          HUMANOID_REST_FRAME,
        ).map(
          (
            r: IAutoMovieResolvedBone,
          ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
        ),
      );
    const rest: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
    for (const bone of body.skeleton.bones)
      rest.set(
        bone.bone,
        Vector3.add(
          bone.parent === null
            ? Vector3.create(0, 0, 0)
            : rest.get(bone.parent)!,
          bone.rest.translation,
        ),
      );
    return body.joints.map((joint: IJoint): IPlacement => {
      const r: IAutoMovieResolvedBone = resolved.get(joint.carrier)!;
      return {
        bone: joint.bone,
        position: Vector3.add(
          r.worldPosition,
          Quaternion.rotateVector(
            r.worldRotation,
            Vector3.subtract(vector(joint.position), rest.get(joint.carrier)!),
          ),
        ),
        rotation: r.worldRotation,
      };
    });
  }

  /**
   * The polygon drawing's input for a canonical body and pose, in Human's
   * registered frame: rest bones and placements reflected back by
   * `(x, y, z) -> (z, y, x)`. The drawing's parent must carry that same
   * reflection (`REFLECTION`, a column-major 4x4) so the figure shows in the
   * canonical world; a reflected world matrix keeps faces outward because
   * three.js reverses winding for it.
   *
   * @param body The canonical body.
   * @param pose A canonical pose; omitted, the T-pose rest.
   * @returns Rest bones and placements in Human's frame.
   */
  export function display(
    body: IBody,
    pose?: IAutoMoviePose,
  ): Pick<AutoMovieHumanSkeleton.IOutput, "bones" | "posed"> {
    const flip = (p: readonly number[]): [number, number, number] => [
      p[2]!,
      p[1]!,
      p[0]!,
    ];
    const bones: AutoMovieHumanSkeleton.IBone[] = body.joints.map(
      (j: IJoint): AutoMovieHumanSkeleton.IBone => ({
        bone: j.bone,
        parent: j.parent,
        position: flip(j.position),
        tip: j.tip === null ? null : flip(j.tip),
        radius: j.radius,
      }),
    );
    const posed: AutoMovieHumanSkeleton.IPlacement[] =
      pose === undefined
        ? bones.map(
            (
              b: AutoMovieHumanSkeleton.IBone,
            ): AutoMovieHumanSkeleton.IPlacement => ({
              bone: b.bone,
              position: [...b.position],
              rotation: [0, 0, 0, 1],
            }),
          )
        : place(body, pose).map(
            (p: IPlacement): AutoMovieHumanSkeleton.IPlacement => {
              const q: IAutoMovieQuaternion = reflectRotation(p.rotation);
              return {
                bone: p.bone,
                position: flip([p.position.x, p.position.y, p.position.z]),
                rotation: [q.x, q.y, q.z, q.w],
              };
            },
          );
    return { bones, posed };
  }

  /** The reflection between Human's frame and the canonical one, column-major 4x4. */
  export const REFLECTION: readonly number[] = [
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1,
  ];
}

/** One bind joint in Human's frame, metres. */
interface IBind {
  bone: string;
  parent: string | null;
  position: IAutoMovieVector3;
  tip: IAutoMovieVector3 | null;
  radius: number;
}

/** Reflect bind joints into the canonical frame, straighten them into the T-pose, floor them and build the rig and profile. */
function canonical(
  bind: readonly IBind[],
  options: { mass: number; id: string },
): AutoMovieHumanCanonicalBody.IBody {
  const children: Map<string, string[]> = new Map();
  for (const bone of bind)
    if (bone.parent !== null)
      children.set(bone.parent, [
        ...(children.get(bone.parent) ?? []),
        bone.bone,
      ]);
  const position: Map<string, IAutoMovieVector3> = new Map();
  const tip: Map<string, IAutoMovieVector3 | null> = new Map();
  const turnOf: Map<string, IAutoMovieQuaternion> = new Map();
  for (const bone of bind) {
    position.set(bone.bone, reflect(bone.position));
    tip.set(bone.bone, bone.tip === null ? null : reflect(bone.tip));
    turnOf.set(bone.bone, Quaternion.identity());
  }
  const descendants = (root: string): string[] => [
    root,
    ...(children.get(root) ?? []).flatMap(descendants),
  ];
  const turn = (
    bones: readonly string[],
    rotation: IAutoMovieQuaternion,
    pivot: IAutoMovieVector3,
  ): void => {
    const move = (p: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(
        pivot,
        Quaternion.rotateVector(rotation, Vector3.subtract(p, pivot)),
      );
    for (const bone of bones) {
      position.set(bone, move(position.get(bone)!));
      const end: IAutoMovieVector3 | null = tip.get(bone)!;
      tip.set(bone, end === null ? null : move(end));
      turnOf.set(bone, Quaternion.multiply(rotation, turnOf.get(bone)!));
    }
  };
  const align = (
    side: string,
    from: string,
    to: string,
    direction: IAutoMovieVector3,
  ): void => {
    const pivot: IAutoMovieVector3 = position.get(`${side}${from}`)!;
    turn(
      descendants(`${side}${from}`),
      rotationBetween(
        Vector3.subtract(position.get(`${side}${to}`)!, pivot),
        direction,
      ),
      pivot,
    );
  };
  const down: IAutoMovieVector3 = Vector3.create(0, -1, 0);
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const lateral: IAutoMovieVector3 = Vector3.create(sign, 0, 0);
    align(side, "UpperArm", "LowerArm", lateral);
    align(side, "LowerArm", "Hand", lateral);
    align(side, "Hand", "MiddleProximal", lateral);

    // Pronate about the now-lateral forearm until the volar normal,
    // sign * (along x (index - little)), faces -Y.
    const hand: IAutoMovieVector3 = position.get(`${side}Hand`)!;
    const along: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(position.get(`${side}MiddleProximal`)!, hand),
    );
    const across: IAutoMovieVector3 = Vector3.subtract(
      position.get(`${side}IndexProximal`)!,
      position.get(`${side}LittleProximal`)!,
    );
    const volar: IAutoMovieVector3 = Vector3.normalize(
      Vector3.scale(Vector3.cross(along, across), sign),
    );
    const angle: number =
      (Math.atan2(
        Vector3.dot(Vector3.cross(volar, down), lateral),
        Vector3.dot(volar, down),
      ) *
        180) /
      Math.PI;
    turn(
      descendants(`${side}LowerArm`),
      Quaternion.fromAxisAngle(lateral, angle),
      position.get(`${side}LowerArm`)!,
    );

    // Straight legs; each foot turns back to its bind orientation.
    align(side, "UpperLeg", "LowerLeg", down);
    align(side, "LowerLeg", "Foot", down);
    turn(
      descendants(`${side}Foot`),
      Quaternion.inverse(turnOf.get(`${side}Foot`)!),
      position.get(`${side}Foot`)!,
    );
  }

  // Floor: the lowest foot joint sphere touches Y = 0.
  let floor: number = Infinity;
  for (const bone of bind)
    if (/(Foot|Subtalar|Midfoot|Hallux|Toe\d)/.test(bone.bone))
      for (const p of [position.get(bone.bone)!, tip.get(bone.bone)!])
        if (p !== null) floor = Math.min(floor, p.y - bone.radius);
  const lift = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: p.x,
    y: p.y - floor,
    z: p.z,
  });
  for (const bone of bind) {
    position.set(bone.bone, lift(position.get(bone.bone)!));
    const end: IAutoMovieVector3 | null = tip.get(bone.bone)!;
    tip.set(bone.bone, end === null ? null : lift(end));
  }

  const carrier: Map<string, AutoMovieHumanoidBone> = new Map();
  for (const bone of bind) {
    const toe: string | null = toeSide(bone.bone);
    carrier.set(
      bone.bone,
      toe !== null
        ? (`${toe}Toes` as AutoMovieHumanoidBone)
        : HUMANOID.has(bone.bone)
          ? (bone.bone as AutoMovieHumanoidBone)
          : carrier.get(bone.parent!)!,
    );
  }
  const bones: IAutoMovieBone[] = [];
  const placed: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
  const add = (
    bone: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    at: IAutoMovieVector3,
  ): void => {
    placed.set(bone, at);
    bones.push({
      bone,
      parent,
      rest: {
        translation: Vector3.subtract(
          at,
          parent === null ? Vector3.create(0, 0, 0) : placed.get(parent)!,
        ),
        rotation: Quaternion.identity(),
        scale: Vector3.create(1, 1, 1),
      },
      constraint: null,
    });
  };
  for (const bone of bind) {
    const toe: string | null = toeSide(bone.bone);
    if (toe !== null && bone.bone === `${toe}HalluxProximal`)
      add(
        `${toe}Toes` as AutoMovieHumanoidBone,
        `${toe}Foot` as AutoMovieHumanoidBone,
        position.get(bone.bone)!,
      );
    if (HUMANOID.has(bone.bone))
      add(
        bone.bone as AutoMovieHumanoidBone,
        bone.parent === null ? null : carrier.get(bone.parent)!,
        position.get(bone.bone)!,
      );
  }
  return {
    skeleton: { id: options.id, bones },
    profile: Profile.build(
      new Map(
        bind.map((bone: IBind): [string, Profile.IJoint] => [
          bone.bone,
          {
            position: position.get(bone.bone)!,
            tip: tip.get(bone.bone)!,
            radius: bone.radius,
          },
        ]),
      ),
      options.mass,
      options.id,
    ),
    joints: bind.map((bone: IBind): AutoMovieHumanCanonicalBody.IJoint => {
      const p: IAutoMovieVector3 = position.get(bone.bone)!;
      const end: IAutoMovieVector3 | null = tip.get(bone.bone)!;
      return {
        bone: bone.bone,
        parent: bone.parent,
        carrier: carrier.get(bone.bone)!,
        position: [p.x, p.y, p.z],
        tip: end === null ? null : [end.x, end.y, end.z],
        radius: bone.radius,
      };
    }),
  };
}

/** The reflection `(x, y, z) -> (z, y, x)` from Human's frame to the canonical one. */
function reflect(v: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: v.z, y: v.y, z: v.x };
}

/** A rotation conjugated by the reflection: its axis reflects and its sense reverses. */
function reflectRotation(q: IAutoMovieQuaternion): IAutoMovieQuaternion {
  return { x: -q.z, y: -q.y, z: -q.x, w: q.w };
}

/** Every humanoid bone id, telling Human's own joints apart. */
const HUMANOID: ReadonlySet<string> = new Set<string>([
  "hips",
  "spine",
  "chest",
  "upperChest",
  "neck",
  "head",
  "leftEye",
  "rightEye",
  "jaw",
  ...(["left", "right"] as const).flatMap((s: string): string[] =>
    [
      "Shoulder",
      "UpperArm",
      "LowerArm",
      "Hand",
      "UpperLeg",
      "LowerLeg",
      "Foot",
      "Toes",
      "ThumbMetacarpal",
      "ThumbProximal",
      "ThumbDistal",
      ...["Index", "Middle", "Ring", "Little"].flatMap((d: string): string[] =>
        ["Proximal", "Intermediate", "Distal"].map(
          (k: string): string => `${d}${k}`,
        ),
      ),
    ].map((b: string): string => `${s}${b}`),
  ),
]);

/** The side of a toe joint, or null for any other joint. */
function toeSide(bone: string): string | null {
  const m: RegExpExecArray | null = /^(left|right)(Hallux|Toe\d)/.exec(bone);
  return m === null ? null : m[1]!;
}

/** A tuple as a vector. */
function vector(p: readonly number[]): IAutoMovieVector3 {
  return { x: p[0]!, y: p[1]!, z: p[2]! };
}
