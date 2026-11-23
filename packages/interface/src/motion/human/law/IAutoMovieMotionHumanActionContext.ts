import type { IAutoMovieRandom } from "../../../core/IAutoMovieRandom";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMoviePoseResolution } from "../../../pose/IAutoMoviePoseResolution";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieScheduleCue } from "../../composition/IAutoMovieScheduleCue";
import type { AutoMovieMotionHumanActionKey } from "../AutoMovieMotionHumanActionKey";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import type { IAutoMovieMotionHumanArmPlanned } from "../compose/IAutoMovieMotionHumanArmPlanned";
import type { IAutoMovieMotionMeeting } from "../compose/IAutoMovieMotionMeeting";
import type { IAutoMovieMotionMeetingKind } from "../compose/IAutoMovieMotionMeetingKind";
import type { IAutoMovieMotionHumanAttribute } from "../ensemble/IAutoMovieMotionHumanAttribute";
import type { IAutoMovieMotionHumanForce } from "../perform/IAutoMovieMotionHumanForce";
import type { IAutoMovieMotionHumanObstacle } from "../perform/IAutoMovieMotionHumanObstacle";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanSkill } from "../skill/IAutoMovieMotionHumanSkill";
import type { AutoMovieMotionHumanScheduledInstant } from "./AutoMovieMotionHumanScheduledInstant";
import type { IAutoMovieMotionHumanActionLaw } from "./IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanActionPlan } from "./IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanContactWindow } from "./IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieMotionHumanEntryState } from "./IAutoMovieMotionHumanEntryState";
import type { IAutoMovieMotionHumanPerformerReader } from "./IAutoMovieMotionHumanPerformerReader";
import type { IAutoMovieMotionHumanPlacedAction } from "./IAutoMovieMotionHumanPlacedAction";
import type { IAutoMovieMotionHumanPropReader } from "./IAutoMovieMotionHumanPropReader";

