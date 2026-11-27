import { HUMAN_STRIKE_ARMADA } from "./HUMAN_STRIKE_ARMADA";
import { HUMAN_STRIKE_AXE_KICK } from "./HUMAN_STRIKE_AXE_KICK";
import { HUMAN_STRIKE_BACKFIST } from "./HUMAN_STRIKE_BACKFIST";
import { HUMAN_STRIKE_BACK_KICK } from "./HUMAN_STRIKE_BACK_KICK";
import { HUMAN_STRIKE_CHAIN_PUNCH } from "./HUMAN_STRIKE_CHAIN_PUNCH";
import { HUMAN_STRIKE_CRESCENT_KICK } from "./HUMAN_STRIKE_CRESCENT_KICK";
import { HUMAN_STRIKE_CROSS } from "./HUMAN_STRIKE_CROSS";
import { HUMAN_STRIKE_DESCENDING_ELBOW } from "./HUMAN_STRIKE_DESCENDING_ELBOW";
import { HUMAN_STRIKE_HAMMERFIST } from "./HUMAN_STRIKE_HAMMERFIST";
import { HUMAN_STRIKE_HEADBUTT } from "./HUMAN_STRIKE_HEADBUTT";
import { HUMAN_STRIKE_HOOK_KICK } from "./HUMAN_STRIKE_HOOK_KICK";
import { HUMAN_STRIKE_HORIZONTAL_ELBOW } from "./HUMAN_STRIKE_HORIZONTAL_ELBOW";
import { HUMAN_STRIKE_JAB } from "./HUMAN_STRIKE_JAB";
import { HUMAN_STRIKE_JUMPING_SIDE_KICK } from "./HUMAN_STRIKE_JUMPING_SIDE_KICK";
import { HUMAN_STRIKE_LEAD_HOOK } from "./HUMAN_STRIKE_LEAD_HOOK";
import { HUMAN_STRIKE_LEAD_KNEE } from "./HUMAN_STRIKE_LEAD_KNEE";
import { HUMAN_STRIKE_LEAD_UPPERCUT } from "./HUMAN_STRIKE_LEAD_UPPERCUT";
import { HUMAN_STRIKE_LEG_SWEEP } from "./HUMAN_STRIKE_LEG_SWEEP";
import { HUMAN_STRIKE_MEIA_LUA_DE_FRENTE } from "./HUMAN_STRIKE_MEIA_LUA_DE_FRENTE";
import { HUMAN_STRIKE_PALM_HEEL } from "./HUMAN_STRIKE_PALM_HEEL";
import { HUMAN_STRIKE_PUSH_KICK } from "./HUMAN_STRIKE_PUSH_KICK";
import { HUMAN_STRIKE_REAR_CHAIN_PUNCH } from "./HUMAN_STRIKE_REAR_CHAIN_PUNCH";
import { HUMAN_STRIKE_REAR_HOOK } from "./HUMAN_STRIKE_REAR_HOOK";
import { HUMAN_STRIKE_REAR_KNEE } from "./HUMAN_STRIKE_REAR_KNEE";
import { HUMAN_STRIKE_REAR_UPPERCUT } from "./HUMAN_STRIKE_REAR_UPPERCUT";
import { HUMAN_STRIKE_RISING_ELBOW } from "./HUMAN_STRIKE_RISING_ELBOW";
import { HUMAN_STRIKE_ROUND_KICK } from "./HUMAN_STRIKE_ROUND_KICK";
import { HUMAN_STRIKE_SIDE_KICK } from "./HUMAN_STRIKE_SIDE_KICK";
import { HUMAN_STRIKE_SPINNING_BACKFIST } from "./HUMAN_STRIKE_SPINNING_BACKFIST";
import { HUMAN_STRIKE_SPINNING_ELBOW } from "./HUMAN_STRIKE_SPINNING_ELBOW";
import { HUMAN_STRIKE_SPINNING_HOOK_KICK } from "./HUMAN_STRIKE_SPINNING_HOOK_KICK";
import { HUMAN_STRIKE_STOMP } from "./HUMAN_STRIKE_STOMP";
import { HUMAN_STRIKE_SWITCH_KICK } from "./HUMAN_STRIKE_SWITCH_KICK";
import { HUMAN_STRIKE_TEEP } from "./HUMAN_STRIKE_TEEP";

