import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryAtlasTessellation,
} from "..";

/**
 * Evaluated source geometry, automatic levels and bounded atlas-observation
 * policy.
 */
export interface IAutoMovieRecoveryAtlasObservationInput {
  /** Borrowed evaluated source positions, millimetres. */
  verticesMm: readonly Readonly<AutoMovieVector3Tuple>[];

  /** Borrowed oriented source faces addressing verticesMm. */
  triangles: readonly (readonly [number, number, number])[];

  /** Source projection direction used by the scalar chart. */
  axis: Readonly<AutoMovieVector3Tuple>;

  /**
   * Automatic saved scalar levels in millimetres; adjacent values delimit
   * slabs.
   */
  levelsMm: readonly number[];

  /** Optional work-priority ordering of saved slab ordinals. */
  intervalOrder?: readonly number[];

  /**
   * Optional millimetre scalar window selecting intersecting complete saved
   * slabs.
   */
  scalarWindowMm?: readonly [number, number];

  /** Optional original source-face ordinals prioritized within selected work. */
  priorityFaces?: readonly number[];

  /**
   * Whether exact equal-position aliases establish source incidence without
   * moving positions.
   */
  exactCoordinateAliases: boolean;

  /** Physical curve/surface fitting tolerance, millimetres. */
  toleranceMm: number;

  /** Maximum fitted spans per chart boundary curve. */
  maxSpans: number;

  /** Source crease/corner turn threshold in degrees, strictly between 0 and 180. */
  cornerDegrees: number;

  /** Maximum coefficient patches in one chart. */
  maxPatchesPerChart: number;

  /** Maximum numerical fitting iterations per chart. */
  maxIterations: number;

  /**
   * Optional maximum observation-row population per chart; omission retains the
   * fitter's policy.
   */
  maxObservationRowsPerChart?: number;

  /**
   * Optional maximum adaptive refinements per chart; omission retains the
   * fitter's policy.
   */
  maxRefinementsPerChart?: number;

  /** Maximum number of selected source slabs to visit. */
  maxIntervals: number;

  /**
   * Maximum number of selected private charts retained for the common boundary
   * pass.
   */
  maxCharts: number;

  /**
   * When true, publish the admitted chart inventory without coefficient
   * fitting; omission selects ordinary fitting.
   */
  inventoryOnly?: boolean;

  /**
   * Optional experimental millimetre exchange length weighting
   * physical-gradient rows; not an identified optimum.
   */
  physicalGradientLengthMm?: number;

  /** Caller-supplied topology domain for the generated coefficient atlas. */
  topologyDomain: string;

  /** Physical tessellation tolerance and finite emission budgets. */
  tessellation: IAutoMovieRecoveryAtlasTessellation;
}
