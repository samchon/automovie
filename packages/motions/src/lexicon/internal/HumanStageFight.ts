import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { crouch } from "../../everyday/internal/crouch";
import { lieDown } from "../../floor/internal/lieDown";
import { clinch } from "../../grappling/internal/clinch";
import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { HUMAN_STAGE_FIGHT_BACKHAND } from "../../next/presets/HUMAN_STAGE_FIGHT_BACKHAND";
import { HUMAN_STAGE_FIGHT_CHOKE } from "../../next/presets/HUMAN_STAGE_FIGHT_CHOKE";
import { HUMAN_STAGE_FIGHT_DIVE_FOR_COVER } from "../../next/presets/HUMAN_STAGE_FIGHT_DIVE_FOR_COVER";
import { HUMAN_STAGE_FIGHT_DODGE } from "../../next/presets/HUMAN_STAGE_FIGHT_DODGE";
import { HUMAN_STAGE_FIGHT_DUCK } from "../../next/presets/HUMAN_STAGE_FIGHT_DUCK";
import { HUMAN_STAGE_FIGHT_ESQUIVA } from "../../next/presets/HUMAN_STAGE_FIGHT_ESQUIVA";
import { HUMAN_STAGE_FIGHT_GRAB } from "../../next/presets/HUMAN_STAGE_FIGHT_GRAB";
import { HUMAN_STAGE_FIGHT_GRABBED } from "../../next/presets/HUMAN_STAGE_FIGHT_GRABBED";
import { HUMAN_STAGE_FIGHT_HAIR_PULL } from "../../next/presets/HUMAN_STAGE_FIGHT_HAIR_PULL";
import { HUMAN_STAGE_FIGHT_HEADLOCK } from "../../next/presets/HUMAN_STAGE_FIGHT_HEADLOCK";
import { HUMAN_STAGE_FIGHT_LEAN_BACK } from "../../next/presets/HUMAN_STAGE_FIGHT_LEAN_BACK";
import { HUMAN_STAGE_FIGHT_POKE } from "../../next/presets/HUMAN_STAGE_FIGHT_POKE";
import { HUMAN_STAGE_FIGHT_PUSHED } from "../../next/presets/HUMAN_STAGE_FIGHT_PUSHED";
import { HUMAN_STAGE_FIGHT_RESTRAIN } from "../../next/presets/HUMAN_STAGE_FIGHT_RESTRAIN";
import { HUMAN_STAGE_FIGHT_SHOVE } from "../../next/presets/HUMAN_STAGE_FIGHT_SHOVE";
import { HUMAN_STAGE_FIGHT_SHOVED } from "../../next/presets/HUMAN_STAGE_FIGHT_SHOVED";
import { HUMAN_STAGE_FIGHT_SLAP } from "../../next/presets/HUMAN_STAGE_FIGHT_SLAP";
import { HUMAN_STAGE_FIGHT_SLAPPED } from "../../next/presets/HUMAN_STAGE_FIGHT_SLAPPED";
import { HUMAN_STAGE_FIGHT_STAGE_HEADBUTT } from "../../next/presets/HUMAN_STAGE_FIGHT_STAGE_HEADBUTT";
import { HUMAN_STAGE_FIGHT_STAGE_PALM_STRIKE } from "../../next/presets/HUMAN_STAGE_FIGHT_STAGE_PALM_STRIKE";
import { HUMAN_STAGE_FIGHT_STAGE_SLAP } from "../../next/presets/HUMAN_STAGE_FIGHT_STAGE_SLAP";
import { HUMAN_STAGE_FIGHT_STRUGGLE } from "../../next/presets/HUMAN_STAGE_FIGHT_STRUGGLE";
import { give } from "../../reaction/internal/give";
import { stagger } from "../../reaction/internal/stagger";
import { closeStrike } from "../../striking/internal/closeStrike";
import { punch } from "../../striking/internal/punch";
import { step } from "../../striking/internal/step";
import { touch } from "../../touch/internal/touch";