/*
 * The strike family's presets: named parameter values spread into a law's
 * parameters beside the target, each under its family name
 * (`AutoMovieMotionHumanStrike`); a preset adds no method.
 */
export namespace AutoMovieMotionHumanStrikePresets {
  /*
   * The armada preset: capoeira's armada, a whole turn and then the rear leg's
   * straight sweep outward. Spread into `footStrike`'s parameters beside the
   * rest that the composition gives; each value means what the law's member of
   * the same name does. The `armada` row of `HumanStrike` fixes these values.
   */
  export const ARMADA: typeof HUMAN_STRIKE_ARMADA = HUMAN_STRIKE_ARMADA;

  /*
   * The axeKick preset: an axe kick with the rear leg. Spread into
   * `footStrike`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `axeKick` row
   * of `HumanStrike` fixes these values.
   */
  export const AXE_KICK: typeof HUMAN_STRIKE_AXE_KICK = HUMAN_STRIKE_AXE_KICK;

  /*
   * The backKick preset: a back kick with the rear leg. Spread into
   * `footStrike`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `backKick` row
   * of `HumanStrike` fixes these values.
   */
  export const BACK_KICK: typeof HUMAN_STRIKE_BACK_KICK =
    HUMAN_STRIKE_BACK_KICK;

  /*
   * The backfist preset: a backfist with the lead hand. Spread into `punch`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `backfist` row of
   * `HumanStrike` fixes these values.
   */
  export const BACKFIST: typeof HUMAN_STRIKE_BACKFIST = HUMAN_STRIKE_BACKFIST;

  /*
   * The chainPunch preset: a wing chun chain punch with the lead hand, a
   * vertical fist along the centreline. Spread into `punch`'s parameters beside
   * the rest that the composition gives; each value means what the law's member
   * of the same name does. The `chainPunch` row of `HumanStrike` fixes these
   * values.
   */
  export const CHAIN_PUNCH: typeof HUMAN_STRIKE_CHAIN_PUNCH =
    HUMAN_STRIKE_CHAIN_PUNCH;

  /*
   * The crescentKick preset: a crescent kick with the rear leg. Spread into
   * `footStrike`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `crescentKick`
   * row of `HumanStrike` fixes these values.
   */
  export const CRESCENT_KICK: typeof HUMAN_STRIKE_CRESCENT_KICK =
    HUMAN_STRIKE_CRESCENT_KICK;

  /*
   * The cross preset: a straight punch with the rear hand. Spread into
   * `punch`'s parameters beside the rest that the composition gives; each value
   * means what the law's member of the same name does. The `cross` row of
   * `HumanStrike` fixes these values.
   */
  export const CROSS: typeof HUMAN_STRIKE_CROSS = HUMAN_STRIKE_CROSS;

  /*
   * The descendingElbow preset: a descending elbow with the rear arm. Spread
   * into `closeStrike`'s parameters beside the rest that the composition gives;
   * each value means what the law's member of the same name does. The
   * `descendingElbow` row of `HumanStrike` fixes these values.
   */
  export const DESCENDING_ELBOW: typeof HUMAN_STRIKE_DESCENDING_ELBOW =
    HUMAN_STRIKE_DESCENDING_ELBOW;

  /*
   * The hammerfist preset: a hammerfist with the rear hand. Spread into
   * `punch`'s parameters beside the rest that the composition gives; each value
   * means what the law's member of the same name does. The `hammerfist` row of
   * `HumanStrike` fixes these values.
   */
  export const HAMMERFIST: typeof HUMAN_STRIKE_HAMMERFIST =
    HUMAN_STRIKE_HAMMERFIST;

  /*
   * The headbutt preset: a headbutt, the forehead driven onto the target.
   * Spread into `closeStrike`'s parameters beside the rest that the composition
   * gives; each value means what the law's member of the same name does. The
   * `headbutt` row of `HumanStrike` fixes these values.
   */
  export const HEADBUTT: typeof HUMAN_STRIKE_HEADBUTT = HUMAN_STRIKE_HEADBUTT;

  /*
   * The hookKick preset: a hook kick with the lead leg. Spread into
   * `footStrike`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `hookKick` row
   * of `HumanStrike` fixes these values.
   */
  export const HOOK_KICK: typeof HUMAN_STRIKE_HOOK_KICK =
    HUMAN_STRIKE_HOOK_KICK;

