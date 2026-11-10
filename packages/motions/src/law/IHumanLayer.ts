import type { IAutoMovieRandom } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { HumanSkill } from "../skill/HumanSkill";

/**
 * An additive layer over whatever action a person performs: gaze, breathing,
 * an affect display. A layer never starts, cuts or ends an action; it takes
 * the active action's posture at a film second and returns it with its own
 * contribution added, the way layered animation adds an additive pose on top
 * of a base locomotion (Unreal's layered blend per bone, Unity's additive
 * animator layers).
 *
 * A layer must keep every planted or gripping limb goal unchanged, because
 * contacts are re-solved from those goals and must not slide; it should
 * change joints a body action leaves free (the eyes, the head, the chest's
 * breathing) or add small offsets to the root and the trunk. Its draws come
 * from `random`, keyed by the performer and the layer's name.
 */
export interface IHumanLayer {
  /** Stable layer name, unique per performer; keys the layer's draws. */
  name: string;

  /**
   * The posture with this layer's contribution added.
   *
   * @param posture The active action's posture, after earlier layers.
   * @param seconds Film seconds.
   * @param context The person and the performance's queries.
   * @returns The layered posture.
   */
  apply(
    posture: IHumanPosture,
    seconds: number,
    context: IHumanLayer.IContext,
  ): IHumanPosture;
}
/**
 * Companion types of {@link IHumanLayer}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member.
 * @evidence contracts/development/design.md#principled-representation The person's body and skill with the performance's target and draw queries.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a layer reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the body, skill and target types.
 */
export namespace IHumanLayer {
  /** What a layer can read. */
  export interface IContext {
    /** The person's subject id. */
    subject: string;

    /** The person's body. */
    body: IHumanBody;

    /** The person's skill. */
    skill: HumanSkill.ISkill;

    /**
     * A target's world point and outward normal at a film second.
     *
     * @param target The target.
     * @param seconds Film seconds.
     * @returns The aim.
     */
    aim(
      target: AutoMovieMotionTarget,
      seconds: number,
    ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 };

    /**
     * The layer's draw stream for one channel.
     *
     * @param channel The quantity drawn.
     * @returns The stream.
     */
    random(channel: string): IAutoMovieRandom;
  }
}
