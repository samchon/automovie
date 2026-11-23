import type { IAutoMovieMotionHumanCrouch } from "../everyday/IAutoMovieMotionHumanCrouch";
import type { IAutoMovieMotionHumanLieDown } from "../floor/IAutoMovieMotionHumanLieDown";
import type { IAutoMovieMotionHumanClinch } from "../grappling/IAutoMovieMotionHumanClinch";
import type { IAutoMovieMotionHumanDisarm } from "../grappling/IAutoMovieMotionHumanDisarm";
import type { IAutoMovieMotionHumanHostageHold } from "../grappling/IAutoMovieMotionHumanHostageHold";
import type { IAutoMovieMotionHumanLungeGrab } from "../grappling/IAutoMovieMotionHumanLungeGrab";
import type { IAutoMovieMotionHumanGrapple } from "../next/IAutoMovieMotionHumanGrapple";
import type { IAutoMovieMotionHumanTouch } from "../next/IAutoMovieMotionHumanTouch";
import type { IAutoMovieMotionHumanGive } from "../reaction/IAutoMovieMotionHumanGive";
import type { IAutoMovieMotionHumanStagger } from "../reaction/IAutoMovieMotionHumanStagger";
import type { IAutoMovieMotionHumanCloseStrike } from "../striking/IAutoMovieMotionHumanCloseStrike";
import type { IAutoMovieMotionHumanPunch } from "../striking/IAutoMovieMotionHumanPunch";
import type { IAutoMovieMotionHumanStep } from "../striking/IAutoMovieMotionHumanStep";
import type { IAutoMovieMotionHumanStageProp } from "./IAutoMovieMotionHumanStageProp";

/**
 * Open parameters of the stageFight lexicon family, keyed by each runtime
 * export name.
 */
export interface IAutoMovieMotionHumanLexiconStageFightParams {
  /** Perform a preauthored blocking, flourish or contact cue with an inert prop. */
  HumanStageProp: IAutoMovieMotionHumanStageProp;

  /** Perform a role in a staged grappling exchange. */
  grapple: IAutoMovieMotionHumanGrapple.IParams;

  /**
   * A lunge and grab: the leading foot steps long toward the victim and both
   * palms close on its shoulders or a named region; a victim beyond the longest
   * lunge is refused.
   */
  lungeGrab: IAutoMovieMotionHumanLungeGrab.IParams;

  /**
   * A staged disarm: both hands close on the armed wrist and forearm (a knife)
   * or the wrist and the slide (a handgun), lever the armed hand, and the hand
   * on the wrist takes the weapon. The armed partner performs `disarmed`.
   */
  disarm: IAutoMovieMotionHumanDisarm.IParams;

  /**
   * The armed partner of a disarm: the forearm turns with the lever and the
   * hand opens at the disarm's `taken` instant.
   */
  disarmed: IAutoMovieMotionHumanDisarm.IYield;

  /**
   * A hostage hold from behind: the free arm across the chest or throat, a held
   * weapon's point at a region, and the pair walking backward. The hostage
   * performs heldHostage.
   */
  hostageHold: IAutoMovieMotionHumanHostageHold.IParams;

  /**
   * The hostage of a hold: carried backward with the holder, stepping the same
   * way.
   */
  heldHostage: IAutoMovieMotionHumanHostageHold.IHeld;

  /**
   * A stage palm strike: the rear palm heel driven at the target and stopped
   * short at 0.85 of its delivery (provisional), with no contact declared.
   */
  stagePalmStrike: Omit<
    IAutoMovieMotionHumanPunch.IParams,
    "technique" | "hand" | "feint"
  >;

  /**
   * A stage headbutt: the forehead driven at the target and stopped short at
   * 0.85 of its delivery (provisional), the hands on a person's neck, with no
   * contact declared.
   */
  stageHeadbutt: Omit<
    IAutoMovieMotionHumanCloseStrike.IParams,
    "technique" | "arm" | "feint"
  >;

