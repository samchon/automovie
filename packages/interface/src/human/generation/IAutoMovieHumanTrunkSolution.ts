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
 * The trunk after its tapes and courses are closed on its own surface: what
 * the chains are built from and what the skeleton and the arm read. The solver
 * produces it from the person's inputs, the crotch height and the neck's
 * chain alone.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The trunk after its tapes and courses are closed on its own surface: what the chains are built from and what the skeleton and the arm read.
 * @evidence contracts/development/design.md#principled-representation `column`: The column through its landmark keys. `landmarks`: The landmarks, left side. `reliefs`: The breasts, blades, buttocks, sternal notch, umbilicus and spinal furrow as relief windows on the trunk's chart.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanTrunkSolver.solve, AutoMovieHumanTrunkSolver.replay, AutoMovieHumanTrunkSolver.solution. Read by AutoMovieHumanTrunkChains.build, AutoMovieHumanMassInterim.gluteal, AutoMovieHumanTrunkInterim.upperSites. Also types AutoMovieHumanBodyLaneInterim.solution, AutoMovieHumanBodyPreparation.solution.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `rawNeck`: Explicit raw demand used only by the legacy chain builder; ordinary property/JSON reads do not execute it.
 */
export interface IAutoMovieHumanTrunkSolution {
  /** The column through its landmark keys. */
  column: IAutoMovieHumanTrunkColumn.IColumn;

  /** The landmarks, left side. */
  landmarks: IAutoMovieHumanTrunkLandmarks;

  /** The breasts, blades, buttocks, sternal notch, umbilicus and spinal furrow as relief windows on the trunk's chart. */
  reliefs: IAutoMovieLoftRelief[];

  /** The features that broke their contract and were left out, one diagnostic each. */
  diagnostics: IAutoMovieLoftContract.IDiagnostic[];

  /** The landmark heights and tapes the features stand on, which a feature piece reads alone. */
  sites: IAutoMovieHumanTrunkFeatures.ISites;

  /** The neck's bottom ring as the shoulders read it. */
  seat: IAutoMovieHumanTrunkNeckSeat.ISeat;

  /** Already requested legacy neck chain; null during original-only preparation. */
  neck: IAutoMovieLoftChain | null;

  /**
   * Explicit raw demand used only by the legacy chain builder; ordinary property/JSON reads do not execute it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explicit raw demand used only by the legacy chain builder; ordinary property/JSON reads do not execute it.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanBodySources and AutoMovieHumanTrunkConstruction and the callback provider must satisfy the documented rawNeck contract.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanBodySources and AutoMovieHumanTrunkConstruction and its callback provider own the cost of each rawNeck invocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanBodySources and AutoMovieHumanTrunkConstruction and the callback provider determine when the inputs to rawNeck describe equivalent work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanBodySources and AutoMovieHumanTrunkConstruction and the callback provider own any captured source data and the callable's lifetime.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanTrunkSolution.rawNeck callable contract, without an implementation body. AutoMovieHumanBodySources and AutoMovieHumanTrunkConstruction and its supplied callbacks own the numerical method and admission of the documented arguments.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanTrunkSolution.rawNeck declares only the invocation boundary; decomposition belongs to AutoMovieHumanBodySources and AutoMovieHumanTrunkConstruction and the callback provider.
   */
  rawNeck?: () => IAutoMovieLoftChain;

  /** The trapezius line from the shoulder point to the neck's ring. */
  line: IAutoMovieHumanShoulderOutline;

  /** The arm's ellipse and cap below the shoulder point. */
  oval: IAutoMovieHumanArmRootOval.IInput;

  /** The control pitch of the crotch ring, mm: the rows' and the fold's unit. */
  pitch: number;
}
