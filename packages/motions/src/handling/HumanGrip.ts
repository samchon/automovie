import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  curlChainUntilContact,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieGripKind,
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePhysicalProfile,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * A hand closing on an object: which digits close for a grip kind, each
 * digit's phalanges as the body's own colliders, and the finger angles at
 * contact, solved, never authored.
 *
 * Closure is the engine's `curlChainUntilContact` (GraspIt!'s auto-grasp
 * stopping rule): the digits named by the grip kind close proximal to distal
 * until each phalanx first touches the object, the four fingers before the
 * thumb so the thumb closes over them as in a power grip (Napier 1956; the
 * Cutkosky and Feix oppositions the grip kinds name):
 *
 * - `power`, `lateral` and `two-hand`: the four fingers, then the thumb;
 * - `hook`: the four fingers, the thumb left relaxed;
 * - `precision`: the thumb, the index and the middle finger, the ring and
 *   little fingers left relaxed.
 *
 * The curl runs on the hand alone, from its rest or from the open shape a
 * law passes (an offered hand opens its thumb before it closes), with the
 * object carried into the rest hand's frame by the planned grasp (the hand's
 * world wrist and rotation), so the angles depend only on where the object sits in the hand,
 * which a grip keeps fixed, and are computed once per grasp. Each phalanx is
 * the capsule the body's physical profile declares on that digit bone, its
 * radius and its far end read from the collider, so contact meets what is
 * drawn; a body whose profile declares no digit colliders is refused, since
 * its finger thickness is unknown.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which digits close per grip kind, the frame the curl runs in, where phalanx radius and tip come from, and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The engine's contact curl on the body's own digit colliders, in the rest hand's frame, with the object moved there by the rigid hand transform.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Digit tables, a chain reader, the curl, and two small readers (current finger angles, thumb-index aperture).
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No finger thickness is guessed: a missing digit collider throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms One curl per grasp, linear in digits times search steps times bones.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A law computes the closure once and reuses it for every frame of the hold.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace HumanGrip {
  /** A digit. */
  export type Digit = "Index" | "Middle" | "Ring" | "Little" | "Thumb";

  /** The digits that close for each grip kind, in closing order. */
  export const CLOSING: Readonly<Record<AutoMovieGripKind, readonly Digit[]>> =
    {
      power: ["Index", "Middle", "Ring", "Little", "Thumb"],
      lateral: ["Index", "Middle", "Ring", "Little", "Thumb"],
      "two-hand": ["Index", "Middle", "Ring", "Little", "Thumb"],
      hook: ["Index", "Middle", "Ring", "Little"],
      precision: ["Thumb", "Index", "Middle"],
    };

  /**
   * A digit's bones, proximal to distal.
   *
   * @param side The hand.
   * @param digit The digit.
   * @returns The three bones.
   */
  export function bones(
    side: HumanHand.Side,
    digit: Digit,
  ): AutoMovieHumanoidBone[] {
    const segments: string[] =
      digit === "Thumb"
        ? ["Metacarpal", "Proximal", "Distal"]
        : ["Proximal", "Intermediate", "Distal"];
    return segments.map(
      (s: string): AutoMovieHumanoidBone =>
        `${side}${digit}${s}` as AutoMovieHumanoidBone,
    );
  }

  /**
   * A digit as a curl chain from the body's colliders: the radius of its
   * distal phalanx capsule and the end of that capsule's core in the distal
   * bone's frame.
   *
   * @param body The body.
   * @param side The hand.
   * @param digit The digit.
   * @returns The chain.
   * @throws {Error} When the profile declares no capsule on a phalanx of the digit.
   */
  export function chain(
    body: IHumanBody,
    side: HumanHand.Side,
    digit: Digit,
  ): curlChainUntilContact.IChain {
    const list: AutoMovieHumanoidBone[] = bones(side, digit);
    const capsule = (
      bone: AutoMovieHumanoidBone,
    ): Extract<IAutoMoviePhysicalProfile.IShape, { kind: "capsule" }> => {
      const shape: IAutoMoviePhysicalProfile.IShape | undefined =
        body.profile.segments
          .find(
            (s: IAutoMoviePhysicalProfile.ISegment): boolean => s.bone === bone,
          )
          ?.shapes.find(
            (s: IAutoMoviePhysicalProfile.IShape): boolean =>
              s.kind === "capsule",
          );
      if (shape === undefined || shape.kind !== "capsule")
        throw new Error(
          `The body's profile declares no capsule on ${bone}; a grasp needs its digits' colliders`,
        );
      return shape;
    };
    const distal = capsule(list[2]!);
    return {
      bones: list,
      tip: Vector3.add(
        distal.transform.position,
        Quaternion.rotateVector(distal.transform.rotation, {
          x: 0,
          y: distal.halfLength,
          z: 0,
        }),
      ),
      radius: Math.min(
        ...list.map((b: AutoMovieHumanoidBone): number => capsule(b).radius),
      ),
    };
  }

  /**
   * Close a hand's digits on an object.
   *
   * @param body The body.
   * @param side The hand.
   * @param kind The grip kind.
   * @param hand The hand's planned world frame: its wrist joint and its rotation from rest.
   * @param colliders The object's colliders in the world at the grasp.
   * @param from The digit angles the closure starts from, clinical degrees; the rest hand when absent.
   * @returns The closed finger angles of that hand and each closing digit's final gap, metres.
   */
  export function close(
    body: IHumanBody,
    side: HumanHand.Side,
    kind: AutoMovieGripKind,
    hand: HumanHand.IWrist,
    colliders: readonly curlChainUntilContact.ICollider[],
    from: IHumanPosture["joints"] = {},
  ): { joints: IHumanPosture["joints"]; gaps: Partial<Record<Digit, number>> } {
    // Carry the object into the rest hand's frame: rest = R0 R^-1 (world - W) + P0.
    const rest: IAutoMovieResolvedBone = resolve(body, {
      skeleton: body.skeleton.id,
      root: null,
      joints: [],
    }).get(`${side}Hand`)!;
    const carry: IAutoMovieQuaternion = Quaternion.multiply(
      rest.worldRotation,
      Quaternion.inverse(hand.rotation),
    );
    const moved: curlChainUntilContact.ICollider[] = colliders.map(
      (
        c: curlChainUntilContact.ICollider,
      ): curlChainUntilContact.ICollider => ({
        shape: c.shape,
        frame: {
          position: Vector3.add(
            rest.worldPosition,
            Quaternion.rotateVector(
              carry,
              Vector3.subtract(c.frame.position, hand.point),
            ),
          ),
          rotation: Quaternion.normalize(
            Quaternion.multiply(carry, c.frame.rotation),
          ),
        },
      }),
    );
    const digits: readonly Digit[] = CLOSING[kind];
    const result: curlChainUntilContact.IResult = curlChainUntilContact({
      skeleton: body.skeleton,
      pose: {
        skeleton: body.skeleton.id,
        root: null,
        joints: (
          Object.entries(from) as [
            AutoMovieHumanoidBone,
            readonly [number, number, number],
          ][]
        ).map(
          ([bone, a]): IAutoMovieJointPose => ({
            bone,
            flexion: a[0],
            abduction: a[1],
            twist: a[2],
          }),
        ),
      },
      chains: digits.map(
        (d: Digit): curlChainUntilContact.IChain => chain(body, side, d),
      ),
      colliders: moved,
      jointAxes: HUMANOID_JOINT_AXES,
      restFrames: HUMANOID_REST_FRAME,
      topology: body.topology,
    });
    const joints: IHumanPosture["joints"] = {};
    for (const j of result.pose.joints)
      joints[j.bone] = [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0];
    const gaps: Partial<Record<Digit, number>> = {};
    result.chains.forEach(
      (c: curlChainUntilContact.IChainResult, i: number): void => {
        gaps[digits[i]!] = c.gap;
      },
    );
    return { joints, gaps };
  }

  /**
   * A hand's current digit angles in a pose.
   *
   * @param pose The pose.
   * @param side The hand.
   * @returns Clinical degrees of every digit bone the pose sets.
   */
  export function fingers(
    pose: IAutoMoviePose,
    side: HumanHand.Side,
  ): IHumanPosture["joints"] {
    const out: IHumanPosture["joints"] = {};
    const digits: Set<string> = new Set(
      (["Index", "Middle", "Ring", "Little", "Thumb"] as const).flatMap(
        (d: Digit): string[] => bones(side, d),
      ),
    );
    for (const j of pose.joints as IAutoMovieJointPose[])
      if (digits.has(j.bone))
        out[j.bone] = [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0];
    return out;
  }

  /**
   * The grip aperture of a hand shape: the distance between the thumb's and
   * the index finger's tips, Jeannerod's measure of hand opening.
   *
   * @param body The body.
   * @param side The hand.
   * @param joints The digit angles.
   * @returns Metres.
   */
  export function aperture(
    body: IHumanBody,
    side: HumanHand.Side,
    joints: IHumanPosture["joints"],
  ): number {
    const pose: IAutoMoviePose = {
      skeleton: body.skeleton.id,
      root: null,
      joints: (
        Object.entries(joints) as [
          AutoMovieHumanoidBone,
          readonly [number, number, number],
        ][]
      ).map(
        ([bone, a]): IAutoMovieJointPose => ({
          bone,
          flexion: a[0],
          abduction: a[1],
          twist: a[2],
        }),
      ),
    };
    const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      resolve(body, pose);
    const tip = (digit: Digit): IAutoMovieVector3 => {
      const c: curlChainUntilContact.IChain = chain(body, side, digit);
      const distal: IAutoMovieResolvedBone = resolved.get(c.bones[2]!)!;
      return Vector3.add(
        distal.worldPosition,
        Quaternion.rotateVector(distal.worldRotation, c.tip),
      );
    };
    return Vector3.length(Vector3.subtract(tip("Thumb"), tip("Index")));
  }
}

/** World bones of a pose. */
function resolve(
  body: IHumanBody,
  pose: IAutoMoviePose,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  return new Map(
    resolvePose(
      pose,
      body.skeleton,
      HUMANOID_JOINT_AXES,
      HUMANOID_REST_FRAME,
      body.topology,
    ).map(
      (
        r: IAutoMovieResolvedBone,
      ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
    ),
  );
}
