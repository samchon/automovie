/**
 * The complete conserved state of a fluid domain at one absolute step.
 *
 * A state is a pure function of the domain record and the integer step index,
 * so seeking a shot backwards, forwards, or out of order yields exactly the
 * same numbers as playing it straight through; nothing accumulates in a runtime
 * object between frames. `simulateFluidDomain` produces it by integrating from
 * the authored state, so a state at step `n` costs `n` lattice updates, and it
 * throws for a step that is not an integer in `[0, solver.maxSteps]` or a state
 * that turns non-finite.
 *
 * Cell arrays are row-major (`row * columns + column`). Face arrays are indexed
 * as documented on each field: a face lies between two cells, so there is one
 * more of them than cells along the axis they cross.
 *
 * The ledger balances: `volume` equals the step-0 volume plus `sourceVolume`
 * minus `drainVolume` and `outflowVolume`, up to floating-point rounding.
 *
 * @evidence contracts/common.md#principled-implementation `simulateFluidDomain` replays the explicit flux-form update from step 0 on every call and accumulates the three ledger terms from the same limited fluxes it applies to depth, so the balance follows from each interior face appearing once with each sign.
 * @evidence contracts/common.md#clear-and-simple-design Depth on cells and velocity on faces is the whole state the next step needs, plus four ledger totals that let a caller audit conservation without re-solving.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No result is cached between seeks, which costs a full replay but keeps every state independent of call order; depth is floored at zero only after the positivity limiter, so the floor absorbs rounding rather than hiding lost volume.
 * @evidence contracts/common.md#meaningful-documentation States the absolute-step determinism, the producer, its cost and both refusals, the array layouts, and the ledger identity; members give units, index formulas and what each total counts.
 * @author Samchon
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
   * Face velocity along `+x` in m/s, indexed `row * (columns + 1) + column`
   * with `column` in `[0, columns]`. Face `column` separates cell `column - 1`
   * from cell `column`; the outermost two lie on the domain edge.
   */
  velocityX: number[];

  /**
   * Face velocity along `+z` in m/s, indexed `row * columns + column` with
   * `row` in `[0, rows]`. Face `row` separates cell row `row - 1` from cell row
   * `row`; the outermost two lie on the domain edge.
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