/**
 * Stage fighting short of a strike: slaps, grabs and holds, each a row of a
 * shipped action on a partner the composition names (the row leaves the target
 * or the partner open). The receiver's response is its own row (`slapped`,
 * `shoved`, `grabbed`, `pushed`), whose start the composition syncs to the
 * attacker's contact: `b.registered("slapped", { from }).sync({ of: "slap" })`.
 * Register the ones a film uses.
 */
export namespace HumanStageFight {
  /**
   * A stage palm strike: the rear palm heel driven at the target and stopped
   * short at 0.85 of its delivery (provisional), with no contact declared. It
   * reaches the stop 0.26 s after the launch at elite skill (0.85 of the elite
   * cross's 0.310 s, Cheraghi et al. 2014) and returns in as long
   * ({@link IAutoMovieMotionHumanPunch}).
   */
  export const stagePalmStrike: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["stagePalmStrike"]
  > = AutoMovieMotionHumanActionRow.of(
    "stagePalmStrike",
    punch,
    HUMAN_STAGE_FIGHT_STAGE_PALM_STRIKE,
  );

  /**
   * A stage headbutt: the forehead driven at the target and stopped short at
   * 0.85 of its delivery (provisional), the hands on a person's neck, with no
   * contact declared. It stops 0.26 s after the launch at elite skill (0.85 of
   * the elite cross's 0.310 s) and returns in as long
   * ({@link IAutoMovieMotionHumanCloseStrike}).
   */
  export const stageHeadbutt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["stageHeadbutt"]
  > = AutoMovieMotionHumanActionRow.of(
    "stageHeadbutt",
    closeStrike,
    HUMAN_STAGE_FIGHT_STAGE_HEADBUTT,
  );

  /**
   * A forehand slap: one tap of the open palm. The composition gives the cheek
   * as the target.
   */
  export const slap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["slap"]
  > = AutoMovieMotionHumanActionRow.of("slap", touch, HUMAN_STAGE_FIGHT_SLAP);

  /**
   * A stage slap, the non-contact one a stage fight uses: the open palm swung
   * across the cheek the composition names, half a hand's length clear of it
   * (provisional), with no contact declared. The receiver's `slapped` sells
   * it.
   */
  export const stageSlap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["stageSlap"]
  > = AutoMovieMotionHumanActionRow.of(
    "stageSlap",
    touch,
    HUMAN_STAGE_FIGHT_STAGE_SLAP,
  );

  /** A backhand slap: one tap of the hand's back. */
  export const backhand: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["backhand"]
  > = AutoMovieMotionHumanActionRow.of(
    "backhand",
    touch,
    HUMAN_STAGE_FIGHT_BACKHAND,
  );

  /** A shove: the palm pressed on the partner's chest. */
  export const shove: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["shove"]
  > = AutoMovieMotionHumanActionRow.of("shove", touch, HUMAN_STAGE_FIGHT_SHOVE);

  /**
   * A grab: the hand closed on the partner's region and held (a collar, an arm,
   * the hair at the crown).
   */
  export const grab: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["grab"]
  > = AutoMovieMotionHumanActionRow.of("grab", touch, HUMAN_STAGE_FIGHT_GRAB);

  /** A poke of the forefinger into the partner's chest, repeated. */
  export const poke: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["poke"]
  > = AutoMovieMotionHumanActionRow.of("poke", touch, HUMAN_STAGE_FIGHT_POKE);

  /** A hold on the partner by the clinch, kept three seconds (provisional). */
  export const restrain: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["restrain"]
  > = AutoMovieMotionHumanActionRow.of(
    "restrain",
    clinch,
    HUMAN_STAGE_FIGHT_RESTRAIN,
  );

  /**
   * The receiver of a slap: the head turned away from the hand (`from`). Sync
   * its start to the slap's contact.
   */
  export const slapped: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["slapped"]
  > = AutoMovieMotionHumanActionRow.of(
    "slapped",
    give,
    HUMAN_STAGE_FIGHT_SLAPPED,
  );

