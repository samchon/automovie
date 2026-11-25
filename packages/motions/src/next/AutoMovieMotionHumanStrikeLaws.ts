import { martialArt as martialArtLaw } from "../sport/martialArt";
import { closeStrike as closeStrikeLaw } from "../striking/closeStrike";
import { footStrike as footStrikeLaw } from "../striking/footStrike";
import { kick as kickLaw } from "../striking/kick";
import { knee as kneeLaw } from "../striking/knee";
import { punch as punchLaw } from "../striking/punch";
import { step as stepLaw } from "../striking/step";

/**
 * The strike family's laws, each the shipped function under its family name
 * (`AutoMovieMotionHumanStrike`), with its own comment.
 */
export namespace AutoMovieMotionHumanStrikeLaws {
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
}
