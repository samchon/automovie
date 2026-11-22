import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { HumanActionRow } from "../law/HumanActionRow";
import { closeStrike } from "../striking/closeStrike";
import { footStrike } from "../striking/footStrike";
import { kick } from "../striking/kick";
import { knee } from "../striking/knee";
import { punch } from "../striking/punch";

/**
 * The strikes as rows on the grammar (#3362): each named technique is a row
 * of the shipped law that owns its geometry and its outcome, the effector
 * and the side fixed, the target and the accuracy the composition's.
 *
 * | Row | Law | Fixed |
 * | --- | --- | --- |
 * | `jab`, `cross` | `punch` | straight, lead or rear hand |
 * | `leadHook`, `rearHook` | `punch` | hook, lead or rear hand |
 * | `leadUppercut`, `rearUppercut` | `punch` | uppercut, lead or rear hand |
 * | `backfist` | `punch` | backfist, lead hand |
 * | `hammerfist`, `palmHeel` | `punch` | hammerfist or palm heel, rear hand |
 * | `horizontalElbow`, `risingElbow`, `descendingElbow` | `closeStrike` | the elbow's path, rear arm |
 * | `spinningElbow`, `spinningBackfist` | `closeStrike` | a whole turn, rear arm |
 * | `headbutt` | `closeStrike` | the forehead |
 * | `chainPunch`, `rearChainPunch` | `punch` | the vertical fist, lead or rear |
 * | `meiaLuaDeFrente`, `armada` | `footStrike` | crescent, or hook spun, rear leg |
 * | `sideKick`, `hookKick`, `legSweep`, `jumpingSideKick` | `footStrike` | technique, lead leg, the jump |
 * | `backKick`, `crescentKick`, `axeKick`, `stomp`, `spinningHookKick` | `footStrike` | technique, rear leg, the spin |
 * | `roundKick`, `switchKick` | `kick` | round, rear or lead leg |
 * | `pushKick`, `teep` | `kick` | push, lead or rear leg |
 * | `leadKnee`, `rearKnee` | `knee` | lead or rear leg |
 *
 * A strike with a held weapon is the weapons' rows on the blade laws
 * (`HumanWeaponMelee`) and a slap the stage fight's (`HumanStageFight`), so
 * every strike shares the stroke and the outcome law of its family. The
 * receiver's reaction is synced to the strike's hit (`sync({ hit })`,
 * #3480) and planned by the perturbation law (#3430).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is a row of, what it fixes, what the composition gives and where the weapons, slaps and reactions are.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named techniques of #3362's table; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own.
 */
export namespace HumanStrike {
  /** A straight punch with the lead hand. */
  export const jab: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["jab"]
  > = HumanActionRow.of("jab", punch, {
    technique: "straight",
    hand: "lead",
  });

  /** A straight punch with the rear hand. */
  export const cross: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["cross"]
  > = HumanActionRow.of("cross", punch, {
    technique: "straight",
    hand: "rear",
  });

  /** A hook with the lead hand. */
  export const leadHook: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["leadHook"]
  > = HumanActionRow.of("leadHook", punch, {
    technique: "hook",
    hand: "lead",
  });

  /** A hook with the rear hand. */
  export const rearHook: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["rearHook"]
  > = HumanActionRow.of("rearHook", punch, {
    technique: "hook",
    hand: "rear",
  });

  /** An uppercut with the lead hand. */
  export const leadUppercut: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["leadUppercut"]
  > = HumanActionRow.of("leadUppercut", punch, {
    technique: "uppercut",
    hand: "lead",
  });

  /** An uppercut with the rear hand. */
  export const rearUppercut: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["rearUppercut"]
  > = HumanActionRow.of("rearUppercut", punch, {
    technique: "uppercut",
    hand: "rear",
  });

  /** A wing chun chain punch with the lead hand: a vertical fist along the centreline. */
  export const chainPunch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["chainPunch"]
  > = HumanActionRow.of("chainPunch", punch, {
    technique: "verticalFist",
    hand: "lead",
  });

  /** A wing chun chain punch with the rear hand. */
  export const rearChainPunch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["rearChainPunch"]
  > = HumanActionRow.of("rearChainPunch", punch, {
    technique: "verticalFist",
    hand: "rear",
  });

  /** Capoeira's meia-lua de frente: the rear leg's straight sweep inward across the front. */
  export const meiaLuaDeFrente: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["meiaLuaDeFrente"]
  > = HumanActionRow.of("meiaLuaDeFrente", footStrike, {
    technique: "crescent",
    leg: "rear",
  });

  /** Capoeira's armada: a whole turn, then the rear leg's straight sweep outward. */
  export const armada: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["armada"]
  > = HumanActionRow.of("armada", footStrike, {
    technique: "hook",
    leg: "rear",
    spin: true,
  });

  /** A backfist with the lead hand. */
  export const backfist: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["backfist"]
  > = HumanActionRow.of("backfist", punch, {
    technique: "backfist",
    hand: "lead",
  });

  /** A hammerfist with the rear hand. */
  export const hammerfist: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["hammerfist"]
  > = HumanActionRow.of("hammerfist", punch, {
    technique: "hammerfist",
    hand: "rear",
  });

