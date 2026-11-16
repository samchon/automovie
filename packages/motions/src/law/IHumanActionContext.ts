import type {
  IAutoMovieRandom,
  IAutoMovieResolvedBone,
  resolveAutoMovieSchedule,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import type { HumanAttribute } from "../ensemble/HumanAttribute";
import type { HumanForce } from "../perform/HumanForce";
import type { HumanObstacle } from "../perform/HumanObstacle";
import type { IHumanProp } from "../perform/IHumanProp";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { HumanSkill } from "../skill/HumanSkill";
import type { IHumanActionLaw } from "./IHumanActionLaw";
import type { IHumanActionPlan } from "./IHumanActionPlan";
import type { IHumanContactWindow } from "./IHumanContactWindow";
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

  /**
   * The performer's group attributes (`IHumanPerformer.attributes`), each in
   * [0, 1]; an attribute absent, or the whole record absent, reads as its
   * neutral value.
   */
  attributes?: Readonly<Partial<Record<HumanAttribute.Name, number>>>;

  /** The state the action is entered from. */
  entry: IHumanEntryState;

  /** Film second of the action's time zero. */
  start: number;

  /**
   * A factor on every span of the action that physics does not fix, over
   * its manner's own tempo (`AutoMovieMotionManner.of`): 1 when absent, and
   * more where the action is replanned to take the time its planned motion
   * needs within the speed bound (Hollerbach 1984's time scaling, applied
   * where the action is placed).
   */
  tempo?: number;

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
   * @param window The film seconds the meeting holds over, which every role states alike (`AutoMovieMotionMeeting.IWindow`); its natural instants when absent.
   * @returns The meeting.
   * @throws {Error} When no such performer exists, or the kind lacks a role.
   * @throws {HumanRefusal} When the window closes before the contact can be made.
   */
  meeting(
    kind: AutoMovieMotionMeeting.IKind,
    role: string,
    partner?:
      | IHumanActionContext.IPartner
      | readonly IHumanActionContext.IPartner[],
    window?: AutoMovieMotionMeeting.IWindow,
  ): AutoMovieMotionMeeting.IMeeting;

  /**
   * One of the film's cue tracks (`HumanPerformance.IInput.cues`): its named
   * instants in film seconds, in the track's order, so a law can place its
   * own beats on a score's or its stresses on a line's (a dance's steps on
   * the beats, a nod on an accent). It may be read at plan time. A law that
   * only needs to start at a cue is synced by its composition instead.
   *
   * @param track The track's name.
   * @returns The track's instants, each with its event name and film second.
   * @throws {HumanRefusal} A `participant` refusal when the performance has no such track.
   */
  cue(track: string): readonly resolveAutoMovieSchedule.ICue[];

  /**
   * What stands in the way in this performance
   * (`HumanPerformance.IInput.obstacles`): the scene's solids with their
   * openings, which a law that moves the body across the floor asks
   * `HumanObstacle.blocking` about before it plans a stretch of its path.
   *
   * @returns The obstacles; none when the performance was given none.
   */
  obstacles(): readonly HumanObstacle.IObstacle[];

  /**
   * The forces on this performer in a span of this action
   * (`HumanPerformance.IInput.forces`, #3429): impulses and sustained
   * forces, known before the action plans because they are inputs. A
   * reaction reads them to size its response; none acts by itself. Absent on
   * a context built outside a performance.
   *
   * @param from Seconds since the action's start.
   * @param to Seconds since the action's start, at least `from`.
   * @returns The forces, in the order the performance was given them.
   */
  forces?(from: number, to: number): readonly HumanForce.IForce[];

  /**
   * What the performer's next action on a prop demands of a grip this action
   * is choosing (`IHumanActionLaw.demands`): the poses that action will hold
   * the prop in, so a grasp is chosen for them as well as for its own reach.
   * The action asked is the first later one of the performer that names the
   * prop among its parameters; an action that asks nothing, or none, gives
   * none. Absent on an overlay and on a context built outside a performance.
   *
   * @param grip The grip being weighed, with the posture this action leaves the body in with it.
   * @returns The poses demanded of it.
   */
  demands?(grip: IHumanActionLaw.IGrip): readonly IHumanActionLaw.IDemand[];

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
     * @param requested Optional observed bone names; omission requests the complete displayed hierarchy.
     * @returns Fresh resolved bones by rig bone, containing only requested reachable bones when supplied.
     */
    bones(
      seconds: number,
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

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

    /**
     * Their placed posture at a film second, read under the same rule as
     * `root`: the posture their active action writes, before layers and the
     * decaying offset of a cut. An instanced member displays it moved
     * (`instance`). Absent where the context reads no placed path.
     *
     * @param seconds Film seconds.
     * @returns Their posture.
     * @throws {HumanRefusal} As `root` does.
     */
    posture?(seconds: number): IHumanPosture;
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
     * @param channels Optional requested channels; omitted for a whole-posture read.
     * @returns The carrier's posture at that instant; its last posture once it has ended. Only requested channels are valid when supplied.
     */
    posture(
      seconds: number,
      channels?: readonly AutoMovieMotionHumanChannel[],
    ): IHumanPosture;

    /**
     * What the carrier stands on when it is not the ground: the first prop
     * its plan plants a foot on (a stance on a cart's bed), so an overlay
     * that begins with it is carried by that prop (`HumanSupportFrame`).
     * Absent on the ground.
     */
    support?: IHumanContactWindow.Support;
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

    /**
     * The travel of each of its articulations an act or its own track has
     * moved by a film second (`HumanPerformance.state`); an articulation
     * absent from the record is at rest. Read at plan time like `frame`, so
     * an act that operates a part starts from where the part is. Absent from
     * a context that tracks no state, where every articulation is at rest.
     *
     * @param seconds Film seconds.
     * @returns Travel by articulation id.
     */
    state?(seconds: number): Readonly<Record<string, number>>;
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
