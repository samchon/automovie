import type { IAutoMovieBeatEndState } from "../harness/IAutoMovieBeatEndState";
import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";

/**
 * Mutable motion table and borrowed rig context for world-aware stance
 * planting.
 */
export namespace IAutoMoviePlantPerformShotStanceFeet {
  /**
   * Pin the stance feet of every gait-bearing or resumed actor clip, replacing
   * the clip in `motions` and returning the world-space plants a later beat can
   * resume.
   *
   * An actor is planted when its clip carries a gait cycle or the previous beat
   * left it opening plants, and it has a rig and a staged node; a static
   * gesture or hold clip keeps its authored key grid. Opening plants are
   * converted from scene world space into the actor's model frame for the
   * solve, and the new plants back into world space, exactly once. With a scene
   * space, its world ground height is carried into the model frame for contact;
   * otherwise the model-space `y = 0` plane is the ground. The conversion
   * assumes the unit-scale, yaw-only actor transform `stageScene` emits. A rig
   * with no recognized foot plants nothing, and its clip is left untouched so a
   * host's own plant measurements are not shadowed. Actors are processed in
   * code-unit order of their ids, which is the order of the returned entries.
   */
  export type IProps = {
    /**
     * Borrowed validated stage. Actor placement must use unit scale and
     * yaw-only rotation for the world/model ground conversion; absent scene
     * space uses model y = 0 ground.
     */
    staged: IAutoMovieStagedSet.ISuccess;
    /**
     * Caller-owned mutable node-to-motion table. Eligible entries are replaced
     * with planted motions in code-unit actor-id order; untouched actors keep
     * their existing object identity.
     */
    motions: Record<string, IAutoMovieMotion>;
    /**
     * Prior beat state supplying opening foot plants in world metres.
     * Null/undefined means no resumed plants; a previous actor with no
     * footPlants supplies none.
     */
    previous: IAutoMovieBeatEndState | null | undefined;
    /**
     * Synchronous rig lookup for eligible actors. Null skips the actor; answers
     * are borrowed during solving and exceptions propagate without rolling back
     * earlier replacements.
     */
    skeleton: (node: string) => IAutoMovieSkeleton | null;
    /**
     * Synchronous per-actor clinical axis lookup, or undefined. Missing
     * callback/answer delegates to plantStanceFeet defaults; records are not
     * retained and exceptions propagate.
     */
    jointAxes:
      | ((
          node: string,
        ) =>
          | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
          | undefined)
      | undefined;
    /**
     * Synchronous per-actor clinical rest-frame lookup matching rendering, or
     * undefined for solver defaults. Borrowed for the solve; exceptions
     * propagate.
     */
    restFrames:
      | ((
          node: string,
        ) =>
          | Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>
          | undefined)
      | undefined;
  };
}
