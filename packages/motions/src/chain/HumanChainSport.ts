import type { dance } from "../exercise/dance";
import type { exercise } from "../exercise/exercise";
import type { stretch } from "../exercise/stretch";
import type { athletics } from "../sport/athletics";
import type { ballSport } from "../sport/ballSport";
import type { baseball } from "../sport/baseball";
import type { gymnastics } from "../sport/gymnastics";
import type { martialArt } from "../sport/martialArt";
import type { racket } from "../sport/racket";
import type { swim } from "../sport/swim";
import { HumanChainMutual } from "./HumanChainMutual";

/**
 * The chain methods of exercise, dance and sport: the bodyweight exercises,
 * the static stretches, the dance steps, and the positions and techniques
 * of athletics, gymnastics, martial arts, ball sports, baseball, racket
 * sports and swimming.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the family and documents each method.
 * @evidence contracts/development/design.md#principled-representation One method per action of the family, each `act` under the action's name.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The exercise, dance and sport actions only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every method takes its law's own parameter type.
 */
export class HumanChainSport extends HumanChainMutual {
  /**
   * Perform a standing bodyweight exercise counted in repetitions: a squat,
   * a lunge, high knees or a jumping jack.
   *
   * @param params The exercise, the repetitions, the depth and the tempo.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public exercise(params: exercise.IParams, anchor?: string): this {
    return this.act("exercise", params, anchor);
  }

  /**
   * Hold and release a standing static stretch or yoga pose.
   *
   * @param params The stretch, the side, the time and the intensity.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public stretch(params: stretch.IParams, anchor?: string): this {
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
  public dance(params: dance.IParams, anchor?: string): this {
    return this.act("dance", params, anchor);
  }

  /**
   * Take the sprint start's crouch into the set position, held to the gun.
   *
   * @param params The front foot and the time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public athletics(params: athletics.IParams = {}, anchor?: string): this {
    return this.act("athletics", params, anchor);
  }

  /**
   * Kick up into a handstand from standing, hold it and step down.
   *
   * @param params The time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public gymnastics(params: gymnastics.IParams = {}, anchor?: string): this {
    return this.act("gymnastics", params, anchor);
  }

  /**
   * Perform a martial-art technique: a horse stance, a choku-zuki or a tai
   * chi push.
   *
   * @param params The technique, the count and the time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public martialArt(params: martialArt.IParams, anchor?: string): this {
    return this.act("martialArt", params, anchor);
  }

  /**
   * Perform a team ball skill with an implied ball: a dribble, a dig, a set
   * or a throw-in.
   *
   * @param params The skill, the side and the count.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public ballSport(params: ballSport.IParams, anchor?: string): this {
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
  public baseball(params: baseball.IParams, anchor?: string): this {
    return this.act("baseball", params, anchor);
  }

  /**
   * Take a racket or golf position without the stroke: the ready position,
   * a split step or the golf address.
   *
   * @param params The position, the side and the time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public racket(params: racket.IParams, anchor?: string): this {
    return this.act("racket", params, anchor);
  }

  /**
   * Swim on a declared water plane: tread water or swim the front crawl.
   *
   * @param params The stroke, the water's height and the cycles.
   * @param anchor An optional anchor id.
   * @returns The chain.
   */
  public swim(params: swim.IParams, anchor?: string): this {
    return this.act("swim", params, anchor);
  }
}
