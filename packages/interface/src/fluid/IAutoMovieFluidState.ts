/**
 * The complete conserved state of a fluid domain at one **absolute** step.
 *
 * Absolute is the whole contract. A state is a pure function of the domain
 * record and the integer step index, so seeking a shot backwards, forwards, or
 * out of order yields exactly the same numbers as playing it straight through;
 * nothing accumulates in a runtime object between frames.
 *
 * Cell arrays are row-major (`row * columns + column`). Face arrays are indexed
 * as documented on each field: a face lies _between_ two cells, so there is one
 * more of them than cells along the axis they cross.
 *
 * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-seek-state Exposes `IAutoMovieFluidState` as the portable data boundary for the effects fluid seek state requirement.
 * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-seek-and-checkpoint-state Types `IAutoMovieFluidState` for the fluid seek and checkpoint state system contract.
 */
export interface IAutoMovieFluidState {
  /**
   * Identity of the domain this state belongs to.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-seek-state Exposes `domain` as the portable data boundary for the effects fluid seek state requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-seek-and-checkpoint-state Types `domain` for the fluid seek and checkpoint state system contract.
   */
  domain: string;

  /**
   * Absolute integer step index, `0` being the authored initial state.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-seek-state Exposes `step` as the portable data boundary for the effects fluid seek state requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-seek-and-checkpoint-state Types `step` for the fluid seek and checkpoint state system contract.
   */
  step: number;

  /**
   * Absolute domain-clock second, exactly `step * solver.fixedStepSeconds`.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-seek-state Exposes `time` as the portable data boundary for the effects fluid seek state requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-seek-and-checkpoint-state Types `time` for the fluid seek and checkpoint state system contract.
   */
  time: number;

  /**
   * Water depth per cell in metres, row-major, never negative.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-seek-state Exposes `depth` as the portable data boundary for the effects fluid seek state requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-seek-and-checkpoint-state Types `depth` for the fluid seek and checkpoint state system contract.
   */
  depth: number[];

  /**
   * Face velocity along `+x` in m/s, indexed `row * (columns + 1) + column`
   * with `column` in `[0, columns]`. Face `column` separates cell `column - 1`
   * from cell `column`; the outermost two lie on the domain edge.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-seek-state Exposes `velocityX` as the portable data boundary for the effects fluid seek state requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-seek-and-checkpoint-state Types `velocityX` for the fluid seek and checkpoint state system contract.
   */
  velocityX: number[];

  /**
   * Face velocity along `+z` in m/s, indexed `row * columns + column` with
   * `row` in `[0, rows]`. Face `row` separates cell row `row - 1` from cell row
   * `row`; the outermost two lie on the domain edge.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-seek-state Exposes `velocityZ` as the portable data boundary for the effects fluid seek state requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-seek-and-checkpoint-state Types `velocityZ` for the fluid seek and checkpoint state system contract.
   */
  velocityZ: number[];

  /**
   * Water volume currently held by the lattice, in m³.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-seek-state Exposes `volume` as the portable data boundary for the effects fluid seek state requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-seek-and-checkpoint-state Types `volume` for the fluid seek and checkpoint state system contract.
   */
  volume: number;

  /**
   * Cumulative volume admitted by declared sources since step 0, in m³.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-seek-state Exposes `sourceVolume` as the portable data boundary for the effects fluid seek state requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-seek-and-checkpoint-state Types `sourceVolume` for the fluid seek and checkpoint state system contract.
   */
  sourceVolume: number;

  /**
   * Cumulative volume removed by declared drains since step 0, in m³.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-seek-state Exposes `drainVolume` as the portable data boundary for the effects fluid seek state requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-seek-and-checkpoint-state Types `drainVolume` for the fluid seek and checkpoint state system contract.
   */
  drainVolume: number;

  /**
   * Cumulative volume that left across `open` edges since step 0, in m³.
   *
   * @evidence requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-seek-state Exposes `outflowVolume` as the portable data boundary for the effects fluid seek state requirement.
   * @evidence specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-seek-and-checkpoint-state Types `outflowVolume` for the fluid seek and checkpoint state system contract.
   */
  outflowVolume: number;
}
