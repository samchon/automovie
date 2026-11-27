import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  AutoMovieEngineKinematicsChains,
} from "@automovie/engine";
import type {
  AutoMovieGripKind,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieCurlChainUntilContact,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrip,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../posture/internal/prepareHumanPoseResolution";

/**
 * A hand closing on an object: which digits close for a grip kind, each digit's
 * phalanges as the body's own colliders, and the finger angles at contact,
 * solved, never authored.
 *
 * Closure is the engine's `AutoMovieEngineKinematicsChains.curlChainUntilContact` (the auto-grasp stopping rule
 * of Miller and Allen 2004, IEEE Robot. Autom. Mag. 11(4):110): the digits
 * named by the grip kind close proximal to distal until each phalanx first
 * touches the object, the four fingers before the thumb so the thumb closes
 * over them as in a power grip (Napier 1956; the Cutkosky and Feix oppositions
 * the grip kinds name):
 *
 * - `power`, `lateral` and `two-hand`: the four fingers, then the thumb;
 * - `hook`: the four fingers, the thumb left relaxed;
 * - `precision`: the thumb, the index and the middle finger, the ring and little
 *   fingers left relaxed.
 *
 * The curl runs on the hand alone, from its rest or from the open shape a law
 * passes (an offered hand opens its thumb before it closes), with the object
 * carried into the rest hand's frame by the planned grasp (the hand's world
 * wrist and rotation), so the angles depend only on where the object sits in
 * the hand, which a grip keeps fixed, and are computed once per grasp. Each
 * chain reads the profile's phalanx capsules and distal core tip. Its uniform
 * radius is the minimum of those three capsule radii, so wider phalanges remain
 * an approximation to their drawn surface. Missing digit capsules are refused
 * rather than replaced with guessed thickness.
 */
export namespace HumanGrip {
  /** The digits that close for each grip kind, in closing order. */
  export const CLOSING: Readonly<
    Record<AutoMovieGripKind, readonly IAutoMovieMotionHumanGrip.Digit[]>
  > = {
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
    side: AutoMovieHumanSide,
    digit: IAutoMovieMotionHumanGrip.Digit,
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
   * A digit's curl chain from its declared capsules: their minimum radius and
   * the distal capsule's far core end in the distal bone's frame.
   *
   * @param body The body.
   * @param side The hand.
   * @param digit The digit.
   * @returns The chain.
   * @throws {Error} When the profile declares no capsule on a phalanx of the
   *   digit.
   */
  export function chain(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    digit: IAutoMovieMotionHumanGrip.Digit,
  ): IAutoMovieCurlChainUntilContact.IChain {
    const list: AutoMovieHumanoidBone[] = bones(side, digit);
    const capsule: (
      bone: AutoMovieHumanoidBone,
    ) => Extract<IAutoMoviePhysicalShape, IChainCapsule> = (
      bone: AutoMovieHumanoidBone,
    ): Extract<IAutoMoviePhysicalShape, IChainCapsuleResult> => {
      const shape: IAutoMoviePhysicalShape | undefined = body.profile.segments
        .find((s: IAutoMoviePhysicalSegment): boolean => s.bone === bone)
        ?.shapes.find(
          (s: IAutoMoviePhysicalShape): boolean => s.kind === "capsule",
        );
      if (shape === undefined || shape.kind !== "capsule")
        throw new Error(
          `The body's profile declares no capsule on ${bone}; a grasp needs its digits' colliders`,
        );
      return shape;
    };
    const distal: Extract<IAutoMoviePhysicalShape, IChainDistal> = capsule(
      list[2]!,
    );
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
        capsule(list[0]!).radius,
        capsule(list[1]!).radius,
        distal.radius,
      ),
    };
  }

  /**
   * Close a hand's digits on an object.
   *
   * @param body The body.
   * @param side The hand.
   * @param kind The grip kind.
   * @param hand The hand's planned world frame: its wrist joint and its
   *   rotation from rest.
   * @param colliders The object's colliders in the world at the grasp.
   * @param from The digit angles the closure starts from, clinical degrees; the
   *   rest hand when absent.
   * @returns The closed finger angles of that hand and each closing digit's
   *   final gap, metres.
   */
  export function close(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    kind: AutoMovieGripKind,
    hand: IAutoMovieMotionHumanHand.IWrist,
    colliders: readonly IAutoMovieCurlChainUntilContact.ICollider[],
    from: IAutoMovieMotionHumanPosture["joints"] = {},
  ): IAutoMovieMotionHumanGrip.ICloseResult {
    // Carry the object into the rest hand's frame: rest = R0 R^-1 (world - W) + P0.
    const rest: IAutoMovieResolvedBone = poseBones(
      body,
      {
        skeleton: body.skeleton.id,
        root: null,
        joints: [],
      },
      undefined,
      new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
    ).get(`${side}Hand`)!;
    const carry: IAutoMovieQuaternion = Quaternion.multiply(
      rest.worldRotation,
      Quaternion.inverse(hand.rotation),
    );
    const moved: IAutoMovieCurlChainUntilContact.ICollider[] = colliders.map(
      (
        c: IAutoMovieCurlChainUntilContact.ICollider,
      ): IAutoMovieCurlChainUntilContact.ICollider => ({
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
    const digits: readonly IAutoMovieMotionHumanGrip.Digit[] = CLOSING[kind];
    const result: IAutoMovieCurlChainUntilContact.IResult =
      AutoMovieEngineKinematicsChains.curlChainUntilContact({
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
          (
            d: IAutoMovieMotionHumanGrip.Digit,
          ): IAutoMovieCurlChainUntilContact.IChain => chain(body, side, d),
        ),
        colliders: moved,
        jointAxes: HUMANOID_JOINT_AXES,
        restFrames: HUMANOID_REST_FRAME,
        topology: body.topology,
        resolution: body.poseResolution,
      });
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const j of result.pose.joints)
      joints[j.bone] = [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0];
    const gaps: Partial<Record<IAutoMovieMotionHumanGrip.Digit, number>> = {};
    result.chains.forEach(
      (c: IAutoMovieCurlChainUntilContact.IChainResult, i: number): void => {
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
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanPosture["joints"] {
    const out: IAutoMovieMotionHumanPosture["joints"] = {};
    const digits: Set<string> = new Set(
      (["Index", "Middle", "Ring", "Little", "Thumb"] as const).flatMap(
        (d: IAutoMovieMotionHumanGrip.Digit): string[] => bones(side, d),
      ),
    );
    for (const j of pose.joints)
      if (digits.has(j.bone))
        out[j.bone] = [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0];
    return out;
  }

  /**
   * The grip aperture of a hand shape: the distance between the thumb's and the
   * index finger's tips, Jeannerod's measure of hand opening.
   *
   * @param body The body.
   * @param side The hand.
   * @param joints The digit angles.
   * @returns Metres.
   */
  export function aperture(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    joints: IAutoMovieMotionHumanPosture["joints"],
  ): number {
    return prepareAperture(body, side)(joints);
  }

  /**
   * Prepare the thumb and index geometry for one synchronous aperture search.
   *
   * @param body The body and its digit capsules, unchanged through the search.
   * @param side The hand whose shapes are searched.
   * @returns A reader of the thumb-index tip distance, metres, of a clinical
   *   hand shape.
   */
  export function prepareAperture(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): (joints: IAutoMovieMotionHumanPosture["joints"]) => number {
    const thumb: IAutoMovieCurlChainUntilContact.IChain = chain(
      body,
      side,
      "Thumb",
    );
    const index: IAutoMovieCurlChainUntilContact.IChain = chain(
      body,
      side,
      "Index",
    );
    const requested: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([
        `${side}ThumbDistal`,
        `${side}IndexDistal`,
      ]);
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const readTips: ReturnType<typeof poseBones.prepareTuples> =
      poseBones.prepareTuples(body, requested);
    const tip: (
      resolved: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      digit: PrepareApertureTipDigit,
    ) => IAutoMovieVector3 = (
      resolved: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      digit: PrepareApertureTipDigit2,
    ): IAutoMovieVector3 => {
      const prepared: IAutoMovieCurlChainUntilContact.IChain =
        digit === "Thumb" ? thumb : index;
      const distal: IAutoMovieResolvedBone = resolved.get(prepared.bones[2]!)!;
      return Vector3.add(
        distal.worldPosition,
        Quaternion.rotateVector(distal.worldRotation, prepared.tip),
      );
    };
    return (joints: IAutoMovieMotionHumanPosture["joints"]): number => {
      const skeleton: string = body.skeleton.id;
      const staged: ReturnType<typeof readTips> = readTips(joints);
      const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        staged({ skeleton, root: null }, resolution());
      return Vector3.distance(tip(resolved, "Thumb"), tip(resolved, "Index"));
    };
  }
}

/** The alternatives of `PrepareApertureTipDigit2`'s site. */
type PrepareApertureTipDigit2 = "Thumb" | "Index";

/** The alternatives of `PrepareApertureTipDigit`'s site. */
type PrepareApertureTipDigit = "Thumb" | "Index";

/** The record of `IChainDistal`'s site. */
type IChainDistal = { kind: "capsule" };

/** The record of `IChainCapsuleResult`'s site. */
type IChainCapsuleResult = { kind: "capsule" };

/** The record of `IChainCapsule`'s site. */
type IChainCapsule = { kind: "capsule" };