  /**
   * The receiver of a shove: a step back to catch the balance, the body leaving
   * at 0.8 m/s (provisional). Sync its start to the shove's contact.
   */
  export const shoved: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["shoved"]
  > = AutoMovieMotionHumanActionRow.of(
    "shoved",
    stagger,
    HUMAN_STAGE_FIGHT_SHOVED,
  );

  /**
   * The receiver of a grab: the trunk led toward the grabbing hand (`from`).
   * Sync its start to the grab's contact.
   */
  export const grabbed: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["grabbed"]
  > = AutoMovieMotionHumanActionRow.of(
    "grabbed",
    give,
    HUMAN_STAGE_FIGHT_GRABBED,
  );

  /**
   * A choke from the front: both palms closed on the neck and held two seconds
   * (provisional). The composition gives the two sides of the neck as `target`
   * and `other`.
   */
  export const choke: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["choke"]
  > = AutoMovieMotionHumanActionRow.of("choke", touch, HUMAN_STAGE_FIGHT_CHOKE);

  /**
   * A headlock or a choke from behind: the clinch's hold on the partner's neck,
   * kept two seconds (provisional).
   */
  export const headlock: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["headlock"]
  > = AutoMovieMotionHumanActionRow.of(
    "headlock",
    clinch,
    HUMAN_STAGE_FIGHT_HEADLOCK,
  );

  /**
   * A hair pull: the hand closed on the crown, the temple or the nape the
   * composition names and held; the receiver's `grabbed` follows it. The puller
   * stands as close as for a slap: the row does not close the distance itself,
   * and a region beyond the arm is refused.
   */
  export const hairPull: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["hairPull"]
  > = AutoMovieMotionHumanActionRow.of(
    "hairPull",
    touch,
    HUMAN_STAGE_FIGHT_HAIR_PULL,
  );

  /**
   * The receiver of a choke: both hands brought to the attacker's forearms. The
   * composition gives them as `target` and `other`.
   */
  export const struggle: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["struggle"]
  > = AutoMovieMotionHumanActionRow.of(
    "struggle",
    touch,
    HUMAN_STAGE_FIGHT_STRUGGLE,
  );

  /**
   * A dive for cover: down onto the floor, prone, and stay there three seconds
   * (provisional).
   */
  export const diveForCover: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["diveForCover"]
  > = AutoMovieMotionHumanActionRow.of(
    "diveForCover",
    lieDown,
    HUMAN_STAGE_FIGHT_DIVE_FOR_COVER,
  );

  /**
   * A duck under a threat with no strike to answer: a short partial crouch (0.3
   * s held, provisional).
   */
  export const duck: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["duck"]
  > = AutoMovieMotionHumanActionRow.of("duck", crouch, HUMAN_STAGE_FIGHT_DUCK);

  /** Capoeira's esquiva baixa: a full crouch under a kick, held while it passes. */
  export const esquiva: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["esquiva"]
  > = AutoMovieMotionHumanActionRow.of(
    "esquiva",
    crouch,
    HUMAN_STAGE_FIGHT_ESQUIVA,
  );

  /**
   * A dodge with no strike to answer: one quick step to the right out of a
   * threat's line.
   */
  export const dodge: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["dodge"]
  > = AutoMovieMotionHumanActionRow.of("dodge", step, HUMAN_STAGE_FIGHT_DODGE);

  /** A lean back out of a threat's line (`from`), the feet kept. */
  export const leanBack: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["leanBack"]
  > = AutoMovieMotionHumanActionRow.of(
    "leanBack",
    give,
    HUMAN_STAGE_FIGHT_LEAN_BACK,
  );

  /**
   * The receiver of a poke or a light push: the trunk giving way from the hand
   * (`from`) without a step.
   */
  export const pushed: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["stageFight"]["pushed"]
  > = AutoMovieMotionHumanActionRow.of(
    "pushed",
    give,
    HUMAN_STAGE_FIGHT_PUSHED,
  );
}
