import type { IAutoMovieVector3 } from "@automovie/interface";

import type { Student } from "../../entities/cast/student/Student";
import type { IStageProp } from "../../entities/props/IStageProp";
import type { IStageSet } from "../../entities/sets/IStageSet";
import type { IBodyState } from "../../laws/body/IBodyState";
import type { Gait } from "../../laws/everyday/Gait";
import type { StageAction } from "../../laws/staging/StageAction";

/**
 * Everything the stage laws relate: the set, the students by id and the
 * props by id, plus the state snapshot the schedule stores after each
 * student intent, which carries the state it started from so any second of
 * the action can be evaluated without looking anything else up.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the world and the snapshot hold.
 * @evidence contracts/development/design.md#principled-representation The snapshot pairs the start and end body states with the action's lead-in hold and its motion plan, in seconds and world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the laws, performance, prop track and camera read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene is named.
 */
export interface IStageWorld {
  /** The set. */
  set: IStageSet;

  /** Students by id. */
  students: ReadonlyMap<string, Student>;

  /** Props by id. */
  props: ReadonlyMap<string, IStageProp>;
}
export namespace IStageWorld {
  /** The schedule's snapshot after one student intent. */
  export interface IStudentStep {
    /** Discriminator. */
    kind: "student";

    /** The action. */
    action: StageAction.Action;

    /** Body state before the action. */
    from: IBodyState;

    /** Body state after the action. */
    to: IBodyState;

    /** Seconds held still before the action's own motion begins. */
    lead: number;

    /** The action's own seconds after the lead. */
    natural: number;

    /** The action's own contact offset after the lead, seconds, when it has one. */
    contact?: number;

    /** A walk's plan, when the action walks. */
    walk?: Gait.IPlan;

    /** The outcome class the laws decided, such as `withdrawn` for a habit-withdrawn offer. */
    outcome?: string;

    /** A world point the action reaches, such as a handover point or a floor point. */
    point?: IAutoMovieVector3;

    /** A flight's route points from the start position, world metres. */
    route?: IAutoMovieVector3[];
  }

  /** The schedule's snapshot after one prop intent. */
  export interface IPropStep {
    /** Discriminator. */
    kind: "prop";

    /** Where the prop rests, world metres. */
    point: IAutoMovieVector3;
  }

  /** Any snapshot. */
  export type Step = IStudentStep | IPropStep;
}
