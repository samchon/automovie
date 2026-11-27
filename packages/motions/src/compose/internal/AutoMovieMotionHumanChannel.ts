import type {
  AutoMovieHumanDigit,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannelClaim,
  AutoMovieMotionHumanChannel as AutoMovieMotionHumanChannelContract,
  IAutoMovieHumanDigitGoal,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanPostureRotation,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanPosture } from "../../posture/internal/HumanPosture";

/**
 * The channel that owns a bone's joint.
 *
 * @param bone The bone.
 * @returns Its channel.
 */
export function AutoMovieMotionHumanChannel(
  bone: AutoMovieHumanoidBone,
): AutoMovieMotionHumanChannelContract {
  const side: AutoMovieHumanSide | undefined = bone.startsWith("left")
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
 * Channel ordering, bone ownership and posture merging for the canonical
 * channel vocabulary. ORDER is constrained by the interface union. The readers
 * below use this order and ownership partition when composing primitives,
 * including individual-digit claims.
 */
export namespace AutoMovieMotionHumanChannel {
  /**
   * The order channels are written in: the body is placed first and the arms
   * last, so a primitive reads every part its own part hangs from as the action
   * already placed it. The hands' fingers come before the arms although they
   * hang from them: an arm's goal lays a surface of the hand (the palm, a
   * fingertip, the fist) on its target, and the arm's fit reads that surface
   * with the fingers as their own primitive shapes them, while a finger's
   * angles read nothing of the arm. The channels as data, checked against the
   * canonical union.
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
  ] as const satisfies readonly NonNullable<AutoMovieMotionHumanChannelContract>[];

  /**
   * The bones `trunkTurn` covers: the spine and the chest above the pelvis, not
   * the shoulder girdles.
   */
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
   */
  export function digit(
    bone: AutoMovieHumanoidBone,
  ): AutoMovieHumanDigit | undefined {
    const found: RegExpMatchArray | null = bone.match(
      /^(left|right)(Thumb|Index|Middle|Ring|Little)/,
    );
    return found === null
      ? undefined
      : (`${found[1]}${found[2]}` as AutoMovieHumanDigit);
  }

  /**
   * Whether claims cover a claim: they name it, or it is a digit of a hand they
   * name.
   *
   * @param claims The claims.
   * @param claim The claim asked about.
   * @returns Whether it is covered.
   */
  export function claims(
    claims: readonly AutoMovieMotionHumanChannelClaim[],
    claim: AutoMovieMotionHumanChannelClaim,
  ): boolean {
    if (claims.includes(claim)) return true;
    const side: RegExpMatchArray | null = claim.match(
      /^(left|right)(Thumb|Index|Middle|Ring|Little)$/,
    );
    return (
      side !== null &&
      claims.includes(`${side[1]}Hand` as AutoMovieMotionHumanChannelClaim)
    );
  }

  /**
   * Whether claims cover a bone's joint: they name its channel, or its digit.
   *
   * @param claims The claims.
   * @param bone The bone.
   * @returns Whether its joint is covered.
   */
  export function covers(
    claims: readonly AutoMovieMotionHumanChannelClaim[],
    bone: AutoMovieHumanoidBone,
  ): boolean {
    if (claims.includes(AutoMovieMotionHumanChannel(bone))) return true;
    if (claims.includes("trunkTurn") && TURN.includes(bone)) return true;
    const own: AutoMovieHumanDigit | undefined = digit(bone);
    return own !== undefined && claims.includes(own);
  }

  /**
   * A posture with some channels taken from another: every field the channels
   * own is copied from `written`, everything else stays as `base` has it. A
   * joint or a limb goal `written` no longer sets is cleared. A digit claim
   * takes that digit's joints and its digit goal only; a hand's channel takes
   * all five.
   *
   * @param base The posture the other channels keep.
   * @param written The posture the channels were written on.
   * @param channels The channels and digits to take.
   * @returns The merged posture.
   */
  export function merge(
    base: IAutoMovieMotionHumanPosture,
    written: IAutoMovieMotionHumanPosture,
    channels: readonly AutoMovieMotionHumanChannelClaim[],
  ): IAutoMovieMotionHumanPosture {
    return merged(
      base,
      written,
      (channel: AutoMovieMotionHumanChannelContract): boolean =>
        channels.includes(channel),
      (bone: AutoMovieHumanoidBone): boolean => covers(channels, bone),
      (digit: AutoMovieHumanDigit): boolean =>
        AutoMovieMotionHumanChannel.claims(channels, digit),
    );
  }

  /**
   * Prepare the immutable claim decisions of repeated posture merges. Actual
   * joint triples, goals, roots and optional fields remain inputs of every
   * call, and the returned records keep merge's original ownership.
   *
   * @param channels The fixed channel/digit/trunk-turn claims, copied at
   *   preparation.
   * @returns The same merge with fixed channel and digit claim membership.
   */
  export function prepareMerge(
    channels: readonly AutoMovieMotionHumanChannelClaim[],
  ): (
    base: IAutoMovieMotionHumanPosture,
    written: IAutoMovieMotionHumanPosture,
  ) => IAutoMovieMotionHumanPosture {
    const fixed: readonly AutoMovieMotionHumanChannelClaim[] = [...channels];
    const owned: ReadonlySet<AutoMovieMotionHumanChannelClaim> = new Set(fixed);
    const digits: ReadonlySet<AutoMovieHumanDigit> = new Set(
      HumanPosture.DIGITS.filter((digit: AutoMovieHumanDigit): boolean =>
        claims(fixed, digit),
      ),
    );
    const coversBone = (bone: AutoMovieHumanoidBone): boolean => {
      if (owned.has(AutoMovieMotionHumanChannel(bone))) return true;
      if (owned.has("trunkTurn") && TURN.includes(bone)) return true;
      const own: AutoMovieHumanDigit | undefined = digit(bone);
      return own !== undefined && digits.has(own);
    };
    const owns = (channel: AutoMovieMotionHumanChannelContract): boolean =>
      owned.has(channel);
    const ownsDigit = (digit: AutoMovieHumanDigit): boolean =>
      digits.has(digit);
    return (
      base: IAutoMovieMotionHumanPosture,
      written: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture =>
      merged(base, written, owns, coversBone, ownsDigit);
  }

  /**
   * Keep cold and prepared selection identical, including property insertion
   * order.
   */
  function merged(
    base: IAutoMovieMotionHumanPosture,
    written: IAutoMovieMotionHumanPosture,
    owns: (channel: AutoMovieMotionHumanChannelContract) => boolean,
    coversBone: (bone: AutoMovieHumanoidBone) => boolean,
    ownsDigit: (digit: AutoMovieHumanDigit) => boolean,
  ): IAutoMovieMotionHumanPosture {
    // Each record's own keys in their order, then each value read by its key:
    // the order `Object.entries` gives, without a pair per joint.
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    const kept: IAutoMovieMotionHumanPosture["joints"] = base.joints;
    for (const bone of Object.keys(kept) as AutoMovieHumanoidBone[]) {
      const angles: readonly [number, number, number] | undefined = kept[bone];
      if (!coversBone(bone)) joints[bone] = angles;
    }
    const taken: IAutoMovieMotionHumanPosture["joints"] = written.joints;
    for (const bone of Object.keys(taken) as AutoMovieHumanoidBone[]) {
      const angles: readonly [number, number, number] | undefined = taken[bone];
      if (coversBone(bone)) joints[bone] = angles;
    }

    // Each digit's goal goes with its digit; a posture that has none keeps
    // none, so a merge without digit goals is the merge it always was.
    let digits: NonNullable<IAutoMovieMotionHumanPosture["digits"]> | undefined;
    for (const d of HumanPosture.DIGITS) {
      const goal: IAutoMovieHumanDigitGoal | undefined = (
        ownsDigit(d) ? written : base
      ).digits?.[d];
      if (goal !== undefined) (digits ??= {})[d] = goal;
    }
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const limb of LIMBS) {
      const goal: IAutoMovieHumanLimbGoal | undefined = (
        owns(limb) ? written : base
      ).limbs[limb];
      if (goal !== undefined) limbs[limb] = goal;
    }

    // A whole-body rotation turns the root, so it goes with the root's
    // channel; a posture that has none keeps none.
    const rotation: IAutoMovieHumanPostureRotation | undefined = (
      owns("root") ? written : base
    ).rotation;
    return {
      root: owns("root") ? written.root : base.root,
      yaw: owns("root") ? written.yaw : base.yaw,
      pitch: owns("trunk") ? written.pitch : base.pitch,
      roll: owns("trunk") ? written.roll : base.roll,
      joints,
      limbs,
      ...(digits === undefined ? {} : { digits }),
      ...(rotation === undefined ? {} : { rotation }),
    };
  }
}

/** The four limbs a merge reads a goal of, in the order it writes them. */
const LIMBS: readonly ["leftArm", "rightArm", "leftLeg", "rightLeg"] = [
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg",
];
