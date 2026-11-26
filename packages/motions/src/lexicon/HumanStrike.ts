import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";
import { HUMAN_STRIKE_ARMADA } from "../next/presets/HUMAN_STRIKE_ARMADA";
import { HUMAN_STRIKE_AXE_KICK } from "../next/presets/HUMAN_STRIKE_AXE_KICK";
import { HUMAN_STRIKE_BACKFIST } from "../next/presets/HUMAN_STRIKE_BACKFIST";
import { HUMAN_STRIKE_BACK_KICK } from "../next/presets/HUMAN_STRIKE_BACK_KICK";
import { HUMAN_STRIKE_CHAIN_PUNCH } from "../next/presets/HUMAN_STRIKE_CHAIN_PUNCH";
import { HUMAN_STRIKE_CRESCENT_KICK } from "../next/presets/HUMAN_STRIKE_CRESCENT_KICK";
import { HUMAN_STRIKE_CROSS } from "../next/presets/HUMAN_STRIKE_CROSS";
import { HUMAN_STRIKE_DESCENDING_ELBOW } from "../next/presets/HUMAN_STRIKE_DESCENDING_ELBOW";
import { HUMAN_STRIKE_HAMMERFIST } from "../next/presets/HUMAN_STRIKE_HAMMERFIST";
import { HUMAN_STRIKE_HEADBUTT } from "../next/presets/HUMAN_STRIKE_HEADBUTT";
import { HUMAN_STRIKE_HOOK_KICK } from "../next/presets/HUMAN_STRIKE_HOOK_KICK";
import { HUMAN_STRIKE_HORIZONTAL_ELBOW } from "../next/presets/HUMAN_STRIKE_HORIZONTAL_ELBOW";
import { HUMAN_STRIKE_JAB } from "../next/presets/HUMAN_STRIKE_JAB";
import { HUMAN_STRIKE_JUMPING_SIDE_KICK } from "../next/presets/HUMAN_STRIKE_JUMPING_SIDE_KICK";
import { HUMAN_STRIKE_LEAD_HOOK } from "../next/presets/HUMAN_STRIKE_LEAD_HOOK";
import { HUMAN_STRIKE_LEAD_KNEE } from "../next/presets/HUMAN_STRIKE_LEAD_KNEE";
import { HUMAN_STRIKE_LEAD_UPPERCUT } from "../next/presets/HUMAN_STRIKE_LEAD_UPPERCUT";
import { HUMAN_STRIKE_LEG_SWEEP } from "../next/presets/HUMAN_STRIKE_LEG_SWEEP";
import { HUMAN_STRIKE_MEIA_LUA_DE_FRENTE } from "../next/presets/HUMAN_STRIKE_MEIA_LUA_DE_FRENTE";
import { HUMAN_STRIKE_PALM_HEEL } from "../next/presets/HUMAN_STRIKE_PALM_HEEL";
import { HUMAN_STRIKE_PUSH_KICK } from "../next/presets/HUMAN_STRIKE_PUSH_KICK";
import { HUMAN_STRIKE_REAR_CHAIN_PUNCH } from "../next/presets/HUMAN_STRIKE_REAR_CHAIN_PUNCH";
import { HUMAN_STRIKE_REAR_HOOK } from "../next/presets/HUMAN_STRIKE_REAR_HOOK";
import { HUMAN_STRIKE_REAR_KNEE } from "../next/presets/HUMAN_STRIKE_REAR_KNEE";
import { HUMAN_STRIKE_REAR_UPPERCUT } from "../next/presets/HUMAN_STRIKE_REAR_UPPERCUT";
import { HUMAN_STRIKE_RISING_ELBOW } from "../next/presets/HUMAN_STRIKE_RISING_ELBOW";
import { HUMAN_STRIKE_ROUND_KICK } from "../next/presets/HUMAN_STRIKE_ROUND_KICK";
import { HUMAN_STRIKE_SIDE_KICK } from "../next/presets/HUMAN_STRIKE_SIDE_KICK";
import { HUMAN_STRIKE_SPINNING_BACKFIST } from "../next/presets/HUMAN_STRIKE_SPINNING_BACKFIST";
import { HUMAN_STRIKE_SPINNING_ELBOW } from "../next/presets/HUMAN_STRIKE_SPINNING_ELBOW";
import { HUMAN_STRIKE_SPINNING_HOOK_KICK } from "../next/presets/HUMAN_STRIKE_SPINNING_HOOK_KICK";
import { HUMAN_STRIKE_STOMP } from "../next/presets/HUMAN_STRIKE_STOMP";
import { HUMAN_STRIKE_SWITCH_KICK } from "../next/presets/HUMAN_STRIKE_SWITCH_KICK";
import { HUMAN_STRIKE_TEEP } from "../next/presets/HUMAN_STRIKE_TEEP";
import { closeStrike } from "../striking/closeStrike";
import { footStrike } from "../striking/footStrike";
import { kick } from "../striking/kick";
import { knee } from "../striking/knee";
import { punch } from "../striking/punch";

