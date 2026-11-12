import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanBound } from "../law/HumanBound";
import { AutoMovieMotionHumanReach } from "./AutoMovieMotionHumanReach";

/**
 * Amounts by level: how far a joint turns as a share of its range of motion,
 * how far the trunk leans as a share of the reach's lean limit, and how far
 * the root shifts as a share of the stature.
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
 * The result is signed as the posture's clinical angles are, so an extension
 * is negative.
 *
 * An amount has three rungs: a level, a level with a scale in [0.5, 1.5], or
 * explicit degrees (a magnitude, signed by the motion) with their source.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a level is a share of, which limit each motion reads, the sign of the result and the three rungs.
 * @evidence contracts/development/design.md#principled-representation A share of the joint's own range, the normalisation joint-discomfort posture prediction uses, so a level means the same effort at every joint.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One table of five levels and five functions; the only owner of amounts by level.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Levels and motions are closed unions; the ranges are the engine's and are not copied here.
 */
export namespace AutoMovieMotionHumanRange {
  /**
   * How far, as a named share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is named; `LEVELS` gives each share.
   * @evidence contracts/development/design.md#principled-representation Five steps from barely to nearly all of a range, ordered so a scale past its bound names the next one.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five names, each with a shipped law that uses its share.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No level is the whole range: a joint at its limit is an explicit decision on the explicit rung.
   */
  export type Level = "slight" | "light" | "half" | "deep" | "full";

  /**
   * The share of each level (provisional; checked by the fit of the gesture
   * amplitudes and the reaction sizes that were converted onto them, listed
   * in the campaign's pull request).
   */
  export const LEVELS: Readonly<Record<Level, number>> = {
    slight: 0.1,
    light: 0.25,
    half: 0.5,
    deep: 0.75,
    full: 0.9,
  };

  /**
   * A direction a joint turns in, by its clinical name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is named; the namespace gives the limit each reads.
   * @evidence contracts/development/design.md#principled-representation The six clinical motions of a three-axis joint, so a law never writes a sign.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six names, the two ends of the three axes of `IAutoMovieJointConstraint`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union mapped exhaustively to a limit.
   */
  export type Motion =
    | "flexion"
    | "extension"
    | "abduction"
    | "adduction"
    | "external"
    | "internal";

  /**
   * A level with a scale.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two members and the scale's range.
   * @evidence contracts/development/design.md#principled-representation The middle rung of an amount: the level keeps the intent and the scale states the correction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; read by `share`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The scale is bounded so it cannot stand in for another level.
   */
  export interface IScaled {
    /** The level. */
    level: Level;

    /** The factor, in [0.5, 1.5]. */
    scale: number;
  }

  /**
   * Explicit degrees with where they come from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the magnitude's sign rule and what a source is.
   * @evidence contracts/development/design.md#principled-representation The last rung of an amount: a magnitude the motion signs, for a sourced angle no level states.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; read by `degrees` and `lean`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The source is required by the type and refused when empty.
   */
  export interface IExplicit {
    /** The magnitude, degrees; not negative, since the motion gives the sign. */
    degrees: number;

    /** A citation, or `provisional: <capture case name>`. */
    source: string;
  }

  /**
   * An amount on one of three rungs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the three rungs; the namespace describes them.
   * @evidence contracts/development/design.md#principled-representation Intent first and degrees on demand: every rung resolves to degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One union of three members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union; the rungs do not nest.
   */
  export type Amount = Level | IScaled | IExplicit;

  /**
   * The share of a level, scaled or not.
   *
   * @param amount A level, or a level with a scale.
   * @returns The share, in (0, 1].
   * @throws {Error} When the scale lies outside [0.5, 1.5] or the scaled share exceeds 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result's range and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The level's share times the scale.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped: a scale past its bound throws and names the neighbouring level.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function share(amount: Level | IScaled): number {
    if (typeof amount === "string") return LEVELS[amount];
    if (!(amount.scale >= 0.5 && amount.scale <= 1.5)) {
      const names: Level[] = Object.keys(LEVELS) as Level[];
      const next: Level | undefined =
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
   * @throws {Error} When the joint has no range, the motion's axis is locked or has no room, explicit degrees are negative or past the limit, or an explicit source is empty.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result's sign and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The share times the motion's limit in `DEFAULT_HUMANOID_ROM`, measured from the joint's rest at 0; explicit degrees take the limit's sign.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One limit lookup, then one branch per rung.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped: a locked axis and degrees past the limit throw.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the engine's range table and delegates the share to `share`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function degrees(
    bone: AutoMovieHumanoidBone,
    motion: Motion,
    amount: Amount,
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
   * @returns Signed degrees, or null when the joint has no range, the motion's axis is locked or the limit is 0.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result's sign and what null means.
   * @evidence contracts/development/implementation.md#principled-implementation The end of the motion's axis in `DEFAULT_HUMANOID_ROM`, as the namespace's table maps motions to limits.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One axis choice and one end choice.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A motion with no room reads as null, never as 0 degrees.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the engine's range table; `degrees` and the resolve table both read limits here.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function limit(
    bone: AutoMovieHumanoidBone,
    motion: Motion,
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
   * @throws {Error} When explicit degrees are negative or past the limit, or an explicit source is empty.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the limit the share is of, and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The trunk's lean is a root pitch and roll and not one joint, so its range is the limit the reach leans to, `AutoMovieMotionHumanReach.LEAN_LIMIT`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per rung.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the reach's limit and `share`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function lean(amount: Amount): number {
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result's unit.
   * @evidence contracts/development/implementation.md#principled-implementation A small whole-body displacement scales with the body's height, so the same share is the same movement on a short and a tall body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No metres are typed by the caller.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One product with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function shift(
    body: Pick<IHumanBody, "measure">,
    share: number,
  ): number {
    return share * body.measure.stature;
  }
}

/** Refuses explicit degrees that are unsourced, negative or past a limit. */
function checked(
  amount: AutoMovieMotionHumanRange.IExplicit,
  most: number,
  what: string,
): void {
  if (amount.source.trim() === "")
    throw new Error("Explicit degrees state their source");
  HumanBound.within(what, amount.degrees, 0, most, "degrees");
}
