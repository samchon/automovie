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
 * @evidence contracts/development/common.md#meaningful-documentation degrees: The magnitude, degrees; not negative, since the motion gives the sign.
 * @evidence contracts/development/design.md#principled-representation degrees: The magnitude, degrees; not negative, since the motion gives the sign.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanRange.ts (AutoMovieMotionHumanRange.share, amount); compose/AutoMovieMotionHumanResolve.ts (AutoMovieMotionHumanResolve.table, level); compose/AutoMovieMotionHumanRange.ts (AutoMovieMotionHumanRange.degrees, motion); compose/AutoMovieMotionHumanRange.ts (AutoMovieMotionHumanRange.limit, motion); compose/AutoMovieMotionHumanResolve.ts (AutoMovieMotionHumanResolve.amount, motion); touch/selfAction.ts (selfAction.plan.lift, motion).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.
 */
export namespace IAutoMovieMotionHumanRange {
  /**
   * How far, as a named share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is named; `LEVELS` gives each share.
   * @evidence contracts/development/design.md#principled-representation Five steps from barely to nearly all of a range, ordered so a scale past its bound names the next one.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five names, each with a shipped law that uses its share.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No level is the whole range: a joint at its limit is an explicit decision on the explicit rung.
   */
  export type Level = (readonly [
    "slight",
    "light",
    "half",
    "deep",
    "full",
  ])[number];

  /**
   * A direction a joint turns in, by its clinical name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is named; the namespace gives the limit each reads.
   * @evidence contracts/development/design.md#principled-representation The six clinical motions of a three-axis joint, so a law never writes a sign.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six names, the two ends of the three axes of `IAutoMovieJointConstraint`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union mapped exhaustively to a limit.
   */
  export type Motion = (readonly [
    "flexion",
    "extension",
    "abduction",
    "adduction",
    "external",
    "internal",
  ])[number];

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
    level: IAutoMovieMotionHumanRange.Level;

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
  export type Amount =
    | IAutoMovieMotionHumanRange.Level
    | IAutoMovieMotionHumanRange.IScaled
    | IAutoMovieMotionHumanRange.IExplicit;
}
