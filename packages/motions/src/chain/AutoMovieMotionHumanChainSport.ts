import type {
  IAutoMovieMotionHumanAthletics,
  IAutoMovieMotionHumanBallSport,
  IAutoMovieMotionHumanBaseball,
  IAutoMovieMotionHumanChiSau,
  IAutoMovieMotionHumanDance,
  IAutoMovieMotionHumanExercise,
  IAutoMovieMotionHumanGymnastics,
  IAutoMovieMotionHumanMartialArt,
  IAutoMovieMotionHumanRacket,
  IAutoMovieMotionHumanStretch,
  IAutoMovieMotionHumanSwim,
} from "@automovie/interface";

import { AutoMovieMotionHumanChainMutual } from "./AutoMovieMotionHumanChainMutual";

/**
 * The chain methods of exercise, dance and sport: the bodyweight exercises, the
 * static stretches, the dance steps, and the positions and techniques of
 * athletics, gymnastics, martial arts, ball sports, baseball, racket sports and
 * swimming.
 */
export class AutoMovieMotionHumanChainSport extends AutoMovieMotionHumanChainMutual {
  /**
   * Perform a standing bodyweight exercise counted in repetitions: a squat, a
   * lunge, high knees or a jumping jack.
   *
   * @param params The exercise, the repetitions, the depth and the tempo.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public exercise(
    params: IAutoMovieMotionHumanExercise.IParams,
    anchor?: string,
  ): this {
    return this.act("exercise", params, anchor);
  }

  /**
   * Hold and release a standing static stretch or yoga pose.
   *
   * @param params The stretch, the side, the time and the intensity.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public stretch(
    params: IAutoMovieMotionHumanStretch.IParams,
    anchor?: string,
  ): this {
    return this.act("stretch", params, anchor);
  }

  /**
   * Dance a solo step locked to a declared beat: a bounce, a sway or a
   * step-touch.
   *
   * @param params The step, the tempo and the beats.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public dance(
    params: IAutoMovieMotionHumanDance.IParams,
    anchor?: string,
  ): this {
    return this.act("dance", params, anchor);
  }

  /**
   * Take the sprint start's crouch into the set position, held to the gun.
   *
   * @param params The front foot and the time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public athletics(
    params: IAutoMovieMotionHumanAthletics.IParams = {},
    anchor?: string,
  ): this {
    return this.act("athletics", params, anchor);
  }

  /**
   * Kick up into a handstand from standing, hold it and step down.
   *
   * @param params The time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public gymnastics(
    params: IAutoMovieMotionHumanGymnastics.IParams = {},
    anchor?: string,
  ): this {
    return this.act("gymnastics", params, anchor);
  }

  /**
   * Perform a martial-art technique: a horse stance, a choku-zuki or a tai chi
   * push.
   *
   * @param params The technique, the count and the time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public martialArt(
    params: IAutoMovieMotionHumanMartialArt.IParams,
    anchor?: string,
  ): this {
    return this.act("martialArt", params, anchor);
  }

  /**
   * Roll wing chun's sticky hands with a partner, both forearms in contact
   * through a small vertical circle; the partner performs it naming this one.
   *
   * @param params The partner, the cycles and the time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public chiSau(
    params: IAutoMovieMotionHumanChiSau.IParams,
    anchor?: string,
  ): this {
    return this.act("chiSau", params, anchor);
  }

  /**
   * Perform a team ball skill. Court releases use a held prop. Aim points
   * use world metres. After a set shot releases its ball, the fixed finish can
   * connect the placed endpoint arms when both palm sites remain still and the
   * proposed passage meets the sampled hand and body limits.
   *
   * @param params The skill and its action-specific props, aim or gesture.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public ballSport(
    params: IAutoMovieMotionHumanBallSport.IParams,
    anchor?: string,
  ): this {
    return this.act("ballSport", params, anchor);
  }

  /**
   * Take a baseball position: the catcher's crouch, a ground ball or the
   * batting stance.
   *
   * @param params The position and the time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public baseball(
    params: IAutoMovieMotionHumanBaseball.IParams,
    anchor?: string,
  ): this {
    return this.act("baseball", params, anchor);
  }

  /**
   * Take a racket or golf position without the stroke: the ready position, a
   * split step or the golf address.
   *
   * @param params The position, the side and the time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public racket(
    params: IAutoMovieMotionHumanRacket.IParams,
    anchor?: string,
  ): this {
    return this.act("racket", params, anchor);
  }

  /**
   * Append a stroke, stationary tread, float, or scripted falter on a
   * horizontal water plane. A dog-paddle course can turn as it advances.
   *
   * @param params The action, water height, cycle count, pace and optional
   *   turn.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public swim(
    params: IAutoMovieMotionHumanSwim.IParams,
    anchor?: string,
  ): this {
    return this.act("swim", params, anchor);
  }
}