  /** A palm-heel strike with the rear hand. */
  export const palmHeel: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["palmHeel"]
  > = HumanActionRow.of("palmHeel", punch, {
    technique: "palmHeel",
    hand: "rear",
  });

  /** A horizontal elbow with the rear arm, swept across the line. */
  export const horizontalElbow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["horizontalElbow"]
  > = HumanActionRow.of("horizontalElbow", closeStrike, {
    technique: "horizontalElbow",
    arm: "rear",
  });

  /** A rising elbow with the rear arm, brought up under the target. */
  export const risingElbow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["risingElbow"]
  > = HumanActionRow.of("risingElbow", closeStrike, {
    technique: "risingElbow",
    arm: "rear",
  });

  /** A descending elbow with the rear arm, brought down onto the target. */
  export const descendingElbow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["descendingElbow"]
  > = HumanActionRow.of("descendingElbow", closeStrike, {
    technique: "descendingElbow",
    arm: "rear",
  });

  /** A spinning elbow: a whole turn on the lead ball, the rear elbow landing as it comes past. */
  export const spinningElbow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["spinningElbow"]
  > = HumanActionRow.of("spinningElbow", closeStrike, {
    technique: "spinningElbow",
    arm: "rear",
  });

  /** A spinning backfist: a whole turn on the lead ball, the back of the rear fist landing as it comes past. */
  export const spinningBackfist: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["spinningBackfist"]
  > = HumanActionRow.of("spinningBackfist", closeStrike, {
    technique: "spinningBackfist",
    arm: "rear",
  });

  /** A headbutt: the forehead driven onto the target, the hands on a person's neck. */
  export const headbutt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["headbutt"]
  > = HumanActionRow.of("headbutt", closeStrike, {
    technique: "headbutt",
  });

  /** A side kick with the lead leg: the heel driven along the line, the hip turned over. */
  export const sideKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["sideKick"]
  > = HumanActionRow.of("sideKick", footStrike, {
    technique: "side",
    leg: "lead",
  });

  /** A back kick with the rear leg: turned away, the heel thrust behind. */
  export const backKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["backKick"]
  > = HumanActionRow.of("backKick", footStrike, {
    technique: "back",
    leg: "rear",
  });

  /** A hook kick with the lead leg: the heel swept toward the kicker's own side. */
  export const hookKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["hookKick"]
  > = HumanActionRow.of("hookKick", footStrike, {
    technique: "hook",
    leg: "lead",
  });

  /** A crescent kick with the rear leg: the sole swept away from the kicker's side. */
  export const crescentKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["crescentKick"]
  > = HumanActionRow.of("crescentKick", footStrike, {
    technique: "crescent",
    leg: "rear",
  });

  /** An axe kick with the rear leg: the heel brought down from above. */
  export const axeKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["axeKick"]
  > = HumanActionRow.of("axeKick", footStrike, {
    technique: "axe",
    leg: "rear",
  });

  /** A stomp with the rear leg: the sole driven straight down onto a floor-level target. */
  export const stomp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["stomp"]
  > = HumanActionRow.of("stomp", footStrike, {
    technique: "stomp",
    leg: "rear",
  });

  /** A leg sweep with the lead leg: the sole reaping the partner's support ankle. */
  export const legSweep: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["legSweep"]
  > = HumanActionRow.of("legSweep", footStrike, {
    technique: "sweep",
    leg: "lead",
  });

  /** A spinning hook kick with the rear leg: a whole turn, then the heel swept across. */
  export const spinningHookKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["spinningHookKick"]
  > = HumanActionRow.of("spinningHookKick", footStrike, {
    technique: "hook",
    leg: "rear",
    spin: true,
  });

  /** A jumping side kick with the lead leg: off the floor at the contact. */
  export const jumpingSideKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["jumpingSideKick"]
  > = HumanActionRow.of("jumpingSideKick", footStrike, {
    technique: "side",
    leg: "lead",
    jump: true,
  });

  /** A round kick with the rear leg's shin. */
  export const roundKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["roundKick"]
  > = HumanActionRow.of("roundKick", kick, {
    technique: "round",
    leg: "rear",
  });

  /** A round kick with the lead leg. */
  export const switchKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["switchKick"]
  > = HumanActionRow.of("switchKick", kick, {
    technique: "round",
    leg: "lead",
  });

  /** A push kick with the lead foot. */
  export const pushKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["pushKick"]
  > = HumanActionRow.of("pushKick", kick, {
    technique: "push",
    leg: "lead",
  });

  /** A push kick with the rear foot. */
  export const teep: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["teep"]
  > = HumanActionRow.of("teep", kick, {
    technique: "push",
    leg: "rear",
  });

  /** A knee with the lead leg. */
  export const leadKnee: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["leadKnee"]
  > = HumanActionRow.of("leadKnee", knee, { leg: "lead" });

  /** A knee with the rear leg. */
  export const rearKnee: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["rearKnee"]
  > = HumanActionRow.of("rearKnee", knee, { leg: "rear" });
}