/**
 * The strikes as rows on the grammar: each named technique is a row of the
 * shipped law that owns its geometry and its outcome, the effector and the side
 * fixed, the target and the accuracy the composition's.
 *
 * | Row                                                                | Law           | Fixed                              |
 * | ------------------------------------------------------------------ | ------------- | ---------------------------------- |
 * | `jab`, `cross`                                                     | `punch`       | straight, lead or rear hand        |
 * | `leadHook`, `rearHook`                                             | `punch`       | hook, lead or rear hand            |
 * | `leadUppercut`, `rearUppercut`                                     | `punch`       | uppercut, lead or rear hand        |
 * | `backfist`                                                         | `punch`       | backfist, lead hand                |
 * | `hammerfist`, `palmHeel`                                           | `punch`       | hammerfist or palm heel, rear hand |
 * | `horizontalElbow`, `risingElbow`, `descendingElbow`                | `closeStrike` | the elbow's path, rear arm         |
 * | `spinningElbow`, `spinningBackfist`                                | `closeStrike` | a whole turn, rear arm             |
 * | `headbutt`                                                         | `closeStrike` | the forehead                       |
 * | `chainPunch`, `rearChainPunch`                                     | `punch`       | the vertical fist, lead or rear    |
 * | `meiaLuaDeFrente`, `armada`                                        | `footStrike`  | crescent, or hook spun, rear leg   |
 * | `sideKick`, `hookKick`, `legSweep`, `jumpingSideKick`              | `footStrike`  | technique, lead leg, the jump      |
 * | `backKick`, `crescentKick`, `axeKick`, `stomp`, `spinningHookKick` | `footStrike`  | technique, rear leg, the spin      |
 * | `roundKick`, `switchKick`                                          | `kick`        | round, rear or lead leg            |
 * | `pushKick`, `teep`                                                 | `kick`        | push, lead or rear leg             |
 * | `leadKnee`, `rearKnee`                                             | `knee`        | lead or rear leg                   |
 *
 * A strike with a held weapon is the weapons' rows on the blade laws
 * (`HumanWeaponMelee`) and a slap the stage fight's (`HumanStageFight`), so
 * every strike shares the stroke and the outcome law of its family. The
 * receiver's reaction is synced to the strike's hit (`sync({ hit })`) and
 * planned by the perturbation law.
 *
 * Each row fixes the values of the preset of the same name in
 * `AutoMovieMotionHumanStrike` (`JAB`, `CROSS`, `TEEP` and the rest), so the
 * values are written once.
 */
export namespace HumanStrike {
  /**
   * A straight punch with the lead hand. Launch to contact 0.310 s at elite
   * skill for a rear-hand straight (Cheraghi et al. 2014), other punches in
   * proportion to their path (`StrikingSkill.lone`), 1.06 times that at novice,
   * and 0.35 s back to the guard ({@link IAutoMovieMotionHumanPunch}).
   */
  export const jab: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["jab"]
  > = AutoMovieMotionHumanActionRow.of("jab", punch, HUMAN_STRIKE_JAB);

