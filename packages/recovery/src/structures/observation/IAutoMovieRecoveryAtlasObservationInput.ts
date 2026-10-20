import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";

import type { IAutoMovieRecoveryAtlasTessellation } from "./IAutoMovieRecoveryAtlasTessellation";

/**
 * Evaluated source geometry, automatic levels and bounded atlas-observation policy.
 *
 * @evidence contracts/common.md#principled-implementation Physical source coordinates, scalar levels and explicit chart/fitting limits define the same private observation domain before coefficient publication.
 * @evidence contracts/common.md#clear-and-simple-design One named public input separates source observation and fitting policy from the atlas result and its tessellation subrecord.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source priorities and windows select declared work rather than supplying authored curves, hidden caps or replacement source geometry.
 * @evidence contracts/common.md#meaningful-documentation States millimetres, borrowed source arrays, optional selections, count limits and the explicit experimental physical-gradient weight.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased input performs no observation or fitting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The synchronous observer borrows source arrays; its existing budgets bound selected work.
 */
export interface IAutoMovieRecoveryAtlasObservationInput {
  /** Borrowed evaluated source positions, millimetres. */
  verticesMm: readonly C.Vector[];

  /** Borrowed oriented source faces addressing verticesMm. */
  triangles: readonly (readonly [number, number, number])[];

  /** Source projection direction used by the scalar chart. */
  axis: C.Vector;

  /** Automatic saved scalar levels in millimetres; adjacent values delimit slabs. */
  levelsMm: readonly number[];

  /** Optional work-priority ordering of saved slab ordinals. */
  intervalOrder?: readonly number[];

  /** Optional millimetre scalar window selecting intersecting complete saved slabs. */
  scalarWindowMm?: readonly [number, number];

  /** Optional original source-face ordinals prioritized within selected work. */
  priorityFaces?: readonly number[];

  /** Whether exact equal-position aliases establish source incidence without moving positions. */
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

  /** Optional maximum observation-row population per chart; omission retains the fitter's policy. */
  maxObservationRowsPerChart?: number;

  /** Optional maximum adaptive refinements per chart; omission retains the fitter's policy. */
  maxRefinementsPerChart?: number;

  /** Maximum number of selected source slabs to visit. */
  maxIntervals: number;

  /** Maximum number of selected private charts retained for the common boundary pass. */
  maxCharts: number;

  /** When true, publish the admitted chart inventory without coefficient fitting; omission selects ordinary fitting. */
  inventoryOnly?: boolean;

  /** Optional experimental millimetre exchange length weighting physical-gradient rows; not an identified optimum. */
  physicalGradientLengthMm?: number;

  /** Caller-supplied topology domain for the generated coefficient atlas. */
  topologyDomain: string;

  /** Physical tessellation tolerance and finite emission budgets. */
  tessellation: IAutoMovieRecoveryAtlasTessellation;
}
