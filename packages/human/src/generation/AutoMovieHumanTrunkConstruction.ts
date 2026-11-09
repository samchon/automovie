import type { IAutoMovieLoftChain } from "@automovie/engine";

import { AutoMovieHumanTrunkChains } from "./AutoMovieHumanTrunkChains";
import { AutoMovieHumanTrunkSolver } from "./AutoMovieHumanTrunkSolver";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanTrunkInputs } from "./IAutoMovieHumanTrunkInputs";
import type { IAutoMovieHumanTrunkSolution } from "./IAutoMovieHumanTrunkSolution";
import type { AutoMovieHumanTrunkNeckSeat } from "./AutoMovieHumanTrunkNeckSeat";

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

  /** One actual solve and its placement metadata, before legacy chains are requested. */
  export interface IPlacement {
    /** Same solved trunk used by placement and the current body original builders. */
    solution: IAutoMovieHumanTrunkSolution;
    /** Existing neck, landmarks and diagnostics; no legacy trunk chains are added. */
    calibration: IAutoMovieHumanBodyCalibration;
  }

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
    return loft(prepare(calibration, inputs, floor));
  }

  /**
   * Prepare the same solve and metadata without constructing legacy chains.
   * @evidence contracts/common.md#principled-implementation Uses the unchanged solver inputs, neck and metadata projection. Production and the explicit legacy receiver share this actual solution.
   * @evidence contracts/common.md#clear-and-simple-design Separates placement from optional legacy chain materialization at their existing owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Omits no solver premise, diagnostic or landmark and supplies no alternative source or fake chain.
   * @evidence contracts/common.md#meaningful-documentation Names the placement-only result and the existing solver's separate reuse policy.
   * @evidence contracts/performance.md#efficient-algorithms Performs the existing solve/metadata work without the unused two legacy chain builds; no measured speedup is claimed.
   * @evidence contracts/performance.md#reuse-equivalent-work Returns the actual solution so later original builders need not depend on an implicit repeated solver-cache lookup.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The invocation owns its metadata and borrows the immutable solver result; no cache or process is introduced.
   */
  export function prepare(
    calibration: IAutoMovieHumanBodyCalibration,
    inputs: IInputs,
    floor: number,
    original?: { seat: AutoMovieHumanTrunkNeckSeat.ISeat; raw: () => IAutoMovieLoftChain },
  ): IPlacement {
    const neck: IAutoMovieLoftChain | undefined = original === undefined ? calibration.chains.find(
      (c: IAutoMovieLoftChain): boolean => c.name === "head",
    ) : undefined;
    if (neck === undefined && original === undefined)
      throw new Error("A trunk stands under the neck chain `head`");

    const solution: IAutoMovieHumanTrunkSolution =
      AutoMovieHumanTrunkSolver.solve({
        inputs,
        stature: calibration.stature,
        crotch: floor,
        ...(original === undefined ? { neck } : { neckBoundary: original.seat, rawNeck: original.raw }),
      });
    return {
      solution,
      calibration: {
        ...calibration,
        trunk: solution.landmarks,
        diagnostics: [
          ...(calibration.diagnostics ?? []),
          ...solution.diagnostics,
        ],
        events: calibration.events.map(
          (
            e: IAutoMovieHumanBodyCalibration.IEvent,
          ): IAutoMovieHumanBodyCalibration.IEvent =>
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
      },
    };
  }

  /**
   * Materialize the legacy receiver only when that actual geometry is requested.
   * @evidence contracts/common.md#principled-implementation Builds the unchanged two chains from the exact prepared solution and retains the neck's original endpoint owner.
   * @evidence contracts/common.md#clear-and-simple-design The legacy apply wrapper and its explicit receiver observer share this one materializer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not re-solve, re-fit or replace the current original trunk with legacy geometry.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes the legacy receiver from the current source tree.
   * @evidence contracts/performance.md#efficient-algorithms Performs the existing bounded two-chain build only on request.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads the supplied solution without another solver call.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns call-owned chain arrays; no persistent receiver is retained here.
   */
  export function loft(prepared: IPlacement): IAutoMovieHumanBodyCalibration {
    const made: IAutoMovieLoftChain[] = AutoMovieHumanTrunkChains.build(
      prepared.solution,
      { samples: SAMPLES, rule: "sagittal" },
    );
    return {
      ...prepared.calibration,
      chains: [
        ...made,
        ...prepared.calibration.chains.filter(
          (chain: IAutoMovieLoftChain): boolean =>
            chain.name !== "trunk" && chain.name !== "upper",
        ),
      ],
    };
  }
}
