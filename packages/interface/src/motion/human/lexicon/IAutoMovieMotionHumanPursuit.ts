import type { IAutoMovieMotionHumanGait } from "../next/IAutoMovieMotionHumanGait";

/**
 * Travel relative to another person, each a row of `approach`: the composition
 * gives the person as the target. Register the ones a film uses.
 *
 * `follow` and `escort` go where the person goes: the stop is taken where the
 * person comes to rest, read from their placed actions, and the pursuer sets
 * off late enough to arrive just after them. So the person pursued is composed
 * before the pursuer (`leader.with(follower)`), and a pursuit composed the
 * other way round is refused, saying so. First pass: the pursuer does not match
 * the person's speed on the way or keep a gap through their turns. `confront`
 * steps up to a person where they stand.
 *
 * `intercept` heads a moving person off, running to where they will be, and
 * `chase` is a row of it: a chase runs. `flee` is the opposite travel: a run
 * straight away from a person, read where they are when it begins. It is a law
 * of its own over the run, since its destination comes from the person and not
 * from the scene.
 */
export namespace IAutoMovieMotionHumanPursuit {
  /** Parameters of an interception. */
  export interface IIntercept {
    /** The person headed off, by subject id; composed before the performer. */
    target: string;

    /**
     * The running gait (`IAutoMovieMotionHumanRun.IParams.pace` gives the
     * speeds); `run` when absent. A pace the target outruns is refused.
     */
    pace?: IAutoMovieMotionHumanGait.RunPace;
  }

  /** Parameters of a flight from a person. */
  export interface IFlee {
    /** The person fled from, by subject id. */
    from: string;

    /**
     * How far to run, metres, positive; `FLIGHT` hip heights when absent (9 hip
     * heights, about 8 m at the reference hip).
     */
    metres?: number;

    /**
     * The running gait (`IAutoMovieMotionHumanRun.IParams.pace` gives the
     * speeds); `run` when absent. An escape at full effort is `sprint`.
     */
    pace?: IAutoMovieMotionHumanGait.RunPace;
  }
}
