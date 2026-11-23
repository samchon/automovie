/**
 * Physical surface response addressed by profile collision shapes.
 *
 * Friction and restitution are unitless coefficients in [0, 1]; the pair
 * response uses their arithmetic means. Compliance is nonnegative metres per
 * newton and damping a nonnegative dissipative time constant in seconds.
 * Nonzero compliance requires a positive maximumCompression smaller than each
 * referencing shape's solid core extent; a rigid material needs no soft depth.
 * validatePhysicalProfile checks numeric ranges and shape-specific core
 * clearance.
 */
export interface IAutoMoviePhysicalMaterial {
  /** Nonblank profile-local id. */
  id: string;

  /** Coulomb coefficient in [0,1]. */
  friction: number;

  /** Restitution in [0,1]. */
  restitution: number;

  /** Nonnegative contact compliance, metres per newton; zero is rigid. */
  compliance: number;

  /**
   * Positive soft-layer depth in metres when compliance is nonzero; a rigid
   * core limits compression.
   */
  maximumCompression?: number;

  /** Nonnegative dissipative contact time constant, seconds. */
  damping: number;
}
