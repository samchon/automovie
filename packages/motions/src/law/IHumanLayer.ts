import type { IAutoMovieRandom } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { HumanSkill } from "../skill/HumanSkill";
import type { IHumanContactWindow } from "./IHumanContactWindow";

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
 *
 * A layer runs for the whole film, or inside a window the performance is
 * given with it ({@link IHumanLayer.IScheduled}): from and to a film second
 * or an instant of an action or of a cue track, entered and left over a
 * fade so neither end steps.
 */
export interface IHumanLayer {
  /** Stable layer name, unique per performer; keys the layer's draws. */
  name: string;

  /**
   * The channels the layer writes beyond what every action leaves free, such
   * as an arm a mood lets hang. A layer scheduled in a window during which
   * one of the person's actions holds such a channel by a contact (a grip on
   * that hand, a planted foot of that leg) is refused when the performance
   * is built. Absent for a layer that only adds to joints no contact holds.
   */
  channels?: readonly AutoMovieMotionHumanChannel[];

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
  /**
   * A film second, or a named instant: an event of the action anchored `of`
   * or of the cue track named `of` (`start` and `end` of an action are
   * always there; an action's decisive instant, or else its start, when no
   * event is named), the `index`-th of that name from 0, `offset` seconds
   * later.
   */
  export type Instant =
    | number
    | { of: string; event?: string; index?: number; offset?: number };

  /** A layer's window in film seconds. */
  export interface IWindow {
    /** The second it starts. */
    from: number;

    /** The second it ends. */
    to: number;
  }

  /**
   * A layer with the window it runs in.
   *
   * The layer is given as it is, or as a function of the window's seconds
   * for one that times itself inside it: a sigh when a partner's exit ends
   * is `{ from: { of: "exit", event: "end" }, layer: (w) => HumanAffect.layer([{ kind: "sigh", at: w.from }]) }`.
   */
  export interface IScheduled {
    /** The layer, or what builds it from the window's seconds. */
    layer: IHumanLayer | ((window: IWindow) => IHumanLayer);

    /** When it starts; the film's start when absent. */
    from?: Instant;

    /** When it ends; the film's end when absent. */
    to?: Instant;

    /** Seconds over which it comes in after `from` and goes out before `to`; 0.3 when absent. */
    fade?: number;
  }

  /** The action a person performs at the second a layer is applied. */
  export interface IAction {
    /** Its name. */
    name: HumanActionKey;

    /** The action it is a row of; its own name when it is none. */
    family: HumanActionKey;

    /** Film second it became active. */
    from: number;

    /** Film second it stops. */
    to: number;

    /** Its events, in film seconds. */
    events: readonly { name: string; seconds: number }[];

    /** Its contact windows, as shares of its own duration. */
    contacts: readonly IHumanContactWindow[];
  }

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
     * The action the person performs at the second applied, so a layer can
     * follow it: gaze ahead of a turn, breath after an effort.
     *
     * @returns The action, or undefined before the person's first.
     */
    action(): IAction | undefined;

    /**
     * The layer's draw stream for one channel.
     *
     * @param channel The quantity drawn.
     * @returns The stream.
     */
    random(channel: string): IAutoMovieRandom;
  }
}
