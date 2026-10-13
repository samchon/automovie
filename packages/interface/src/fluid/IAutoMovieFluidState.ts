/**
 * The complete conserved state of a fluid domain at one **absolute** step.
 *
 * Absolute is the whole contract. A state is a pure function of the domain
 * record and the integer step index, so seeking a shot backwards, forwards, or
 * out of order yields exactly the same numbers as playing it straight through;
 * nothing accumulates in a runtime object between frames. `simulateFluidDomain`
 * produces it by integrating from the authored state, so a state at step `n`
 * costs `n` lattice updates, and it throws for a step that is not an integer in
 * `[0, solver.maxSteps]` or a state that turns non-finite.
 *
 * Cell arrays are row-major (`row * columns + column`). Face arrays are indexed
 * as documented on each field: a face lies _between_ two cells, so there is one
 * more of them than cells along the axis they cross.
 *
 * The ledger balances: `volume` equals the step-0 volume plus `sourceVolume`
 * minus `drainVolume` and `outflowVolume`, up to floating-point rounding.
 *
 * @evidence contracts/common.md#principled-implementation A pure function of `(domain, step)` computed by re-integrating from the authored state with only correctly rounded IEEE-754 operations, so any seek order reproduces the same bits; the price of that purity is a full re-integration per seek.
 * @evidence contracts/common.md#clear-and-simple-design Flat `number[]` arrays in the documented cell and face orders plus four ledger scalars, what the surface derivation, spray sampler and mass-balance check need, with no handle to a running solver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No step or domain is special-cased; the ledger terms let the balance be checked instead of a renormalization hiding loss, and a non-finite state throws at the step it first appears.
 * @evidence contracts/common.md#meaningful-documentation States the index formulas for cells and both face arrays, units, the exact time relation, the ledger meanings since step 0, the balance identity, the per-seek cost, and when production throws.
 * @author Samchon
 */
export interface IAutoMovieFluidState {
  /** Identity of the domain this state belongs to. */
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
