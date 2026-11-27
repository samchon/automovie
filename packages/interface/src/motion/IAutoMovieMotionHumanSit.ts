import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanBalance } from "./IAutoMovieMotionHumanBalance";
import type { IAutoMovieMotionHumanSeated } from "./IAutoMovieMotionHumanSeated";

/**
 * Sitting down on a chair, bench or stool from standing in front of it: the
 * body's seat socket is lowered onto the seat while the trunk leans forward and
 * the feet stay where they stand.
 *
 * Stand-to-sit is the rise reversed under eccentric control (Kralj, Jaeger and
 * Munih 1990, J Biomech 23:1123): the hips travel back and down, the trunk
 * flexes forward to keep the weight over the feet until the seat takes it, then
 * the trunk settles into the seated posture. The goal is the seat socket on its
 * point on the seat ({@link seated}); the root follows from that goal and the
 * trunk's pitch, the planted legs and the hands are solved by inverse
 * kinematics. The socket moves back over the first 70 % of the descent, no
 * further than keeps the centre of mass where it stands over the feet until a
 * pendulum's time constant before contact (Hof, Gazendam and Sinke 2005), over
 * which the body comes down onto the seat, and down from 10 % to its end, so it
 * reaches the seat from above; the trunk pitches forward to its peak by 45 % of
 * the descent and settles after contact; each hand is brought to its rest along
 * the arm trajectory planner's path, onto its armrest as the seat takes the
 * body, the two supports loaded together where the armrest lies nearest the
 * shoulder, or, with none, onto its thigh from contact to seated, once the
 * thighs no longer rise under it, the fingers straightening to lie flat.
 *
 * Peak trunk flexion `35 + 50 (1 - r)` degrees and descent time `2 (1 + 0.6 (1
 * - r))` seconds for a seat at `r` of the popliteal height (provisional
 * coefficients; a lower seat needs more trunk flexion and more time, Janssen,
 * Bussmann and Stam 2002, and sit-to-stand takes about 1.5 to 2.5 s in healthy
 * adults): 2 s for a seat at the popliteal height (`r` = 1), 2.5 s for a low
 * seat at 0.7 of it. Contact comes at 75 % of the descent. The seated back is
 * `upright` (pitch 0), `lean` (12 degrees back onto a backrest, which the seat
 * must have) or `slump` (pelvis 10 degrees back, chest 12 and spine 8 flexed),
 * all provisional.
 *
 * The performer must stand facing within 20 degrees of the seat's heading with
 * feet the legs can reach from the seat; otherwise the sit is refused with the
 * range of foot distances that work. Events `commit` (the last instant the
 * sitting can be abandoned for standing), `seatContact` and `seated`; the seat
 * window starts at contact.
 *
 * A seat above 1.2 of the popliteal height, or one sat astride, is got onto
 * instead ({@link HumanMountOn}): the feet leave the floor for the seat's rests
 * or hang, under the same parameters, events and cancel table.
 */
export namespace IAutoMovieMotionHumanSit {
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

    /** The seat. */
    seat: IAutoMovieMotionHumanSeated.ISeat;

    /** The seated back; `upright` when absent. */
    back?: "upright" | "lean" | "slump";

    /** Seconds to stay seated after `seated`, at least 0; 1 when absent. */
    hold?: number;

    /**
     * How the legs rest once seated on a seat inside the band: `parallel`, both
     * feet where they stood, or `crossed`, the left ankle lifted and set down
     * across the right one over `CROSS` seconds after `seated`, which the time
     * seated must cover. `parallel` when absent; ignored on a high seat.
     */
    legs?: "parallel" | "crossed";

    /**
     * How it is performed: the manner's tempo stretches or shortens the
     * descent, or the climb onto a high seat; neutral when absent. No span of
     * sitting down is fixed by gravity, since the legs lower the body under
     * control.
     */
    manner?: IAutoMovieMotionManner;
  }
}
