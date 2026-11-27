import type { IAutoMovieViewPart } from "../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadTapeSource } from "./IAutoMovieHumanHeadTapeSource";

/**
 * Type contracts exchanged by AutoMovieHumanHeadTape; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanHeadTape {
  /**
   * Selected source family member and the public-input closure witness.
   *
   * Production borrows this exact original part. The caller owns the selected
   * plan, original source closures and witness.
   */
  export interface IResult {
    /** Actual closed plan, preserving the independent public dimensions. */
    plan: IAutoMovieHumanHeadLayout;
    /** Identical original source used by the selected numerical witness. */
    part: IAutoMovieViewPart;
    /** Retained diagonal-transfer control chosen by the scalar solve. */
    power: number;
    /** Actual numerically maximizing source course. */
    course: ICourse;
    /** Public target, mm. */
    targetMm: number;
  }

  /**
   * Actual course witness and bounded numerical search diagnostics.
   *
   * Retains fixed-size witness data and bounded failure descriptions.
   */
  export interface ICourse {
    /** Actual original-source plane. */
    plane: IAutoMovieHumanHeadTapeSource.IPlane;
    /** Numerically integrated actual world course, mm. */
    lengthMm: number;
    /** Shared quadrature K/2K difference, mm, not a bound. */
    differenceMm: number;
    /** Normalized front/back search coordinates. */
    coordinates: [number, number];
    /** Last normalized search step, not an optimality bound. */
    resolution: number;
    /** Number of attempted planes, including explicit inadmissible members. */
    evaluations: number;
    /**
     * Count of explicitly excluded crown-pole candidates;
     * source/callback/calculation errors propagate.
     */
    unavailable: number;
  }

  /** One actual factory member, retaining the input plan and original part. */
  export type Member = {
    /**
     * Resolved head dimensions and landmark layout that place this measurement
     * course.
     */
    plan: IAutoMovieHumanHeadLayout;
    /**
     * Geometric part with its original axis and section laws; its declared
     * source frame and units apply.
     */
    part: IAutoMovieViewPart;
  };

  /** A world sagittal point, calibration mm; side tilt is excluded. */
  export type P2 = readonly [number, number];

  /**
   * The factory argument of AutoMovieHumanHeadTape.close. Close the
   * retained1.6..6 cranial diagonal-transfer family on its actual tape. The
   * factory must preserve all four guide curves, public calipers and the
   * original neck/face field below nasion while changing cranial fullness. Ear
   * attachment points must come from that unchanged material region. Existing G
   * supplies the fixed anterior-seat convention independently of the tape
   * target; Me bounds upper-source ownership, not a tape measure. Cost: every
   * residual is a member whose course maximum needs many complete course
   * measurements. The closure therefore tracks the maximum by continuation
   * between members and certifies only the final member with the complete
   * search (see `solve`), instead of scanning every member completely; the
   * public target, the 1e-8 mm allowance and every refusal are unchanged, and a
   * failed certification repeats the former complete procedure.
   */
  export type CloseFactory = (power: number) => Member;

  /**
   * Ordered physical cranial stations [first, brow, crown], millimetres. The
   * source domain must contain first, first < brow < crown, and crown must
   * equal its upper endpoint; maximum throws otherwise. Numerically maximize
   * regular front-higher/no-side-tilt cranial courses.
   */
  export type MaximumRegion = readonly [
    firstMillimetres: number,
    browMillimetres: number,
    crownMillimetres: number,
  ];

  /**
   * Optional extra search candidate [u, v], dimensionless shares in [0, 1]. The
   * front station is brow + u*(crown-brow), then the posterior station is first
   * + v*(front-first); an inadmissible candidate is skipped while the full
   * search continues. Numerically maximize regular front-higher/no-side-tilt
   * cranial courses.
   */
  export type MaximumSeed = readonly [
    frontShare: number,
    posteriorShare: number,
  ];
}