  /**
   * A straight punch with the rear hand. Launch to contact 0.310 s at elite
   * skill for a rear-hand straight (Cheraghi et al. 2014), other punches in
   * proportion to their path (`StrikingSkill.lone`), 1.06 times that at novice,
   * and 0.35 s back to the guard ({@link IAutoMovieMotionHumanPunch}).
   */
  export const cross: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["cross"]
  > = AutoMovieMotionHumanActionRow.of("cross", punch, HUMAN_STRIKE_CROSS);

  /**
   * A hook with the lead hand. Launch to contact 0.310 s at elite skill for a
   * rear-hand straight (Cheraghi et al. 2014), other punches in proportion to
   * their path (`StrikingSkill.lone`), 1.06 times that at novice, and 0.35 s
   * back to the guard ({@link IAutoMovieMotionHumanPunch}).
   */
  export const leadHook: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["leadHook"]
  > = AutoMovieMotionHumanActionRow.of(
    "leadHook",
    punch,
    HUMAN_STRIKE_LEAD_HOOK,
  );

  /**
   * A hook with the rear hand. Launch to contact 0.310 s at elite skill for a
   * rear-hand straight (Cheraghi et al. 2014), other punches in proportion to
   * their path (`StrikingSkill.lone`), 1.06 times that at novice, and 0.35 s
   * back to the guard ({@link IAutoMovieMotionHumanPunch}).
   */
  export const rearHook: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["rearHook"]
  > = AutoMovieMotionHumanActionRow.of(
    "rearHook",
    punch,
    HUMAN_STRIKE_REAR_HOOK,
  );

  /**
   * An uppercut with the lead hand. Launch to contact 0.310 s at elite skill
   * for a rear-hand straight (Cheraghi et al. 2014), other punches in
   * proportion to their path (`StrikingSkill.lone`), 1.06 times that at novice,
   * and 0.35 s back to the guard ({@link IAutoMovieMotionHumanPunch}).
   */
  export const leadUppercut: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["leadUppercut"]
  > = AutoMovieMotionHumanActionRow.of(
    "leadUppercut",
    punch,
    HUMAN_STRIKE_LEAD_UPPERCUT,
  );

  /**
   * An uppercut with the rear hand. Launch to contact 0.310 s at elite skill
   * for a rear-hand straight (Cheraghi et al. 2014), other punches in
   * proportion to their path (`StrikingSkill.lone`), 1.06 times that at novice,
   * and 0.35 s back to the guard ({@link IAutoMovieMotionHumanPunch}).
   */
  export const rearUppercut: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["rearUppercut"]
  > = AutoMovieMotionHumanActionRow.of(
    "rearUppercut",
    punch,
    HUMAN_STRIKE_REAR_UPPERCUT,
  );

  /**
   * A wing chun chain punch with the lead hand: a vertical fist along the
   * centreline. Launch to contact 0.310 s at elite skill for a rear-hand
   * straight (Cheraghi et al. 2014), other punches in proportion to their path
   * (`StrikingSkill.lone`), 1.06 times that at novice, and 0.35 s back to the
   * guard ({@link IAutoMovieMotionHumanPunch}).
   */
  export const chainPunch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["chainPunch"]
  > = AutoMovieMotionHumanActionRow.of(
    "chainPunch",
    punch,
    HUMAN_STRIKE_CHAIN_PUNCH,
  );

  /**
   * A wing chun chain punch with the rear hand. Launch to contact 0.310 s at
   * elite skill for a rear-hand straight (Cheraghi et al. 2014), other punches
   * in proportion to their path (`StrikingSkill.lone`), 1.06 times that at
   * novice, and 0.35 s back to the guard ({@link IAutoMovieMotionHumanPunch}).
   */
  export const rearChainPunch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["rearChainPunch"]
  > = AutoMovieMotionHumanActionRow.of(
    "rearChainPunch",
    punch,
    HUMAN_STRIKE_REAR_CHAIN_PUNCH,
  );

  /**
   * Capoeira's meia-lua de frente: the rear leg's straight sweep inward across
   * the front. Launch to contact 0.33 s at elite skill, 1.06 times that at
   * novice, recoil 0.65 s ({@link IAutoMovieMotionHumanFootStrike}).
   */
  export const meiaLuaDeFrente: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["meiaLuaDeFrente"]
  > = AutoMovieMotionHumanActionRow.of(
    "meiaLuaDeFrente",
    footStrike,
    HUMAN_STRIKE_MEIA_LUA_DE_FRENTE,
  );

