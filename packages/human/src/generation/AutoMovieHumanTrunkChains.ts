import { AutoMovieSeamStation, type IAutoMovieLoftChain } from "@automovie/engine";
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
 * landmark a row of its own). The vault is a branch: the shoulders' ring there
 * is the parent the arm and the torso part from (the event `upper` down), so
 * the two chains hold two rings at the vault's height. The trunk's top ring is
 * the torso's (`AutoMovieHumanTrunkRing`), crossing the armpit as the bridge
 * between its two arcs; the shoulders' bottom ring is the torso's with the
 * arm's arc between the axillary guides at its full crease
 * (`AutoMovieHumanShoulderRing`), the arm's top ring.
 *
 * Each chain's derivatives are the natural spline's through the rows of both
 * chains, each chain reading its own ring at the vault and the neighbour's
 * rings beyond it: below the vault both read the torso, above it the trunk
 * reads the shoulders' wall without the arm (`AutoMovieHumanShoulderRing.wall`)
 * and the shoulders their own ring. A control whose value is the same in both
 * families has the same spline in both, so wherever the arm's arc leaves the
 * ring unchanged the surface is C2 across the vault. The top row is the
 * neck's bottom layer copied with its slopes and curvatures (rule J3), so the
 * shoulders arrive at the neck with the neck's own jets.
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
    rule: IAutoMovieLoftChain["rule"];
  }

  /**
   * The chains.
   *
   * @param solution The solved trunk.
   * @param sampling The chains' ring sampling.
   * @returns `trunk` and `upper`, bottom first.
   */
  export function build(solution: IAutoMovieHumanTrunkSolution, sampling: ISampling): [IAutoMovieLoftChain, IAutoMovieLoftChain] {
    const l: IAutoMovieHumanTrunkLandmarks = solution.landmarks;
    const top: IAutoMovieLoftChain.ILayer = AutoMovieHumanTrunkNeckSeat.layer(solution.neck);
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
    const shoulder: AutoMovieHumanShoulderRing.IInput = {
      column: solution.column,
      line: solution.line,
      oval: solution.oval,
      axilla: l.axilla,
    };

    // The torso's rings to the vault, shared by both families.
    const torso: number[][] = lower.map((y: number): number[] => AutoMovieHumanTrunkRing.controls(solution.column.at(y)));

    // A family: its rings at the vault and above it, the neck's layer on top,
    // under the station rule with the neck's copied layer kept.
    const family = (name: string, ring: (y: number) => number[]): IAutoMovieLoftChain => {
      const layers: IAutoMovieLoftChain.ILayer[] = rows.map((y: number, k: number): IAutoMovieLoftChain.ILayer => {
        if (k === rows.length - 1) return top;
        const coefficients: number[] = k < vault ? torso[k]! : ring(y);

        return { y, coefficients, slopes: new Array<number>(coefficients.length).fill(0) };
      });

      return AutoMovieSeamStation.continuous(
        {
          name,
          basis: "spline",
          order: AutoMovieHumanTrunkQuadrant.ORDER,
          samples: sampling.samples,
          rule: sampling.rule,
          layers,
          reliefs: solution.reliefs,
        },
        [rows.length - 1],
      );
    };

    // The trunk's family reads the torso at the vault and the shoulders' wall
    // without the arm above it; the shoulders' family its own ring from the vault up.
    const trunk: IAutoMovieLoftChain = family("trunk", (y: number): number[] =>
      y <= l.axilla ? torso[vault]! : AutoMovieHumanShoulderRing.wall(shoulder, y),
    );
    const upper: IAutoMovieLoftChain = family("upper", (y: number): number[] => AutoMovieHumanShoulderRing.controls(shoulder, y));

    return [
      { ...trunk, layers: trunk.layers.slice(0, vault + 1) },
      { ...upper, layers: upper.layers.slice(vault) },
    ];
  }
}
