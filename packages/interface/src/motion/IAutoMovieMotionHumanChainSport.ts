import type { IAutoMovieMotionHumanExercise } from "./IAutoMovieMotionHumanExercise";
import type { IAutoMovieMotionHumanStretch } from "./IAutoMovieMotionHumanStretch";
import type { IAutoMovieMotionHumanDance } from "./IAutoMovieMotionHumanDance";
import type { IAutoMovieMotionHumanSwim } from "./IAutoMovieMotionHumanSwim";
import type { IAutoMovieMotionHumanAthletics } from "./IAutoMovieMotionHumanAthletics";
import type { IAutoMovieMotionHumanBallSport } from "./IAutoMovieMotionHumanBallSport";
import type { IAutoMovieMotionHumanBaseball } from "./IAutoMovieMotionHumanBaseball";
import type { IAutoMovieMotionHumanChiSau } from "./IAutoMovieMotionHumanChiSau";
import type { IAutoMovieMotionHumanGymnastics } from "./IAutoMovieMotionHumanGymnastics";
import type { IAutoMovieMotionHumanMartialArt } from "./IAutoMovieMotionHumanMartialArt";
import type { IAutoMovieMotionHumanRacket } from "./IAutoMovieMotionHumanRacket";
import type { IAutoMovieMotionHumanChainMutual } from "./IAutoMovieMotionHumanChainMutual";

/**
 * The chain methods of exercise, dance and sport: the bodyweight exercises, the
 * static stretches, the dance steps, and the positions and techniques of
 * athletics, gymnastics, martial arts, ball sports, baseball, racket sports and
 * swimming.
 */
export interface IAutoMovieMotionHumanChainSport extends IAutoMovieMotionHumanChainMutual {
  /**
   * Perform a standing bodyweight exercise counted in repetitions: a squat, a
   * lunge, high knees or a jumping jack.
   *
   * @param params The exercise, the repetitions, the depth and the tempo.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  exercise(
    params: IAutoMovieMotionHumanExercise.IParams,
    anchor?: string,
  ): this;

  /**
   * Hold and release a standing static stretch or yoga pose.
   *
   * @param params The stretch, the side, the time and the intensity.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  stretch(params: IAutoMovieMotionHumanStretch.IParams, anchor?: string): this;

  /**
   * Dance a solo step locked to a declared beat: a bounce, a sway or a
   * step-touch.
   *
   * @param params The step, the tempo and the beats.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  dance(params: IAutoMovieMotionHumanDance.IParams, anchor?: string): this;

  /**
   * Take the sprint start's crouch into the set position, held to the gun.
   *
   * @param params The front foot and the time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  athletics(
    params?: IAutoMovieMotionHumanAthletics.IParams,
    anchor?: string,
  ): this;

  /**
   * Kick up into a handstand from standing, hold it and step down.
   *
   * @param params The time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  gymnastics(
    params?: IAutoMovieMotionHumanGymnastics.IParams,
    anchor?: string,
  ): this;

  /**
   * Perform a martial-art technique: a horse stance, a choku-zuki or a tai chi
   * push.
   *
   * @param params The technique, the count and the time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  martialArt(
    params: IAutoMovieMotionHumanMartialArt.IParams,
    anchor?: string,
  ): this;

  /**
   * Roll wing chun's sticky hands with a partner, both forearms in contact
   * through a small vertical circle; the partner performs it naming this one.
   *
   * @param params The partner, the cycles and the time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  chiSau(params: IAutoMovieMotionHumanChiSau.IParams, anchor?: string): this;

  /**
   * Perform a team ball skill with an implied ball: a dribble, a dig, a set or
   * a throw-in.
   *
   * @param params The skill, the side and the count.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  ballSport(
    params: IAutoMovieMotionHumanBallSport.IParams,
    anchor?: string,
  ): this;

  /**
   * Take a baseball position: the catcher's crouch, a ground ball or the
   * batting stance.
   *
   * @param params The position and the time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  baseball(
    params: IAutoMovieMotionHumanBaseball.IParams,
    anchor?: string,
  ): this;

  /**
   * Take a racket or golf position without the stroke: the ready position, a
   * split step or the golf address.
   *
   * @param params The position, the side and the time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  racket(params: IAutoMovieMotionHumanRacket.IParams, anchor?: string): this;

  /**
   * Append a stroke, stationary tread, float, or scripted falter on a
   * horizontal water plane. A dog-paddle course can turn as it advances.
   *
   * @param params The action, water height, cycle count, pace and optional turn.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  swim(params: IAutoMovieMotionHumanSwim.IParams, anchor?: string): this;
}
