import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { IHumanPosture } from "../posture/IHumanPosture";

/**
 * A part of the body one primitive writes at a time.
 *
 * The channels partition {@link IHumanPosture}: `root` owns `root`, `yaw`
 * and the whole-body `rotation`;
 * `trunk` owns `pitch`, `roll` and the joints of the pelvis, the spine and the
 * shoulder girdles; `head` owns the neck, the head, the jaw and the eyes;
 * each arm owns its limb goal and the joints of its upper arm, forearm and
 * hand; each hand owns its finger joints; each leg owns its limb goal and the
 * joints of its thigh, shank, foot and toes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a channel is and which fields of a posture each one owns.
 * @evidence contracts/development/design.md#principled-representation A partition of the posture by the kinematic tree: the root, the trunk it carries, the head and the limbs that hang from the trunk, and each hand at the end of its arm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Nine channels, the coarsest split under which two parts of one action never need the same channel at once; the only owner of which field belongs to which part.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union read from the `ORDER` list, so a primitive cannot claim a part the merge does not know and a page lists the same channels.
 */
export type AutoMovieMotionHumanChannel =
  (typeof AutoMovieMotionHumanChannel.ORDER)[number];
export namespace AutoMovieMotionHumanChannel {
  /**
   * The order channels are written in: the body is placed first and the
   * arms last, so a primitive reads every part its own part hangs from as
   * the action already placed it. The hands' fingers come before the arms
   * although they hang from them: an arm's goal lays a surface of the hand
   * (the palm, a fingertip, the fist) on its target, and the arm's fit reads
   * that surface with the fingers as their own primitive shapes them, while
   * a finger's angles read nothing of the arm. The channels as data: the
   * union is read from this list.
   */
  export const ORDER = [
    "root",
    "trunk",
    "head",
    "leftLeg",
    "rightLeg",
    "leftHand",
    "rightHand",
    "leftArm",
    "rightArm",
  ] as const;

  /**
   * The channel that owns a bone's joint.
   *
   * @param bone The bone.
   * @returns Its channel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result; the type's document gives the partition.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the side and the part from the bone's name, the rig vocabulary's own structure, and maps the part to its channel by the partition the type states.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One side test, then one branch per part group.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Eyes and shoulder girdles carry a side in their names but belong to the head and the trunk, and are routed there before the limb rules.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(bone: AutoMovieHumanoidBone): AutoMovieMotionHumanChannel {
    const side: "left" | "right" | undefined = bone.startsWith("left")
      ? "left"
      : bone.startsWith("right")
        ? "right"
        : undefined;
    if (side === undefined)
      return bone === "neck" || bone === "head" || bone === "jaw"
        ? "head"
        : "trunk";
    const part: string = bone.slice(side.length);
    if (part === "Eye") return "head";
    if (part === "Shoulder") return "trunk";
    if (/^(Thumb|Index|Middle|Ring|Little)/.test(part)) return `${side}Hand`;
    if (part === "UpperArm" || part === "LowerArm" || part === "Hand")
      return `${side}Arm`;
    return `${side}Leg`;
  }

  /**
   * One digit of a hand as a part of the body an overlay can claim on its
   * own (#3445): a thumb typing while the other four digits of the same
   * hand keep holding a phone. A claim of a hand's channel covers its five
   * digits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the independent digit claim and its coverage by a whole-hand claim.
   * @evidence contracts/development/design.md#principled-representation The closed, sided digit vocabulary of IHumanPosture; ownership has no unit or timebase.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Reuses the posture's digit owner for composition claims and yields.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An alias preserves the existing vocabulary without a parallel list or widened string.
   */
  export type Digit = IHumanPosture.Digit;

  /**
   * What a plan claims or a carrier yields: a channel, one digit of a hand,
   * or `trunkTurn`, the spine and the chest turned about the pelvis held on
   * its support (#3491): a carrier that keeps the trunk on a saddle or a
   * moving floor yields its turn to an act that aims from it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three claim forms and the supported trunk turn above a held pelvis.
   * @evidence contracts/development/design.md#principled-representation A closed union of posture ownership units; channel and digit membership are type-checked, while composition checks overlapping claims.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Extends channel ownership only with the digit and trunk-turn claims current overlays use.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the channel and digit owners; trunkTurn owns the TURN bones rather than an alternate posture representation.
   */
  export type Claim = AutoMovieMotionHumanChannel | Digit | "trunkTurn";

