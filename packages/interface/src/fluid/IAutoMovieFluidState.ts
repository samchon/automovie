/**
 * The complete conserved state of a fluid domain at one absolute step.
 *
 * simulateFluidDomain replays the supplied domain from its authored state for each absolute integer step, with no retained inter-call state. A seek to n costs n lattice updates and rejects a step outside [0, solver.maxSteps]. After each update it checks depth and face velocities for finiteness; returned clock/ledger totals have no corresponding check, and the depth assignment converts a NaN intermediate to zero before that check.
 *
 * Cell arrays are row-major at row * columns + column. Face arrays contain one extra face along the crossed axis, with their indexing given below.
 *
 * With finite representable arithmetic, the flux ledger targets initial volume plus sourceVolume minus drainVolume and outflowVolume, up to rounding. Extreme admitted fields can overflow flux or ledger intermediates; the current checks do not prove that balance for every returned record.
 *
 * @evidence contracts/common.md#principled-implementation Each call replays an explicit flux-form update from zero, with a shared donor-scaled limiter and ledger contributions from the same fluxes. Interior cancellation gives mathematical conservation under finite arithmetic; shape admission and the current depth/velocity checks do not establish finite clock/ledger values or detect a NaN depth intermediate already replaced by zero.
 * @evidence contracts/common.md#clear-and-simple-design Depth on cells and velocity on faces is the whole state the next step needs, plus four ledger totals that let a caller audit conservation without re-solving.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No result cache makes seek results independent of earlier calls for unchanged inputs. The nonpositive-depth assignment follows limiting but also hides NaN intermediates, and ledger/time overflow is not independently refused; these remain unresolved numerical admission gaps rather than guaranteed roundoff-only corrections.
 * @evidence contracts/common.md#meaningful-documentation States replay ownership and cost, step refusal, exact scope and limits of finite-state checks, array layouts and the intended finite-arithmetic ledger relation; members give units, indices and each total's meaning.
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
   * +X face velocity in metres per second at row * (columns + 1) + column for columns within [0, columns]. Face column separates cells column - 1 and column; the first and last faces are domain edges.
   */
  velocityX: number[];

  /**
   * +Z face velocity in metres per second at row * columns + column for rows within [0, rows]. Face row separates cell rows row - 1 and row; the first and last faces are domain edges.
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
