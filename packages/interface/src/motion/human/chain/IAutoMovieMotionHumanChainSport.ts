import type { IAutoMovieMotionHumanDance } from "../exercise/IAutoMovieMotionHumanDance";
import type { IAutoMovieMotionHumanExercise } from "../exercise/IAutoMovieMotionHumanExercise";
import type { IAutoMovieMotionHumanStretch } from "../exercise/IAutoMovieMotionHumanStretch";
import type { IAutoMovieMotionHumanAthletics } from "../sport/IAutoMovieMotionHumanAthletics";
import type { IAutoMovieMotionHumanBallSport } from "../sport/IAutoMovieMotionHumanBallSport";
import type { IAutoMovieMotionHumanBaseball } from "../sport/IAutoMovieMotionHumanBaseball";
import type { IAutoMovieMotionHumanGymnastics } from "../sport/IAutoMovieMotionHumanGymnastics";
import type { IAutoMovieMotionHumanMartialArt } from "../sport/IAutoMovieMotionHumanMartialArt";
import type { IAutoMovieMotionHumanRacket } from "../sport/IAutoMovieMotionHumanRacket";
import type { IAutoMovieMotionHumanSwim } from "../sport/IAutoMovieMotionHumanSwim";
import type { IAutoMovieMotionHumanChainMutual } from "./IAutoMovieMotionHumanChainMutual";

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
export interface IAutoMovieMotionHumanChainSport extends IAutoMovieMotionHumanChainMutual {
  /**
   * Perform a standing bodyweight exercise counted in repetitions: a squat,
   * a lunge, high knees or a jumping jack.
   *
   * @param params The exercise, the repetitions, the depth and the tempo.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainSport.exercise: Perform a standing bodyweight exercise counted in repetitions: a squat, a lunge, high knees or a jumping jack.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainSport.exercise is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainSport.exercise is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainSport.exercise is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainSport.exercise is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainSport.exercise is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainSport.exercise is used through packages/motions/src/chain/HumanChainSport.ts.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainSport.stretch: Hold and release a standing static stretch or yoga pose.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainSport.stretch is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainSport.stretch is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainSport.stretch is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainSport.stretch is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainSport.stretch is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainSport.stretch is used through packages/motions/src/chain/HumanChainSport.ts.
   */
  stretch(params: IAutoMovieMotionHumanStretch.IParams, anchor?: string): this;

  /**
   * Dance a solo step locked to a declared beat: a bounce, a sway or a
   * step-touch.
   *
   * @param params The step, the tempo and the beats.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainSport.dance: Dance a solo step locked to a declared beat: a bounce, a sway or a step-touch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainSport.dance is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainSport.dance is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainSport.dance is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainSport.dance is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainSport.dance is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainSport.dance is used through packages/motions/src/chain/HumanChainSport.ts.
   */
  dance(params: IAutoMovieMotionHumanDance.IParams, anchor?: string): this;

  /**
   * Take the sprint start's crouch into the set position, held to the gun.
   *
   * @param params The front foot and the time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainSport.athletics: Take the sprint start's crouch into the set position, held to the gun.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainSport.athletics is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainSport.athletics is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainSport.athletics is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainSport.athletics is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainSport.athletics is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainSport.athletics is used through packages/motions/src/chain/HumanChainSport.ts.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainSport.gymnastics: Kick up into a handstand from standing, hold it and step down.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainSport.gymnastics is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainSport.gymnastics is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainSport.gymnastics is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainSport.gymnastics is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainSport.gymnastics is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainSport.gymnastics is used through packages/motions/src/chain/HumanChainSport.ts.
   */
  gymnastics(
    params?: IAutoMovieMotionHumanGymnastics.IParams,
    anchor?: string,
  ): this;

  /**
   * Perform a martial-art technique: a horse stance, a choku-zuki or a tai
   * chi push.
   *
   * @param params The technique, the count and the time.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainSport.martialArt: Perform a martial-art technique: a horse stance, a choku-zuki or a tai chi push.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainSport.martialArt is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainSport.martialArt is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainSport.martialArt is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainSport.martialArt is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainSport.martialArt is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainSport.martialArt is used through packages/motions/src/chain/HumanChainSport.ts.
   */
  martialArt(
    params: IAutoMovieMotionHumanMartialArt.IParams,
    anchor?: string,
  ): this;

  /**
   * Perform a team ball skill with an implied ball: a dribble, a dig, a set
   * or a throw-in.
   *
   * @param params The skill, the side and the count.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainSport.ballSport: Perform a team ball skill with an implied ball: a dribble, a dig, a set or a throw-in.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainSport.ballSport is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainSport.ballSport is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainSport.ballSport is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainSport.ballSport is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainSport.ballSport is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainSport.ballSport is used through packages/motions/src/chain/HumanChainSport.ts.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainSport.baseball: Take a baseball position: the catcher's crouch, a ground ball or the batting stance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainSport.baseball is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainSport.baseball is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainSport.baseball is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainSport.baseball is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainSport.baseball is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainSport.baseball is used through packages/motions/src/chain/HumanChainSport.ts.
   */
  baseball(
    params: IAutoMovieMotionHumanBaseball.IParams,
    anchor?: string,
  ): this;

  /**
   * Take a racket or golf position without the stroke: the ready position,
   * a split step or the golf address.
   *
   * @param params The position, the side and the time held.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainSport.racket: Take a racket or golf position without the stroke: the ready position, a split step or the golf address.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainSport.racket is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainSport.racket is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainSport.racket is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainSport.racket is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainSport.racket is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainSport.racket is used through packages/motions/src/chain/HumanChainSport.ts.
   */
  racket(params: IAutoMovieMotionHumanRacket.IParams, anchor?: string): this;

  /**
   * Swim on a declared water plane: tread water or swim the front crawl.
   *
   * @param params The stroke, the water's height and the cycles.
   * @param anchor An optional anchor id.
   * @returns The chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanChainSport.swim: Swim on a declared water plane: tread water or swim the front crawl.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanChainSport.swim is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanChainSport.swim is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanChainSport.swim is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanChainSport.swim is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanChainSport.swim is used through packages/motions/src/chain/HumanChainSport.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanChainSport.swim is used through packages/motions/src/chain/HumanChainSport.ts.
   */
  swim(params: IAutoMovieMotionHumanSwim.IParams, anchor?: string): this;
}
