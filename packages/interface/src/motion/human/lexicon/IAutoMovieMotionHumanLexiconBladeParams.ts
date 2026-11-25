import type { IAutoMovieMotionHumanStep } from "../striking/IAutoMovieMotionHumanStep";
import type { IAutoMovieMotionHumanStageBladeFootwork } from "./IAutoMovieMotionHumanStageBladeFootwork";
import type { IAutoMovieMotionHumanSword } from "./IAutoMovieMotionHumanSword";
import type { IAutoMovieMotionHumanSwordGuard } from "./IAutoMovieMotionHumanSwordGuard";
import type { IAutoMovieMotionHumanSwordParry } from "./IAutoMovieMotionHumanSwordParry";

/**
 * Open parameters of the blade lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconBladeParams {
  /** Move to a stage mark in the chosen blade sport's stance. */
  stageBladeFootwork: IAutoMovieMotionHumanStageBladeFootwork.IParams;

  /**
   * The guard a fencer waits in: the hilt low in front, the point at the
   * opponent.
   */
  enGarde: Omit<IAutoMovieMotionHumanSwordGuard.IParams, "guard">;

  /** Vom Tag: the hilt at the shoulder, the blade upright. */
  vomTag: Omit<IAutoMovieMotionHumanSwordGuard.IParams, "guard">;

  /** Ochs: the hilt beside the head, the point at the opponent's face. */
  ochs: Omit<IAutoMovieMotionHumanSwordGuard.IParams, "guard">;

  /** Pflug: the hilt at the hip, the point at the opponent's face. */
  pflug: Omit<IAutoMovieMotionHumanSwordGuard.IParams, "guard">;

  /** Alber: the hilt low, the point at the ground ahead. */
  alber: Omit<IAutoMovieMotionHumanSwordGuard.IParams, "guard">;

  /** A descending cut from above. */
  cut: Omit<IAutoMovieMotionHumanSword.ICut, "from">;

  /** A horizontal slash from the blade hand's side. */
  slash: Omit<IAutoMovieMotionHumanSword.ICut, "from">;

  /** A rising cut from the off side, as a blade leaves its scabbard into a cut. */
  draw: Omit<IAutoMovieMotionHumanSword.ICut, "from">;

  /** A thrust, with the least advance that reaches its target. */
  thrust: IAutoMovieMotionHumanSword.IAttack;

  /** A lunge: a thrust carried by the leading foot's long step, then recovered. */
  lunge: Omit<IAutoMovieMotionHumanSword.IAttack, "advance">;

  /**
   * A stab with a knife or a dagger: a thrust, with the least advance that
   * reaches.
   */
  stab: IAutoMovieMotionHumanSword.IAttack;

  /** A backhand slash, the return of a forehand one. */
  backslash: Omit<IAutoMovieMotionHumanSword.ICut, "from">;

  /** Fencing footwork, an advance: one step forward, the stance kept. */
  advance: Omit<IAutoMovieMotionHumanStep.IParams, "direction" | "steps">;

  /** Fencing footwork, a retreat: one step back, the stance kept. */
  retreat: Omit<IAutoMovieMotionHumanStep.IParams, "direction" | "steps">;

  /** Fencing footwork, a traverse: one step to the left off the line. */
  traverse: Omit<IAutoMovieMotionHumanStep.IParams, "direction" | "steps">;

  /** A parry of the attack named by `against`, or of a line as a drill. */
  parry: IAutoMovieMotionHumanSwordParry.IParry;

  /**
   * A beat: the blade struck against the attacker's and taken off it at once
   * (`against`).
   */
  beat: Omit<IAutoMovieMotionHumanSwordParry.IParry, "hold">;

  /**
   * A bind: the parry kept on the attacker's blade for a second (provisional),
   * from which a wind or a disengage follows.
   */
  bind: Omit<IAutoMovieMotionHumanSwordParry.IParry, "hold">;

  /**
   * A wind: out of a bind, the point turned in and thrust at the target without
   * leaving the blade's side. First pass: the thrust alone.
   */
  wind: IAutoMovieMotionHumanSword.IAttack;

  /**
   * A disengage: out of a bind or past a parry, the thrust renewed at another
   * target. First pass: the thrust alone, the point's dip under the blade not
   * drawn.
   */
  disengage: IAutoMovieMotionHumanSword.IAttack;

  /** A feint: a cut shown to half its path and withdrawn (provisional share). */
  feint: Omit<IAutoMovieMotionHumanSword.ICut, "feint">;

  /** A void: one step back out of the blade's reach, the stance kept. */
  voidStep: Omit<IAutoMovieMotionHumanStep.IParams, "direction" | "steps">;

  /** A riposte: the thrust that answers out of a parry. */
  riposte: IAutoMovieMotionHumanSword.IAttack;

  /**
   * A taken blade: the attacker's blade kept on the parry that took it while it
   * is carried aside, then held there (`against`, `until`).
   */
  taken: IAutoMovieMotionHumanSwordParry.ITaken;
}
