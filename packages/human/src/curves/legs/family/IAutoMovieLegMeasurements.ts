import type { IAutoMovieCurve64 as C } from "@automovie/engine";

/**
 * Physical inputs to the cardinal-support and shared-handle leg family.
 * Calibration registers a hip-relative measurement gauge, not saved controls.
 * Native horizontal observations and public-derived straight-rest dimensions
 * use this record with distinct measurement protocols retained by the caller.
 *
 * @author Samchon
 */
export namespace IAutoMovieLegMeasurements {
  /** Four values ordered anatomical outer, anterior, inner and posterior. */
  export type Four = readonly [number, number, number, number];

  /** Mandatory distal courses and optional mass proxy courses. Native suffixes retain legacy identifiers; proxy labels do not certify observed muscle peaks. */
  export type StationName =
    | "vastusLateralisProxy"
    | "thighLower"
    | "vastusMedialisProxy"
    | "aboveKnee"
    | "kneeNative"
    | "patellaInferior"
    | "belowKnee"
    | "calfLateralProxy"
    | "calfNative"
    | "calfMedialProxy"
    | "lowerCalf"
    | "ankleAbove";

  /** Straight rest converts source height to bone arc length. The horizontal diagnostic retains source height only for calibration comparisons. */
  export type Chart = "straight-rest" | "source-horizontal-diagnostic";

  /** Physical dimensions at one course; the family derives cardinal poles and shared tangent handles from this record.
   *
   * @author Samchon
   */
  export interface Station {
    /** Course label used in generated section names and ordering validation. */
    name: StationName;

    /** Fraction in (0,1] from proximal to distal source height; the terminal ankle fraction is 1. */
    sourceFractionProximalToDistal: number;

    /** Positive outer-to-inner support separation, in millimetres. */
    breadthMm: number;

    /** Positive anterior-to-posterior support separation, in millimetres. */
    depthMm: number;

    /** Centre X and Z coordinates in the source section gauge, in millimetres. */
    centerSourceFrameTransverseMm: readonly [number, number];

    /** Outer pole Z displacement divided by half depth; strictly within (-1,1). */
    outerSagittalPhase: number;

    /** Anterior pole X displacement divided by half breadth; strictly within (-1,1). */
    anteriorLateralPhase: number;

    /** Inner pole Z displacement divided by half depth; strictly within (-1,1). */
    innerSagittalPhase: number;

    /** Posterior pole X displacement divided by half breadth; strictly within (-1,1). */
    posteriorLateralPhase: number;

    /** Positive shared tangent-handle lengths at outer, anterior, inner and posterior poles, mm. */
    roundingHandleMm: Four;

    /** dXouter, dZanterior, dXinner and dZposterior per source +Y mm. Required internally unless a complete pole jet is supplied; an omitted terminal jet uses PCHIP seeds. */
    physicalSupportDerivatives?: Four;

    /** Complete outer/anterior/inner/posterior pole derivatives per source +Y mm.
     * Public-derived asymmetric courses supply all XYZ components so transport
     * cannot reseed their lateral centre or fore-aft drift independently.
     */
    physicalPoleDerivatives?: readonly [C.Vector, C.Vector, C.Vector, C.Vector];

    /** Complete shared-handle derivatives per source +Y mm, when explicitly resolved. */
    physicalHandleDerivatives?: Four;
  }

  /** Hip-relative registration and mechanical scale used to convert one positive-side recipe into each actual parent frame.
   *
   * @author Samchon
   */
  export interface Calibration {
    /** Source knee centre minus source hip centre in the mechanical chart, mm. */
    sourceHipToKneeMm: C.Vector;

    /** Source ankle centre minus source hip centre in the same mechanical chart, mm. */
    sourceHipToAnkleMm: C.Vector;

    /** Positive upper-leg and shank mechanical arc lengths per side, mm.
     * Each side's current/source growth scales the shared positive-side recipe.
     * Public-derived inputs use current bone lengths; these fields do not imply
     * independently measured bilateral skin or observed reference anatomy.
     */
    sourceBoneArcLengthsMm: Readonly<
      Record<"left" | "right", readonly [number, number]>
    >;

    /** Source section-gauge origin minus source hip centre, mm. */
    sourceFrameOriginFromHipMm: C.Vector;

    /** Proper source section-gauge basis columns; the longitudinal column must have a nonzero Y projection. */
    sourceFrameBasisColumns: C.Matrix;

    /** Source section-gauge origin minus proximal cut centre in the source chart, mm. */
    sourceOriginRelativeToProximalCutMm: C.Vector;

    /** Distal and proximal source cut Y relative to hip, mm, strictly increasing. */
    sourceRangeYFromHipMm: readonly [number, number];
  }

  /** One physical recipe converted independently in each side's actual proper parent frame.
   *
   * @author Samchon
   */
  export interface Detailed {
    /** Source registration, or the public resolver's equivalent current straight-bone gauge. */
    calibration: Calibration;

    /** Seven mandatory ordered courses, optionally interleaved with the five named feature proxies; final source fraction is 1. */
    stations: readonly Station[];
  }
}
