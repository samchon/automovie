import type { IAutoMovieMotionHumanTarget } from "./IAutoMovieMotionHumanTarget";

/**
 * The places of the air around a performer by name: the heights, lateral
 * offsets and distances a law states a hand's place with, the three rungs of a
 * place (a name, a nudged or in-between name, an explicit share record), the
 * share record each resolves to on a body (`place`, the
 * `IAutoMovieMotionHumanTarget.IDefault` that `AutoMovieMotionHumanTarget`'s
 * `fallback` and `resolve` take), and the names a world point falls in
 * (`nearest`).
 */
export namespace IAutoMovieMotionHumanTargetGrid {
  /**
   * A small displacement of a place in the performer's floor frame, each
   * component a share of the arm (upper arm and forearm) within `NUDGE`.
   */
  export interface INudge {
    /**
     * Toward the acting hand's side; negative is toward the midline and across
     * it; 0 when absent.
     */
    out?: number;

    /** Upward; 0 when absent. */
    up?: number;

    /** Forward; 0 when absent. */
    forward?: number;
  }

  /**
   * A place of the air on one of three rungs: a name (a whole place or three
   * grid names), a name with a nudge or a share between two names, or an
   * explicit share record with its source.
   */
  export type Place =
    | IAutoMovieMotionHumanTarget.Name
    | IAutoMovieMotionHumanTargetGrid.IGrid
    | IAutoMovieMotionHumanTargetGrid.INudged
    | IAutoMovieMotionHumanTargetGrid.IBetween
    | IAutoMovieMotionHumanTargetGrid.IExplicit;

  /** A place of the air around the performer, by three names. */
  export interface IGrid {
    /** How high. */
    height: IAutoMovieMotionHumanTargetGrid.Height;

    /** How far to the acting hand's side. */
    lateral: IAutoMovieMotionHumanTargetGrid.Lateral;

    /** How far ahead. */
    distance: IAutoMovieMotionHumanTargetGrid.Distance;

    /** Which way the place faces; back at the performer when absent. */
    facing?: "performer" | "up";
  }

  /**
   * A height of the standing body, read from its measure: the floor, six
   * joints, the crown, and `overhead`, where a raised hand stands.
   */
  export type Height = (readonly [
    "floor",
    "knee",
    "hip",
    "waist",
    "chest",
    "shoulder",
    "neck",
    "eye",
    "crown",
    "overhead",
  ])[number];

  /** How far to the acting hand's side of the midline. */
  export type Lateral = (readonly [
    "centre",
    "inside",
    "shoulder",
    "outside",
  ])[number];

  /** How far ahead of the root's vertical axis. */
  export type Distance = (readonly ["close", "near", "mid", "far"])[number];

  /** A named place with a nudge. */
  export interface INudged {
    /** The place nudged. */
    at:
      | IAutoMovieMotionHumanTarget.Name
      | IAutoMovieMotionHumanTargetGrid.IGrid;

    /** The nudge. */
    nudge: IAutoMovieMotionHumanTargetGrid.INudge;
  }

  /** A place a share of the way from one named place to another. */
  export interface IBetween {
    /** The two places. */
    between: readonly [
      IAutoMovieMotionHumanTarget.Name | IAutoMovieMotionHumanTargetGrid.IGrid,
      IAutoMovieMotionHumanTarget.Name | IAutoMovieMotionHumanTargetGrid.IGrid,
    ];

    /** How far from the first to the second, in [0, 1]. */
    share: number;

    /** A nudge of the place between; none when absent. */
    nudge?: IAutoMovieMotionHumanTargetGrid.INudge;
  }

  /** A place stated as its share record, with where the shares come from. */
  export interface IExplicit {
    /** The share record. */
    explicit: IAutoMovieMotionHumanTarget.IDefault;

    /** A citation, or `provisional: <capture case name>`. */
    source: string;
  }
}
