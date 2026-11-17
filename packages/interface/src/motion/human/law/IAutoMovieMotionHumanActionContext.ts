import type { IAutoMovieRandom } from "../../../core/IAutoMovieRandom";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieScheduleCue } from "../../composition/IAutoMovieScheduleCue";
import type { AutoMovieMotionHumanActionKey } from "../AutoMovieMotionHumanActionKey";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionMeeting } from "../compose/IAutoMovieMotionMeeting";
import type { IAutoMovieMotionMeetingKind } from "../compose/IAutoMovieMotionMeetingKind";
import type { IAutoMovieMotionHumanAttribute } from "../ensemble/IAutoMovieMotionHumanAttribute";
import type { IAutoMovieMotionHumanForce } from "../perform/IAutoMovieMotionHumanForce";
import type { IAutoMovieMotionHumanObstacle } from "../perform/IAutoMovieMotionHumanObstacle";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanSkill } from "../skill/IAutoMovieMotionHumanSkill";
import type { IAutoMovieMotionHumanActionLaw } from "./IAutoMovieMotionHumanActionLaw";
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

  /** A factor on every span of the action that physics does not fix, over its manner's own tempo (`AutoMovieMotionManner.of`): 1 when absent, and more where the action is replanned to take the time its planned motion needs within the speed bound (Hollerbach 1984's time scaling, applied where the action is placed). */
  tempo?: number;

  /** The action this one is performed over, when it is an overlay: a wave during a walk. The carrier keeps the root and the legs and whatever else it does not yield; this action writes only the channels it claims, on the carrier's posture of the same instant. Absent for an action that carries the body itself. */
  carrier?: IAutoMovieMotionHumanActionContext.ICarrier;

  /**
   * A target's world point and outward unit normal at a film second.
   *
   * @param target The target.
   * @param seconds Film seconds.
   * @returns The aim.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionContext.aim: A target's world point and outward unit normal at a film second.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionContext.aim is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionContext.aim is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionContext.aim is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionContext.aim is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionContext.aim is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionContext.aim is used through packages/motions/src/perform/HumanPerformancePlace.ts.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionContext.action: Another action already placed in the performance, by its anchor: a defence reads the attack it answers, a receiver the offer it takes.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionContext.action is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionContext.action is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionContext.action is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionContext.action is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionContext.action is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionContext.action is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   */
  action(anchor: string): IAutoMovieMotionHumanPlacedAction;

  /**
   * Another person in the performance: their body and their displayed world bones at a film second, so a law can place any region or socket of theirs or sweep against their colliders. Call it only from a posture, for seconds at or before the one evaluated, as with `aim`.
   *
   * @param subject The other person.
   * @returns Their body and bone query.
   * @throws {Error} When no such performer exists.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionContext.performer: Another person in the performance: their body and their displayed world bones at a film second, so a law can place any region or socket of theirs or sweep against their colliders. Call it only from a posture, for seconds at or before the one evaluated, as with `aim`.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionContext.performer is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionContext.performer is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionContext.performer is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionContext.performer is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionContext.performer is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionContext.performer is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   */
  performer(subject: string): IAutoMovieMotionHumanPerformerReader;

  /**
   * A prop of the performance with its displayed world frame at a film second, carried by whichever hand grips it then. Unlike `performer`, it may be read at plan time for seconds before the action's start: where an object lies, or the giver's hand it rests in.
   *
   * @param subject The prop.
   * @returns The prop and its frame query.
   * @throws {Error} When no such prop exists.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionContext.prop: A prop of the performance with its displayed world frame at a film second, carried by whichever hand grips it then. Unlike `performer`, it may be read at plan time for seconds before the action's start: where an object lies, or the giver's hand it rests in.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionContext.prop is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionContext.prop is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionContext.prop is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionContext.prop is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionContext.prop is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionContext.prop is used through packages/motions/src/perform/HumanPerformancePlace.ts.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionContext.meeting: The meeting of an action this performer does with others: the one record every role reads, computed from where all stand at this action's start by whichever role is planned first, and the same whichever that is. With no partner it is this role's own meeting on its default places, which is not solid. It may be read at plan time, so the partners' earlier actions must be placed first, as `HumanChain.mutual` places them.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionContext.meeting is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionContext.meeting is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionContext.meeting is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionContext.meeting is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionContext.meeting is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionContext.meeting is used through packages/motions/src/perform/HumanPerformancePlace.ts.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionContext.cue: One of the film's cue tracks (`IAutoMovieMotionHumanPerformance.IInput.cues`): its named instants in film seconds, in the track's order, so a law can place its own beats on a score's or its stresses on a line's (a dance's steps on the beats, a nod on an accent). It may be read at plan time. A law that only needs to start at a cue is synced by its composition instead.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionContext.cue is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionContext.cue is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionContext.cue is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionContext.cue is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionContext.cue is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionContext.cue is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   */
  cue(track: string): readonly IAutoMovieScheduleCue[];

  /**
   * What stands in the way in this performance (`IAutoMovieMotionHumanPerformance.IInput.obstacles`): the scene's solids with their openings, which a law that moves the body across the floor asks
   * `HumanObstacle.blocking` about before it plans a stretch of its path.
   *
   * @returns The obstacles; none when the performance was given none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionContext.obstacles: What stands in the way in this performance (`IAutoMovieMotionHumanPerformance.IInput.obstacles`): the scene's solids with their openings, which a law that moves the body across the floor asks `HumanObstacle.blocking` about before it plans a stretch of its path.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionContext.obstacles is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionContext.obstacles is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionContext.obstacles is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionContext.obstacles is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionContext.obstacles is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionContext.obstacles is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   */
  obstacles(): readonly IAutoMovieMotionHumanObstacle[];

  /**
   * The forces on this performer in a span of this action (`IAutoMovieMotionHumanPerformance.IInput.forces`, #3429): impulses and sustained forces, known before the action plans because they are inputs. A reaction reads them to size its response; none acts by itself. Absent on a context built outside a performance.
   *
   * @param from Seconds since the action's start.
   * @param to Seconds since the action's start, at least `from`.
   * @returns The forces, in the order the performance was given them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionContext.forces: The forces on this performer in a span of this action (`IAutoMovieMotionHumanPerformance.IInput.forces`, #3429): impulses and sustained forces, known before the action plans because they are inputs. A reaction reads them to size its response; none acts by itself. Absent on a context built outside a performance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionContext.forces is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionContext.forces is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionContext.forces is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionContext.forces is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionContext.forces is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionContext.forces is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   */
  forces?(from: number, to: number): readonly IAutoMovieMotionHumanForce[];

  /**
   * What the performer's next action on a prop demands of a grip this action is choosing (`IAutoMovieMotionHumanActionLaw.demands`): the poses that action will hold the prop in, so a grasp is chosen for them as well as for its own reach. The action asked is the first later one of the performer that names the prop among its parameters; an action that asks nothing, or none, gives none. Absent on an overlay and on a context built outside a performance.
   *
   * @param grip The grip being weighed, with the posture this action leaves the body in with it.
   * @returns The poses demanded of it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionContext.demands: What the performer's next action on a prop demands of a grip this action is choosing (`IAutoMovieMotionHumanActionLaw.demands`): the poses that action will hold the prop in, so a grasp is chosen for them as well as for its own reach. The action asked is the first later one of the performer that names the prop among its parameters; an action that asks nothing, or none, gives none. Absent on an overlay and on a context built outside a performance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionContext.demands is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionContext.demands is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionContext.demands is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionContext.demands is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionContext.demands is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionContext.demands is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   */
  demands?(
    grip: IAutoMovieMotionHumanActionLaw.IGrip,
  ): readonly IAutoMovieMotionHumanActionLaw.IDemand[];

  /**
   * This instance's draw stream for one channel.
   *
   * @param channel The quantity drawn.
   * @returns The stream.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionContext.random: This instance's draw stream for one channel.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionContext.random is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionContext.random is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionContext.random is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionContext.random is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionContext.random is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionContext.random is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   */
  random(channel: string): IAutoMovieRandom;

  /**
   * The draws of one channel across this action's repeats: one stream for every instance of the action's id, keyed by the chain seed, the subject, the action's id and the channel, with this instance's ordinal as the index into it. A low-discrepancy sequence over the repeats reads it, so consecutive repeats land apart.
   *
   * @param channel The quantity drawn.
   * @returns The stream and this instance's index.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionContext.series: The draws of one channel across this action's repeats: one stream for every instance of the action's id, keyed by the chain seed, the subject, the action's id and the channel, with this instance's ordinal as the index into it. A low-discrepancy sequence over the repeats reads it, so consecutive repeats land apart.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionContext.series is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionContext.series is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionContext.series is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionContext.series is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionContext.series is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionContext.series is used through packages/motions/src/perform/HumanPerformancePlace.ts.
   */
  series(channel: string): IAutoMovieMotionHumanActionContext.ISeries;
}

/** Contracts used by jump.plan, run.plan, stand.plan, support.plan. */
export namespace IAutoMovieMotionHumanActionContext {
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
     * @returns The carrier's posture at that instant; its last posture once it has ended.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanActionContext.ICarrier.posture: Its posture under the overlay.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanActionContext.ICarrier.posture is used through packages/motions/src/perform/HumanPerformancePlace.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanActionContext.ICarrier.posture is used through packages/motions/src/perform/HumanPerformancePlace.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanActionContext.ICarrier.posture is used through packages/motions/src/perform/HumanPerformancePlace.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanActionContext.ICarrier.posture is used through packages/motions/src/perform/HumanPerformancePlace.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanActionContext.ICarrier.posture is used through packages/motions/src/perform/HumanPerformancePlace.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanActionContext.ICarrier.posture is used through packages/motions/src/perform/HumanPerformancePlace.ts.
     */
    posture(seconds: number): IAutoMovieMotionHumanPosture;

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
}
