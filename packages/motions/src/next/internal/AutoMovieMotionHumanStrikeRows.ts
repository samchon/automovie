import { HumanStrike as HumanStrikeSource } from "../../lexicon/internal/HumanStrike";
import { StrikingAdvance as StrikingAdvanceSource } from "../../striking/internal/StrikingAdvance";
import { StrikingAim as StrikingAimSource } from "../../striking/internal/StrikingAim";
import { StrikingBlade as StrikingBladeSource } from "../../striking/internal/StrikingBlade";
import { StrikingBody as StrikingBodySource } from "../../striking/internal/StrikingBody";
import { StrikingContact as StrikingContactSource } from "../../striking/internal/StrikingContact";
import { StrikingGuardYield as StrikingGuardYieldSource } from "../../striking/internal/StrikingGuardYield";
import { StrikingHeld as StrikingHeldSource } from "../../striking/internal/StrikingHeld";
import { StrikingQuality as StrikingQualitySource } from "../../striking/internal/StrikingQuality";
import { StrikingReach as StrikingReachSource } from "../../striking/internal/StrikingReach";
import { StrikingRecord as StrikingRecordSource } from "../../striking/internal/StrikingRecord";
import { StrikingRoll as StrikingRollSource } from "../../striking/internal/StrikingRoll";
import { StrikingSkill as StrikingSkillSource } from "../../striking/internal/StrikingSkill";
import { StrikingStance as StrikingStanceSource } from "../../striking/internal/StrikingStance";
import { StrikingStroke as StrikingStrokeSource } from "../../striking/internal/StrikingStroke";
import { StrikingTarget as StrikingTargetSource } from "../../striking/internal/StrikingTarget";
import { StrikingTwist as StrikingTwistSource } from "../../striking/internal/StrikingTwist";

/**
 * The strike family's owners, rows and tables, each the shipped value under its
 * family name (`AutoMovieMotionHumanStrike`), with its own comment.
 */
export namespace AutoMovieMotionHumanStrikeRows {
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
}
