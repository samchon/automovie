/** Fit-local use of the internal lagged numerical curvature option. */
export interface IAutoMovieRecoveryCurvatureReport {
  /**
   * Whether fixed optional numerical and seed capacity was admitted for this
   * fit.
   */
  eligible: boolean;

  /** All requested existing models, including terminal checks. */
  models: number;

  /** Models using GN because optional capacity was not admitted. */
  capacity: number;

  /**
   * Eligible models using GN because the latest accepted update supplied no
   * seed.
   */
  noSeed: number;

  /** Eligible seeded models whose full optional attempt was charged. */
  attempted: number;

  /** Models returning a complete optional numerical factor/row pair. */
  supported: number;

  /** Attempted models with pre-return optional arithmetic refusal. */
  refused: number;

  /**
   * Latest model's reason; null denotes supported numerical use, not normal
   * convergence.
   */
  latestReason:
    | "capacity"
    | "no-seed"
    | "local-formation"
    | "point-pivot"
    | "camera-pivot"
    | "row-whitening"
    | null;
}