/**
 * Everything one action instance plans from: whose body, with which parameters and skill, entered from which state, at which film second, and how to find its targets and its seeded draws.
 *
 * `start` is the film second of the action's own time zero; an action entered at a later share of itself (a redirect continuing its family's clock) starts before its entry. `aim` resolves a target to a world point and outward normal at a film second: a person's region on that person's displayed body, a prop's named point, a free point, or the virtual opponent of `none`.
 * `random` returns the stream of one channel of this instance, keyed by the chain seed, the subject, the action's id and its instance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation attributes: The performer's group attributes (`IAutoMovieMotionHumanPerformer.attributes`), each in [0, 1]; an attribute absent, or the whole record absent, reads as its neutral value. start: Film second of the action's time zero. tempo: A factor on every span of the action that physics does not fix, over its manner's own tempo (`AutoMovieMotionManner.of`): 1 when absent, and more where the action is replanned to take the time its planned motion needs within the speed bound (Hollerbach 1984's time scaling, applied where the action is placed). support: What the carrier stands on when it is not the ground: the first prop its plan plants a foot on (a stance on a cart's bed), so an overlay that begins with it is carried by that prop (`HumanSupportFrame`). Absent on the ground. start: Film second of its law's time zero. posture: Their placed posture at a film second, read under the same rule as `root`: the posture their active action writes, before layers and the decaying offset of a cut. An instanced member displays it moved (`instance`). Absent where the context reads no placed path.
 * @evidence contracts/development/design.md#principled-representation attributes: The performer's group attributes (`IAutoMovieMotionHumanPerformer.attributes`), each in [0, 1]; an attribute absent, or the whole record absent, reads as its neutral value. start: Film second of the action's time zero. tempo: A factor on every span of the action that physics does not fix, over its manner's own tempo (`AutoMovieMotionManner.of`): 1 when absent, and more where the action is replanned to take the time its planned motion needs within the speed bound (Hollerbach 1984's time scaling, applied where the action is placed). support: What the carrier stands on when it is not the ground: the first prop its plan plants a foot on (a stance on a cart's bed), so an overlay that begins with it is carried by that prop (`HumanSupportFrame`). Absent on the ground. start: Film second of its law's time zero. posture: Their placed posture at a film second, read under the same rule as `root`: the posture their active action writes, before layers and the decaying offset of a cut. An instanced member displays it moved (`instance`). Absent where the context reads no placed path.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/jump.ts (jump.plan, context); actions/run.ts (run.plan, context); actions/stand.ts (stand.plan, context); actions/support.ts (support.plan, context); actions/supportWindows.ts (supportWindows.of, context); actions/walk.ts (walk.plan, context).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanSkill identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical AutoMovieMotionHumanActionKey, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanContactWindow.Support, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanActionContext<P = object> {
  /** The performer's subject id. */
  subject: string;

  /** The performer's body. */
  body: IAutoMovieMotionHumanBody;

  /** The action's parameters. */
  params: P;

  /** The performer's resolved skill. */
  skill: IAutoMovieMotionHumanSkill;

  /** The performer's group attributes (`IAutoMovieMotionHumanPerformer.attributes`), each in [0, 1]; an attribute absent, or the whole record absent, reads as its neutral value. */
  attributes?: Readonly<
    Partial<Record<IAutoMovieMotionHumanAttribute.Name, number>>
  >;

  /** The state the action is entered from. */
  entry: IAutoMovieMotionHumanEntryState;

  /** Film second of the action's time zero. */
  start: number;

  /** The film second of an earlier anchor or cue, when planning in a performance. */
  instant?: IAutoMovieMotionHumanActionContext.Instant;

  /** A factor on every span of the action that physics does not fix, over its manner's own tempo (`AutoMovieMotionManner.of`): 1 when absent, and more where the action is replanned to take the time its planned motion needs within the speed bound (Hollerbach 1984's time scaling, applied where the action is placed). */
  tempo?: number;

  /** The action this one is performed over, when it is an overlay: a wave during a walk. The carrier keeps the root and the legs and whatever else it does not yield; this action writes only the channels it claims, on the carrier's posture of the same instant. Absent for an action that carries the body itself. */
  carrier?: IAutoMovieMotionHumanActionContext.ICarrier;

  /**
   * The arm solutions handed between the plans of this one action: the
   * solutions the last plan of the same action in the same performance
   * reached (an alignment trial's, a replan's over another span), by the
   * arms solved together, and the map this plan's solutions are written
   * into for the next. A plan's arm groups read and write it
   * (`AutoMovieMotionHumanArmPlanned.together`); a solution handed on is
   * only the start of the next solve, which admits its own result. Absent,
   * every solve starts from its course.
   */
  handover?: IAutoMovieMotionHumanActionContext.IHandover;

  /**
   * A target's world point and outward unit normal at a film second.
   *
   * @param target The target.
   * @param seconds Film seconds.
   * @returns The aim.
   */
  aim(
    target: IAutoMovieMotionTarget,
    seconds: number,
  ): {
    /** Resolved target point in world metres. */
    point: IAutoMovieVector3;
    /** Resolved target's outward surface normal in world coordinates. */
    normal: IAutoMovieVector3;
  };

  /**
   * Another action already placed in the performance, by its anchor: a defence reads the attack it answers, a receiver the offer it takes.
   *
   * @param anchor The other intent's anchor id.
   * @returns Its subject, name, parameters, plan and film times.
   * @throws {Error} When no action with that anchor is placed earlier in walk order.
   */
  action(anchor: string): IAutoMovieMotionHumanPlacedAction;

  /**
   * Another person in the performance: their body and their displayed world bones at a film second, so a law can place any region or socket of theirs or sweep against their colliders. Call it only from a posture, for seconds at or before the one evaluated, as with `aim`.
   *
   * @param subject The other person.
   * @returns Their body and bone query.
   * @throws {Error} When no such performer exists.
   */
  performer(subject: string): IAutoMovieMotionHumanPerformerReader;

  /**
   * A prop of the performance with its displayed world frame at a film second, carried by whichever hand grips it then. Unlike `performer`, it may be read at plan time for seconds before the action's start: where an object lies, or the giver's hand it rests in.
   *
   * @param subject The prop.
   * @returns The prop and its frame query.
   * @throws {Error} When no such prop exists.
   */
  prop(subject: string): IAutoMovieMotionHumanPropReader;

  /**
   * The meeting of an action this performer does with others: the one record every role reads, computed from where all stand at this action's start by whichever role is planned first, and the same whichever that is. With no partner it is this role's own meeting on its default places, which is not solid. It may be read at plan time, so the partners' earlier actions must be placed first, as `HumanChain.mutual` places them.
   *
   * @param kind The kind of mutual action.
   * @param role This performer's role in it.
   * @param partner The other performer and their role, or every other one of a meeting of three or more; absent when alone.
   * @param window The film seconds the meeting holds over, which every role states alike (`IAutoMovieMotionMeeting.IWindow`); its natural instants when absent.
   * @returns The meeting.
   * @throws {Error} When no such performer exists, or the kind lacks a role.
   * @throws {HumanRefusal} When the window closes before the contact can be made.
   */
  meeting(
    kind: IAutoMovieMotionMeetingKind,
    role: string,
    partner?:
      | IAutoMovieMotionHumanActionContext.IPartner
      | readonly IAutoMovieMotionHumanActionContext.IPartner[],
    window?: IAutoMovieMotionMeeting.IWindow,
  ): IAutoMovieMotionMeeting;

  /**
   * One of the film's cue tracks (`IAutoMovieMotionHumanPerformance.IInput.cues`): its named instants in film seconds, in the track's order, so a law can place its own beats on a score's or its stresses on a line's (a dance's steps on the beats, a nod on an accent). It may be read at plan time. A law that only needs to start at a cue is synced by its composition instead.
   *
   * @param track The track's name.
   * @returns The track's instants, each with its event name and film second.
   * @throws {HumanRefusal} A `participant` refusal when the performance has no such track.
   */
  cue(track: string): readonly IAutoMovieScheduleCue[];

  /**
   * What stands in the way in this performance (`IAutoMovieMotionHumanPerformance.IInput.obstacles`): the scene's solids with their openings, which a law that moves the body across the floor asks
   * `HumanObstacle.blocking` about before it plans a stretch of its path.
   *
   * @returns The obstacles; none when the performance was given none.
   */
  obstacles(): readonly IAutoMovieMotionHumanObstacle[];

  /**
   * The forces on this performer in a span of this action (`IAutoMovieMotionHumanPerformance.IInput.forces`, #3429): impulses and sustained forces, known before the action plans because they are inputs. A reaction reads them to size its response; none acts by itself. Absent on a context built outside a performance.
   *
   * @param from Seconds since the action's start.
   * @param to Seconds since the action's start, at least `from`.
   * @returns The forces, in the order the performance was given them.
   */
  forces?(from: number, to: number): readonly IAutoMovieMotionHumanForce[];

  /**
   * What the performer's next action on a prop demands of a grip this action is choosing (`IAutoMovieMotionHumanActionLaw.demands`): the poses that action will hold the prop in, so a grasp is chosen for them as well as for its own reach. The action asked is the first later one of the performer that names the prop among its parameters; an action that asks nothing, or none, gives none. Absent on an overlay and on a context built outside a performance.
   *
   * @param grip The grip being weighed, with the posture this action leaves the body in with it.
   * @returns The poses demanded of it.
   */
  demands?(
    grip: IAutoMovieMotionHumanActionLaw.IGrip,
  ): readonly IAutoMovieMotionHumanActionLaw.IDemand[];

  /** How the composition cuts this action into the performer's next one, when it cuts it at one of this action's own events or shares (`IAutoMovieIntent.until`), with what that next action plants: a run cut into a vault lowers the pole to the plant over its last strides. Absent when the action is not so cut, on an overlay and on a context built outside a performance. */
  cut?: IAutoMovieMotionHumanActionContext.ICut;

  /**
   * This instance's draw stream for one channel.
   *
   * @param channel The quantity drawn.
   * @returns The stream.
   */
  random(channel: string): IAutoMovieRandom;

  /**
   * The draws of one channel across this action's repeats: one stream for every instance of the action's id, keyed by the chain seed, the subject, the action's id and the channel, with this instance's ordinal as the index into it. A low-discrepancy sequence over the repeats reads it, so consecutive repeats land apart.
   *
   * @param channel The quantity drawn.
   * @returns The stream and this instance's index.
   */
  series(channel: string): IAutoMovieMotionHumanActionContext.ISeries;
}