  /**
   * Capoeira's armada: a whole turn, then the rear leg's straight sweep
   * outward. Launch to contact 0.66 s at elite skill: a whole turn of 0.33 s,
   * then the kick's 0.33 s ({@link IAutoMovieMotionHumanFootStrike}).
   */
  export const armada: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["armada"]
  > = AutoMovieMotionHumanActionRow.of(
    "armada",
    footStrike,
    HUMAN_STRIKE_ARMADA,
  );

  /**
   * A backfist with the lead hand. Launch to contact 0.310 s at elite skill for
   * a rear-hand straight (Cheraghi et al. 2014), other punches in proportion to
   * their path (`StrikingSkill.lone`), 1.06 times that at novice, and 0.35 s
   * back to the guard ({@link IAutoMovieMotionHumanPunch}).
   */
  export const backfist: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["backfist"]
  > = AutoMovieMotionHumanActionRow.of(
    "backfist",
    punch,
    HUMAN_STRIKE_BACKFIST,
  );

  /**
   * A hammerfist with the rear hand. Launch to contact 0.310 s at elite skill
   * for a rear-hand straight (Cheraghi et al. 2014), other punches in
   * proportion to their path (`StrikingSkill.lone`), 1.06 times that at novice,
   * and 0.35 s back to the guard ({@link IAutoMovieMotionHumanPunch}).
   */
  export const hammerfist: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["hammerfist"]
  > = AutoMovieMotionHumanActionRow.of(
    "hammerfist",
    punch,
    HUMAN_STRIKE_HAMMERFIST,
  );

  /**
   * A palm-heel strike with the rear hand. Launch to contact 0.310 s at elite
   * skill for a rear-hand straight (Cheraghi et al. 2014), other punches in
   * proportion to their path (`StrikingSkill.lone`), 1.06 times that at novice,
   * and 0.35 s back to the guard ({@link IAutoMovieMotionHumanPunch}).
   */
  export const palmHeel: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["palmHeel"]
  > = AutoMovieMotionHumanActionRow.of(
    "palmHeel",
    punch,
    HUMAN_STRIKE_PALM_HEEL,
  );

  /**
   * A horizontal elbow with the rear arm, swept across the line. Launch to
   * contact 0.310 s at elite skill, the elite cross's (Cheraghi et al. 2014),
   * 1.06 times that at novice (the punch's timing,
   * {@link IAutoMovieMotionHumanCloseStrike}).
   */
  export const horizontalElbow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["horizontalElbow"]
  > = AutoMovieMotionHumanActionRow.of(
    "horizontalElbow",
    closeStrike,
    HUMAN_STRIKE_HORIZONTAL_ELBOW,
  );

  /**
   * A rising elbow with the rear arm, brought up under the target. Launch to
   * contact 0.310 s at elite skill, the elite cross's (Cheraghi et al. 2014),
   * 1.06 times that at novice (the punch's timing,
   * {@link IAutoMovieMotionHumanCloseStrike}).
   */
  export const risingElbow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["risingElbow"]
  > = AutoMovieMotionHumanActionRow.of(
    "risingElbow",
    closeStrike,
    HUMAN_STRIKE_RISING_ELBOW,
  );

  /**
   * A descending elbow with the rear arm, brought down onto the target. Launch
   * to contact 0.310 s at elite skill, the elite cross's (Cheraghi et al.
   * 2014), 1.06 times that at novice (the punch's timing,
   * {@link IAutoMovieMotionHumanCloseStrike}).
   */
  export const descendingElbow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["descendingElbow"]
  > = AutoMovieMotionHumanActionRow.of(
    "descendingElbow",
    closeStrike,
    HUMAN_STRIKE_DESCENDING_ELBOW,
  );

