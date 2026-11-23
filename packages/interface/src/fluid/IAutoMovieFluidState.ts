/**
 * The complete conserved state of a fluid domain at one absolute step.
 *
 * SimulateFluidDomain replays the supplied domain from its authored state for
 * each absolute integer step, with no retained inter-call state. A seek to n
 * costs n lattice updates and rejects a step outside [0, solver.maxSteps].
 * After each update it checks depth and face velocities for finiteness;
 * returned clock/ledger totals have no corresponding check, and the depth
 * assignment converts a NaN intermediate to zero before that check.
 *
 * Cell arrays are row-major at row * columns + column. Face arrays contain one
 * extra face along the crossed axis, with their indexing given below.
 *
 * With finite representable arithmetic, the flux ledger targets initial volume
 * plus sourceVolume minus drainVolume and outflowVolume, up to rounding.
 * Extreme admitted fields can overflow flux or ledger intermediates; the
 * current checks do not prove that balance for every returned record.
 */
export interface IAutoMovieFluidState {
  /** Id of the domain this state belongs to. */
  domain: string;

  /** Absolute integer step index, `0` being the authored initial state. */
  step: number;

  /** Absolute domain-clock second, exactly `step * solver.fixedStepSeconds`. */
  time: number;

  /** Water depth per cell in metres, row-major, never negative. */
  depth: number[];

  /**
   * +X face velocity in metres per second at row * (columns + 1) + column for
   * columns within [0, columns]. Face column separates cells column - 1 and
   * column; the first and last faces are domain edges.
   */
  velocityX: number[];

  /**
   * +Z face velocity in metres per second at row * columns + column for rows
   * within [0, rows]. Face row separates cell rows row - 1 and row; the first
   * and last faces are domain edges.
   */
  velocityZ: number[];

  /** Water volume currently held by the lattice, in m³. */
  volume: number;

  /** Cumulative volume admitted by declared sources since step 0, in m³. */
  sourceVolume: number;

  /** Cumulative volume removed by declared drains since step 0, in m³. */
  drainVolume: number;

  /** Cumulative volume that left across `open` edges since step 0, in m³. */
  outflowVolume: number;
}
