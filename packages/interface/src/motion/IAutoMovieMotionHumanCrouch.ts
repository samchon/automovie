import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanBalance } from "./IAutoMovieMotionHumanBalance";

/**
 * A crouch or a squat held in place: the hips sink over the planted feet to a
 * knee flexion the depth names, the trunk inclines until the centre of mass is
 * back over the feet, the hands come to rest on the thighs above the knees, the
 * body holds, then stands again.
 *
 * The depth is a knee flexion, not a height, so one depth fits every body:
 * `partial` is the parallel squat of about 100 degrees (Escamilla 2001, Med Sci
 * Sports Exerc 33:127) and `full` the deep squat at the knee's range end of 150
 * degrees, inside the 141.6 degrees measured in kneeling (Acker et al. 2011, J
 * Arthroplasty 26:319) and below the 157 +- 6 degrees of a heels-up squat
 * (Hemmerich et al. 2006, J Orthop Res 24:770), which the range table does not
 * reach. The shank tilts forward by the crouching ankle's dorsiflexion
 * (`ANKLE`, within the range table's), plus the heel lift when the heels are up
 * (the foot pivots about its toes' joint, which stays on the floor), and the
 * thigh takes the rest of the knee flexion, so the hip joint's place over the
 * ankle follows from the leg's two lengths. On the way down the shank and the
 * thigh tilt together, each by the descent's share of its own tilt, so the hips
 * follow the leg's arc and the ankle never passes its range: the heel stays
 * down until the ankle reaches the range and then rises by the rest, the
 * heel-off of a range-limited ankle. A depth whose thigh angle and the hip's
 * flexion range leave no room for the trunk is refused with the deepest knee
 * flexion the heels allow: a full squat with flat heels leaves the thigh past
 * the hip's range at the crouching ankle, so it asks for `heels: "up"`.
 *
 * The trunk inclines on the authored path from measured squat postures. An
 * optional balance correction rotates only the specified trunk subtree to the
 * nearest boundary of the actual supporting sole area. The inclination is
 * shared by the lumbopelvic rhythm: the pelvis tilts about the hips as far as
 * the folded thighs leave the hip room and the spine flexes for the rest, the
 * rounded back of a deep squat (`HumanTrunk.incline`); the hands rest on the
 * thighs just above the knees, as people support the trunk on the thighs
 * (Kingma, Faber and van Dieen 2016, J Biomech 49:881). The descent takes 1.0 s
 * for a partial and 1.3 s for a full squat at a 0.93 m hip height, scaled by
 * the square root of the hip height (dynamic similarity, Alexander 1984) and by
 * the manner's tempo (provisional), the hold `hold` seconds and the rise as
 * long as the descent. Events: `descend` at the start, `lowest`, `ascend`.
 */
export namespace IAutoMovieMotionHumanCrouch {
  /** Parameters. */
  export interface IParams {
    /**
     * A balancing shift (`IAutoMovieMotionHumanBalance`): one closed-form shift
     * of its part, scaled by its weight between its two event-named instants,
     * each field absent taking the law's recommendation. Absent, none: the
     * posture is the law's own kinematic one with no balance shift or
     * centre-of-mass reading.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /** How deep; `partial` when absent. */
    depth?: IAutoMovieMotionHumanCrouch.Depth;

    /** The heels; `flat` for a partial and `up` for a full squat when absent. */
    heels?: IAutoMovieMotionHumanCrouch.Heels;

    /** Seconds held at the lowest pose, at least 0; 1 when absent. */
    hold?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /** How deep: a parallel squat or a deep squat. */
  export type Depth = "partial" | "full";

  /** Whether the heels stay on the floor or rise about the toes' joints. */
  export type Heels = "flat" | "up";
}
