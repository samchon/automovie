import { AutoMovieHumanSeamStation } from "../lofting/AutoMovieHumanSeamStation";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanShoulderRing } from "./AutoMovieHumanShoulderRing";
import { AutoMovieHumanTrunkNeckSeat } from "./AutoMovieHumanTrunkNeckSeat";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";
import { AutoMovieHumanTrunkRing } from "./AutoMovieHumanTrunkRing";
import { AutoMovieHumanTrunkRows } from "./AutoMovieHumanTrunkRows";
import type { IAutoMovieHumanTrunkLandmarks } from "./IAutoMovieHumanTrunkLandmarks";
import type { IAutoMovieHumanTrunkSolution } from "./IAutoMovieHumanTrunkSolution";

/**
 * The trunk's two chains from a solved trunk: `trunk` from the crotch ring to
 * the axilla vault and `upper` from the vault to the neck's bottom ring.
 *
 * One family of rows runs over both chains (`AutoMovieHumanTrunkRows`, every
 * landmark a row of its own), one ring per row: below the vault the torso's
 * ring of seven guides and six sectors (`AutoMovieHumanTrunkRing`), above it
 * the shoulder ring with the arm's arc between the axillary guides
 * (`AutoMovieHumanShoulderRing`). The top row is the neck's bottom layer
 * copied with its slopes and curvatures (rule J3), so the shoulders arrive at
 * the neck with the neck's own jets. Every other row's derivatives are the
 * natural spline's through all rows of both chains (the station rule), so the
 * surface is C2 across every row and across the vault, where the two chains
 * share one layer and its jets.
 *
 * The trunk's features are relief windows over the same chart on both
 * chains, so a feature that reaches the vault, such as the breast's upper
 * pole, runs on across it.
 */
export namespace AutoMovieHumanTrunkChains {
  /** The chains' sampling: uniform phases of each ring and the phase rule. */
  export interface ISampling {
    /** Uniform phases of the chains' rings. */
    samples: number;

    /** Phase correspondence rule. */
    rule: IAutoMovieHumanLoftChain["rule"];
  }

  /**
   * The chains.
   *
   * @param solution The solved trunk.
   * @param sampling The chains' ring sampling.
   * @returns `trunk` and `upper`, bottom first.
   */
  export function build(solution: IAutoMovieHumanTrunkSolution, sampling: ISampling): [IAutoMovieHumanLoftChain, IAutoMovieHumanLoftChain] {
    const l: IAutoMovieHumanTrunkLandmarks = solution.landmarks;
    const top: IAutoMovieHumanLoftChain.ILayer = AutoMovieHumanTrunkNeckSeat.layer(solution.neck);
    const spacing = (): number => AutoMovieHumanTrunkRows.MAX_GAP;

    // Rows of each chain between its ends, the landmarks kept; the vault is
    // both chains' end and one row.
    const lower: number[] = AutoMovieHumanTrunkRows.stations(
      l.crotch,
      l.axilla,
      [l.buttock, l.iliocristale, l.omphalion, l.waist, l.fold, l.bust],
      spacing,
    );
    const higher: number[] = AutoMovieHumanTrunkRows.stations(l.axilla, top.y, [l.glenohumeral[1], solution.line.from], spacing);
    const rows: number[] = [...lower, ...higher.slice(1)];
    const vault: number = lower.length - 1;

    // One ring per row; the top is the neck's layer.
    const shoulder: AutoMovieHumanShoulderRing.IInput = {
      column: solution.column,
      line: solution.line,
      oval: solution.oval,
      axilla: l.axilla,
    };
    const layers: IAutoMovieHumanLoftChain.ILayer[] = rows.map((y: number, k: number): IAutoMovieHumanLoftChain.ILayer => {
      if (k === rows.length - 1) return top;
      const coefficients: number[] =
        k <= vault ? AutoMovieHumanTrunkRing.controls(solution.column.at(y)) : AutoMovieHumanShoulderRing.controls(shoulder, y);

      return { y, coefficients, slopes: new Array<number>(coefficients.length).fill(0) };
    });

    // The station rule over both chains at once, the neck's copied layer kept.
    const whole: IAutoMovieHumanLoftChain = AutoMovieHumanSeamStation.continuous(
      {
        name: "trunk",
        basis: "spline",
        order: AutoMovieHumanTrunkQuadrant.ORDER,
        samples: sampling.samples,
        rule: sampling.rule,
        layers,
        reliefs: solution.reliefs,
      },
      [rows.length - 1],
    );

    return [
      { ...whole, name: "trunk", layers: whole.layers.slice(0, vault + 1) },
      { ...whole, name: "upper", layers: whole.layers.slice(vault) },
    ];
  }
}
