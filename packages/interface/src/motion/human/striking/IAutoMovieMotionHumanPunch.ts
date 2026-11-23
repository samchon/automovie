import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanStrikingQuality } from "./IAutoMovieMotionHumanStrikingQuality";

/**
 * A punch: the fist's knuckles brought onto the target along a measured path
 * and returned to the guard, with the trunk turning and the feet stepping or
 * pivoting to carry the shoulder.
 *
 * The law writes effector goals, not joint angles. The fist socket is brought
 * from where it is at the launch onto the target region's point (another
 * person's actual region, a prop point, a free point, or a virtual opponent at
 * range) on a minimum-jerk delivery that aims through the target so the fist
 * lands at 0.78 of its peak speed (Liu et al. 2022); the wrist goal is the fist
 * point less the hand-rotated socket offset, the elbow bend hint and the
 * shoulder carried by the trunk turn shape the arm, and the engine's limb fit
 * solves the joints. The target is tracked online with the visuomotor latency
 * (`StrikingAim`); the fist stops on the first surface of the struck body it
 * meets (`StrikingStroke`), so a guard on the line is struck instead of the
 * face it covers, and two punches thrown at once meet whichever arm or head is
 * in the way.
 *
 * Techniques (IBA coaching manual pp. 42 to 45 and the kickboxing research of
 * the research): `straight` lands nearly extended (elbow 5 to 25 degrees) along
 * the line, palm down; `hook` lands with the elbow near a right angle (70 to
 * 100 degrees), arriving across the line, palm down; `uppercut` rises from
 * below with the elbow at 60 to 100 degrees, palm toward the puncher. The close
 * hand strikes land other surfaces of the hand: `palmHeel` drives the heel of
 * the open palm along the line with the wrist extended and the fingers up, the
 * arm nearly extended like the straight; `backfist` swings the back of the fist
 * out across the line onto the target with the arm nearly extended;
 * `hammerfist` brings the fist's little-finger edge down onto the target with
 * the elbow bent 30 to 90 degrees; `verticalFist` drives the knuckles along the
 * centreline with the fist upright, the palm in, as wing chun's chain punches
 * do, the arm nearly extended. No located study gives their delivery times, so
 * they keep the punch's measured timing. A rear-hand punch turns the trunk
 * through to bring the rear shoulder forward and pivots the rear foot on its
 * ball; a lead hook turns the other way. A body punch lowers the root through
 * the knees. When the arm's band falls short, the lead foot steps in by up to
 * one stance length, never past the room in front of the arms (`StrikingRoom`)
 * and never toward a target that no place on the line brings within the band,
 * and the rear foot drags from mid-delivery to mid-return (the IBA stepping
 * jab), so no planted foot is left behind a travelling hip; the trunk's turn is
 * shared by the pelvis and the lumbar and thoracic spine. Beyond that the fist
 * extends along the line at the band's reach and falls short, the declared
 * miss-at-maximum-reach rule.
 *
 * Timing, from launch to contact (`StrikingSkill.lone`): a lone rear straight
 * takes 0.310 s at elite skill (Cheraghi et al. 2014), and another lone punch
 * that time scaled by its own path to the target over the rear hand's, so a jab
 * is faster (derived, provisional); a punch that follows another punch's
 * contact reaches its own contact 0.35 s after that contact when the hands
 * alternate and 0.45 s when it is the same hand at elite skill (Piorkowski et
 * al. 2011), less the time already passed since that contact when it launches,
 * never under 0.12 s. The return to the guard after contact takes 0.35 s at
 * elite skill. The performer's `speed` skill multiplies the lone delivery and
 * both intervals by 1.06 at novice, 1.04 at amateur, 1.02 at trained and 1.0 at
 * elite, so a lone rear straight takes 0.33, 0.32, 0.315 and 0.31 s and the
 * intervals are 0.37 and 0.48 s at novice (`StrikingSkill.strike`, the novice
 * ratio from Vagner et al. 2023, the levels between on a smoothstep,
 * `HumanSkill.LEVELS`; the intervals' scaling is derived and provisional, as
 * their study split no skill levels, `StrikingSkill.interval`), and its
 * `recovery` skill the return by 1.4, 1.3, 1.1 and 1.0
 * (`StrikingSkill.recovery`). A seeded timing variability, 7 % of the time and
 * 25 ms at novice to 2.5 % and 10 ms at elite, is added (`HumanSkill.jitter`),
 * and a seeded guard drop may hold the returning glove low before it reaches
 * the guard. A feint shows a share of the delivery without contact and returns
 * in the same time. The fist peaks at 3.2 m/s at novice to 7.16 m/s at elite
 * (Liu et al. 2022; the novice end provisional) and meets the target at 0.78 of
 * that (`StrikingSkill.PUNCH_PEAK_SPEED`). The performer's skill is its
 * `proficiency` ({@link IAutoMovieMotionHumanPerformer}); `manner` does not
 * change these times.
 */
export namespace IAutoMovieMotionHumanPunch {
  /** Parameters. */
  export interface IParams {
    /** The technique. */
    technique: IAutoMovieMotionHumanPunch.Technique;

    /**
     * Which hand: the stance's lead or rear; lead for a straight or a hook and
     * rear for an uppercut when absent.
     */
    hand?: IAutoMovieMotionHumanPunch.Hand;

    /** What it strikes. */
    at: IAutoMovieMotionTarget;

    /** Declared accuracy; `hit` when absent. */
    accuracy?: IAutoMovieMotionHumanStrikingQuality.Accuracy;

    /** A feint: the share of the delivery shown before returning, in (0, 1). */
    feint?: number;

    /**
     * How much repeats of the punch differ (`IManner`): `variation` scales the
     * spread of the point aimed at within a person's region, and `aimSkill`
     * replaces the performer's skill for that spread. Absent or 0, every repeat
     * is aimed at the region's own point. Neither member changes the times or
     * the fist's speed: these follow the performer's skill (see the
     * namespace).
     */
    manner?: IAutoMovieMotionHumanPunch.IManner;
  }

  /**
   * How much repeats of a punch differ in where they aim. It changes neither
   * the times nor the fist's speed, which follow the performer's skill.
   */
  export interface IManner {
    /**
     * How far repeats spread the point aimed at within a person's region, in
     * [0, 1]; 0 when absent: every repeat aims at the region's own point.
     */
    variation?: number;

    /**
     * A skill in [0, 1] that replaces the performer's skill for the aim spread
     * only; the performer's skill when absent.
     */
    aimSkill?: number;
  }

  /**
   * The technique: the punches by their path and the close hand strikes by the
   * surface of the hand they land.
   */
  export type Technique =
    | "straight"
    | "hook"
    | "uppercut"
    | "palmHeel"
    | "backfist"
    | "hammerfist"
    | "verticalFist";

  /** The hand that punches: the stance's lead hand or its rear hand. */
  export type Hand = "lead" | "rear";
}