  /** The bones `trunkTurn` covers: the spine and the chest above the pelvis, not the shoulder girdles. */
  export const TURN: readonly AutoMovieHumanoidBone[] = [
    "spine",
    "chest",
    "upperChest",
  ];

  /**
   * The digit that owns a bone's joint, for a finger or thumb bone.
   *
   * @param bone The bone.
   * @returns Its digit; none for a bone of no digit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and the empty case.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the side and the digit from the bone's name, the rig vocabulary's own structure, as `of` does.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One side test and one pattern.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function digit(bone: AutoMovieHumanoidBone): Digit | undefined {
    const found: RegExpMatchArray | null = bone.match(
      /^(left|right)(Thumb|Index|Middle|Ring|Little)/,
    );
    return found === null ? undefined : (`${found[1]}${found[2]}` as Digit);
  }

  /**
   * Whether claims cover a claim: they name it, or it is a digit of a hand
   * they name.
   *
   * @param claims The claims.
   * @param claim The claim asked about.
   * @returns Whether it is covered.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two ways a claim is covered.
   * @evidence contracts/development/implementation.md#principled-implementation A hand's channel is the union of its digits, so it covers each of them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One membership test and one hand test.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A digit claim never covers its hand: the hand's other digits stay free.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the claims.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function claims(claims: readonly Claim[], claim: Claim): boolean {
    if (claims.includes(claim)) return true;
    const side: RegExpMatchArray | null = claim.match(
      /^(left|right)(Thumb|Index|Middle|Ring|Little)$/,
    );
    return side !== null && claims.includes(`${side[1]}Hand` as Claim);
  }

  /**
   * Whether claims cover a bone's joint: they name its channel, or its digit.
   *
   * @param claims The claims.
   * @param bone The bone.
   * @returns Whether its joint is covered.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what covers a joint.
   * @evidence contracts/development/implementation.md#principled-implementation The joint's channel by `of`, or its digit by `digit`; with claims that name no digit it is `claims.includes(of(bone))` exactly.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two membership tests.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the claims.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `of` and `digit`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function covers(
    claims: readonly Claim[],
    bone: AutoMovieHumanoidBone,
  ): boolean {
    if (claims.includes(of(bone))) return true;
    if (claims.includes("trunkTurn") && TURN.includes(bone)) return true;
    const own: Digit | undefined = digit(bone);
    return own !== undefined && claims.includes(own);
  }

  /**
   * A posture with some channels taken from another: every field the
   * channels own is copied from `written`, everything else stays as `base`
   * has it. A joint or a limb goal `written` no longer sets is cleared. A
   * digit claim takes that digit's joints and its digit goal only; a hand's
   * channel takes all five.
   *
   * @param base The posture the other channels keep.
   * @param written The posture the channels were written on.
   * @param channels The channels and digits to take.
   * @returns The merged posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is copied, what stays and what happens to a field the written posture no longer sets.
   * @evidence contracts/development/implementation.md#principled-implementation Each field goes to the posture of its owner: the channels' fields from the written posture, the rest from the base, so a primitive cannot change a part it did not claim.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two passes over the joints, one over the four limbs, and four scalar choices.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An owned joint or limb goal absent from the written posture is cleared and not inherited from the base, so a primitive can release a goal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the joints the two postures hold.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `of` for every joint.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function merge(
    base: IHumanPosture,
    written: IHumanPosture,
    channels: readonly Claim[],
  ): IHumanPosture {
    return merged(
      base,
      written,
      (channel: AutoMovieMotionHumanChannel): boolean => channels.includes(channel),
      (bone: AutoMovieHumanoidBone): boolean => covers(channels, bone),
      (digit: IHumanPosture.Digit): boolean => claims(channels, digit),
    );
  }

  /**
   * Prepare the immutable claim decisions of repeated posture merges.
   * Actual joint triples, goals, roots and optional fields remain inputs of
   * every call, and the returned records keep merge's original ownership.
   *
   * @param channels The fixed channel/digit/trunk-turn claims, copied at preparation.
   * @returns The same merge with claim membership and encountered bone ownership shared.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the fixed copied claims, actual per-call posture data and fresh result/borrowed payload ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Channel partition and digit coverage depend only on fixed claims and a bone's closed name, so their exact boolean decisions may be shared while all numeric and optional source values remain freshly read.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared merge body serves cold and prepared callers; preparation owns only the fixed channel/digit sets and lazy bone-classification map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Absent owned joints, goals and rotations are still cleared; bone insertion order, aliases and borrowed payloads remain unchanged. No posture result, input identity or fit is cached.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation scans C claims and ten digit names once. Each merge retains its O(Jb+Jw) joint traversal and fixed limb/digit reads; each encountered bone's channel/digit parsing runs once per prepared reader instead of on both sides of every merge. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Same fixed claims share only name-membership decisions, across distinct postures and exact seconds. The copied claim list isolates caller edits, and changed claims require a new preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owning plan or synchronous overlay query retains C copied claims, channel/digit sets and at most one boolean per encountered closed bone name until released. No pose, numeric record, time history or external handle is retained.
   */
  export function prepareMerge(
    channels: readonly Claim[],
  ): (base: IHumanPosture, written: IHumanPosture) => IHumanPosture {
    const fixed: readonly Claim[] = [...channels];
    const owned: ReadonlySet<Claim> = new Set(fixed);
    const digits: ReadonlySet<IHumanPosture.Digit> = new Set(
      IHumanPosture.DIGITS.filter((digit: IHumanPosture.Digit): boolean => claims(fixed, digit)),
    );
    const bones: Map<AutoMovieHumanoidBone, boolean> = new Map();
    const coversBone = (bone: AutoMovieHumanoidBone): boolean => {
      let known: boolean | undefined = bones.get(bone);
      if (known === undefined) bones.set(bone, (known = covers(fixed, bone)));
      return known;
    };
    const owns = (channel: AutoMovieMotionHumanChannel): boolean => owned.has(channel);
    const ownsDigit = (digit: IHumanPosture.Digit): boolean => digits.has(digit);
    return (base: IHumanPosture, written: IHumanPosture): IHumanPosture =>
      merged(base, written, owns, coversBone, ownsDigit);
  }