  /**
   * A spinning elbow: a whole turn on the lead ball, the rear elbow landing as
   * it comes past. Launch to contact 0.310 s at elite skill, the elite cross's
   * (Cheraghi et al. 2014), 1.06 times that at novice (the punch's timing,
   * {@link IAutoMovieMotionHumanCloseStrike}).
   */
  export const spinningElbow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["spinningElbow"]
  > = AutoMovieMotionHumanActionRow.of(
    "spinningElbow",
    closeStrike,
    HUMAN_STRIKE_SPINNING_ELBOW,
  );

  /**
   * A spinning backfist: a whole turn on the lead ball, the back of the rear
   * fist landing as it comes past. Launch to contact 0.310 s at elite skill,
   * the elite cross's (Cheraghi et al. 2014), 1.06 times that at novice (the
   * punch's timing, {@link IAutoMovieMotionHumanCloseStrike}).
   */
  export const spinningBackfist: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["spinningBackfist"]
  > = AutoMovieMotionHumanActionRow.of(
    "spinningBackfist",
    closeStrike,
    HUMAN_STRIKE_SPINNING_BACKFIST,
  );

  /**
   * A headbutt: the forehead driven onto the target, the hands on a person's
   * neck. Launch to contact 0.310 s at elite skill, the elite cross's (Cheraghi
   * et al. 2014), 1.06 times that at novice (the punch's timing,
   * {@link IAutoMovieMotionHumanCloseStrike}).
   */
  export const headbutt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["headbutt"]
  > = AutoMovieMotionHumanActionRow.of(
    "headbutt",
    closeStrike,
    HUMAN_STRIKE_HEADBUTT,
  );

  /**
   * A side kick with the lead leg: the heel driven along the line, the hip
   * turned over. Launch to contact 0.77 s at elite skill (Pieter and Pieter),
   * 1.06 times that at novice ({@link IAutoMovieMotionHumanFootStrike}).
   */
  export const sideKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["sideKick"]
  > = AutoMovieMotionHumanActionRow.of(
    "sideKick",
    footStrike,
    HUMAN_STRIKE_SIDE_KICK,
  );

  /**
   * A back kick with the rear leg: turned away, the heel thrust behind. Launch
   * to contact 0.33 s at elite skill, 1.06 times that at novice, recoil 0.65 s
   * ({@link IAutoMovieMotionHumanFootStrike}).
   */
  export const backKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["backKick"]
  > = AutoMovieMotionHumanActionRow.of(
    "backKick",
    footStrike,
    HUMAN_STRIKE_BACK_KICK,
  );

  /**
   * A hook kick with the lead leg: the heel swept toward the kicker's own side.
   * Launch to contact 0.33 s at elite skill, 1.06 times that at novice, recoil
   * 0.65 s ({@link IAutoMovieMotionHumanFootStrike}).
   */
  export const hookKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["hookKick"]
  > = AutoMovieMotionHumanActionRow.of(
    "hookKick",
    footStrike,
    HUMAN_STRIKE_HOOK_KICK,
  );

  /**
   * A crescent kick with the rear leg: the sole swept away from the kicker's
   * side. Launch to contact 0.33 s at elite skill, 1.06 times that at novice,
   * recoil 0.65 s ({@link IAutoMovieMotionHumanFootStrike}).
   */
  export const crescentKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["crescentKick"]
  > = AutoMovieMotionHumanActionRow.of(
    "crescentKick",
    footStrike,
    HUMAN_STRIKE_CRESCENT_KICK,
  );

  /**
   * An axe kick with the rear leg: the heel brought down from above. Launch to
   * contact 0.33 s at elite skill, 1.06 times that at novice, recoil 0.65 s
   * ({@link IAutoMovieMotionHumanFootStrike}).
   */
  export const axeKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["axeKick"]
  > = AutoMovieMotionHumanActionRow.of(
    "axeKick",
    footStrike,
    HUMAN_STRIKE_AXE_KICK,
  );

  /**
   * A stomp with the rear leg: the sole driven straight down onto a floor-level
   * target. Launch to contact 0.33 s at elite skill, 1.06 times that at novice,
   * recoil 0.65 s ({@link IAutoMovieMotionHumanFootStrike}).
   */
  export const stomp: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["stomp"]
  > = AutoMovieMotionHumanActionRow.of("stomp", footStrike, HUMAN_STRIKE_STOMP);

