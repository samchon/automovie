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

import { AutoMovieHumanCanonicalProfile as Profile } from "./AutoMovieHumanCanonicalProfile";
import type { AutoMovieHumanSkeleton } from "./AutoMovieHumanSkeleton";

/**
 * A prepared Human on the engine's canonical humanoid rig, so a motion
 * written as canonical clinical poses drives Human's polygon man exactly as it
 * drives any other VRM humanoid.
 *
 * The canonical rig is the one `HUMANOID_JOINT_AXES` and `HUMANOID_REST_FRAME`
 * read: the VRM 1.0 T-pose, right-handed, +Y up, the body facing +Z with its
 * left toward +X, identity rest rotations. Human registers +X forward, +Y up
 * and +Z toward its left-named limbs, a left-handed frame, so `adapt` reflects
 * every point by `(x, y, z) -> (z, y, x)` (a left-named limb then lies on the
 * anatomical left), straightens each arm into the T-pose by shortest arcs
 * about the shoulder, the elbow and the wrist onto ±X and pronates the
 * forearm until the palm faces -Y. Legs, trunk and head keep Human's neutral,
 * where Human's clinical angles are zero. Each humanoid-named Human joint
 * becomes a rig bone; the toes bone stands at the hallux's
 * metatarsophalangeal joint, as Human's own rig places it, and every other
 * Human joint rides its nearest humanoid ancestor (a toe rides the toes
 * bone). The physical profile follows (`AutoMovieHumanCanonicalProfile`).
 *
 * The canonical rig has no scapulohumeral rhythm, pelvic share or resting
 * abduction, which Human's own evaluator adds; a canonical pose therefore
 * moves the polygon man by the rig's angles alone.
 */
export namespace AutoMovieHumanCanonicalBody {
  /** A Human on the canonical rig. */
  export interface IBody {
    /** The canonical rig at its T-pose rest; consumers read it with `HUMANOID_JOINT_AXES` and `HUMANOID_REST_FRAME`. */
    skeleton: IAutoMovieSkeleton;

    /** The physical profile on the rig's bones, segment frames at the rest. */
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