/** Contracts used by jump.plan, run.plan, stand.plan, support.plan. */
export namespace IAutoMovieMotionHumanActionContext {
  /**
   * Resolve an event of an earlier action or a cue track into film seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the admitted sources and output timebase.
   * @evidence contracts/development/design.md#principled-representation Reuses the scheduled instant representation, with numeric film time as the result.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Balance calls the existing performance resolver through the action context.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No duration share substitutes for the foreign named event.
   */
  export type Instant = (at: AutoMovieMotionHumanScheduledInstant) => number;

  /**
   * The action an overlay is performed over.
   *
   * @evidence contracts/development/common.md#meaningful-documentation support: What the carrier stands on when it is not the ground: the first prop its plan plants a foot on (a stance on a cart's bed), so an overlay that begins with it is carried by that prop (`HumanSupportFrame`). Absent on the ground.
   * @evidence contracts/development/design.md#principled-representation support: What the carrier stands on when it is not the ground: the first prop its plan plants a foot on (a stance on a cart's bed), so an overlay that begins with it is carried by that prop (`HumanSupportFrame`). Absent on the ground.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanBase.ts (AutoMovieMotionHumanBase.under).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieMotionHumanActionKey, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanContactWindow.Support identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ICarrier {
    /** Its name. */
    name: AutoMovieMotionHumanActionKey;