  /**
   * A leg sweep with the lead leg: the sole reaping the partner's support
   * ankle. Launch to contact 0.33 s at elite skill, 1.06 times that at novice,
   * recoil 0.65 s ({@link IAutoMovieMotionHumanFootStrike}).
   */
  export const legSweep: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["legSweep"]
  > = AutoMovieMotionHumanActionRow.of(
    "legSweep",
    footStrike,
    HUMAN_STRIKE_LEG_SWEEP,
  );

  /**
   * A spinning hook kick with the rear leg: a whole turn, then the heel swept
   * across. Launch to contact 0.66 s at elite skill: a whole turn of 0.33 s,
   * then the kick's 0.33 s ({@link IAutoMovieMotionHumanFootStrike}).
   */
  export const spinningHookKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["spinningHookKick"]
  > = AutoMovieMotionHumanActionRow.of(
    "spinningHookKick",
    footStrike,
    HUMAN_STRIKE_SPINNING_HOOK_KICK,
  );

  /**
   * A jumping side kick with the lead leg: off the floor at the contact. Launch
   * to contact 0.92 s at elite skill: the side kick's 0.77 s and 0.15 s of jump
   * ({@link IAutoMovieMotionHumanFootStrike}).
   */
  export const jumpingSideKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["jumpingSideKick"]
  > = AutoMovieMotionHumanActionRow.of(
    "jumpingSideKick",
    footStrike,
    HUMAN_STRIKE_JUMPING_SIDE_KICK,
  );

  /**
   * A round kick with the rear leg's shin. Launch to contact 0.33 s at elite
   * skill, 0.39 s at novice, the whole kick 0.98 to 1.30 s
   * ({@link IAutoMovieMotionHumanKick}).
   */
  export const roundKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["roundKick"]
  > = AutoMovieMotionHumanActionRow.of(
    "roundKick",
    kick,
    HUMAN_STRIKE_ROUND_KICK,
  );

  /**
   * A round kick with the lead leg. Launch to contact 0.33 s at elite skill,
   * 0.39 s at novice, the whole kick 0.98 to 1.30 s
   * ({@link IAutoMovieMotionHumanKick}).
   */
  export const switchKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["switchKick"]
  > = AutoMovieMotionHumanActionRow.of(
    "switchKick",
    kick,
    HUMAN_STRIKE_SWITCH_KICK,
  );

  /**
   * A push kick with the lead foot. Launch to contact 0.33 s at elite skill,
   * 0.39 s at novice, the whole kick 0.98 to 1.30 s
   * ({@link IAutoMovieMotionHumanKick}).
   */
  export const pushKick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["pushKick"]
  > = AutoMovieMotionHumanActionRow.of(
    "pushKick",
    kick,
    HUMAN_STRIKE_PUSH_KICK,
  );

  /**
   * A push kick with the rear foot. Launch to contact 0.33 s at elite skill,
   * 0.39 s at novice, the whole kick 0.98 to 1.30 s
   * ({@link IAutoMovieMotionHumanKick}).
   */
  export const teep: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["teep"]
  > = AutoMovieMotionHumanActionRow.of("teep", kick, HUMAN_STRIKE_TEEP);

  /**
   * A knee with the lead leg. Launch to contact 0.22 s at elite skill, 0.65 s
   * of recoil ({@link IAutoMovieMotionHumanKnee}).
   */
  export const leadKnee: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["leadKnee"]
  > = AutoMovieMotionHumanActionRow.of(
    "leadKnee",
    knee,
    HUMAN_STRIKE_LEAD_KNEE,
  );

  /**
   * A knee with the rear leg. Launch to contact 0.22 s at elite skill, 0.65 s
   * of recoil ({@link IAutoMovieMotionHumanKnee}).
   */
  export const rearKnee: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["strike"]["rearKnee"]
  > = AutoMovieMotionHumanActionRow.of(
    "rearKnee",
    knee,
    HUMAN_STRIKE_REAR_KNEE,
  );
}
