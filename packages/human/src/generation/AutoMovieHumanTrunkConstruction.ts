import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanTrunkChains } from "./AutoMovieHumanTrunkChains";
import { AutoMovieHumanTrunkSolver } from "./AutoMovieHumanTrunkSolver";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanTrunkInputs } from "./IAutoMovieHumanTrunkInputs";
import type { IAutoMovieHumanTrunkSolution } from "./IAutoMovieHumanTrunkSolution";

/**
 * The trunk and shoulders composed from their pieces: the solve closes the
 * person's tapes and courses on the trunk's own surface
 * (`AutoMovieHumanTrunkSolver`), and the two chains `trunk` and `upper` are
 * built from what it publishes (`AutoMovieHumanTrunkChains`). This file only
 * composes: the landmarks, guides, sectors, features, shoulder line, cap and
 * arm root are each their own piece.
 *
 * The ends belong to the neighbours: the crotch's height comes from the leg
 * law, the neck's bottom ring from the neck, whose layer the shoulders copy.
 * The section is mirror-symmetric, so the legs part exactly on the midline.
 */
export namespace AutoMovieHumanTrunkConstruction {
  /** What a trunk reads, in the same millimetres as the calibration. */
  export type IInputs = IAutoMovieHumanTrunkInputs;

  /** Uniform phases of the chains' rings: two per control point of the 256-control section. */
  const SAMPLES: number = 512;

  /**
   * Calibration with the trunk's rows replaced, or added when it holds none.
   *
   * @param calibration Calibration holding the neck chain `head`.
   * @param inputs Tapes, courses and controls in calibration millimetres.
   * @param floor Height of the crotch in calibration millimetres.
   * @returns The calibration with `trunk` and `upper`, and the diagnostics of any trunk feature that broke its contract and was left out.
   */
  export function apply(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
    floor: number,
  ): IAutoMovieHumanBodyCalibration {
    const neck: IAutoMovieHumanLoftChain | undefined = calibration.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === "head",
    );
    if (neck === undefined) throw new Error("A trunk stands under the neck chain `head`");

    const solution: IAutoMovieHumanTrunkSolution = AutoMovieHumanTrunkSolver.solve({
      inputs,
      stature: calibration.stature,
      crotch: floor,
      neck,
    });
    const made: IAutoMovieHumanLoftChain[] = AutoMovieHumanTrunkChains.build(solution, {
      samples: SAMPLES,
      rule: "sagittal",
    });
    const others: IAutoMovieHumanLoftChain[] = calibration.chains.filter(
      (c: IAutoMovieHumanLoftChain): boolean => c.name !== "trunk" && c.name !== "upper",
    );

    return {
      ...calibration,
      chains: [...made, ...others],
      trunk: solution.landmarks,
      diagnostics: [...(calibration.diagnostics ?? []), ...solution.diagnostics],
      events: calibration.events.map(
        (e: IAutoMovieHumanBodyCalibration.IEvent): IAutoMovieHumanBodyCalibration.IEvent =>
          e.parent === "trunk" && e.direction === "down"
            ? {
                ...e,
                shared: true,
                splits: [
                  { child: "leg.right", arcs: [[Math.PI, 2 * Math.PI]] },
                  { child: "leg.left", arcs: [[0, Math.PI]] },
                ],
              }
            : e,
      ),
    };
  }
}