    /**
     * Its posture under the overlay.
     *
     * @param seconds Seconds of the overlay's own clock.
     * @param channels Optional requested channels; omitted for a whole-posture read.
     * @param resolution Optional same-body exact FK source borrowed only by this synchronous posture call, never retained by the carrier or returned posture.
     * @returns The carrier's posture at that instant; its last posture once it has ended. Only requested channels are valid when supplied.
     */
    posture(seconds: number,
      channels?: readonly AutoMovieMotionHumanChannel[],
      resolution?: IAutoMoviePoseResolution.ISource,
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3]): IAutoMovieMotionHumanPosture;

    /** What the carrier stands on when it is not the ground: the first prop its plan plants a foot on (a stance on a cart's bed), so an overlay that begins with it is carried by that prop (`HumanSupportFrame`). Absent on the ground. */
    support?: IAutoMovieMotionHumanContactWindow.Support;
  }

  /**
   * A person's root on the floor plan: where it is and which way it faces.
   *
   * @evidence contracts/development/common.md#meaningful-documentation position: The root, world metres. yaw: The heading, degrees about +Y with 0 facing +Z.
   * @evidence contracts/development/design.md#principled-representation position: The root, world metres. yaw: The heading, degrees about +Y with 0 facing +Z.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStation.ts (walkStation.point.read, return); perform/HumanPerformancePlace.ts (HumanPerformancePlace.place.context, return); perform/HumanPerformanceRead.ts (HumanPerformanceRead.root, return); ensemble/HumanFormation.ts (HumanFormation.frame); everyday/approach.ts (approach.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IRoot {
    /** The root, world metres. */
    position: IAutoMovieVector3;

    /** The heading, degrees about +Y with 0 facing +Z. */
    yaw: number;
  }

  /**
   * Another performer of a meeting and the role they take in it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation role: Their role's name within the kind. subject: Their subject id.
   * @evidence contracts/development/design.md#principled-representation role: Their role's name within the kind. subject: Their subject id.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceMeeting.ts (HumanPerformanceMeeting.reader, partner); perform/HumanPerformanceMeeting.ts (HumanPerformanceMeeting.reader.key, other); perform/HumanPerformanceMeeting.ts (HumanPerformanceMeeting.reader.meeting, other); perform/HumanPerformanceMeeting.ts (HumanPerformanceMeeting.reader).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanPerformanceMeeting.reader.
   */
  export interface IPartner {
    /** Their role's name within the kind. */
    role: string;

    /** Their subject id. */
    subject: string;
  }

  /**
   * A stream shared by every repeat of an action, with one repeat's place in it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation random: The stream, the same for every instance of the action's id. index: Which occurrence of the action's id in the performer's chain this is, from 0.
   * @evidence contracts/development/design.md#principled-representation random: The stream, the same for every instance of the action's id. index: Which occurrence of the action's id in the performer's chain this is, from 0.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanVariation.ts (AutoMovieMotionHumanVariation.of, return); compose/AutoMovieMotionHumanVariationDraw.ts (AutoMovieMotionHumanVariationDraw.uniforms, draws); compose/AutoMovieMotionHumanVariationDraw.ts (AutoMovieMotionHumanVariationDraw.normals, draws); compose/AutoMovieMotionHumanVariationDraw.ts (AutoMovieMotionHumanVariationDraw.disc, draws); perform/HumanPerformancePlace.ts (HumanPerformancePlace.place.context, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieRandom identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ISeries {
    /** The stream, the same for every instance of the action's id. */
    random: IAutoMovieRandom;

    /** Which occurrence of the action's id in the performer's chain this is, from 0. */
    index: number;
  }

  /**
   * How the composition cuts an action into the performer's next one
   * (`IAutoMovieMotionHumanActionContext.cut`): at one of the action's own
   * events or at a share of it, and what the next action plants.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it is; exactly one of `event` and `share` is present.
   * @evidence contracts/development/design.md#principled-representation The composition's own cut (`IAutoMovieIntent.until`) in this action's terms, and the next law's own plant declaration.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, what an action reads to prepare the next one's entry; built by `HumanPerformanceAhead.cut`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No action is named: the plant is the next law's declaration, read from its resolved parameters.
   */
  export interface ICut {
    /** The event of this action the cut falls at, its first occurrence; absent when the cut is at a share. */
    event?: string;

    /** The share of this action's uncut duration the cut falls at, in [0, 1]; absent when the cut is at an event. */
    share?: number;

    /** What the next action plants on the floor ahead as it is entered (`IAutoMovieMotionHumanActionLaw.plants`); absent when it plants nothing. */
    plant?: IAutoMovieMotionHumanActionLaw.IPlant;
  }

  /**
   * The arm solutions handed from one plan of an action to the next
   * (`IHumanActionContext.handover`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each member holds and who reads and writes it.
   * @evidence contracts/development/design.md#principled-representation The solutions are the planner's own handover records (`IAutoMovieMotionHumanArmPlanned.IWarm`), keyed as its groups key them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the last plan wrote, read; what this plan writes, filled. The performance owns both, per action.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No verdict, pose or trajectory is handed on: a solution starts a solve that admits its own result, so a stale one costs time, never a wrong plan.
   */
  export interface IHandover {
    /** The solutions the last plan of this action reached; absent for its first plan. */
    warm?: ReadonlyMap<string, IAutoMovieMotionHumanArmPlanned.IWarm>;

    /** Where this plan's solutions are written, for the next plan of this action. */
    last: Map<string, IAutoMovieMotionHumanArmPlanned.IWarm>;
  }
}
