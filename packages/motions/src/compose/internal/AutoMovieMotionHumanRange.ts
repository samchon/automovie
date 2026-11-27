import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanRange,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanReach } from "./AutoMovieMotionHumanReach";

/**
 * Amounts by level: how far a joint turns as a share of its range of motion,
 * how far the trunk leans as a share of the reach's lean limit, and how far the
 * root shifts as a share of the stature.
 *
 * A law states `"light"` neck flexion and the joint's own range supplies the
 * degrees, so one word fits a neck and a knee: a level is a share of the
 * distance from the joint's rest (0 degrees) to the limit of the named motion
 * in `DEFAULT_HUMANOID_ROM`. The limit a motion reads:
 *
 * | Motion      | Limit           |
 * | ----------- | --------------- |
 * | `flexion`   | `flexion.max`   |
 * | `extension` | `flexion.min`   |
 * | `abduction` | `abduction.max` |
 * | `adduction` | `abduction.min` |
 * | `external`  | `twist.max`     |
 * | `internal`  | `twist.min`     |
 *
 * The result is signed as the posture's clinical angles are, so an extension is
 * negative.
 *
 * An amount has three rungs: a level, a level with a scale in [0.5, 1.5], or
 * explicit degrees (a magnitude, signed by the motion) with their source.
 */
export namespace AutoMovieMotionHumanRange {
  /** The levels of {@link IAutoMovieMotionHumanRange.Level}, as data. */
  export const LEVEL_NAMES = [
    "slight",
    "light",
    "half",
    "deep",
    "full",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanRange.Level>[];

  /**
   * The share of each level (provisional; checked by the fit of the gesture
   * amplitudes and the reaction sizes that were converted onto them, listed in
   * the campaign's pull request).
   */
  export const LEVELS: Readonly<
    Record<IAutoMovieMotionHumanRange.Level, number>
  > = {
    slight: 0.1,
    light: 0.25,
    half: 0.5,
    deep: 0.75,
    full: 0.9,
  };

  /** The motions of {@link IAutoMovieMotionHumanRange.Motion}, as data. */
  export const MOTIONS = [
    "flexion",
    "extension",
    "abduction",
    "adduction",
    "external",
    "internal",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanRange.Motion>[];

  /**
   * The share of a level, scaled or not.
   *
   * @param amount A level, or a level with a scale.
   * @returns The share, in (0, 1].
   * @throws {Error} When the scale lies outside [0.5, 1.5] or the scaled share
   *   exceeds 1.
   */
  export function share(amount: ShareAmount): number {
    if (typeof amount === "string") return LEVELS[amount];
    if (!(amount.scale >= 0.5 && amount.scale <= 1.5)) {
      const names: IAutoMovieMotionHumanRange.Level[] = Object.keys(
        LEVELS,
      ) as IAutoMovieMotionHumanRange.Level[];
      const next: IAutoMovieMotionHumanRange.Level | undefined =
        names[names.indexOf(amount.level) + (amount.scale > 1 ? 1 : -1)];
      throw new Error(
        `A scale of ${amount.scale} on ${amount.level} lies outside [0.5, 1.5]; ${
          next === undefined
            ? "state explicit degrees"
            : `use the level ${next}`
        }`,
      );
    }
    const scaled: number = LEVELS[amount.level] * amount.scale;
    if (scaled > 1)
      throw new Error(
        `${amount.level} scaled by ${amount.scale} exceeds the whole range`,
      );
    return scaled;
  }

  /**
   * The clinical degrees of a joint's motion by an amount.
   *
   * @param bone The joint.
   * @param motion The motion.
   * @param amount The amount, on any rung.
   * @returns Signed degrees, as the posture's clinical angles are.
   * @throws {Error} When the joint has no range, the motion's axis is locked or
   *   has no room, explicit degrees are negative or past the limit, or an
   *   explicit source is empty.
   */
  export function degrees(
    bone: AutoMovieHumanoidBone,
    motion: IAutoMovieMotionHumanRange.Motion,
    amount: IAutoMovieMotionHumanRange.Amount,
  ): number {
    const end: number | null = limit(bone, motion);
    if (end === null) throw new Error(`${bone} has no range in ${motion}`);
    if (typeof amount === "string" || "level" in amount)
      return share(amount) * end;
    checked(amount, Math.abs(end), `${bone} ${motion}`);
    return Math.sign(end) * amount.degrees;
  }

  /**
   * The signed limit a motion of a joint reads.
   *
   * @param bone The joint.
   * @param motion The motion.
   * @returns Signed degrees, or null when the joint has no range, the motion's
   *   axis is locked or the limit is 0.
   */
  export function limit(
    bone: AutoMovieHumanoidBone,
    motion: IAutoMovieMotionHumanRange.Motion,
  ): number | null {
    const joint: IAutoMovieJointConstraint | undefined =
      DEFAULT_HUMANOID_ROM[bone];
    if (joint === undefined) return null;
    const axis: IAutoMovieAngleRange | null =
      motion === "flexion" || motion === "extension"
        ? joint.flexion
        : motion === "abduction" || motion === "adduction"
          ? joint.abduction
          : joint.twist;
    if (axis === null) return null;
    const end: number =
      motion === "flexion" || motion === "abduction" || motion === "external"
        ? axis.max
        : axis.min;
    return end === 0 ? null : end;
  }

  /**
   * The trunk's lean by an amount: a share of the reach's lean limit.
   *
   * @param amount The amount, on any rung.
   * @returns Degrees, not negative.
   * @throws {Error} When explicit degrees are negative or past the limit, or an
   *   explicit source is empty.
   */
  export function lean(amount: IAutoMovieMotionHumanRange.Amount): number {
    const end: number = AutoMovieMotionHumanReach.LEAN_LIMIT;
    if (typeof amount === "string" || "level" in amount)
      return share(amount) * end;
    checked(amount, end, "the trunk's lean");
    return amount.degrees;
  }

  /**
   * A root shift as a share of the stature.
   *
   * @param body The body.
   * @param share The share of the stature.
   * @returns Metres.
   */
  export function shift(
    body: Pick<IAutoMovieMotionHumanBody, "measure">,
    share: number,
  ): number {
    return share * body.measure.stature;
  }
}

/** The alternatives of `ShareAmount`'s site. */
type ShareAmount =
  | IAutoMovieMotionHumanRange.Level
  | IAutoMovieMotionHumanRange.IScaled;

/** Refuses explicit degrees that are unsourced, negative or past a limit. */
function checked(
  amount: IAutoMovieMotionHumanRange.IExplicit,
  most: number,
  what: string,
): void {
  if (amount.source.trim() === "")
    throw new Error("Explicit degrees state their source");
  HumanBound.within(what, amount.degrees, 0, most, "degrees");
}
