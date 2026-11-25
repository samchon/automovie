/**
 * The timing of a stepping gait over a distance: its step period, its swing,
 * and how far along its path the pelvis is at each instant.
 *
 * The step period is the pace's own, the time its longest step takes at the
 * asked speed, whatever the distance: a distance that is not a whole number of
 * longest steps is walked in shorter steps at the same cadence, and so a little
 * slower, as a walker regulates the last steps to a target by their length
 * (Lee, Lishman and Thomson 1982, J Exp Psychol Hum Percept Perform 8:448). A
 * period shrunk with the step instead would quicken the cadence by a fifth on a
 * 3 m walk of five steps where four fall just short, and without bound on a
 * short one.
 *
 * The pelvis gathers its speed over a ramp, cruises one step per period and
 * sheds the speed over a second ramp, each ramp a smooth step of the speed
 * (zero rate and zero rate of rate at both ends). At a heel strike the landing
 * footprint lies `front` steps ahead of the pelvis. A gait with a flight passes
 * at a foot's mid-stance over the middle of the way its centre of pressure
 * travels, from the heel to the ball: the spring-mass leg of running is
 * symmetric about its contact (Blickhan 1989, J Biomech 22:1217), so the leg
 * lands as far ahead of that contact as it leaves it behind. That puts the
 * landing `1 - swing / 2T` steps ahead less the `lead` the middle lies ahead of
 * the ankle; a gait with double support shares the step between the two legs,
 * so the footprint lies no more than half a step ahead. Cruising, the pelvis is
 * `j - front` steps along at heel strike j when the ramp up lasts twice the
 * time from the start to `1 - front` periods before the first heel strike, and
 * it ends over the closing pair when the ramp down lasts `2 (1 - front)`
 * periods.
 *
 * The ramp up lasts longer wherever that would carry the pelvis past the foot
 * left standing at the start, by the time it lifts one period after the first
 * toe-off, further than a cruising stance carries it past its footprint: a leg
 * trails no further at the start than in full stride. The period then lengthens
 * so the longer ramp does not quicken the cruise, and a plan too short for both
 * ramps shrinks them in proportion.
 *
 * A walk whose way is set from outside (`IProps.travel`, a cadenced station)
 * keeps the asked period and as many steps as the way takes to be gone, and its
 * pelvis is where the way says: each step is then as long as the way gone in
 * it, as a drilled soldier keeps his place at a called cadence by the length of
 * his step.
 */
export namespace IAutoMovieMotionHumanWalkPace {
  /**
   * The timing with the fewest steps whose cruising step is no longer than the
   * longest one: at least two steps whenever there is a way to go, one step the
   * whole way being a lunge, the pelvis crossing the distance over a single
   * stance. What a timing is planned from.
   */
  export interface IProps {
    /** The path's length, metres. */
    distance: number;

    /** The asked cruising speed, m/s. */
    speed: number;

    /** The swing's duration in step periods. */
    share: number;

    /** The realised step period for a planned one, seconds. */
    period(seconds: number): number;

    /**
     * How far ahead of the ankle the middle of a flight gait's centre of
     * pressure path lies, metres; 0 when absent.
     */
    lead?: number;

    /**
     * The pelvis's speed along the way as the gait is entered, m/s, never
     * negative: the ramp up starts from it, and from rest when absent.
     */
    entrySpeed?: number;

    /**
     * How long the standing foot of a gait entered in stride has stood at the
     * start, seconds, never negative: one foot standing and the other in the
     * air (a run out of a hurdle clearance), so the foot in the air lands one
     * period after the standing foot's stance began, as the next footfall of a
     * gait in progress does, instead of after a standing start's initiation
     * (`WalkPace.FIRST`). A standing start when absent.
     */
    stride?: number;

    /**
     * The share of the way the pelvis has gone at a second of the walk, from 0,
     * never falling and reaching 1, when the way is set from outside (a
     * cadenced station, `walkStation.cadenced`); the pelvis ramps, cruises and
     * ramps by itself when absent.
     */
    travel?: (seconds: number) => number;
  }
}
