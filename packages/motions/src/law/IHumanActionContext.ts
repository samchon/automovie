import type {
  IAutoMovieRandom,
  IAutoMovieResolvedBone,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import type { IHumanProp } from "../perform/IHumanProp";
import type { IHumanPosture } from "../posture/IHumanPosture";
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
   * The action this one is performed over, when it is an overlay: a wave
   * during a walk. The carrier keeps the root and the legs and whatever else
   * it does not yield; this action writes only the channels it claims, on
   * the carrier's posture of the same instant. Absent for an action that
   * carries the body itself.
   */
  carrier?: IHumanActionContext.ICarrier;

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
   * The meeting of an action this performer does with others: the one
   * record every role reads, computed from where all stand at this action's
   * start by whichever role is planned first, and the same whichever that
   * is. With no partner it is this role's own meeting on its default
   * places, which is not solid. It may be read at plan time, so the
   * partners' earlier actions must be placed first, as `HumanChain.mutual`
   * places them.
   *
   * @param kind The kind of mutual action.
   * @param role This performer's role in it.
   * @param partner The other performer and their role, or every other one of a meeting of three or more; absent when alone.
   * @returns The meeting.
   * @throws {Error} When no such performer exists, or the kind lacks a role.
   */
  meeting(
    kind: AutoMovieMotionMeeting.IKind,
    role: string,
    partner?: IHumanActionContext.IPartner | readonly IHumanActionContext.IPartner[],
  ): AutoMovieMotionMeeting.IMeeting;

  /**
   * This instance's draw stream for one channel.
   *
   * @param channel The quantity drawn.
   * @returns The stream.
   */
  random(channel: string): IAutoMovieRandom;

  /**
   * The draws of one channel across this action's repeats: one stream for
   * every instance of the action's id, keyed by the chain seed, the subject,
   * the action's id and the channel, with this instance's ordinal as the
   * index into it. A low-discrepancy sequence over the repeats reads it, so
   * consecutive repeats land apart.
   *
   * @param channel The quantity drawn.
   * @returns The stream and this instance's index.
   */
  series(channel: string): IHumanActionContext.ISeries;
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

    /**
     * Where their placed actions put their root at a film second, readable
     * while a law plans: a follower, an escort or an interception plans its
     * own path from where the other will be, not from where they stood when
     * it began.
     *
     * It is the root their active action writes (the point a law places a
     * body by, as its own `entry.posture.root` is: carried within the
     * pelvis, a few centimetres from the pelvis joint on the floor plan),
     * before layers and before the decaying offset of a cut, so it costs
     * one posture of theirs and reads no pose. Before their first action it is their starting place,
     * and after their last it is where that action left them.
     *
     * The other's path is known only as far as the composition has placed
     * it, in the order the composition is written (a sequence part by part,
     * a parallel group part by part), so the person read is composed before
     * the one who reads.
     *
     * @param seconds Film seconds.
     * @returns Their root.
     * @throws {HumanRefusal} A `participant` refusal when the second lies after their last placed action while later actions of theirs are still to be placed.
     */
    root(seconds: number): IRoot;
  }

  /** Another performer of a meeting and the role they take in it. */
  export interface IPartner {
    /** Their role's name within the kind. */
    role: string;

    /** Their subject id. */
    subject: string;
  }

  /** A person's root on the floor plan: where it is and which way it faces. */
  export interface IRoot {
    /** The root, world metres. */
    position: IAutoMovieVector3;

    /** The heading, degrees about +Y with 0 facing +Z. */
    yaw: number;
  }

  /** The action an overlay is performed over. */
  export interface ICarrier {
    /** Its name. */
    name: HumanActionKey;

    /**
     * Its posture under the overlay.
     *
     * @param seconds Seconds of the overlay's own clock.
     * @returns The carrier's posture at that instant; its last posture once it has ended.
     */
    posture(seconds: number): IHumanPosture;
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

  /** A stream shared by every repeat of an action, with one repeat's place in it. */
  export interface ISeries {
    /** The stream, the same for every instance of the action's id. */
    random: IAutoMovieRandom;

    /** Which occurrence of the action's id in the performer's chain this is, from 0. */
    index: number;
  }

  /** An action placed in the performance. */
  export interface IPlaced {
    /** Its performer. */
    subject: string;

    /** Its name. */
    name: HumanActionKey;

    /** The action it is a row of; its own name when it is none. */
    family: HumanActionKey;

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
