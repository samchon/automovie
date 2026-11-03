import type { AutoMovieHumanLoftContract } from "../lofting/AutoMovieHumanLoftContract";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanRelief } from "../network/IAutoMovieHumanRelief";
import type { AutoMovieHumanArmRootOval } from "./AutoMovieHumanArmRootOval";
import type { AutoMovieHumanTrunkColumn } from "./AutoMovieHumanTrunkColumn";
import type { AutoMovieHumanTrunkFeatures } from "./AutoMovieHumanTrunkFeatures";
import type { AutoMovieHumanTrunkNeckSeat } from "./AutoMovieHumanTrunkNeckSeat";
import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";
import type { IAutoMovieHumanTrunkLandmarks } from "./IAutoMovieHumanTrunkLandmarks";

/**
 * The trunk after its tapes and courses are closed on its own surface: what
 * the chains are built from and what the skeleton and the arm read. The solver
 * produces it from the person's inputs, the crotch height and the neck's
 * chain alone.
 */
export interface IAutoMovieHumanTrunkSolution {
  /** The column through its landmark keys. */
  column: AutoMovieHumanTrunkColumn.IColumn;

  /** The landmarks, left side. */
  landmarks: IAutoMovieHumanTrunkLandmarks;

  /** The breasts, blades, buttocks, sternal notch, umbilicus and spinal furrow as relief windows on the trunk's chart. */
  reliefs: IAutoMovieHumanRelief[];

  /** The features that broke their contract and were left out, one diagnostic each. */
  diagnostics: AutoMovieHumanLoftContract.IDiagnostic[];

  /** The landmark heights and tapes the features stand on, which a feature piece reads alone. */
  sites: AutoMovieHumanTrunkFeatures.ISites;

  /** The neck's bottom ring as the shoulders read it. */
  seat: AutoMovieHumanTrunkNeckSeat.ISeat;

  /** The neck chain, whose bottom layer the shoulders copy. */
  neck: IAutoMovieHumanLoftChain;

  /** The trapezius line from the shoulder point to the neck's ring. */
  line: IAutoMovieHumanShoulderOutline;

  /** The arm's ellipse and cap below the shoulder point. */
  oval: AutoMovieHumanArmRootOval.IInput;

  /** The control pitch of the crotch ring, mm: the rows' and the fold's unit. */
  pitch: number;
}
