import type { IAutoMovieMotionHumanCrouch } from "../everyday/IAutoMovieMotionHumanCrouch";
import type { IAutoMovieMotionHumanLieDown } from "../floor/IAutoMovieMotionHumanLieDown";
import type { IAutoMovieMotionHumanClinch } from "../grappling/IAutoMovieMotionHumanClinch";
import type { IAutoMovieMotionHumanGrapple } from "../grappling/IAutoMovieMotionHumanGrapple";
import type { IAutoMovieMotionHumanGive } from "../reaction/IAutoMovieMotionHumanGive";
import type { IAutoMovieMotionHumanStagger } from "../reaction/IAutoMovieMotionHumanStagger";
import type { IAutoMovieMotionHumanCloseStrike } from "../striking/IAutoMovieMotionHumanCloseStrike";
import type { IAutoMovieMotionHumanPunch } from "../striking/IAutoMovieMotionHumanPunch";
import type { IAutoMovieMotionHumanStep } from "../striking/IAutoMovieMotionHumanStep";
import type { IAutoMovieMotionHumanTouch } from "../touch/IAutoMovieMotionHumanTouch";
import type { IAutoMovieMotionHumanStageProp } from "./IAutoMovieMotionHumanStageProp";

/**
 * Open parameters of the stageFight lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The stageFight family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the stageFight row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconStageFightParams {
  /** Perform a preauthored blocking, flourish or contact cue with an inert prop. */
  HumanStageProp: IAutoMovieMotionHumanStageProp;

  /** Perform a role in a staged grappling exchange. */
  grapple: IAutoMovieMotionHumanGrapple.IParams;

  /** A stage palm strike: the rear palm heel driven at the target and stopped short at 0.85 of its delivery (provisional), with no contact declared. */
  stagePalmStrike: Omit<
    IAutoMovieMotionHumanPunch.IParams,
    "technique" | "hand" | "feint"
  >;

  /** A stage headbutt: the forehead driven at the target and stopped short at 0.85 of its delivery (provisional), the hands on a person's neck, with no contact declared. */
  stageHeadbutt: Omit<
    IAutoMovieMotionHumanCloseStrike.IParams,
    "technique" | "arm" | "feint"
  >;

  /** A forehand slap: one tap of the open palm. The composition gives the cheek as the target. */
  slap: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "with" | "kind" | "count" | "tangent"
  >;

  /** A stage slap, the non-contact one a stage fight uses: the open palm swung across the cheek the composition names, half a hand's length clear of it (provisional), with no contact declared. The receiver's `slapped` sells it. */
  stageSlap: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "with" | "kind" | "count" | "tangent" | "clear"
  >;

  /** A backhand slap: one tap of the hand's back. */
  backhand: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "with" | "kind" | "count" | "tangent"
  >;

  /** A shove: the palm pressed on the partner's chest. */
  shove: Omit<IAutoMovieMotionHumanTouch.IParams, "with" | "kind" | "count">;

  /** A grab: the hand closed on the partner's region and held (a collar, an arm, the hair at the crown). */
  grab: Omit<IAutoMovieMotionHumanTouch.IParams, "with" | "kind" | "count">;

  /** A poke of the forefinger into the partner's chest, repeated. */
  poke: Omit<IAutoMovieMotionHumanTouch.IParams, "with" | "kind">;

  /** A hold on the partner by the clinch, kept three seconds (provisional). */
  restrain: Omit<IAutoMovieMotionHumanClinch.IParams, "hold">;

  /** The receiver of a slap: the head turned away from the hand (`from`). Sync its start to the slap's contact. */
  slapped: Omit<IAutoMovieMotionHumanGive.IParams, "part" | "way">;

  /** The receiver of a shove: a step back to catch the balance, the body leaving at 0.8 m/s (provisional). Sync its start to the shove's contact. */
  shoved: Omit<IAutoMovieMotionHumanStagger.IParams, "speed">;

  /** The receiver of a grab: the trunk led toward the grabbing hand (`from`). Sync its start to the grab's contact. */
  grabbed: Omit<IAutoMovieMotionHumanGive.IParams, "part" | "way">;

  /** A choke from the front: both palms closed on the neck and held two seconds (provisional). The composition gives the two sides of the neck as `target` and `other`. */
  choke: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "with" | "kind" | "count" | "hold"
  >;

  /** A headlock or a choke from behind: the clinch's hold on the partner's neck, kept two seconds (provisional). */
  headlock: Omit<IAutoMovieMotionHumanClinch.IParams, "hold">;

  /** A hair pull: the hand closed on the crown, the temple or the nape the composition names and held; the receiver's `grabbed` follows it. The puller stands as close as for a slap: the row does not close the distance itself, and a region beyond the arm is refused. */
  hairPull: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "with" | "kind" | "count" | "hold"
  >;

  /** The receiver of a choke: both hands brought to the attacker's forearms. The composition gives them as `target` and `other`. */
  struggle: Omit<
    IAutoMovieMotionHumanTouch.IParams,
    "with" | "kind" | "count" | "hold"
  >;

  /** A dive for cover: down onto the floor, prone, and stay there three seconds (provisional). */
  diveForCover: Omit<IAutoMovieMotionHumanLieDown.IParams, "position" | "hold">;

  /** A duck under a threat with no strike to answer: a short partial crouch (0.3 s held, provisional). */
  duck: Omit<IAutoMovieMotionHumanCrouch.IParams, "depth" | "hold">;

  /** Capoeira's esquiva baixa: a full crouch under a kick, held while it passes. */
  esquiva: Omit<IAutoMovieMotionHumanCrouch.IParams, "depth" | "hold">;

  /** A dodge with no strike to answer: one quick step to the right out of a threat's line. */
  dodge: Omit<IAutoMovieMotionHumanStep.IParams, "direction" | "steps">;

  /** A lean back out of a threat's line (`from`), the feet kept. */
  leanBack: Omit<IAutoMovieMotionHumanGive.IParams, "part" | "way">;

  /** The receiver of a poke or a light push: the trunk giving way from the hand (`from`) without a step. */
  pushed: Omit<IAutoMovieMotionHumanGive.IParams, "part" | "way" | "intensity">;
}
