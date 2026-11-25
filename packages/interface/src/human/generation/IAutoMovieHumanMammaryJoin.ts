import type { IAutoMovieSolidSharedCurve } from "../../construction/IAutoMovieSolidSharedCurve";
import type { IAutoMovieViewPart } from "../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * The records of the breast's footprint rule and the loop the trunk's skin
 * makes with it (`AutoMovieHumanMammaryJoin`).
 */
export namespace IAutoMovieHumanMammaryJoin {
  /** The independent original sources used to place a bilateral thorax root. */
  export interface IPlacement {
    /** The jugular notch in calibration mm. */
    suprasternale: AutoMovieVector3Tuple;
    /** The person's skin point over the left acromion, calibration mm. */
    shoulder: AutoMovieVector3Tuple;
    /** The midpoint of the person's anatomical hip centres, calibration mm. */
    hips: AutoMovieVector3Tuple;
    /** Actual median navel height, calibration mm. */
    umbilicus: number;
    /** The same original arm definition that supplies each axillary datum. */
    arm(side: "left" | "right"): IAutoMovieViewPart | null;
  }
  /**
   * The person's points the footprint is placed from, mm in the figure's frame,
   * on the side of the figure at +Z.
   */
  export interface IPoints {
    /** Suprasternale, the thorax's origin. */
    suprasternale: AutoMovieVector3Tuple;
    /** The thorax's up axis, a unit vector. */
    up: AutoMovieVector3Tuple;
    /** The hip centres' midpoint, the pelvis's origin. */
    hips: AutoMovieVector3Tuple;
    /**
     * The skin over the acromion (ISO 8559-1 shoulder point), the clavicle's
     * lateral end.
     */
    shoulder: AutoMovieVector3Tuple;
    /** The armpit's front fold point, on the anterior axillary line. */
    armpitFront: AutoMovieVector3Tuple;
    /** The bust point, the dome's top. */
    bust: AutoMovieVector3Tuple;
    /**
     * A point at the person's umbilicus's level (ANSUR II omphalion, the
     * navel's centre), when the person has a navel site.
     */
    umbilicus?: AutoMovieVector3Tuple;
  }

  /** The footprint in the breast course's section frame at the course's start. */
  export interface IFootprint {
    /** The course's start, mm. */
    origin: AutoMovieVector3Tuple;
    /** The course's direction, out of the chest, a unit vector. */
    along: AutoMovieVector3Tuple;
    /** The section chart's `u` axis (up), a unit vector. */
    u: AutoMovieVector3Tuple;
    /** The section chart's `v` axis, a unit vector. */
    v: AutoMovieVector3Tuple;
    /** The reaches along `+u`, `-u`, `+v` and `-v`, mm. */
    reaches: { up: number; down: number; plusV: number; minusV: number };
  }

  /** The loop on a host as a joint loop's master gives it. */
  export interface ILoop {
    /** The world point and its first and second clock derivatives, mm. */
    at: (clock: number) => {
      point: AutoMovieVector3Tuple;
      first: AutoMovieVector3Tuple;
      second: AutoMovieVector3Tuple;
    };
    /** The host chart 2-jet `[station mm, phase rad]` by clock. */
    hostAt: IAutoMovieSolidSharedCurve.Loop;
    /**
     * The course stations, mm, at which the loop's samples stand on the
     * footprint's wall.
     */
    stations: number[];
  }
}
