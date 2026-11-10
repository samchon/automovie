import type {
  IAutoMovieRandom,
  IAutoMovieResolvedBone,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanProp } from "../perform/IHumanProp";
import type { HumanSkill } from "../skill/HumanSkill";
import type { IHumanActionPlan } from "./IHumanActionPlan";
import type { IHumanEntryState } from "./IHumanEntryState";

/**
 * Everything one action instance plans from: whose body, with which
 * parameters and skill, entered from which state, at which film second, and
 * how to find its targets and its seeded draws.
 *
 * `start` is the film second of the action's own time zero; an action entered
 * at a later share of itself (a redirect continuing its family's clock) starts
 * before its entry. `aim` resolves a target to a world point and outward
 * normal at a film second: a person's region on that person's displayed body,
 * a prop's named point, a free point, or the virtual opponent of `none`.
 * `random` returns the stream of one channel of this instance, keyed by the
 * chain seed, the subject, the action's id and its instance.
 */
export interface IHumanActionContext<P = object> {
  /** The performer's subject id. */
  subject: string;

  /** The performer's body. */
  body: IHumanBody;

  /** The action's parameters. */
  params: P;

  /** The performer's resolved skill. */
  skill: HumanSkill.ISkill;

  /** The state the action is entered from. */
  entry: IHumanEntryState;

  /** Film second of the action's time zero. */
  start: number;

  /**
   * A target's world point and outward unit normal at a film second.
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
   * Another action already placed in the performance, by its anchor: a
   * defence reads the attack it answers, a receiver the offer it takes.
   *
   * @param anchor The other intent's anchor id.
   * @returns Its subject, name, parameters, plan and film times.
   * @throws {Error} When no action with that anchor is placed earlier in walk order.
   */
  action(anchor: string): IHumanActionContext.IPlaced;

  /**
   * Another person in the performance: their body and their displayed world
   * bones at a film second, so a law can place any region or socket of
   * theirs or sweep against their colliders. Call it only from a posture, for
   * seconds at or before the one evaluated, as with `aim`.
   *
   * @param subject The other person.
   * @returns Their body and bone query.
   * @throws {Error} When no such performer exists.
   */
  performer(subject: string): IHumanActionContext.IPerformer;

  /**
   * A prop of the performance with its displayed world frame at a film
   * second, carried by whichever hand grips it then. Unlike `performer`, it
   * may be read at plan time for seconds before the action's start: where
   * an object lies, or the giver's hand it rests in.
   *
   * @param subject The prop.
   * @returns The prop and its frame query.
   * @throws {Error} When no such prop exists.
   */
  prop(subject: string): IHumanActionContext.IProp;

  /**
   * This instance's draw stream for one channel.
   *
   * @param channel The quantity drawn.
   * @returns The stream.
   */
  random(channel: string): IAutoMovieRandom;
}
/**
 * Companion types of {@link IHumanActionContext}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's timebase.
 * @evidence contracts/development/design.md#principled-representation Another action's plan with its film times.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What an answering law reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the plan type.
 */
export namespace IHumanActionContext {
  /** Another person's body and displayed bones. */
  export interface IPerformer {
    /** Their body. */
    body: IHumanBody;

    /**
     * Their displayed world bones at a film second.
     *
     * @param seconds Film seconds.
     * @returns Resolved bones by rig bone.
     */
    bones(seconds: number): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /** A prop and its displayed frame. */
  export interface IProp {
    /** The prop as declared. */
    prop: IHumanProp;

    /**
     * Its displayed world frame at a film second.
     *
     * @param seconds Film seconds.
     * @returns The frame.
     */
    frame(seconds: number): IHumanProp.IFrame;
  }

  /** An action placed in the performance. */
  export interface IPlaced {
    /** Its performer. */
    subject: string;

    /** Its name. */
    name: HumanActionName;

    /** Its parameters. */
    params: object;

    /** Its plan. */
    plan: IHumanActionPlan;

    /** Film second of its law's time zero. */
    start: number;

    /** Film second it becomes active. */
    entryTime: number;

    /** Film second it stops: its cut or its end, as placed so far. */
    end: number;
  }
}