  /**
   * A forehand slap: one tap of the open palm. The composition gives the cheek
   * as the target.
   */
  slap: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count" | "tangent"
  >;

  /**
   * A stage slap, the non-contact one a stage fight uses: the open palm swung
   * across the cheek the composition names, half a hand's length clear of it
   * (provisional), with no contact declared. The receiver's `slapped` sells
   * it.
   */
  stageSlap: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count" | "tangent" | "clear"
  >;

  /** A backhand slap: one tap of the hand's back. */
  backhand: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count" | "tangent"
  >;

  /** A shove: the palm pressed on the partner's chest. */
  shove: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count"
  >;

  /**
   * A grab: the hand closed on the partner's region and held (a collar, an arm,
   * the hair at the crown).
   */
  grab: Omit<IAutoMovieMotionHumanTouch.IParams, "effector" | "kind" | "count">;

  /** A poke of the forefinger into the partner's chest, repeated. */
  poke: Omit<IAutoMovieMotionHumanTouch.IParams, "effector" | "kind">;

  /** A hold on the partner by the clinch, kept three seconds (provisional). */
  restrain: Omit<IAutoMovieMotionHumanClinch.IParams, "hold">;

  /**
   * The receiver of a slap: the head turned away from the hand (`from`). Sync
   * its start to the slap's contact.
   */
  slapped: Omit<IAutoMovieMotionHumanGive.IParams, "part" | "way">;

  /**
   * The receiver of a shove: a step back to catch the balance, the body leaving
   * at 0.8 m/s (provisional). Sync its start to the shove's contact.
   */
  shoved: Omit<IAutoMovieMotionHumanStagger.IParams, "speed">;

  /**
   * The receiver of a grab: the trunk led toward the grabbing hand (`from`).
   * Sync its start to the grab's contact.
   */
  grabbed: Omit<IAutoMovieMotionHumanGive.IParams, "part" | "way">;

  /**
   * A choke from the front: both palms closed on the neck and held two seconds
   * (provisional). The composition gives the two sides of the neck as `target`
   * and `other`.
   */
  choke: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count" | "hold"
  >;

  /**
   * A headlock or a choke from behind: the clinch's hold on the partner's neck,
   * kept two seconds (provisional).
   */
  headlock: Omit<IAutoMovieMotionHumanClinch.IParams, "hold">;

  /**
   * A hair pull: the hand closed on the crown, the temple or the nape the
   * composition names and held; the receiver's `grabbed` follows it. The puller
   * stands as close as for a slap: the row does not close the distance itself,
   * and a region beyond the arm is refused.
   */
  hairPull: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count" | "hold"
  >;

  /**
   * The receiver of a choke: both hands brought to the attacker's forearms. The
   * composition gives them as `target` and `other`.
   */
  struggle: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "effector" | "kind" | "count" | "hold"
  >;

  /**
   * A dive for cover: down onto the floor, prone, and stay there three seconds
   * (provisional).
   */
  diveForCover: Omit<IAutoMovieMotionHumanLieDown.IParams, "kind" | "hold">;

  /**
   * A duck under a threat with no strike to answer: a short partial crouch (0.3
   * s held, provisional).
   */
  duck: Omit<IAutoMovieMotionHumanCrouch.IParams, "depth" | "hold">;

  /** Capoeira's esquiva baixa: a full crouch under a kick, held while it passes. */
  esquiva: Omit<IAutoMovieMotionHumanCrouch.IParams, "depth" | "hold">;

  /**
   * A dodge with no strike to answer: one quick step to the right out of a
   * threat's line.
   */
  dodge: Omit<IAutoMovieMotionHumanStep.IParams, "direction" | "steps">;

  /** A lean back out of a threat's line (`from`), the feet kept. */
  leanBack: Omit<IAutoMovieMotionHumanGive.IParams, "part" | "way">;

  /**
   * The receiver of a poke or a light push: the trunk giving way from the hand
   * (`from`) without a step.
   */
  pushed: Omit<IAutoMovieMotionHumanGive.IParams, "part" | "way" | "intensity">;
}
