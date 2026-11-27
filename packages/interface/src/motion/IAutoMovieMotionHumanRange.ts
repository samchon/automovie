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
export namespace IAutoMovieMotionHumanRange {
  /** How far, as a named share. */
  export type Level = (readonly [
    "slight",
    "light",
    "half",
    "deep",
    "full",
  ])[number];

  /** A direction a joint turns in, by its clinical name. */
  export type Motion = (readonly [
    "flexion",
    "extension",
    "abduction",
    "adduction",
    "external",
    "internal",
  ])[number];

  /** A level with a scale. */
  export interface IScaled {
    /** The level. */
    level: IAutoMovieMotionHumanRange.Level;

    /** The factor, in [0.5, 1.5]. */
    scale: number;
  }

  /** Explicit degrees with where they come from. */
  export interface IExplicit {
    /** The magnitude, degrees; not negative, since the motion gives the sign. */
    degrees: number;

    /** A citation, or `provisional: <capture case name>`. */
    source: string;
  }

  /** An amount on one of three rungs. */
  export type Amount =
    | IAutoMovieMotionHumanRange.Level
    | IAutoMovieMotionHumanRange.IScaled
    | IAutoMovieMotionHumanRange.IExplicit;
}
