/**
 * Additional native solver budget of one body for its released quality.
 *
 * A released body may declare a higher articulation solver budget than the
 * world's; Rapier adds per-body iterations on top of the world's own, so the
 * addition is the declared total minus the world's count, never negative.
 * Outside release, or without a declaration, nothing is added.
 */
export function physicalReleasedQuality(input: {
  /** Declared released totals, when the body has a released quality policy. */ quality?: {
    /** Total articulation solver iterations while released. */ iterations: number;
    /** Total internal PGS iterations while released. */ internalIterations: number;
  };
  /** Whether the body's default tracking is currently withdrawn. */ released: boolean;
  /** World solver iterations per step. */ iterations: number;
  /** World internal PGS iterations per step. */ internalIterations: number;
}): {
  /** Additional solver iterations to set on every rigid body of the body. */ solver: number;
  /** Additional internal PGS iterations to set on every rigid body of the body. */ pgs: number;
} {
  if (!input.released || !input.quality) return { solver: 0, pgs: 0 };
  return {
    solver: Math.max(0, input.quality.iterations - input.iterations),
    pgs: Math.max(
      0,
      input.quality.internalIterations - input.internalIterations,
    ),
  };
}