    /** Skin girth radius of the segment leaving the joint, metres. */
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
   * Move a prepared Human onto the canonical rig.
   *
   * @param neutral The prepared evaluator's output for `{}`, Human's neutral.
   * @param profile Human's physical profile of the same body.
   * @param id Skeleton id the canonical poses cite.
   * @returns The canonical body.
   */
  export function adapt(
    neutral: AutoMovieHumanSkeleton.IOutput,
    profile: IAutoMoviePhysicalProfile,
    id: string,
  ): IBody {
    const children: Map<string, string[]> = new Map();
    for (const bone of neutral.bones)
      if (bone.parent !== null)
        children.set(bone.parent, [...(children.get(bone.parent) ?? []), bone.bone]);
    const posed: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(
      neutral.posed.map((p: AutoMovieHumanSkeleton.IPlacement): [string, AutoMovieHumanSkeleton.IPlacement] => [p.bone, p]),
    );

    // Neutral joints and tips, reflected into the canonical frame.
    const position: Map<string, IAutoMovieVector3> = new Map();
    const tip: Map<string, IAutoMovieVector3 | null> = new Map();
    const rigid: Map<string, Profile.IRigid> = new Map();
    for (const bone of neutral.bones) {
      const placed: AutoMovieHumanSkeleton.IPlacement = posed.get(bone.bone)!;
      const at: IAutoMovieVector3 = vector(placed.position);
      position.set(bone.bone, Profile.reflect(at));
      tip.set(
        bone.bone,
        bone.tip === null
          ? null
          : Profile.reflect(
              Vector3.add(
                at,
                Quaternion.rotateVector(
                  { x: placed.rotation[0], y: placed.rotation[1], z: placed.rotation[2], w: placed.rotation[3] },
                  Vector3.subtract(vector(bone.tip), vector(bone.position)),
                ),
              ),
            ),
      );
      rigid.set(bone.bone, { rotation: Quaternion.identity(), translation: Vector3.create(0, 0, 0) });
    }

    // Straighten each arm into the VRM T-pose.
    const descendants = (root: string): string[] => [root, ...(children.get(root) ?? []).flatMap(descendants)];
    const turn = (bones: readonly string[], rotation: IAutoMovieQuaternion, pivot: IAutoMovieVector3): void => {
      const move = (p: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(pivot, Quaternion.rotateVector(rotation, Vector3.subtract(p, pivot)));
      for (const bone of bones) {
        position.set(bone, move(position.get(bone)!));
        const end: IAutoMovieVector3 | null = tip.get(bone)!;
        tip.set(bone, end === null ? null : move(end));
        const before: Profile.IRigid = rigid.get(bone)!;
        rigid.set(bone, { rotation: Quaternion.multiply(rotation, before.rotation), translation: move(before.translation) });
      }
    };
    for (const [side, sign] of [["left", 1], ["right", -1]] as const) {
      const lateral: IAutoMovieVector3 = Vector3.create(sign, 0, 0);
      const align = (from: string, to: string): void => {
        const pivot: IAutoMovieVector3 = position.get(`${side}${from}`)!;
        turn(descendants(`${side}${from}`), rotationBetween(Vector3.subtract(position.get(`${side}${to}`)!, pivot), lateral), pivot);
      };
      align("UpperArm", "LowerArm");
      align("LowerArm", "Hand");
      align("Hand", "MiddleProximal");

      // Pronate about the now-lateral forearm until the volar normal,
      // sign * (along x (index - little)), faces -Y.
      const hand: IAutoMovieVector3 = position.get(`${side}Hand`)!;
      const along: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(position.get(`${side}MiddleProximal`)!, hand));
      const across: IAutoMovieVector3 = Vector3.subtract(position.get(`${side}IndexProximal`)!, position.get(`${side}LittleProximal`)!);
      const volar: IAutoMovieVector3 = Vector3.normalize(Vector3.scale(Vector3.cross(along, across), sign));
      const down: IAutoMovieVector3 = Vector3.create(0, -1, 0);
      const angle: number =
        (Math.atan2(Vector3.dot(Vector3.cross(volar, down), lateral), Vector3.dot(volar, down)) * 180) / Math.PI;
      turn(descendants(`${side}LowerArm`), Quaternion.fromAxisAngle(lateral, angle), position.get(`${side}LowerArm`)!);
    }

    // The rig, and the carrier of every Human joint.
    const carrier: Map<string, AutoMovieHumanoidBone> = new Map();
    for (const bone of neutral.bones) {
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
    const add = (bone: AutoMovieHumanoidBone, parent: AutoMovieHumanoidBone | null, at: IAutoMovieVector3): void => {
      placed.set(bone, at);
      bones.push({
        bone,
        parent,
        rest: {
          translation: Vector3.subtract(at, parent === null ? Vector3.create(0, 0, 0) : placed.get(parent)!),
          rotation: Quaternion.identity(),
          scale: Vector3.create(1, 1, 1),
        },
        constraint: null,
      });
    };
    for (const bone of neutral.bones) {
      const toe: string | null = toeSide(bone.bone);
      if (toe !== null && bone.bone === `${toe}HalluxProximal`)
        add(`${toe}Toes` as AutoMovieHumanoidBone, `${toe}Foot` as AutoMovieHumanoidBone, position.get(bone.bone)!);
      if (HUMANOID.has(bone.bone))
        add(bone.bone as AutoMovieHumanoidBone, bone.parent === null ? null : carrier.get(bone.parent)!, position.get(bone.bone)!);
    }
    return {
      skeleton: { id, bones },
      profile: Profile.convert(profile, carrier, rigid),
      joints: neutral.bones.map((bone: AutoMovieHumanSkeleton.IBone): IJoint => {
        const end: IAutoMovieVector3 | null = tip.get(bone.bone)!;
        const p: IAutoMovieVector3 = position.get(bone.bone)!;
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
    const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
      resolvePose(pose, body.skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME).map(
        (r: IAutoMovieResolvedBone): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
      ),
    );
    const rest: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
    for (const bone of body.skeleton.bones)
      rest.set(bone.bone, Vector3.add(bone.parent === null ? Vector3.create(0, 0, 0) : rest.get(bone.parent)!, bone.rest.translation));
    return body.joints.map((joint: IJoint): IPlacement => {
      const r: IAutoMovieResolvedBone = resolved.get(joint.carrier)!;
      return {
        bone: joint.bone,
        position: Vector3.add(
          r.worldPosition,
          Quaternion.rotateVector(r.worldRotation, Vector3.subtract(vector(joint.position), rest.get(joint.carrier)!)),
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
   * three.js and the CPU rasterizer reverse winding for it.
   *
   * @param body The canonical body.
   * @param pose A canonical pose; omitted, the T-pose rest.
   * @returns Rest bones and placements in Human's frame.
   */
  export function display(
    body: IBody,
    pose?: IAutoMoviePose,
  ): Pick<AutoMovieHumanSkeleton.IOutput, "bones" | "posed"> {
    const flip = (p: readonly number[]): [number, number, number] => [p[2]!, p[1]!, p[0]!];
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
        ? bones.map((b: AutoMovieHumanSkeleton.IBone): AutoMovieHumanSkeleton.IPlacement => ({
            bone: b.bone,
            position: [...b.position],
            rotation: [0, 0, 0, 1],
          }))
        : place(body, pose).map((p: IPlacement): AutoMovieHumanSkeleton.IPlacement => {
            const q: IAutoMovieQuaternion = Profile.reflectRotation(p.rotation);
            return { bone: p.bone, position: flip([p.position.x, p.position.y, p.position.z]), rotation: [q.x, q.y, q.z, q.w] };
          });
    return { bones, posed };
  }

  /** The reflection between Human's frame and the canonical one, column-major 4x4. */
  export const REFLECTION: readonly number[] = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1];
}

/** Every humanoid bone id, telling Human's own joints apart. */
const HUMANOID: ReadonlySet<string> = new Set<string>([
  "hips", "spine", "chest", "upperChest", "neck", "head", "leftEye", "rightEye", "jaw",
  ...(["left", "right"] as const).flatMap((s: string): string[] =>
    [
      "Shoulder", "UpperArm", "LowerArm", "Hand", "UpperLeg", "LowerLeg", "Foot", "Toes",
      "ThumbMetacarpal", "ThumbProximal", "ThumbDistal",
      ...["Index", "Middle", "Ring", "Little"].flatMap((d: string): string[] =>
        ["Proximal", "Intermediate", "Distal"].map((k: string): string => `${d}${k}`),
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
