import type { IAutoMovieLoftChain } from "../../construction/IAutoMovieLoftChain";
import type { IAutoMovieHumanTrunkInputs } from "./IAutoMovieHumanTrunkInputs";
import type { IAutoMovieHumanTrunkNeckSeat } from "./IAutoMovieHumanTrunkNeckSeat";

/**
 * Type contracts exchanged by AutoMovieHumanTrunkSolver; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanTrunkSolver exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IFixed. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanTrunkSolver; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IFixed contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanTrunkSolver {
  /** The fixed inputs of a solve.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The fixed inputs of a solve.
   * @evidence contracts/development/design.md#principled-representation `inputs`: The person's tapes, courses and controls in calibration millimetres. `stature`: Stature in calibration millimetres. `crotch`: Height of the crotch ring, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanTrunkSolver.solve, AutoMovieHumanTrunkSolver.converge, AutoMovieHumanTrunkSolver.replay. Also types AutoMovieHumanTrunkSolver.kept, AutoMovieHumanTrunkSolver.SOLVED.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `neck`: Already requested legacy neck chain; absent during direct original preparation. `neckBoundary`: Same physical internal cut's original support descriptor, before any chain. `rawNeck`: Explicit legacy raw supplier; original solving and metadata never call it. `thigh`: The thigh tape, mm, for the groin width; absent, the references' median ratio is used. `groinRatio`: The crotch ring's half girth over the thigh tape, as the leg reports it.
   */
  export interface IFixed {
    /** The person's tapes, courses and controls in calibration millimetres. */
    inputs: IAutoMovieHumanTrunkInputs;

    /** Stature in calibration millimetres. */
    stature: number;

    /** Height of the crotch ring, mm. */
    crotch: number;

    /** Already requested legacy neck chain; absent during direct original preparation. */
    neck?: IAutoMovieLoftChain;

    /** Same physical internal cut's original support descriptor, before any chain. */
    neckBoundary?: IAutoMovieHumanTrunkNeckSeat.ISeat;

    /**
     * Explicit legacy raw supplier; original solving and metadata never call it.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Explicit legacy raw supplier; original solving and metadata never call it.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanTrunkSolver owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanTrunkSolver.IFixed.rawNeck declares the invocation boundary only; AutoMovieHumanTrunkSolver and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanTrunkSolver.IFixed.rawNeck must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanTrunkSolver.IFixed.rawNeck owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanTrunkSolver and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanTrunkSolver producer or caller supplying the callback owns captured state and its lifetime.
     */
    rawNeck?: () => IAutoMovieLoftChain;

    /** The thigh tape, mm, for the groin width; absent, the references' median ratio is used. */
    thigh?: number;

    /** The crotch ring's half girth over the thigh tape, as the leg reports it. */
    groinRatio?: number;
  }
}