  /*
   * The horizontalElbow preset: a horizontal elbow with the rear arm. Spread
   * into `closeStrike`'s parameters beside the rest that the composition gives;
   * each value means what the law's member of the same name does. The
   * `horizontalElbow` row of `HumanStrike` fixes these values.
   */
  export const HORIZONTAL_ELBOW: typeof HUMAN_STRIKE_HORIZONTAL_ELBOW =
    HUMAN_STRIKE_HORIZONTAL_ELBOW;

  /*
   * The jab preset: a straight punch with the lead hand. Spread into `punch`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `jab` row of `HumanStrike`
   * fixes these values.
   */
  export const JAB: typeof HUMAN_STRIKE_JAB = HUMAN_STRIKE_JAB;

  /*
   * The jumpingSideKick preset: a jumping side kick with the lead leg. Spread
   * into `footStrike`'s parameters beside the rest that the composition gives;
   * each value means what the law's member of the same name does. The
   * `jumpingSideKick` row of `HumanStrike` fixes these values.
   */
  export const JUMPING_SIDE_KICK: typeof HUMAN_STRIKE_JUMPING_SIDE_KICK =
    HUMAN_STRIKE_JUMPING_SIDE_KICK;

  /*
   * The leadHook preset: a hook with the lead hand. Spread into `punch`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `leadHook` row of
   * `HumanStrike` fixes these values.
   */
  export const LEAD_HOOK: typeof HUMAN_STRIKE_LEAD_HOOK =
    HUMAN_STRIKE_LEAD_HOOK;

  /*
   * The leadKnee preset: a knee strike with the lead leg. Spread into `knee`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `leadKnee` row of
   * `HumanStrike` fixes these values.
   */
  export const LEAD_KNEE: typeof HUMAN_STRIKE_LEAD_KNEE =
    HUMAN_STRIKE_LEAD_KNEE;

  /*
   * The leadUppercut preset: an uppercut with the lead hand. Spread into
   * `punch`'s parameters beside the rest that the composition gives; each value
   * means what the law's member of the same name does. The `leadUppercut` row
   * of `HumanStrike` fixes these values.
   */
  export const LEAD_UPPERCUT: typeof HUMAN_STRIKE_LEAD_UPPERCUT =
    HUMAN_STRIKE_LEAD_UPPERCUT;

  /*
   * The legSweep preset: a leg sweep with the lead leg. Spread into
   * `footStrike`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `legSweep` row
   * of `HumanStrike` fixes these values.
   */
  export const LEG_SWEEP: typeof HUMAN_STRIKE_LEG_SWEEP =
    HUMAN_STRIKE_LEG_SWEEP;

  /*
   * The meiaLuaDeFrente preset: capoeira's meia-lua de frente, the rear leg's
   * straight sweep inward across the front. Spread into `footStrike`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `meiaLuaDeFrente` row of
   * `HumanStrike` fixes these values.
   */
  export const MEIA_LUA_DE_FRENTE: typeof HUMAN_STRIKE_MEIA_LUA_DE_FRENTE =
    HUMAN_STRIKE_MEIA_LUA_DE_FRENTE;

  /*
   * The palmHeel preset: a palm-heel strike with the rear hand. Spread into
   * `punch`'s parameters beside the rest that the composition gives; each value
   * means what the law's member of the same name does. The `palmHeel` row of
   * `HumanStrike` fixes these values.
   */
  export const PALM_HEEL: typeof HUMAN_STRIKE_PALM_HEEL =
    HUMAN_STRIKE_PALM_HEEL;

  /*
   * The pushKick preset: a push kick with the lead foot. Spread into `kick`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `pushKick` row of
   * `HumanStrike` fixes these values.
   */
  export const PUSH_KICK: typeof HUMAN_STRIKE_PUSH_KICK =
    HUMAN_STRIKE_PUSH_KICK;

  /*
   * The rearChainPunch preset: a wing chun chain punch with the rear hand.
   * Spread into `punch`'s parameters beside the rest that the composition
   * gives; each value means what the law's member of the same name does. The
   * `rearChainPunch` row of `HumanStrike` fixes these values.
   */
  export const REAR_CHAIN_PUNCH: typeof HUMAN_STRIKE_REAR_CHAIN_PUNCH =
    HUMAN_STRIKE_REAR_CHAIN_PUNCH;