  /** Keep cold and prepared selection identical, including property insertion order. */
  function merged(
    base: IHumanPosture,
    written: IHumanPosture,
    owns: (channel: AutoMovieMotionHumanChannel) => boolean,
    coversBone: (bone: AutoMovieHumanoidBone) => boolean,
    ownsDigit: (digit: IHumanPosture.Digit) => boolean,
  ): IHumanPosture {
    const joints: IHumanPosture["joints"] = {};
    for (const [bone, angles] of Object.entries(base.joints) as [
      AutoMovieHumanoidBone,
      readonly [number, number, number],
    ][])
      if (!coversBone(bone)) joints[bone] = angles;
    for (const [bone, angles] of Object.entries(written.joints) as [
      AutoMovieHumanoidBone,
      readonly [number, number, number],
    ][])
      if (coversBone(bone)) joints[bone] = angles;

    // Each digit's goal goes with its digit; a posture that has none keeps
    // none, so a merge without digit goals is the merge it always was.
    let digits: NonNullable<IHumanPosture["digits"]> | undefined;
    if (base.digits !== undefined || written.digits !== undefined)
      for (const d of IHumanPosture.DIGITS) {
        const goal: IHumanPosture.IDigitGoal | undefined = (
          ownsDigit(d) ? written : base
        ).digits?.[d];
        if (goal !== undefined) (digits ??= {})[d] = goal;
      }
    const limbs: IHumanPosture["limbs"] = {};
    for (const limb of [
      "leftArm",
      "rightArm",
      "leftLeg",
      "rightLeg",
    ] as const) {
      const goal: IHumanPosture.IGoal | undefined = (
        owns(limb) ? written : base
      ).limbs[limb];
      if (goal !== undefined) limbs[limb] = goal;
    }

    // A whole-body rotation turns the root, so it goes with the root's
    // channel (#3423); a posture that has none keeps none.
    const root: IHumanPosture = owns("root") ? written : base;
    const trunk: IHumanPosture = owns("trunk") ? written : base;
    const rotation: IHumanPosture.IRotation | undefined = root.rotation;
    return {
      root: root.root,
      yaw: root.yaw,
      pitch: trunk.pitch,
      roll: trunk.roll,
      joints,
      limbs,
      ...(digits === undefined ? {} : { digits }),
      ...(rotation === undefined ? {} : { rotation }),
    };
  }
}
