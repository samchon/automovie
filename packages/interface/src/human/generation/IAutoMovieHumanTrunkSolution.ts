import type { IAutoMovieLoftChain } from "../../construction/IAutoMovieLoftChain";
import type { IAutoMovieLoftContract } from "../../construction/IAutoMovieLoftContract";
import type { IAutoMovieLoftRelief } from "../../construction/IAutoMovieLoftRelief";
import type { IAutoMovieHumanArmRootOval } from "./IAutoMovieHumanArmRootOval";
import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";
import type { IAutoMovieHumanTrunkColumn } from "./IAutoMovieHumanTrunkColumn";
import type { IAutoMovieHumanTrunkFeatures } from "./IAutoMovieHumanTrunkFeatures";
import type { IAutoMovieHumanTrunkLandmarks } from "./IAutoMovieHumanTrunkLandmarks";
import type { IAutoMovieHumanTrunkNeckSeat } from "./IAutoMovieHumanTrunkNeckSeat";

/**
 * The trunk after its tapes and courses are closed on its own surface: what the
 * chains are built from and what the skeleton and the arm read. The solver
 * produces it from the person's inputs, the crotch height and the neck's chain
 * alone.
 */
export interface IAutoMovieHumanTrunkSolution {
  /** The column through its landmark keys. */
  column: IAutoMovieHumanTrunkColumn.IColumn;

  /** The landmarks, left side. */
  landmarks: IAutoMovieHumanTrunkLandmarks;

  /**
   * The breasts, blades, buttocks, sternal notch, umbilicus and spinal furrow
   * as relief windows on the trunk's chart.
   */
  reliefs: IAutoMovieLoftRelief[];

  /**
   * The features that broke their contract and were left out, one diagnostic
   * each.
   */
  diagnostics: IAutoMovieLoftContract.IDiagnostic[];

  /**
   * The landmark heights and tapes the features stand on, which a feature piece
   * reads alone.
   */
  sites: IAutoMovieHumanTrunkFeatures.ISites;

  /** The neck's bottom ring as the shoulders read it. */
  seat: IAutoMovieHumanTrunkNeckSeat.ISeat;

  /** Already requested legacy neck chain; null during original-only preparation. */
  neck: IAutoMovieLoftChain | null;

  /**
   * Explicit raw demand used only by the legacy chain builder; ordinary
   * property/JSON reads do not execute it.
   */
  rawNeck?: () => IAutoMovieLoftChain;

  /** The trapezius line from the shoulder point to the neck's ring. */
  line: IAutoMovieHumanShoulderOutline;

  /** The arm's ellipse and cap below the shoulder point. */
  oval: IAutoMovieHumanArmRootOval.IInput;

  /** The control pitch of the crotch ring, mm: the rows' and the fold's unit. */
  pitch: number;
}