  /*
   * The rearHook preset: a hook with the rear hand. Spread into `punch`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `rearHook` row of
   * `HumanStrike` fixes these values.
   */
  export const REAR_HOOK: typeof HUMAN_STRIKE_REAR_HOOK =
    HUMAN_STRIKE_REAR_HOOK;

  /*
   * The rearKnee preset: a knee strike with the rear leg. Spread into `knee`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `rearKnee` row of
   * `HumanStrike` fixes these values.
   */
  export const REAR_KNEE: typeof HUMAN_STRIKE_REAR_KNEE =
    HUMAN_STRIKE_REAR_KNEE;

  /*
   * The rearUppercut preset: an uppercut with the rear hand. Spread into
   * `punch`'s parameters beside the rest that the composition gives; each value
   * means what the law's member of the same name does. The `rearUppercut` row
   * of `HumanStrike` fixes these values.
   */
  export const REAR_UPPERCUT: typeof HUMAN_STRIKE_REAR_UPPERCUT =
    HUMAN_STRIKE_REAR_UPPERCUT;

  /*
   * The risingElbow preset: a rising elbow with the rear arm. Spread into
   * `closeStrike`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `risingElbow`
   * row of `HumanStrike` fixes these values.
   */
  export const RISING_ELBOW: typeof HUMAN_STRIKE_RISING_ELBOW =
    HUMAN_STRIKE_RISING_ELBOW;

  /*
   * The roundKick preset: a round kick with the rear leg. Spread into `kick`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `roundKick` row of
   * `HumanStrike` fixes these values.
   */
  export const ROUND_KICK: typeof HUMAN_STRIKE_ROUND_KICK =
    HUMAN_STRIKE_ROUND_KICK;

  /*
   * The sideKick preset: a side kick with the lead leg. Spread into
   * `footStrike`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `sideKick` row
   * of `HumanStrike` fixes these values.
   */
  export const SIDE_KICK: typeof HUMAN_STRIKE_SIDE_KICK =
    HUMAN_STRIKE_SIDE_KICK;

  /*
   * The spinningBackfist preset: a spinning backfist with the rear arm. Spread
   * into `closeStrike`'s parameters beside the rest that the composition gives;
   * each value means what the law's member of the same name does. The
   * `spinningBackfist` row of `HumanStrike` fixes these values.
   */
  export const SPINNING_BACKFIST: typeof HUMAN_STRIKE_SPINNING_BACKFIST =
    HUMAN_STRIKE_SPINNING_BACKFIST;

  /*
   * The spinningElbow preset: a spinning elbow with the rear arm. Spread into
   * `closeStrike`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The
   * `spinningElbow` row of `HumanStrike` fixes these values.
   */
  export const SPINNING_ELBOW: typeof HUMAN_STRIKE_SPINNING_ELBOW =
    HUMAN_STRIKE_SPINNING_ELBOW;

  /*
   * The spinningHookKick preset: a spinning hook kick with the rear leg. Spread
   * into `footStrike`'s parameters beside the rest that the composition gives;
   * each value means what the law's member of the same name does. The
   * `spinningHookKick` row of `HumanStrike` fixes these values.
   */
  export const SPINNING_HOOK_KICK: typeof HUMAN_STRIKE_SPINNING_HOOK_KICK =
    HUMAN_STRIKE_SPINNING_HOOK_KICK;

  /*
   * The stomp preset: a stomp with the rear leg onto a floor-level target.
   * Spread into `footStrike`'s parameters beside the rest that the composition
   * gives; each value means what the law's member of the same name does. The
   * `stomp` row of `HumanStrike` fixes these values.
   */
  export const STOMP: typeof HUMAN_STRIKE_STOMP = HUMAN_STRIKE_STOMP;

  /*
   * The switchKick preset: a round kick with the lead leg. Spread into `kick`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `switchKick` row of
   * `HumanStrike` fixes these values.
   */
  export const SWITCH_KICK: typeof HUMAN_STRIKE_SWITCH_KICK =
    HUMAN_STRIKE_SWITCH_KICK;

  /*
   * The teep preset: a push kick with the rear foot. Spread into `kick`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `teep` row of
   * `HumanStrike` fixes these values.
   */
  export const TEEP: typeof HUMAN_STRIKE_TEEP = HUMAN_STRIKE_TEEP;
}
