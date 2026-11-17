import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadTapeSource } from "./IAutoMovieHumanHeadTapeSource";

/** Type contracts exchanged by AutoMovieHumanHeadTape; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadTape {
  /**
   * Selected source family member and the public-input closure witness.
   *
   * @evidence contracts/common.md#principled-implementation Preserves the actual source that produced the measured course and its independent tape target.
   * @evidence contracts/common.md#clear-and-simple-design Original part, its plan and selected family control remain one result.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The result claims no loft, merge, skin or independent clinical validation.
   * @evidence contracts/common.md#meaningful-documentation All lengths use calibration mm; the power is a representational source-family control.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no solve.
   * @evidence contracts/performance.md#reuse-equivalent-work Production borrows this exact original part.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the selected plan, original source closures and witness.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Selected source family member and the public-input closure witness.
   * @evidence contracts/development/design.md#principled-representation `plan`: Actual closed plan, preserving the independent public dimensions. `part`: Identical original source used by the selected numerical witness. `power`: Retained diagonal-transfer control chosen by the scalar solve.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadTape.close, AutoMovieHumanHeadTape.solve. Also types AutoMovieHumanHeadCanonical.tape, AutoMovieHumanHeadTape.continued.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `plan`, `part`, `power`, `course`, `targetMm`; callers supply the complete record.
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
   * @evidence contracts/common.md#principled-implementation The length belongs to the specified original plane/source intersection, not a section template.
   * @evidence contracts/common.md#clear-and-simple-design Plane, metric and numerical search diagnostics have separate fields.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Resolution and K/2K difference are observations, not error or global-maximum certificates.
   * @evidence contracts/common.md#meaningful-documentation Length/difference are mm; normalized coordinates describe the admitted plane search only.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no search.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The factory owns original-source reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains fixed-size witness data and bounded failure descriptions.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual course witness and bounded numerical search diagnostics.
   * @evidence contracts/development/design.md#principled-representation `plane`: Actual original-source plane. `lengthMm`: Numerically integrated actual world course, mm. `differenceMm`: Shared quadrature K/2K difference, mm, not a bound.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadTape.maximum, AutoMovieHumanHeadTape.refine. Read by AutoMovieHumanHeadTape.refine. Also types AutoMovieHumanHeadTape.certified, AutoMovieHumanHeadTape.best.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `plane`, `lengthMm`, `differenceMm`, `coordinates`, `resolution`, `evaluations`, `unavailable`; callers supply the complete record.
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
    /** Count of explicitly excluded crown-pole candidates; source/callback/calculation errors propagate. */
    unavailable: number;
  }

  /** One actual factory member, retaining the input plan and original part.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One actual factory member, retaining the input plan and original part.
   * @evidence contracts/development/design.md#principled-representation `plan`: Resolved head dimensions and landmark layout that place this measurement course. `part`: Geometric part with its original axis and section laws; its declared source frame and units apply.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadTape.close, AutoMovieHumanHeadTape.solve. Also types AutoMovieHumanHeadTape.member.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `plan`, `part`; callers supply the complete record.
   */
  export type Member = {
    /** Resolved head dimensions and landmark layout that place this measurement course. */
    plan: IAutoMovieHumanHeadLayout;
    /** Geometric part with its original axis and section laws; its declared source frame and units apply. */
    part: IAutoMovieViewPart;
  };

  /** A world sagittal point, calibration mm; side tilt is excluded.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A world sagittal point, calibration mm; side tilt is excluded.
   * @evidence contracts/development/design.md#principled-representation A world sagittal point, calibration mm; side tilt is excluded. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadTape.close, AutoMovieHumanHeadTape.solve, AutoMovieHumanHeadTape.maximum.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadTape.close, AutoMovieHumanHeadTape.solve, AutoMovieHumanHeadTape.maximum, AutoMovieHumanHeadTape.evaluate for a world sagittal point, calibration mm; side tilt is excluded.
   */
  export type P2 = readonly [number, number];

  /** The factory argument of AutoMovieHumanHeadTape.close. Close the retained1.6..6 cranial diagonal-transfer family on its actual tape.
  The factory must preserve all four guide curves, public calipers and the
  original neck/face field below nasion while changing cranial fullness.
  Ear attachment points must come from that unchanged material region.
  Existing G supplies the fixed anterior-seat convention independently
  of the tape target; Me bounds upper-source ownership, not a tape measure.
  Cost: every residual is a member whose course maximum needs many complete
  course measurements. The closure therefore tracks the maximum by
  continuation between members and certifies only the final member with the
  complete search (see `solve`), instead of scanning every member
  completely; the public target, the 1e-8 mm allowance and every refusal
  are unchanged, and a failed certification repeats the former complete
  procedure.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Close the retained1.6..6 cranial diagonal-transfer family on its actual tape.
 * @evidence contracts/development/design.md#principled-representation Close the retained1.6..6 cranial diagonal-transfer family on its actual tape. The callable takes power and returns Member.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadTape.CloseFactory is the canonical exchange used by AutoMovieHumanHeadTape.close.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadTape.close for close the retained1.6..6 cranial diagonal-transfer family on its actual tape.
 */
  export type CloseFactory = (power: number) => Member;

  /** Ordered physical cranial stations [first, brow, crown], millimetres. The source domain must contain first, first < brow < crown, and crown must equal its upper endpoint; maximum throws otherwise. Numerically maximize regular front-higher/no-side-tilt cranial courses.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Ordered physical cranial stations [first, brow, crown], millimetres.
   * @evidence contracts/development/design.md#principled-representation Ordered physical cranial stations [first, brow, crown], millimetres. The source domain must contain first, first < brow < crown, and crown must equal its upper endpoint; maximum throws otherwise. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadTape.MaximumRegion is the canonical exchange used by AutoMovieHumanHeadTape.maximum.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadTape.maximum for ordered physical cranial stations [first, brow, crown], millimetres.
   */
  export type MaximumRegion = readonly [
    firstMillimetres: number,
    browMillimetres: number,
    crownMillimetres: number,
  ];

  /** Optional extra search candidate [u, v], dimensionless shares in [0, 1]. The front station is brow + u*(crown-brow), then the posterior station is first + v*(front-first); an inadmissible candidate is skipped while the full search continues. Numerically maximize regular front-higher/no-side-tilt cranial courses.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Optional extra search candidate [u, v], dimensionless shares in [0, 1].
   * @evidence contracts/development/design.md#principled-representation Optional extra search candidate [u, v], dimensionless shares in [0, 1]. The front station is brow + u*(crown-brow), then the posterior station is first + v*(front-first); an inadmissible candidate is skipped while the full search continues. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadTape.MaximumSeed is the canonical exchange used by AutoMovieHumanHeadTape.maximum.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadTape.maximum for optional extra search candidate [u, v], dimensionless shares in [0, 1].
   */
  export type MaximumSeed = readonly [
    frontShare: number,
    posteriorShare: number,
  ];
}
