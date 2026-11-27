/**
 * Shifting along a bench while seated: the seat socket slides sideways along
 * the seat by the requested distance, while the feet stay planted and the hands
 * stay on the thighs.
 *
 * The goal is the socket's path; the root follows with the seated pitch kept,
 * and the legs and hands are solved by inverse kinematics. A seated person
 * edges along by unweighting the buttocks, not by lifting them off: the seat
 * bears throughout, sliding, so the body never stands on its feet alone with
 * its centre of mass behind them, and the socket keeps to the seat on the
 * slide's minimum-jerk share `s`; the slide lasts `0.6 + |d|` seconds for `d`
 * metres (provisional). The feet do not step, so a shift is limited to what the
 * planted legs allow sideways: 0.35 thigh lengths, which turns each thigh about
 * 19 degrees in abduction or adduction, inside their 30 degree range
 * (provisional); a longer shift is refused and takes several shifts, as people
 * edge along a bench a few tens of centimetres at a time.
 *
 * On a seat above 1.2 of the popliteal height, where a foot is off the floor,
 * the shift is refused: getting off and sitting down again moves the body
 * there.
 *
 * Events `seatOff` (the buttocks unweighted as the slide starts) and
 * `seatContact` (bearing fully again as it ends).
 */
export namespace IAutoMovieMotionHumanShift {
  /** Parameters. */
  export interface IParams {
    /** Distance along the seat, metres; positive toward the performer's left. */
    by: number;

    /** Seconds to stay seated after setting down; 0.5 when absent. */
    hold?: number;
  }
}
