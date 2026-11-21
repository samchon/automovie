import type { IAutoMovieMotionHumanHandspring } from "../sport/IAutoMovieMotionHumanHandspring";
import type { IAutoMovieMotionHumanHighJump } from "../sport/IAutoMovieMotionHumanHighJump";
import type { IAutoMovieMotionHumanHorizontalJump } from "../sport/IAutoMovieMotionHumanHorizontalJump";
import type { IAutoMovieMotionHumanPoleVault } from "../sport/IAutoMovieMotionHumanPoleVault";
import type { IAutoMovieMotionHumanRoundOff } from "../sport/IAutoMovieMotionHumanRoundOff";
import type { IAutoMovieMotionHumanSquatVault } from "../sport/IAutoMovieMotionHumanSquatVault";
import type { IAutoMovieMotionHumanVault } from "../sport/IAutoMovieMotionHumanVault";

/**
 * Open parameters of the gymnastics lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The gymnastics family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the gymnastics row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconGymnasticsParams {
  /** A round-off leading with the left hand, landing on both feet facing back. */
  roundOffLeft: Omit<IAutoMovieMotionHumanRoundOff.IParams, "lead">;

  /** A round-off leading with the right hand. */
  roundOffRight: Omit<IAutoMovieMotionHumanRoundOff.IParams, "lead">;

  /** A front handspring on the floor, lunging on the left leg; the composition may lead with the right. */
  frontHandspring: IAutoMovieMotionHumanHandspring.IParams;

  /** A handspring vault: the hands on the top of the prop the composition names as `on`. */
  handspringVault: IAutoMovieMotionHumanVault.IParams;

  /** A two-hand box vault: the hands on the near edge of the top of the box the composition names as `on`, the body tucked over them and flying to land beyond its far edge. */
  boxVault: IAutoMovieMotionHumanSquatVault.IParams;

  /** A Fosbury flop over the bar the composition sets, onto its landing place. */
  fosburyFlop: IAutoMovieMotionHumanHighJump.IParams;

  /** A vault on the pole the hand holds, out of a run. */
  vaultOnPole: IAutoMovieMotionHumanPoleVault.IParams;

  /** A long jump out of a run into the sand of the pit the composition names, to the distance it gives. */
  longJump: IAutoMovieMotionHumanHorizontalJump.IParams;
}
