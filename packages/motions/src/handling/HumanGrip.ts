import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  curlChainUntilContact,
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
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";

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
 * which a grip keeps fixed, and are computed once per grasp. Each chain reads
 * the profile's phalanx capsules and distal core tip. Its uniform radius is
 * the minimum of those three capsule radii, so wider phalanges remain an
 * approximation to their drawn surface. Missing digit capsules are refused
 * rather than replaced with guessed thickness.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which digits close per grip kind, the frame the curl runs in, where phalanx radius and tip come from, and the refusal.
 * @evidence contracts/development/design.md#principled-representation Canonical digit identities, body-declared capsule geometry, clinical tuples and world hand/collider frames describe the existing grip without another rig or pose representation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Five operations and one digit-order table serve actual grasp closure, finger extraction and aperture readers; poseBones owns canonical FK and curlChainUntilContact owns numerical contact search.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing capsules still throw. The existing minimum-radius uniform chain approximates wider phalanges, so exact drawn-surface contact is not certified; no new radius guess, target proxy or numerical repair is added.
 */
export namespace HumanGrip {
  /**
   * One of the hand's five canonical digits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the five digits shared by bone naming, closing order and gap reporting.
   * @evidence contracts/development/design.md#principled-representation A closed canonical-digit union matches the body's existing humanoid bone names.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The same values key CLOSING, chain construction and returned gaps.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No open string or additional anatomical digit is introduced.
   */
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States hand side and proximal-to-distal order, including the thumb's metacarpal naming.
   * @evidence contracts/development/implementation.md#principled-implementation Constructs the existing three canonical suffixes for each closed side/digit alternative.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One thumb-versus-finger suffix choice and one name mapping own the canonical ordering.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The existing enum cast follows the closed side/digit and fixed suffix construction; no bone is invented, validated or substituted.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three fixed names, with no rig traversal.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A fresh three-name list has no operation-dependent metadata to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new array and retains no body, input or handle.
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
   * A digit's curl chain from its declared capsules: their minimum radius
   * and the distal capsule's far core end in the distal bone's frame.
   *
   * @param body The body.
   * @param side The hand.
   * @param digit The digit.
   * @returns The chain.
   * @throws {Error} When the profile declares no capsule on a phalanx of the digit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States distal-local tip, metre radius, capsule provenance and refusal, including the uniform minimum-radius approximation.
   * @evidence contracts/development/implementation.md#principled-implementation The capsule's declared rigid transform places its far core endpoint; the existing minimum of all three radii supplies the engine's uniform chain radius.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One first-capsule lookup rule serves the distal tip and the three ordered radius reads.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing capsules throw at the same distal-first stage, and no phalanx width is guessed; wider phalanges retain the documented uniform-radius limitation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three O(P+S) first-profile/capsule searches replace four for P segments and at most S shapes per selected segment, reusing the distal record after the same tip calculation. Direct three-radius Math.min avoids its map array; runtime speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses only the same synchronous query's selected distal capsule; later calls read current profile data and neither geometry nor chain results are globally cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh chain/name array/tip with a scalar radius, borrowing no mutable transform output and retaining no body, profile index or handle.
   */
  export function chain(
    body: IHumanBody,
    side: HumanHand.Side,
    digit: Digit,
  ): curlChainUntilContact.IChain {
    const list: AutoMovieHumanoidBone[] = bones(side, digit);
    const capsule: (
      bone: AutoMovieHumanoidBone,
    ) => Extract<IAutoMoviePhysicalProfile.IShape, { kind: "capsule" }> = (
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
    const distal: Extract<IAutoMoviePhysicalProfile.IShape, { kind: "capsule" }> =
      capsule(list[2]!);
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
   * @param hand The hand's planned world frame: its wrist joint and its rotation from rest.
   * @param colliders The object's colliders in the world at the grasp.
   * @param from The digit angles the closure starts from, clinical degrees; the rest hand when absent.
   * @returns The closed finger angles of that hand and each closing digit's final gap, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States start angles, hand/object world frames, digit ordering and returned clinical tuples/metre gaps.
   * @evidence contracts/development/implementation.md#principled-implementation The same rigid transform carries world colliders into the zero-hand frame before the engine's ordered first-contact curl; its actual FK, clamps and collision queries remain unchanged.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Canonical poseBones owns the rest-hand FK, chain owns capsule metadata, and curlChainUntilContact alone owns numerical closure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves CLOSING order, starting angles and missing-capsule refusals; uniform digit radii keep their stated approximation and no physical success is invented.
   * @evidence contracts/development/implementation.md#efficient-algorithms The rest query demands only the actual hand ancestry; C collider transforms and D chain preparations precede the unchanged curl probes. The body-owned immutable rig lets those probes demand actual digit chains and share unchanged FK math, without a measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The existing body snapshot supplies exactly this skeleton/canonical axes/rest topology to curl; one rest-hand transform places its fixed colliders, while every angle, ROM cap and actual contact query remains independently evaluated.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary FK/collider/search records end with return or throw; the caller owns fresh joint tuples/gaps and no plan, body cache, workspace or handle is retained here.
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
    const rest: IAutoMovieResolvedBone = poseBones(body, {
      skeleton: body.skeleton.id,
      root: null,
      joints: [],
    }, undefined, new Set<AutoMovieHumanoidBone>([`${side}Hand`])).get(`${side}Hand`)!;
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
      resolution: body.poseResolution,
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States side-selected canonical digit channels and clinical-degree tuples, with null channels read as zero.
   * @evidence contracts/development/implementation.md#principled-implementation The existing fifteen-name membership set selects this hand's authored digit records in source order, with later duplicates replacing earlier values.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Canonical bones generates the membership names; one pose scan builds the returned authored-joint record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Performs no FK, clamp, invented digit value or other-hand rewrite; absent channels remain absent.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fifteen generated keys and one O(J) pose scan preserve output order and fresh tuples.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One fixed-size set belongs to this query, with no cross-pose result cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns new tuples and releases its temporary set, retaining no pose or handle.
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
    for (const j of pose.joints)
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States thumb-index tip distance and its metre unit on the supplied clinical hand shape.
   * @evidence contracts/development/implementation.md#principled-implementation Canonical FK places the requested joints; each distal capsule core tip is rigidly placed and their Euclidean separation is the existing aperture measure.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One poseBones map serves both digit-tip placements, using the same chain geometry owner as closure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses actual distal core tips and their existing capsule geometry, without a fitted opening, radius compensation or target substitution.
   * @evidence contracts/development/implementation.md#efficient-algorithms The cold facade prepares one aperture reader and performs actual FK for the two distal ancestor closures after all J authored records are admitted; capsule metadata and scalar distance remain exact.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both actual tips share the same supplied clinical shape's requested FK; repeated shape searches use prepareAperture explicitly, with no global or cross-body result cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar and releases its temporary pose/map/chains, retaining no input, workspace or handle.
   */
  export function aperture(
    body: IHumanBody,
    side: HumanHand.Side,
    joints: IHumanPosture["joints"],
  ): number {
    return prepareAperture(body, side)(joints);
  }

  /**
   * Prepare the thumb and index geometry for one synchronous aperture search.
   *
   * @param body The unchanged body and its digit capsules.
   * @param side The hand whose shapes are searched.
   * @returns A reader of the actual thumb-index tip distance, metres, for each supplied clinical shape.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed geometry, per-reading clinical shape, metre distance and synchronous ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Each reading admits every supplied joint through canonical FK, then uses the original rigid distal-tip placement and Euclidean distance; invariant capsule chains are acquired lazily at their original first tip use and reused for later shapes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One genuine tuple/name producer stages the current shape before its original null-root FK; a shared tip reader admits the two capsule chains at their original first actual use.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every supplied angle is admitted in source order and every actual shape is evaluated; no interpolated aperture, reduced search or guessed tip is used.
   * @evidence contracts/development/implementation.md#efficient-algorithms Capsule searches, thumb/index name binding and tip callback prepare once for T shapes. Each shape retains O(J) entry/tuple staging and complete admission, with one packed 3J array replacing J joint records before the two actual distal ancestor closures. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed body/side/profile/skeleton establish geometry equivalence. Every shape preserves skeleton-id access before Object.entries/F/A/T staging and all staging before the actual lazy operation demand; exact changed dependencies still recompute their own FK/distance without a shape result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller releases two chains and one lazy FK reader with its synchronous aperture search; the builder must not be stored in a returned plan or frame history and no global cache is added.
   */
  export function prepareAperture(
    body: IHumanBody,
    side: HumanHand.Side,
  ): (joints: IHumanPosture["joints"]) => number {
    let thumb: curlChainUntilContact.IChain | undefined;
    let index: curlChainUntilContact.IChain | undefined;
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
      `${side}ThumbDistal`, `${side}IndexDistal`,
    ]);
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const readTips: ReturnType<typeof poseBones.prepareTuples> = poseBones.prepareTuples(body, requested);
    const tip: (resolved: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      digit: "Thumb" | "Index") => IAutoMovieVector3 = (
      resolved: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      digit: "Thumb" | "Index",
    ): IAutoMovieVector3 => {
      const prepared: curlChainUntilContact.IChain = digit === "Thumb"
        ? (thumb ??= chain(body, side, digit)) : (index ??= chain(body, side, digit));
      const distal: IAutoMovieResolvedBone = resolved.get(prepared.bones[2]!)!;
      return Vector3.add(distal.worldPosition, Quaternion.rotateVector(distal.worldRotation, prepared.tip));
    };
    return (joints: IHumanPosture["joints"]): number => {
      const skeleton: string = body.skeleton.id;
      const staged: ReturnType<typeof readTips> = readTips(joints);
      const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        staged({ skeleton, root: null }, resolution());
      return Vector3.distance(tip(resolved, "Thumb"), tip(resolved, "Index"));
    };
  }
}

