import { AutoMovieMotionHumanStrikeLaws } from "./AutoMovieMotionHumanStrikeLaws";
import { AutoMovieMotionHumanStrikePresets } from "./AutoMovieMotionHumanStrikePresets";
import { AutoMovieMotionHumanStrikeRows } from "./AutoMovieMotionHumanStrikeRows";

/**
 * The strikes: punches, kicks, knees and the close and foot strikes, which
 * share one timing model, the striking reach solve and the performer's skill
 * (`StrikingSkill`). A rear straight takes 0.31 s from launch to contact at
 * elite skill and 0.33 s at novice, and a jab less; a kick takes 0.33 s at
 * elite and 0.39 s at novice. A punch's instants are `launch`, `impact` and
 * `recovered` (`shown` instead of `impact` when it feints), a kick's `launch`,
 * `chamber`, `impact` and `replant`; a strike has no `contact` event, so
 * `sync({ of })` without `event` takes its impact. A kick is cut only into
 * another kick, and only until its chamber, so a `stand` or `guard` synced onto
 * a running kick is refused with its legal windows.
 *
 * A named technique that fixes only some of a law's parameters is a preset,
 * data spread into that law's parameters beside the target:
 * `AutoMovieMotionHumanStrike.JAB`, `CROSS`, the hooks, uppercuts, elbows,
 * kicks and knees (`IPunchPreset`, `IFootStrikePreset`, `ICloseStrikePreset`,
 * `IKickPreset` and `IKneePreset`); a preset adds no method.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `punch`: A punch: the fist's knuckles brought onto the target along a
 *   measured path and returned to the guard, with the trunk turning and the
 *   feet stepping or pivoting to carry the shoulder.
 * - `kick`: A kick: the round kick's lower shin or the push kick's ball of the
 *   foot brought onto the target, through a chamber, and recoiled to the
 *   replant.
 * - `knee`: A knee strike: the knee driven up and forward onto the target while
 *   the hands hold the opponent's head or neck (the clinch) or stay at the
 *   guard.
 * - `closeStrike`: The close strikes (`IAutoMovieMotionHumanCloseStrike`): an
 *   elbow, a spinning elbow or backfist, or a headbutt, out to the target on
 *   the punch's measured delivery and back to the guard over its hand
 *   recovery.
 * - `footStrike`: The foot strikes (`IAutoMovieMotionHumanFootStrike`): the
 *   kicking ankle from its plant through a chamber to the contact and back, the
 *   support leg planted on its ball, the pelvis turned, spun or lifted as the
 *   technique and its modifiers ask.
 * - `step`: Fighting-stance footwork: steps that keep the stance, the foot on the
 *   side of travel moving first and the other following to restore the stance
 *   without crossing (IBA coaching manual pp.
 * - `martialArt`: Martial-art forms other than kickboxing: the karate horse
 *   stance (kiba-dachi), alternating straight punches from it (choku-zuki) and
 *   the tai chi push in a bow stance.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `ARMADA`: The armada preset: capoeira's armada, a whole turn and then the
 *   rear leg's straight sweep outward.
 * - `AXE_KICK`: The axeKick preset: an axe kick with the rear leg.
 * - `BACK_KICK`: The backKick preset: a back kick with the rear leg.
 * - `BACKFIST`: The backfist preset: a backfist with the lead hand.
 * - `CHAIN_PUNCH`: The chainPunch preset: a wing chun chain punch with the lead
 *   hand, a vertical fist along the centreline.
 * - `CRESCENT_KICK`: The crescentKick preset: a crescent kick with the rear leg.
 * - `CROSS`: The cross preset: a straight punch with the rear hand.
 * - `DESCENDING_ELBOW`: The descendingElbow preset: a descending elbow with the
 *   rear arm.
 * - `HAMMERFIST`: The hammerfist preset: a hammerfist with the rear hand.
 * - `HEADBUTT`: The headbutt preset: a headbutt, the forehead driven onto the
 *   target.
 * - `HOOK_KICK`: The hookKick preset: a hook kick with the lead leg.
 * - `HORIZONTAL_ELBOW`: The horizontalElbow preset: a horizontal elbow with the
 *   rear arm.
 * - `JAB`: The jab preset: a straight punch with the lead hand.
 * - `JUMPING_SIDE_KICK`: The jumpingSideKick preset: a jumping side kick with the
 *   lead leg.
 * - `LEAD_HOOK`: The leadHook preset: a hook with the lead hand.
 * - `LEAD_KNEE`: The leadKnee preset: a knee strike with the lead leg.
 * - `LEAD_UPPERCUT`: The leadUppercut preset: an uppercut with the lead hand.
 * - `LEG_SWEEP`: The legSweep preset: a leg sweep with the lead leg.
 * - `MEIA_LUA_DE_FRENTE`: The meiaLuaDeFrente preset: capoeira's meia-lua de
 *   frente, the rear leg's straight sweep inward across the front.
 * - `PALM_HEEL`: The palmHeel preset: a palm-heel strike with the rear hand.
 * - `PUSH_KICK`: The pushKick preset: a push kick with the lead foot.
 * - `REAR_CHAIN_PUNCH`: The rearChainPunch preset: a wing chun chain punch with
 *   the rear hand.
 * - `REAR_HOOK`: The rearHook preset: a hook with the rear hand.
 * - `REAR_KNEE`: The rearKnee preset: a knee strike with the rear leg.
 * - `REAR_UPPERCUT`: The rearUppercut preset: an uppercut with the rear hand.
 * - `RISING_ELBOW`: The risingElbow preset: a rising elbow with the rear arm.
 * - `ROUND_KICK`: The roundKick preset: a round kick with the rear leg.
 * - `SIDE_KICK`: The sideKick preset: a side kick with the lead leg.
 * - `SPINNING_BACKFIST`: The spinningBackfist preset: a spinning backfist with
 *   the rear arm.
 * - `SPINNING_ELBOW`: The spinningElbow preset: a spinning elbow with the rear
 *   arm.
 * - `SPINNING_HOOK_KICK`: The spinningHookKick preset: a spinning hook kick with
 *   the rear leg.
 * - `STOMP`: The stomp preset: a stomp with the rear leg onto a floor-level
 *   target.
 * - `SWITCH_KICK`: The switchKick preset: a round kick with the lead leg.
 * - `TEEP`: The teep preset: a push kick with the rear foot.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `StrikingAim`: How a strike follows its target: the goal planned at the
 *   launch from where the target is predicted to be at contact, and then online
 *   corrections, each a minimum-jerk unit superposed on the strike's goal, as
 *   the target is seen to move.
 * - `StrikingBody`: The body facts striking laws read: where a posture puts the
 *   shoulders, hips and head before any limb is solved, where a weapon socket
 *   sits relative to its wrist or ankle under a hand or foot rotation, the
 *   closed fist's finger angles, and another body's limbs as capsules for the
 *   contact sweep.
 * - `StrikingContact`: When and where a moving weapon first touches a surface of
 *   another body.
 * - `StrikingQuality`: Where a strike lands relative to its aim: the author's
 *   declared accuracy plus the performer's seeded endpoint scatter.
 * - `StrikingReach`: The goal maths of bringing a weapon surface onto a target
 *   point: where a two-segment limb's middle joint (elbow or knee) and end
 *   joint (wrist or ankle) must be for a point on its distal segment to sit on
 *   the target, the flexion that takes, and the declared rule when the target
 *   is out of reach.
 * - `StrikingSkill`: The striking family's measured timing, speed, reaction and
 *   guard numbers, from novice to elite, as `HumanSkill.quantity` reads them.
 * - `StrikingGuardYield`: How far a guard facing a person steps back so that the
 *   two fighters' guards, both held, stand clear of each other: no joint of
 *   either body inside the other's colliders (the partner verdict's reading,
 *   `HumanColliders.distance`), whatever the two bodies' sizes.
 * - `StrikingStance`: The fighting stance uses separate tracks, soft knees, a
 *   leading shoulder and glove goals measured from the performer's own head.
 * - `StrikingStroke`: One strike's end-joint path (the wrist or the ankle), from
 *   its launch through an optional via point (a kick's chamber) to its contact
 *   and back, as superposed minimum-jerk units, with the target's online
 *   corrections and the stop at the first surface the weapon meets.
 * - `StrikingTarget`: The relations every striking law reads from its entry state
 *   and its target: which side leads, the line to the target, the feet as
 *   placed, and how a foot steps along the line or pivots on its ball.
 * - `StrikingTwist`: A strike's trunk turn laid on the trunk it enters with: the
 *   spine and the chest each twisted by the given share, their flexion and side
 *   bend kept.
 * - `StrikingRecord`: What a planned strike decided, for audits and captures: the
 *   landing offset it intended (declared accuracy plus seeded scatter), the
 *   goal it planned at its launch, how its reach solve came out, and the second
 *   its weapon met a surface.
 * - `StrikingHeld`: A thing held in the hand as the effector of an action: a
 *   blade whose point and edge are aimed, a firearm whose muzzle is aimed.
 * - `StrikingBlade`: The stroke of a held tool, shared by every blade and firearm
 *   action: the tool is taken from where the hand holds it to a ready pose,
 *   carried along a path to its decisive pose, kept there and returned, while
 *   the feet stay or the leading foot steps or lunges under it.
 * - `StrikingRoll`: Whether the arm can hold a held tool in a pose, and the turn
 *   of the tool about its own line where the action leaves it free.
 * - `StrikingAdvance`: The advance of a stroke: how the body goes with a held
 *   tool's cut, thrust or presentation.
 * - `HumanStrike`: The strikes as rows on the grammar: each named technique is a
 *   row of the shipped law that owns its geometry and its outcome, the effector
 *   and the side fixed, the target and the accuracy the composition's.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanStrike} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanStrike {
  /** A punch. See `AutoMovieMotionHumanStrikeLaws.punch`. */
  export import punch = AutoMovieMotionHumanStrikeLaws.punch;

  /** A kick. See `AutoMovieMotionHumanStrikeLaws.kick`. */
  export import kick = AutoMovieMotionHumanStrikeLaws.kick;

  /** A knee strike. See `AutoMovieMotionHumanStrikeLaws.knee`. */
  export import knee = AutoMovieMotionHumanStrikeLaws.knee;

  /**
   * The close strikes (`IAutoMovieMotionHumanCloseStrike`). See
   * `AutoMovieMotionHumanStrikeLaws.closeStrike`.
   */
  export import closeStrike = AutoMovieMotionHumanStrikeLaws.closeStrike;

  /**
   * The foot strikes (`IAutoMovieMotionHumanFootStrike`). See
   * `AutoMovieMotionHumanStrikeLaws.footStrike`.
   */
  export import footStrike = AutoMovieMotionHumanStrikeLaws.footStrike;

  /** Fighting-stance footwork. See `AutoMovieMotionHumanStrikeLaws.step`. */
  export import step = AutoMovieMotionHumanStrikeLaws.step;

  /**
   * Martial-art forms other than kickboxing. See
   * `AutoMovieMotionHumanStrikeLaws.martialArt`.
   */
  export import martialArt = AutoMovieMotionHumanStrikeLaws.martialArt;

  /**
   * How a strike follows its target. See
   * `AutoMovieMotionHumanStrikeRows.StrikingAim`.
   */
  export import StrikingAim = AutoMovieMotionHumanStrikeRows.StrikingAim;

  /**
   * The body facts striking laws read. See
   * `AutoMovieMotionHumanStrikeRows.StrikingBody`.
   */
  export import StrikingBody = AutoMovieMotionHumanStrikeRows.StrikingBody;

  /**
   * When and where a moving weapon first touches a surface of another body. See
   * `AutoMovieMotionHumanStrikeRows.StrikingContact`.
   */
  export import StrikingContact = AutoMovieMotionHumanStrikeRows.StrikingContact;

  /**
   * Where a strike lands relative to its aim. See
   * `AutoMovieMotionHumanStrikeRows.StrikingQuality`.
   */
  export import StrikingQuality = AutoMovieMotionHumanStrikeRows.StrikingQuality;

  /**
   * The goal maths of bringing a weapon surface onto a target point. See
   * `AutoMovieMotionHumanStrikeRows.StrikingReach`.
   */
  export import StrikingReach = AutoMovieMotionHumanStrikeRows.StrikingReach;

  /**
   * The striking family's measured timing, speed, reaction and guard numbers,
   * from novice to elite, as `HumanSkill.quantity` reads them. See
   * `AutoMovieMotionHumanStrikeRows.StrikingSkill`.
   */
  export import StrikingSkill = AutoMovieMotionHumanStrikeRows.StrikingSkill;

  /**
   * How far a guard facing a person steps back so that the two fighters'
   * guards, both held, stand clear of each other. See
   * `AutoMovieMotionHumanStrikeRows.StrikingGuardYield`.
   */
  export import StrikingGuardYield = AutoMovieMotionHumanStrikeRows.StrikingGuardYield;

  /**
   * The fighting stance uses separate tracks, soft knees, a leading shoulder
   * and glove goals measured from the performer's own head. See
   * `AutoMovieMotionHumanStrikeRows.StrikingStance`.
   */
  export import StrikingStance = AutoMovieMotionHumanStrikeRows.StrikingStance;

  /**
   * One strike's end-joint path (the wrist or the ankle), from its launch
   * through an optional via point (a kick's chamber) to its contact and back,
   * as superposed minimum-jerk units, with the target's online corrections and
   * the stop at the first surface the weapon meets. See
   * `AutoMovieMotionHumanStrikeRows.StrikingStroke`.
   */
  export import StrikingStroke = AutoMovieMotionHumanStrikeRows.StrikingStroke;

  /**
   * The relations every striking law reads from its entry state and its target.
   * See `AutoMovieMotionHumanStrikeRows.StrikingTarget`.
   */
  export import StrikingTarget = AutoMovieMotionHumanStrikeRows.StrikingTarget;

  /**
   * A strike's trunk turn laid on the trunk it enters with. See
   * `AutoMovieMotionHumanStrikeRows.StrikingTwist`.
   */
  export import StrikingTwist = AutoMovieMotionHumanStrikeRows.StrikingTwist;

  /**
   * What a planned strike decided, for audits and captures. See
   * `AutoMovieMotionHumanStrikeRows.StrikingRecord`.
   */
  export import StrikingRecord = AutoMovieMotionHumanStrikeRows.StrikingRecord;

  /**
   * A thing held in the hand as the effector of an action. See
   * `AutoMovieMotionHumanStrikeRows.StrikingHeld`.
   */
  export import StrikingHeld = AutoMovieMotionHumanStrikeRows.StrikingHeld;

  /**
   * The stroke of a held tool, shared by every blade and firearm action. See
   * `AutoMovieMotionHumanStrikeRows.StrikingBlade`.
   */
  export import StrikingBlade = AutoMovieMotionHumanStrikeRows.StrikingBlade;

  /**
   * Whether the arm can hold a held tool in a pose, and the turn of the tool
   * about its own line where the action leaves it free. See
   * `AutoMovieMotionHumanStrikeRows.StrikingRoll`.
   */
  export import StrikingRoll = AutoMovieMotionHumanStrikeRows.StrikingRoll;

  /**
   * The advance of a stroke. See
   * `AutoMovieMotionHumanStrikeRows.StrikingAdvance`.
   */
  export import StrikingAdvance = AutoMovieMotionHumanStrikeRows.StrikingAdvance;

  /**
   * The strikes as rows on the grammar. See
   * `AutoMovieMotionHumanStrikeRows.HumanStrike`.
   */
  export import HumanStrike = AutoMovieMotionHumanStrikeRows.HumanStrike;

  /** The armada preset. See `AutoMovieMotionHumanStrikePresets.ARMADA`. */
  export import ARMADA = AutoMovieMotionHumanStrikePresets.ARMADA;

  /** The axeKick preset. See `AutoMovieMotionHumanStrikePresets.AXE_KICK`. */
  export import AXE_KICK = AutoMovieMotionHumanStrikePresets.AXE_KICK;

  /** The backKick preset. See `AutoMovieMotionHumanStrikePresets.BACK_KICK`. */
  export import BACK_KICK = AutoMovieMotionHumanStrikePresets.BACK_KICK;

  /** The backfist preset. See `AutoMovieMotionHumanStrikePresets.BACKFIST`. */
  export import BACKFIST = AutoMovieMotionHumanStrikePresets.BACKFIST;

  /** The chainPunch preset. See `AutoMovieMotionHumanStrikePresets.CHAIN_PUNCH`. */
  export import CHAIN_PUNCH = AutoMovieMotionHumanStrikePresets.CHAIN_PUNCH;

  /**
   * The crescentKick preset. See
   * `AutoMovieMotionHumanStrikePresets.CRESCENT_KICK`.
   */
  export import CRESCENT_KICK = AutoMovieMotionHumanStrikePresets.CRESCENT_KICK;

  /** The cross preset. See `AutoMovieMotionHumanStrikePresets.CROSS`. */
  export import CROSS = AutoMovieMotionHumanStrikePresets.CROSS;

  /**
   * The descendingElbow preset. See
   * `AutoMovieMotionHumanStrikePresets.DESCENDING_ELBOW`.
   */
  export import DESCENDING_ELBOW = AutoMovieMotionHumanStrikePresets.DESCENDING_ELBOW;

  /** The hammerfist preset. See `AutoMovieMotionHumanStrikePresets.HAMMERFIST`. */
  export import HAMMERFIST = AutoMovieMotionHumanStrikePresets.HAMMERFIST;

  /** The headbutt preset. See `AutoMovieMotionHumanStrikePresets.HEADBUTT`. */
  export import HEADBUTT = AutoMovieMotionHumanStrikePresets.HEADBUTT;

  /** The hookKick preset. See `AutoMovieMotionHumanStrikePresets.HOOK_KICK`. */
  export import HOOK_KICK = AutoMovieMotionHumanStrikePresets.HOOK_KICK;

  /**
   * The horizontalElbow preset. See
   * `AutoMovieMotionHumanStrikePresets.HORIZONTAL_ELBOW`.
   */
  export import HORIZONTAL_ELBOW = AutoMovieMotionHumanStrikePresets.HORIZONTAL_ELBOW;

  /** The jab preset. See `AutoMovieMotionHumanStrikePresets.JAB`. */
  export import JAB = AutoMovieMotionHumanStrikePresets.JAB;

  /**
   * The jumpingSideKick preset. See
   * `AutoMovieMotionHumanStrikePresets.JUMPING_SIDE_KICK`.
   */
  export import JUMPING_SIDE_KICK = AutoMovieMotionHumanStrikePresets.JUMPING_SIDE_KICK;

  /** The leadHook preset. See `AutoMovieMotionHumanStrikePresets.LEAD_HOOK`. */
  export import LEAD_HOOK = AutoMovieMotionHumanStrikePresets.LEAD_HOOK;

  /** The leadKnee preset. See `AutoMovieMotionHumanStrikePresets.LEAD_KNEE`. */
  export import LEAD_KNEE = AutoMovieMotionHumanStrikePresets.LEAD_KNEE;

  /**
   * The leadUppercut preset. See
   * `AutoMovieMotionHumanStrikePresets.LEAD_UPPERCUT`.
   */
  export import LEAD_UPPERCUT = AutoMovieMotionHumanStrikePresets.LEAD_UPPERCUT;

  /** The legSweep preset. See `AutoMovieMotionHumanStrikePresets.LEG_SWEEP`. */
  export import LEG_SWEEP = AutoMovieMotionHumanStrikePresets.LEG_SWEEP;

  /**
   * The meiaLuaDeFrente preset. See
   * `AutoMovieMotionHumanStrikePresets.MEIA_LUA_DE_FRENTE`.
   */
  export import MEIA_LUA_DE_FRENTE = AutoMovieMotionHumanStrikePresets.MEIA_LUA_DE_FRENTE;

  /** The palmHeel preset. See `AutoMovieMotionHumanStrikePresets.PALM_HEEL`. */
  export import PALM_HEEL = AutoMovieMotionHumanStrikePresets.PALM_HEEL;

  /** The pushKick preset. See `AutoMovieMotionHumanStrikePresets.PUSH_KICK`. */
  export import PUSH_KICK = AutoMovieMotionHumanStrikePresets.PUSH_KICK;

  /**
   * The rearChainPunch preset. See
   * `AutoMovieMotionHumanStrikePresets.REAR_CHAIN_PUNCH`.
   */
  export import REAR_CHAIN_PUNCH = AutoMovieMotionHumanStrikePresets.REAR_CHAIN_PUNCH;

  /** The rearHook preset. See `AutoMovieMotionHumanStrikePresets.REAR_HOOK`. */
  export import REAR_HOOK = AutoMovieMotionHumanStrikePresets.REAR_HOOK;

  /** The rearKnee preset. See `AutoMovieMotionHumanStrikePresets.REAR_KNEE`. */
  export import REAR_KNEE = AutoMovieMotionHumanStrikePresets.REAR_KNEE;

  /**
   * The rearUppercut preset. See
   * `AutoMovieMotionHumanStrikePresets.REAR_UPPERCUT`.
   */
  export import REAR_UPPERCUT = AutoMovieMotionHumanStrikePresets.REAR_UPPERCUT;

  /**
   * The risingElbow preset. See
   * `AutoMovieMotionHumanStrikePresets.RISING_ELBOW`.
   */
  export import RISING_ELBOW = AutoMovieMotionHumanStrikePresets.RISING_ELBOW;

  /** The roundKick preset. See `AutoMovieMotionHumanStrikePresets.ROUND_KICK`. */
  export import ROUND_KICK = AutoMovieMotionHumanStrikePresets.ROUND_KICK;

  /** The sideKick preset. See `AutoMovieMotionHumanStrikePresets.SIDE_KICK`. */
  export import SIDE_KICK = AutoMovieMotionHumanStrikePresets.SIDE_KICK;

  /**
   * The spinningBackfist preset. See
   * `AutoMovieMotionHumanStrikePresets.SPINNING_BACKFIST`.
   */
  export import SPINNING_BACKFIST = AutoMovieMotionHumanStrikePresets.SPINNING_BACKFIST;

  /**
   * The spinningElbow preset. See
   * `AutoMovieMotionHumanStrikePresets.SPINNING_ELBOW`.
   */
  export import SPINNING_ELBOW = AutoMovieMotionHumanStrikePresets.SPINNING_ELBOW;

  /**
   * The spinningHookKick preset. See
   * `AutoMovieMotionHumanStrikePresets.SPINNING_HOOK_KICK`.
   */
  export import SPINNING_HOOK_KICK = AutoMovieMotionHumanStrikePresets.SPINNING_HOOK_KICK;

  /** The stomp preset. See `AutoMovieMotionHumanStrikePresets.STOMP`. */
  export import STOMP = AutoMovieMotionHumanStrikePresets.STOMP;

  /** The switchKick preset. See `AutoMovieMotionHumanStrikePresets.SWITCH_KICK`. */
  export import SWITCH_KICK = AutoMovieMotionHumanStrikePresets.SWITCH_KICK;

  /** The teep preset. See `AutoMovieMotionHumanStrikePresets.TEEP`. */
  export import TEEP = AutoMovieMotionHumanStrikePresets.TEEP;
}
