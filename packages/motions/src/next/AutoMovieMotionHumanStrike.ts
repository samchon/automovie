import { HumanStrike as HumanStrikeSource } from "../lexicon/HumanStrike";
import { martialArt as martialArtLaw } from "../sport/martialArt";
import { StrikingAdvance as StrikingAdvanceSource } from "../striking/StrikingAdvance";
import { StrikingAim as StrikingAimSource } from "../striking/StrikingAim";
import { StrikingBlade as StrikingBladeSource } from "../striking/StrikingBlade";
import { StrikingBody as StrikingBodySource } from "../striking/StrikingBody";
import { StrikingContact as StrikingContactSource } from "../striking/StrikingContact";
import { StrikingGuardYield as StrikingGuardYieldSource } from "../striking/StrikingGuardYield";
import { StrikingHeld as StrikingHeldSource } from "../striking/StrikingHeld";
import { StrikingQuality as StrikingQualitySource } from "../striking/StrikingQuality";
import { StrikingReach as StrikingReachSource } from "../striking/StrikingReach";
import { StrikingRecord as StrikingRecordSource } from "../striking/StrikingRecord";
import { StrikingRoll as StrikingRollSource } from "../striking/StrikingRoll";
import { StrikingSkill as StrikingSkillSource } from "../striking/StrikingSkill";
import { StrikingStance as StrikingStanceSource } from "../striking/StrikingStance";
import { StrikingStroke as StrikingStrokeSource } from "../striking/StrikingStroke";
import { StrikingTarget as StrikingTargetSource } from "../striking/StrikingTarget";
import { StrikingTwist as StrikingTwistSource } from "../striking/StrikingTwist";
import { closeStrike as closeStrikeLaw } from "../striking/closeStrike";
import { footStrike as footStrikeLaw } from "../striking/footStrike";
import { kick as kickLaw } from "../striking/kick";
import { knee as kneeLaw } from "../striking/knee";
import { punch as punchLaw } from "../striking/punch";
import { step as stepLaw } from "../striking/step";
import { HUMAN_STRIKE_ARMADA } from "./presets/HUMAN_STRIKE_ARMADA";
import { HUMAN_STRIKE_AXE_KICK } from "./presets/HUMAN_STRIKE_AXE_KICK";
import { HUMAN_STRIKE_BACKFIST } from "./presets/HUMAN_STRIKE_BACKFIST";
import { HUMAN_STRIKE_BACK_KICK } from "./presets/HUMAN_STRIKE_BACK_KICK";
import { HUMAN_STRIKE_CHAIN_PUNCH } from "./presets/HUMAN_STRIKE_CHAIN_PUNCH";
import { HUMAN_STRIKE_CRESCENT_KICK } from "./presets/HUMAN_STRIKE_CRESCENT_KICK";
import { HUMAN_STRIKE_CROSS } from "./presets/HUMAN_STRIKE_CROSS";
import { HUMAN_STRIKE_DESCENDING_ELBOW } from "./presets/HUMAN_STRIKE_DESCENDING_ELBOW";
import { HUMAN_STRIKE_HAMMERFIST } from "./presets/HUMAN_STRIKE_HAMMERFIST";
import { HUMAN_STRIKE_HEADBUTT } from "./presets/HUMAN_STRIKE_HEADBUTT";
import { HUMAN_STRIKE_HOOK_KICK } from "./presets/HUMAN_STRIKE_HOOK_KICK";
import { HUMAN_STRIKE_HORIZONTAL_ELBOW } from "./presets/HUMAN_STRIKE_HORIZONTAL_ELBOW";
import { HUMAN_STRIKE_JAB } from "./presets/HUMAN_STRIKE_JAB";
import { HUMAN_STRIKE_JUMPING_SIDE_KICK } from "./presets/HUMAN_STRIKE_JUMPING_SIDE_KICK";
import { HUMAN_STRIKE_LEAD_HOOK } from "./presets/HUMAN_STRIKE_LEAD_HOOK";
import { HUMAN_STRIKE_LEAD_KNEE } from "./presets/HUMAN_STRIKE_LEAD_KNEE";
import { HUMAN_STRIKE_LEAD_UPPERCUT } from "./presets/HUMAN_STRIKE_LEAD_UPPERCUT";
import { HUMAN_STRIKE_LEG_SWEEP } from "./presets/HUMAN_STRIKE_LEG_SWEEP";
import { HUMAN_STRIKE_MEIA_LUA_DE_FRENTE } from "./presets/HUMAN_STRIKE_MEIA_LUA_DE_FRENTE";
import { HUMAN_STRIKE_PALM_HEEL } from "./presets/HUMAN_STRIKE_PALM_HEEL";
import { HUMAN_STRIKE_PUSH_KICK } from "./presets/HUMAN_STRIKE_PUSH_KICK";
import { HUMAN_STRIKE_REAR_CHAIN_PUNCH } from "./presets/HUMAN_STRIKE_REAR_CHAIN_PUNCH";
import { HUMAN_STRIKE_REAR_HOOK } from "./presets/HUMAN_STRIKE_REAR_HOOK";
import { HUMAN_STRIKE_REAR_KNEE } from "./presets/HUMAN_STRIKE_REAR_KNEE";
import { HUMAN_STRIKE_REAR_UPPERCUT } from "./presets/HUMAN_STRIKE_REAR_UPPERCUT";
import { HUMAN_STRIKE_RISING_ELBOW } from "./presets/HUMAN_STRIKE_RISING_ELBOW";
import { HUMAN_STRIKE_ROUND_KICK } from "./presets/HUMAN_STRIKE_ROUND_KICK";
import { HUMAN_STRIKE_SIDE_KICK } from "./presets/HUMAN_STRIKE_SIDE_KICK";
import { HUMAN_STRIKE_SPINNING_BACKFIST } from "./presets/HUMAN_STRIKE_SPINNING_BACKFIST";
import { HUMAN_STRIKE_SPINNING_ELBOW } from "./presets/HUMAN_STRIKE_SPINNING_ELBOW";
import { HUMAN_STRIKE_SPINNING_HOOK_KICK } from "./presets/HUMAN_STRIKE_SPINNING_HOOK_KICK";
import { HUMAN_STRIKE_STOMP } from "./presets/HUMAN_STRIKE_STOMP";
import { HUMAN_STRIKE_SWITCH_KICK } from "./presets/HUMAN_STRIKE_SWITCH_KICK";
import { HUMAN_STRIKE_TEEP } from "./presets/HUMAN_STRIKE_TEEP";

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
  /**
   * A punch: the fist's knuckles brought onto the target along a measured path
   * and returned to the guard, with the trunk turning and the feet stepping or
   * pivoting to carry the shoulder.
   *
   * The law writes effector goals, not joint angles. The fist socket is brought
   * from where it is at the launch onto the target region's point (another
   * person's actual region, a prop point, a free point, or a virtual opponent
   * at range) on a minimum-jerk delivery that aims through the target so the
   * fist lands at 0.78 of its peak speed (Liu et al. 2022); the wrist goal is
   * the fist point less the hand-rotated socket offset, the elbow bend hint and
   * the shoulder carried by the trunk turn shape the arm, and the engine's limb
   * fit solves the joints. The target is tracked online with the visuomotor
   * latency ({@link StrikingAim}); the fist stops on the first surface of the
   * struck body it meets ({@link StrikingStroke}), so a guard on the line is
   * struck instead of the face it covers, and two punches thrown at once meet
   * whichever arm or head is in the way.
   *
   * Techniques (IBA coaching manual pp. 42 to 45 and the kickboxing research of
   * the research): `straight` lands nearly extended (elbow 5 to 25 degrees)
   * along the line, palm down; `hook` lands with the elbow near a right angle
   * (70 to 100 degrees), arriving across the line, palm down; `uppercut` rises
   * from below with the elbow at 60 to 100 degrees, palm toward the puncher. A
   * rear-hand punch turns the trunk through to bring the rear shoulder forward
   * and pivots the rear foot on its ball; a lead hook turns the other way. A
   * body punch lowers the root through the knees. When the arm's band falls
   * short, the lead foot steps in by up to one stance length, never past the
   * room in front of the arms ({@link StrikingRoom}) and never toward a target
   * that no place on the line brings within the band, and the rear foot drags
   * from mid-delivery to mid-return (the IBA stepping jab), so no planted foot
   * is left behind a travelling hip; the trunk's turn is shared by the pelvis
   * and the lumbar and thoracic spine. Beyond that the fist extends along the
   * line at the band's reach and falls short, the declared
   * miss-at-maximum-reach rule.
   *
   * Timing: a lone punch takes the elite cross's 0.310 s (Cheraghi et al. 2014)
   * scaled by its own path to the target over the rear hand's, so a jab is
   * faster (`StrikingSkill.lone`, derived and provisional); a punch that
   * follows another punch's contact keeps the measured combination intervals,
   * 0.35 s between alternating hands and 0.45 s for the same hand at elite
   * skill (Piorkowski et al. 2011), counted from that contact. The return to
   * the guard takes one alternating interval. Skill scales them
   * ({@link StrikingSkill}): the delivery and both intervals by the strike
   * phase's factor, the intervals' scaling derived and provisional
   * (`StrikingSkill.interval`), and a seeded guard drop may hold the returning
   * glove low before it reaches the guard. A feint shows a share of the
   * delivery without contact and returns in the same time.
   */
  export import punch = punchLaw;

  /**
   * A kick: the round kick's lower shin or the push kick's ball of the foot
   * brought onto the target, through a chamber, and recoiled to the replant.
   *
   * Effector goals, not keyed angles: the ankle travels on superposed
   * minimum-jerk units from its plant through the chamber to the contact and
   * back through a re-chamber, the knee's bend hint and the foot's rotation
   * riding along, and the engine's limb fit solves the leg. The contact is
   * decided on the fitted figure ({@link KickGeometry}): the two-segment solve
   * ({@link StrikingReach}) puts the lower shin (seven tenths of the way from
   * the knee) or the ball of the foot on the target point with the knee between
   * 5 and 40 degrees of flexion (35 for the push kick), and the body's carriage
   * ({@link KickCarriage}) leans the least that lets the fitted leg hold that
   * solve inside the hip's range of motion. A target nearer than the band is
   * met higher up the shin, as a jammed kick lands; one beyond it, after a
   * step-up of the support foot by up to half a stance, is missed at the fitted
   * leg's own reach. The chamber is the contact's leg with the knee folded
   * ({@link KickChamber}).
   *
   * Both gloves keep their guard (the kick-guard decision of the kickboxing
   * research).
   *
   * Timing (Gavagan and Sayers 2017): preparation 0.074 s, chamber 14 % and
   * extension 11 % of the 1.02 s execution, recoil 0.65 s; the round kick lands
   * at 0.55 of its peak foot speed. Skill scales chamber and recoil by 1.4 to 1
   * and the strike phase by 1.06 to 1, and the chamber's fold and the pelvis's
   * turn by its range share ({@link StrikingSkill}). Every phase applies to low,
   * body and high kicks alike, an approximation the source states (it timed
   * head kicks).
   *
   * A round kick may be redirected before its chamber key into another round
   * kick ({@link KickRedirect}).
   */
  export import kick = kickLaw;

  /**
   * A knee strike: the knee driven up and forward onto the target while the
   * hands hold the opponent's head or neck (the clinch) or stay at the guard.
   *
   * The knee is the weapon, and the thigh carries it on a circle about the hip
   * ({@link KneeReach}). The hips square to the thigh's heading, the support
   * foot pivoting on its ball with them; the pelvis travels along the line
   * until the knee's front is on the target, lowered as far as the planted
   * support leg needs to keep its foot, and the knee is solved from the hip
   * that carriage leaves it. A target outside the thigh's range or the pelvis's
   * travel is the declared miss at maximum reach (`short`), and one closer than
   * the hips can withdraw is `jammed`: the knee lands where it first meets the
   * body.
   *
   * The knee is lifted, then the hips are driven in
   * ({@link KneeForm.LIFT_SHARE}): the thigh swings about the hip from where the
   * stance had it to its solved elevation on an early clock, the pelvis travels
   * on a late one, and the way back mirrors it. The shank folds under the knee
   * and the toes point down along it ({@link KneeForm.FLEXION},
   * {@link KneeForm.PLANTAR}), so the foot trails behind the knee instead of
   * leading it into the opponent's legs. The trunk leans back slightly to keep
   * the centre of mass over the pivoting support foot.
   *
   * The thigh, shank and foot are contact capsules on the shown leg
   * ({@link StrikingWeapon}); first contact stops the knee for its dwell, then
   * it gives way before the met body ({@link StrikingRide}) and retraces its
   * approach.
   *
   * Timing (kickboxing research): the knee rises through the round kick's
   * chamber only, so it lands at the chamber key (preparation 0.074 s plus 14 %
   * of the 1.02 s execution) and recoils over the kick's 0.65 s; skill scales
   * them like the kick's. With a person target, the hands reach either side of
   * the other's nape for the clinch; GLORY allows one knee per clinch, which
   * the kickboxing rules check.
   */
  export import knee = kneeLaw;

  /**
   * The close strikes (`IAutoMovieMotionHumanCloseStrike`): an elbow, a
   * spinning elbow or backfist, or a headbutt, out to the target on the punch's
   * measured delivery and back to the guard over its hand recovery.
   *
   * The lower body turns the pelvis and trunk to bring the striking shoulder
   * forward, or spins the stance a whole turn on the lead ball, and shifts the
   * pelvis along the line by what the landing needs (`CloseStrikeLegs`,
   * `CloseStrikeReach`). The striking arm's goal is the landing's: for an
   * elbow, the fist placed so the forearm folds behind the elbow and the
   * elbow's bend hint the elbow joint itself; it arrives along the technique's
   * travel from a short approach behind the landing. A spin keeps the arm at
   * the guard while the stance turns and extends it in the last third. A
   * headbutt leans the trunk onto the target; with a person target both hands
   * take either side of the partner's neck before the impact and hold it to the
   * end, as a clinch holds.
   */
  export import closeStrike = closeStrikeLaw;

  /**
   * The foot strikes (`IAutoMovieMotionHumanFootStrike`): the kicking ankle
   * from its plant through a chamber to the contact and back, the support leg
   * planted on its ball, the pelvis turned, spun or lifted as the technique and
   * its modifiers ask.
   *
   * The ankle's goal is the contact point's: the foot turned to the technique's
   * attitude (`StrikingBody.foot`) and the ankle placed so the heel or sole
   * lands on the target. A leg asked higher than the hip's range reaches tilts
   * the body away through the support hip (`FootStrikeTilt`). A contact beyond
   * the leg's reach is moved along the hip's line to the leg's full reach,
   * where it lands short, as a capoeira kick passes the partner across the
   * roda; a sweep that cannot reach the partner's ankle is refused with the
   * distance. The chamber folds the knee in front of the hip (above it for an
   * axe kick, on the far side of the travel for a hook or a crescent), and the
   * extension aims through the target so it meets it at 0.82 of its unit, after
   * its peak speed. The knee bends toward the line between the hip and the
   * ankle's goal, raised.
   */
  export import footStrike = footStrikeLaw;

  /**
   * Fighting-stance footwork: steps that keep the stance, the foot on the side
   * of travel moving first and the other following to restore the stance
   * without crossing (IBA coaching manual pp. 36 to 39: forward, the lead foot
   * then the rear; back, the rear then the lead; sideways, the near foot then
   * the far).
   *
   * Each step moves the whole stance by its length along the direction in the
   * body's line frame: the first foot swings in the first half of the step, the
   * second follows in the second, each on a minimum-jerk path lifted clear of
   * the floor, while the root carries the body on its own minimum-jerk profile
   * and the guard rides on the trunk. The step length defaults to half a stance
   * length (the kickboxing research's step share) and the step period scales
   * with the leg by dynamic similarity (`PERIOD`, Alexander 1984): 0.35 s on a
   * 0.93 m hip, about three steps a second, inside the 2 to 3.5 steps a second
   * of the ring-movement reading (provisional).
   *
   * An interrupted step hands its bearing foot and airborne placements to the
   * next one. The inherited swing lands before the bearing foot lifts, using
   * the next step's own clock.
   */
  export import step = stepLaw;

  /**
   * Martial-art forms other than kickboxing: the karate horse stance
   * (kiba-dachi), alternating straight punches from it (choku-zuki) and the tai
   * chi push in a bow stance.
   *
   * - Horse stance: the left foot steps out until the feet stand two shoulder
   *   widths apart (provisional) and the hips sink a fifth of the thigh
   *   (provisional), held, and the foot steps back.
   * - Choku-zuki: each fist leaves a waist-high chamber outside the live shoulder
   *   and passes around the flank before reaching the midline at chest height.
   *   The other fist returns to its chamber (hikite). Upper-arm and forearm
   *   radii provide provisional clearance for the tucked elbow as it turns.
   *   Each punch extends in 0.2 s and stays 0.2 s, inside the 400 ms a
   *   choku-zuki takes (VencesBrito et al. 2011); the hands alternate.
   * - Tai chi push: the lead foot steps ahead 0.35 statures (provisional) over 3
   *   s as the hips come half the step forward and sink until both legs reach
   *   their feet; over 3 s more the weight shifts to six tenths of the step as
   *   the palms push from before the chest to an arm's reach ahead, then shifts
   *   back over 3 s, and the foot returns over 3 s: the slow, continuous form
   *   of tai chi (Wu and Hitt 2005).
   *
   * The karate and tai chi stance phrases link their own support transfers and
   * arm carriage on a single clock. The taekwondo and Muay Thai solo resets
   * share that support and recovery clock under their styles' low and high
   * guards. Their distinct pelvis paths and guard sites are authored blocking
   * for screen animation.
   */
  export import martialArt = martialArtLaw;

  /**
   * How a strike follows its target: the goal planned at the launch from where
   * the target is predicted to be at contact, and then online corrections, each
   * a minimum-jerk unit superposed on the strike's goal, as the target is seen
   * to move.
   *
   * A performer observes the target every film frame from the launch. Each
   * observation predicts the target's point at contact by extrapolating its
   * current velocity (a first-order prediction, the simplest model of
   * interception of moving targets; Brenner and Smeets 1996), and the change of
   * that prediction since the previous observation is added to the goal by a
   * new minimum-jerk unit that starts one visuomotor correction latency after
   * the observation and ends at the contact (Flash and Henis 1991: a second
   * unit superposed on the first, not an aborted and re-planned movement;
   * latency 0.11 s, Prablanc and Martin 1992). Observations stop once a
   * correction could no longer run for its shortest duration before contact, so
   * a target that starts moving later than that is not followed: the strike
   * lands on the line it committed to, which is how a well-timed slip makes a
   * punch miss, and why a kick that commits at its chamber key (about one
   * latency before impact) sweeps through where the target was.
   *
   * A stationary target gives zero corrections and the planned goal unchanged;
   * a target moving at constant velocity is met exactly, because each
   * prediction is then exact.
   */
  export import StrikingAim = StrikingAimSource;

  /**
   * The body facts striking laws read: where a posture puts the shoulders, hips
   * and head before any limb is solved, where a weapon socket sits relative to
   * its wrist or ankle under a hand or foot rotation, the closed fist's finger
   * angles, and another body's limbs as capsules for the contact sweep.
   *
   * Bone-local socket and region frames are read as the engine resolves them on
   * the canonical rig, whose rest rotations are the identity (the VRM
   * normalized T-pose), so a hand or foot posed by a world rotation `G` from
   * its rest carries a socket point `p` to `wrist + G p` (the convention
   * `HumanFoot` uses for the sole).
   */
  export import StrikingBody = StrikingBodySource;

  /**
   * When and where a moving weapon first touches a surface of another body.
   *
   * The weapon is a point on its striking surface (the fist's knuckles, the
   * shin's front, the knee, the sole) moving along the strike's path; the other
   * body is its own collision shapes (the shapes of its physical profile, posed
   * with its bones), so a strike meets whatever the other body has on its line
   * at that instant: the region it aimed at, a blocking forearm, a covering
   * glove, a checking shin, or an arm crossing the line in a simultaneous
   * exchange. Contact is the first instant the weapon point's distance to any
   * shape falls to zero, the continuous-collision test of a moving point
   * against moving convex shapes (Ericson, Real-Time Collision Detection, 2005,
   * ch. 5); it is found by scanning a fixed time step and bisecting the first
   * crossing a fixed number of times, so the result is deterministic and
   * resolved to the step over 2^24.
   *
   * The striking laws' own weapons are now limb capsules resolved jointly by
   * the performance against `HumanColliders`; these point queries and the scan
   * serve a stroke that scans for itself, the floor rest's shape list and the
   * capture verdicts.
   */
  export import StrikingContact = StrikingContactSource;

  /**
   * Where a strike lands relative to its aim: the author's declared accuracy
   * plus the performer's seeded endpoint scatter.
   *
   * - `hit`: on the aim point; the weapon stops on the first surface it meets.
   * - `graze`: one weapon width beside it; the weapon glances and follows
   *   through.
   * - `miss`: clear of it by two weapon widths and 5 cm; the weapon follows
   *   through.
   * - A vector: that world offset, stopping on whatever it meets.
   *
   * The scatter is impulse variability, a normal draw with the standard
   * deviation `k D / T` of `HumanSkill.scatter` (Schmidt et al. 1979), shaped
   * by skill: a novice scatters isotropically, an expert keeps the error out of
   * the directions that decide the hit, the lateral share falling to 0.3 of the
   * along-line share on the `path` axis (minimal intervention, Todorov and
   * Jordan 2002; provisional share).
   */
  export import StrikingQuality = StrikingQualitySource;

  /**
   * The goal maths of bringing a weapon surface onto a target point: where a
   * two-segment limb's middle joint (elbow or knee) and end joint (wrist or
   * ankle) must be for a point on its distal segment to sit on the target, the
   * flexion that takes, and the declared rule when the target is out of reach.
   *
   * Only goals are computed here: the end joint's point and the middle joint's
   * position become an `HumanPosture` limb goal (`point` and a `bend` hint
   * beside the middle joint), and the engine's `fitChainToTarget` solves the
   * joint angles within the range of motion, an effector goal and a bend goal
   * as in two-bone inverse kinematics with a swivel (Tolani, Goswami and Badler
   * 2000, Graphical Models 62(5):353). The placement is the triangle of the two
   * segment lengths and the root-to-point distance (law of cosines), in the
   * plane through the root and the point that contains the preferred bend
   * direction.
   *
   * Reachability is decided against a flexion band at contact (a straight punch
   * lands nearly extended, a hook near a right angle, a kick's knee not
   * locked): within the band the point is met exactly; beyond the band's
   * longest reach the limb extends along the line toward the target at that
   * reach and stops short, the declared miss-at-maximum-reach rule, and the
   * shortfall is reported; inside the shortest reach either the contact slides
   * along the distal segment toward the middle joint (a jammed kick lands with
   * the upper shin or the knee) or, where the surface is rigid with the end
   * joint (a fist), the middle joint flexes past the band up to
   * {@link JAM_FLEXION}.
   */
  export import StrikingReach = StrikingReachSource;

  /**
   * The striking family's measured timing, speed, reaction and guard numbers,
   * from novice to elite, as `HumanSkill.quantity` reads them. They belong to
   * striking alone: no other action family reads them, and striking reads no
   * other family's numbers (only the cross-task variability laws of
   * `HumanSkill`).
   *
   * Elite phase durations are the measured means of trained populations; the
   * novice end scales them by the ratios of Vagner et al. 2023 (a systematic
   * review of the roundhouse kick, PMC10459763): the time from launch to target
   * is about equal across levels (280 to 300 ms, so the strike phase scales
   * x1.06 to x1.0), while the whole kick takes 1.06 s for novices against 0.84
   * s for elites, which the chamber and the recovery absorb (x1.4 to x1.0).
   * Peak distal speed differs far more (6.5, 11.4 and 14.3 m/s for novice,
   * sub-elite and elite foot speed), so with near-equal time the novice covers
   * a shorter path: proficiency scales the share of the available range a
   * strike uses (its chamber and its trunk turn), never the range itself.
   *
   * Constants with no located study are marked provisional, with the
   * measurement that would settle them.
   */
  export import StrikingSkill = StrikingSkillSource;

  /**
   * How far a guard facing a person steps back so that the two fighters'
   * guards, both held, stand clear of each other: no joint of either body
   * inside the other's colliders (the partner verdict's reading,
   * `HumanColliders.distance`), whatever the two bodies' sizes.
   *
   * Each fighter reads the other as it perceived them when its guard began,
   * where the guard's line reads them (`StrikingTarget.LOOK` and a reaction
   * time, `HumanPerception.REACTION`), so two guards reading each other never
   * read each other's guard while it is planned. From that reading it
   * anticipates the other's guard held at `set`: the stance the guard law lays
   * for that body about its feet, its lead the foot ahead, facing this fighter
   * (`held`). The two guards held where they stand would pass into each other
   * by some step along the floor's line between them; each fighter takes half
   * of it, the reciprocal share of optimal reciprocal collision avoidance (van
   * den Berg, Guy, Lin and Manocha 2011), so the two halves clear them
   * together. The step is the least at which they clear, bisected
   * (`bracketedBisection`) from a bracket doubled until it clears.
   */
  export import StrikingGuardYield = StrikingGuardYieldSource;

  /**
   * The fighting stance uses separate tracks, soft knees, a leading shoulder
   * and glove goals measured from the performer's own head.
   *
   * IBA coaching manual pp. 34 to 39 and the kickboxing/Muay Thai guides in the
   * kickboxing research give these relations; the numbers are named readings:
   *
   * - Stance length along the line 1.2 shoulder widths (guides: 1.0 to 1.3);
   * - Feet on their own hip tracks, spaced by the hip joints;
   * - 30 degree body turn with lead shoulder forward, lead toe 15 degrees toward
   *   that heading and rear toe 45 degrees out (IBA p.34 readings);
   * - A sunk root flexes both knees 32 degrees, within the 25 to 45 degree band;
   * - Both gloves at ear height the same short distance ahead of their jaw, the
   *   rear one outside its ear and the lead one before its own shoulder, chin
   *   tucked and eyes on the opponent (IABA, A Beginner's Guide: "tuck your
   *   chin down and look forward"; the boxing and MMA guard as coached: the
   *   rear hand "as if holding a phone to your ear and then pushed forward just
   *   in front of your face", the front hand "at the same height"; the Muay
   *   Thai guard: "arms projected out further", "nearly vertical forearms").
   *   The resting arms leave the ribs to be defended by an action: a body kick
   *   is checked with the raised shin and the elbow brought down to the knee.
   *
   * Orthodox leads left and southpaw right; distances read the body's measure.
   */
  export import StrikingStance = StrikingStanceSource;

  /**
   * One strike's end-joint path (the wrist or the ankle), from its launch
   * through an optional via point (a kick's chamber) to its contact and back,
   * as superposed minimum-jerk units, with the target's online corrections and
   * the stop at the first surface the weapon meets.
   *
   * A strike aims through its target: its delivery unit would end beyond the
   * contact point, at the share where its speed has fallen to the measured
   * share of its peak at impact ({@link impactShare}), so it lands moving fast
   * instead of arriving at rest. The unit's end is placed along the strike's
   * declared impact direction (straight on, across for a hook or a round kick,
   * up for an uppercut), and a correcting unit over the same span puts the
   * joint exactly on the contact point at the contact second. Units start with
   * zero velocity and acceleration, so the path is continuous in position,
   * velocity and acceleration everywhere except at a contact, where the weapon
   * stops on the surface it met (an impact) and recoils from there on a
   * minimum-jerk unit to its return point.
   */
  export import StrikingStroke = StrikingStrokeSource;

  /**
   * The relations every striking law reads from its entry state and its target:
   * which side leads, the line to the target, the feet as placed, and how a
   * foot steps along the line or pivots on its ball.
   */
  export import StrikingTarget = StrikingTargetSource;

  /**
   * A strike's trunk turn laid on the trunk it enters with: the spine and the
   * chest each twisted by the given share, their flexion and side bend kept.
   *
   * A guard holds the trunk flexed forward (4 degrees at each of the spine and
   * the chest); a punch that wrote its twist over a bare trunk dropped that
   * flexion, and every punch straightened the trunk 8 degrees as it landed,
   * reading 4 to 5 degrees back from the hips at impact.
   */
  export import StrikingTwist = StrikingTwistSource;

  /**
   * What a planned strike decided, for audits and captures: the landing offset
   * it intended (declared accuracy plus seeded scatter), the goal it planned at
   * its launch, how its reach solve came out, and the second its weapon met a
   * surface. Audits compare a strike against this plan, so a clumsy strike
   * still passes when it lands where it meant to.
   *
   * Each strike's plan carries its record as a member (`IPlan.record`), built
   * on demand from the plan's geometry, so reading one evaluates the strike's
   * postures, and a plan copied or wrapped by a spread keeps it.
   */
  export import StrikingRecord = StrikingRecordSource;

  /**
   * A thing held in the hand as the effector of an action: a blade whose point
   * and edge are aimed, a firearm whose muzzle is aimed.
   *
   * A held prop is rigid in the hand from the instant the grip closed, so its
   * working point (a sword's point, a muzzle), its axis (the way the blade or
   * the barrel runs) and its edge (the way a blade cuts, a barrel's top) are
   * constants of the hand's frame for as long as it is held. This reads them
   * once at the action's entry, from where the prop is displayed and where the
   * hand is displayed, so the law aims the same thing the performance shows
   * whichever way the hand took the prop. With no prop named the hand itself is
   * the effector: the grip's centre, its line the hand's own from the wrist to
   * the knuckles, its edge the little finger's side, as a knife-hand cuts.
   *
   * The frame is the performance's own grip frame: the grip socket's point with
   * the hand bone's rotation. A goal built here puts the working point, not the
   * wrist, on its place: the goal's contact is the working point, so where the
   * wrist cannot turn the hand as asked the point stays and the turn gives
   * way.
   */
  export import StrikingHeld = StrikingHeldSource;

  /**
   * The stroke of a held tool, shared by every blade and firearm action: the
   * tool is taken from where the hand holds it to a ready pose, carried along a
   * path to its decisive pose, kept there and returned, while the feet stay or
   * the leading foot steps or lunges under it.
   *
   * The action states only tool poses (hand frames built by
   * {@link StrikingHeld.hand}); this owns the time course and the body. The
   * clock is a phrase with the standard instants: the tool leaves the entry
   * hold for the ready pose by `ready`, runs its path from `strokeStart`, is at
   * its decisive pose at `stroke`, follows through to `strokeEnd`, stays until
   * `relax` and is back in the entry hold at `end`, or, recovered to its guard
   * (`coursed`), back at the path's start along the path it came, or stays
   * where the stroke left it for an action that ends in its pose (a guard, a
   * levelled aim).
   *
   * An advance carries the body with the stroke: the leading foot leaves the
   * floor at `strokeStart` and lands at `stroke`, the pelvis travels a share of
   * the foot's travel and sinks until both legs reach their feet, and the foot
   * and the pelvis come back from `relax` to `end` (`StrikingAdvance`).
   */
  export import StrikingBlade = StrikingBladeSource;

  /**
   * Whether the arm can hold a held tool in a pose, and the turn of the tool
   * about its own line where the action leaves it free.
   *
   * The hand holds the tool as it took it, so a pose of the tool asks the hand
   * for one rotation, and the arm gives it only inside the ranges of the
   * shoulder, the forearm's twist and the wrist. What the arm gives is found
   * the only way that counts the ranges: the arm is fitted to the pose on the
   * body as it stands at the decisive instant, and the tool is read back from
   * the fitted hand. A pose the fitted hand misses is never played: it is
   * refused when the plan is built.
   *
   * A thrust states where the point goes and about which way the blade runs, a
   * levelled muzzle where the bore points, and neither states which way the
   * edge or the sights face; `hand` chooses that turn, and a lean of the line
   * inside a cone, by the same fit.
   */
  export import StrikingRoll = StrikingRollSource;

  /**
   * The advance of a stroke: how the body goes with a held tool's cut, thrust
   * or presentation. The leading foot, the one on the tool's side, leaves the
   * floor, lands its travel ahead along a line and comes back; the pelvis is
   * carried a share of that travel and lowered until both legs reach their
   * feet. A lunge's full travel is `LUNGE` of the stature and a step's `STEP`
   * (both provisional: fencing studies report lunge lengths, and none was read
   * for this pass); a stroke takes less when its target needs less, as fencing
   * measure works (`HumanSword.aim`).
   */
  export import StrikingAdvance = StrikingAdvanceSource;

  /**
   * The strikes as rows on the grammar: each named technique is a row of the
   * shipped law that owns its geometry and its outcome, the effector and the
   * side fixed, the target and the accuracy the composition's.
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
  export import HumanStrike = HumanStrikeSource;

  /**
   * The armada preset: capoeira's armada, a whole turn and then the rear leg's
   * straight sweep outward. Spread into `footStrike`'s parameters beside the
   * rest that the composition gives; each value means what the law's member of
   * the same name does. The `armada` row of `HumanStrike` fixes these values.
   */
  export const ARMADA: typeof HUMAN_STRIKE_ARMADA = HUMAN_STRIKE_ARMADA;

  /**
   * The axeKick preset: an axe kick with the rear leg. Spread into
   * `footStrike`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `axeKick` row
   * of `HumanStrike` fixes these values.
   */
  export const AXE_KICK: typeof HUMAN_STRIKE_AXE_KICK = HUMAN_STRIKE_AXE_KICK;

  /**
   * The backKick preset: a back kick with the rear leg. Spread into
   * `footStrike`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `backKick` row
   * of `HumanStrike` fixes these values.
   */
  export const BACK_KICK: typeof HUMAN_STRIKE_BACK_KICK =
    HUMAN_STRIKE_BACK_KICK;

  /**
   * The backfist preset: a backfist with the lead hand. Spread into `punch`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `backfist` row of
   * `HumanStrike` fixes these values.
   */
  export const BACKFIST: typeof HUMAN_STRIKE_BACKFIST = HUMAN_STRIKE_BACKFIST;

  /**
   * The chainPunch preset: a wing chun chain punch with the lead hand, a
   * vertical fist along the centreline. Spread into `punch`'s parameters beside
   * the rest that the composition gives; each value means what the law's member
   * of the same name does. The `chainPunch` row of `HumanStrike` fixes these
   * values.
   */
  export const CHAIN_PUNCH: typeof HUMAN_STRIKE_CHAIN_PUNCH =
    HUMAN_STRIKE_CHAIN_PUNCH;

  /**
   * The crescentKick preset: a crescent kick with the rear leg. Spread into
   * `footStrike`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `crescentKick`
   * row of `HumanStrike` fixes these values.
   */
  export const CRESCENT_KICK: typeof HUMAN_STRIKE_CRESCENT_KICK =
    HUMAN_STRIKE_CRESCENT_KICK;

  /**
   * The cross preset: a straight punch with the rear hand. Spread into
   * `punch`'s parameters beside the rest that the composition gives; each value
   * means what the law's member of the same name does. The `cross` row of
   * `HumanStrike` fixes these values.
   */
  export const CROSS: typeof HUMAN_STRIKE_CROSS = HUMAN_STRIKE_CROSS;

  /**
   * The descendingElbow preset: a descending elbow with the rear arm. Spread
   * into `closeStrike`'s parameters beside the rest that the composition gives;
   * each value means what the law's member of the same name does. The
   * `descendingElbow` row of `HumanStrike` fixes these values.
   */
  export const DESCENDING_ELBOW: typeof HUMAN_STRIKE_DESCENDING_ELBOW =
    HUMAN_STRIKE_DESCENDING_ELBOW;

  /**
   * The hammerfist preset: a hammerfist with the rear hand. Spread into
   * `punch`'s parameters beside the rest that the composition gives; each value
   * means what the law's member of the same name does. The `hammerfist` row of
   * `HumanStrike` fixes these values.
   */
  export const HAMMERFIST: typeof HUMAN_STRIKE_HAMMERFIST =
    HUMAN_STRIKE_HAMMERFIST;

  /**
   * The headbutt preset: a headbutt, the forehead driven onto the target.
   * Spread into `closeStrike`'s parameters beside the rest that the composition
   * gives; each value means what the law's member of the same name does. The
   * `headbutt` row of `HumanStrike` fixes these values.
   */
  export const HEADBUTT: typeof HUMAN_STRIKE_HEADBUTT = HUMAN_STRIKE_HEADBUTT;

  /**
   * The hookKick preset: a hook kick with the lead leg. Spread into
   * `footStrike`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `hookKick` row
   * of `HumanStrike` fixes these values.
   */
  export const HOOK_KICK: typeof HUMAN_STRIKE_HOOK_KICK =
    HUMAN_STRIKE_HOOK_KICK;

  /**
   * The horizontalElbow preset: a horizontal elbow with the rear arm. Spread
   * into `closeStrike`'s parameters beside the rest that the composition gives;
   * each value means what the law's member of the same name does. The
   * `horizontalElbow` row of `HumanStrike` fixes these values.
   */
  export const HORIZONTAL_ELBOW: typeof HUMAN_STRIKE_HORIZONTAL_ELBOW =
    HUMAN_STRIKE_HORIZONTAL_ELBOW;

  /**
   * The jab preset: a straight punch with the lead hand. Spread into `punch`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `jab` row of `HumanStrike`
   * fixes these values.
   */
  export const JAB: typeof HUMAN_STRIKE_JAB = HUMAN_STRIKE_JAB;

  /**
   * The jumpingSideKick preset: a jumping side kick with the lead leg. Spread
   * into `footStrike`'s parameters beside the rest that the composition gives;
   * each value means what the law's member of the same name does. The
   * `jumpingSideKick` row of `HumanStrike` fixes these values.
   */
  export const JUMPING_SIDE_KICK: typeof HUMAN_STRIKE_JUMPING_SIDE_KICK =
    HUMAN_STRIKE_JUMPING_SIDE_KICK;

  /**
   * The leadHook preset: a hook with the lead hand. Spread into `punch`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `leadHook` row of
   * `HumanStrike` fixes these values.
   */
  export const LEAD_HOOK: typeof HUMAN_STRIKE_LEAD_HOOK =
    HUMAN_STRIKE_LEAD_HOOK;

  /**
   * The leadKnee preset: a knee strike with the lead leg. Spread into `knee`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `leadKnee` row of
   * `HumanStrike` fixes these values.
   */
  export const LEAD_KNEE: typeof HUMAN_STRIKE_LEAD_KNEE =
    HUMAN_STRIKE_LEAD_KNEE;

  /**
   * The leadUppercut preset: an uppercut with the lead hand. Spread into
   * `punch`'s parameters beside the rest that the composition gives; each value
   * means what the law's member of the same name does. The `leadUppercut` row
   * of `HumanStrike` fixes these values.
   */
  export const LEAD_UPPERCUT: typeof HUMAN_STRIKE_LEAD_UPPERCUT =
    HUMAN_STRIKE_LEAD_UPPERCUT;

  /**
   * The legSweep preset: a leg sweep with the lead leg. Spread into
   * `footStrike`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `legSweep` row
   * of `HumanStrike` fixes these values.
   */
  export const LEG_SWEEP: typeof HUMAN_STRIKE_LEG_SWEEP =
    HUMAN_STRIKE_LEG_SWEEP;

  /**
   * The meiaLuaDeFrente preset: capoeira's meia-lua de frente, the rear leg's
   * straight sweep inward across the front. Spread into `footStrike`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `meiaLuaDeFrente` row of
   * `HumanStrike` fixes these values.
   */
  export const MEIA_LUA_DE_FRENTE: typeof HUMAN_STRIKE_MEIA_LUA_DE_FRENTE =
    HUMAN_STRIKE_MEIA_LUA_DE_FRENTE;

  /**
   * The palmHeel preset: a palm-heel strike with the rear hand. Spread into
   * `punch`'s parameters beside the rest that the composition gives; each value
   * means what the law's member of the same name does. The `palmHeel` row of
   * `HumanStrike` fixes these values.
   */
  export const PALM_HEEL: typeof HUMAN_STRIKE_PALM_HEEL =
    HUMAN_STRIKE_PALM_HEEL;

  /**
   * The pushKick preset: a push kick with the lead foot. Spread into `kick`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `pushKick` row of
   * `HumanStrike` fixes these values.
   */
  export const PUSH_KICK: typeof HUMAN_STRIKE_PUSH_KICK =
    HUMAN_STRIKE_PUSH_KICK;

  /**
   * The rearChainPunch preset: a wing chun chain punch with the rear hand.
   * Spread into `punch`'s parameters beside the rest that the composition
   * gives; each value means what the law's member of the same name does. The
   * `rearChainPunch` row of `HumanStrike` fixes these values.
   */
  export const REAR_CHAIN_PUNCH: typeof HUMAN_STRIKE_REAR_CHAIN_PUNCH =
    HUMAN_STRIKE_REAR_CHAIN_PUNCH;

  /**
   * The rearHook preset: a hook with the rear hand. Spread into `punch`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `rearHook` row of
   * `HumanStrike` fixes these values.
   */
  export const REAR_HOOK: typeof HUMAN_STRIKE_REAR_HOOK =
    HUMAN_STRIKE_REAR_HOOK;

  /**
   * The rearKnee preset: a knee strike with the rear leg. Spread into `knee`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `rearKnee` row of
   * `HumanStrike` fixes these values.
   */
  export const REAR_KNEE: typeof HUMAN_STRIKE_REAR_KNEE =
    HUMAN_STRIKE_REAR_KNEE;

  /**
   * The rearUppercut preset: an uppercut with the rear hand. Spread into
   * `punch`'s parameters beside the rest that the composition gives; each value
   * means what the law's member of the same name does. The `rearUppercut` row
   * of `HumanStrike` fixes these values.
   */
  export const REAR_UPPERCUT: typeof HUMAN_STRIKE_REAR_UPPERCUT =
    HUMAN_STRIKE_REAR_UPPERCUT;

  /**
   * The risingElbow preset: a rising elbow with the rear arm. Spread into
   * `closeStrike`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `risingElbow`
   * row of `HumanStrike` fixes these values.
   */
  export const RISING_ELBOW: typeof HUMAN_STRIKE_RISING_ELBOW =
    HUMAN_STRIKE_RISING_ELBOW;

  /**
   * The roundKick preset: a round kick with the rear leg. Spread into `kick`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `roundKick` row of
   * `HumanStrike` fixes these values.
   */
  export const ROUND_KICK: typeof HUMAN_STRIKE_ROUND_KICK =
    HUMAN_STRIKE_ROUND_KICK;

  /**
   * The sideKick preset: a side kick with the lead leg. Spread into
   * `footStrike`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The `sideKick` row
   * of `HumanStrike` fixes these values.
   */
  export const SIDE_KICK: typeof HUMAN_STRIKE_SIDE_KICK =
    HUMAN_STRIKE_SIDE_KICK;

  /**
   * The spinningBackfist preset: a spinning backfist with the rear arm. Spread
   * into `closeStrike`'s parameters beside the rest that the composition gives;
   * each value means what the law's member of the same name does. The
   * `spinningBackfist` row of `HumanStrike` fixes these values.
   */
  export const SPINNING_BACKFIST: typeof HUMAN_STRIKE_SPINNING_BACKFIST =
    HUMAN_STRIKE_SPINNING_BACKFIST;

  /**
   * The spinningElbow preset: a spinning elbow with the rear arm. Spread into
   * `closeStrike`'s parameters beside the rest that the composition gives; each
   * value means what the law's member of the same name does. The
   * `spinningElbow` row of `HumanStrike` fixes these values.
   */
  export const SPINNING_ELBOW: typeof HUMAN_STRIKE_SPINNING_ELBOW =
    HUMAN_STRIKE_SPINNING_ELBOW;

  /**
   * The spinningHookKick preset: a spinning hook kick with the rear leg. Spread
   * into `footStrike`'s parameters beside the rest that the composition gives;
   * each value means what the law's member of the same name does. The
   * `spinningHookKick` row of `HumanStrike` fixes these values.
   */
  export const SPINNING_HOOK_KICK: typeof HUMAN_STRIKE_SPINNING_HOOK_KICK =
    HUMAN_STRIKE_SPINNING_HOOK_KICK;

  /**
   * The stomp preset: a stomp with the rear leg onto a floor-level target.
   * Spread into `footStrike`'s parameters beside the rest that the composition
   * gives; each value means what the law's member of the same name does. The
   * `stomp` row of `HumanStrike` fixes these values.
   */
  export const STOMP: typeof HUMAN_STRIKE_STOMP = HUMAN_STRIKE_STOMP;

  /**
   * The switchKick preset: a round kick with the lead leg. Spread into `kick`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `switchKick` row of
   * `HumanStrike` fixes these values.
   */
  export const SWITCH_KICK: typeof HUMAN_STRIKE_SWITCH_KICK =
    HUMAN_STRIKE_SWITCH_KICK;

  /**
   * The teep preset: a push kick with the rear foot. Spread into `kick`'s
   * parameters beside the rest that the composition gives; each value means
   * what the law's member of the same name does. The `teep` row of
   * `HumanStrike` fixes these values.
   */
  export const TEEP: typeof HUMAN_STRIKE_TEEP = HUMAN_STRIKE_TEEP;
}
