/**
 * Fit-local use of the internal lagged numerical curvature option.
 *
 * @evidence contracts/development/design.md#principled-representation Original independent rank precedes any optional curvature attempt; computed factor/row support remains separate from direction qualification, actual selection, normal convergence and checkpoint acceptance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Fixed counters and one latest reason expose requested model use without exporting multipliers, factors or a trajectory history.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An unavailable seed or optional factor is reported independently of successful GN fallback; neither counts as curvature use or nonlinear convergence.
 * @evidence contracts/development/common.md#meaningful-documentation Models include terminal checks. Models partition into capacity, noSeed and attempted; attempted partitions into supported and refused. Latest reason belongs only to the latest existing model.
 */
export interface IAutoMovieRecoveryCurvatureReport {
  /** Whether fixed optional numerical and seed capacity was admitted for this fit. */
  eligible: boolean;

  /** All requested existing models, including terminal checks. */
  models: number;

  /** Models using GN because optional capacity was not admitted. */
  capacity: number;

  /** Eligible models using GN because the latest accepted update supplied no seed. */
  noSeed: number;

  /** Eligible seeded models whose full optional attempt was charged. */
  attempted: number;

  /** Models returning a complete optional numerical factor/row pair. */
  supported: number;

  /** Attempted models with pre-return optional arithmetic refusal. */
  refused: number;

  /** Latest model's reason; null denotes supported numerical use, not normal convergence. */
  latestReason:
    | "capacity"
    | "no-seed"
    | "local-formation"
    | "point-pivot"
    | "camera-pivot"
    | "row-whitening"
    | null;
}
