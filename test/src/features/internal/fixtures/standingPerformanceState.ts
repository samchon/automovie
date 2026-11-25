import type {
  IAutoMovieIntent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";
import { HumanPerformanceTether } from "@automovie/motions/internal";

import { motionActionContext } from "../motionActionContext";
import { syntheticHumanPlan } from "../synthetic/syntheticHumanPlan";
import { humanFixtureBody } from "./humanFixtureBody";

/**
 * A synthetic performance record for readers of people, segments or intents.
 * It contains the stored average man's rest posture at the origin facing `+Z`
 * with two already placed one-second actions and the given props.
 *
 * @param props The props, empty by default.
 * @returns A fresh state consisting of the supplied and synthetic records.
 */
export async function standingPerformanceState(
  props: IAutoMovieMotionHumanProp[] = [],
): Promise<standingPerformanceState.IResult> {
  const performer: IAutoMovieMotionHumanPerformer = {
    subject: "actor",
    body: await humanFixtureBody("m-average"),
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    proficiency: { level: "trained" },
  };
  const read: IAutoMovieMotionHumanActionContext = motionActionContext(
    performer.body,
    {},
    { subject: performer.subject, props },
  );
  const context: IAutoMovieMotionHumanActionContext<never> = {
    ...read,
    get params(): never {
      throw new Error("The synthetic segment has no authored parameters");
    },
  };
  const plan: IAutoMovieMotionHumanActionPlan = syntheticHumanPlan({
    duration: 1,
    posture: read.entry.posture,
  });
  const law: IAutoMovieMotionHumanActionLaw<never> = {
    name: "stand",
    interrupts: {},
    plan: (): IAutoMovieMotionHumanActionPlan => {
      throw new Error("The synthetic segment is already placed");
    },
  };
  const intent: IAutoMovieIntent = { subject: performer.subject, capability: "stand" };
  const indices: readonly number[] = [0, 1];
  const entries: IAutoMovieScheduleEntry[] = indices.map(
    (index: number): IAutoMovieScheduleEntry => ({
      index,
      subject: performer.subject,
      intent,
      start: index,
      end: index + 1,
    }),
  );
  const segments: IAutoMovieMotionHumanSegment[] = entries.map(
    (entry: IAutoMovieScheduleEntry): IAutoMovieMotionHumanSegment => ({
      index: entry.index,
      entry: entry.index,
      id: "stand",
      name: "stand",
      params: {},
      law,
      context,
      plan,
      start: entry.start,
      entryTime: entry.start,
      end: entry.end,
    }),
  );
  const person: IAutoMovieMotionHumanSegment.IPerson = {
    performer,
    skill: read.skill,
    segments,
    overlays: [],
    initial: read.entry.posture,
    layers: [],
    layer: {
      subject: performer.subject,
      body: performer.body,
      skill: read.skill,
      aim: read.aim,
      action: () => undefined,
      random: read.random,
    },
    holds: [],
    stops: new Map(),
  };
  const propMap: Map<string, IAutoMovieMotionHumanProp> = new Map(
    props.map((prop: IAutoMovieMotionHumanProp): [string, IAutoMovieMotionHumanProp] => [prop.subject, prop]),
  );
  return {
    state: {
      schedule: { entries, duration: 2 },
      duration: 2,
      performers: [performer],
      people: new Map([[performer.subject, person]]),
      props: propMap,
      tethered: HumanPerformanceTether.index(propMap),
      anchors: new Map(),
      grips: new Map(),
      meetings: new Map(),
      laws: new Map([["stand", law]]),
      riding: new Set(),
      obstacles: [],
      forces: [],
      cues: {},
      clipped: new Map(),
      layered: new Map(),
      intended: new Map([[performer.subject, [intent, intent]]]),
      blasts: [],
      strikes: [],
      resolving: false,
      demand: undefined,
      horizon: undefined,
      meeting: undefined,
      demandAnchor: undefined,
      flight: "staged",
      placements: entries.length,
      trial: undefined,
      handovers: new Map(),
      soft: new Map(),
      writers: new Map(),
      flights: new Map(),
      flying: new Map(),
      hits: undefined,
    },
    context: read,
  };
}

/** Companion types of {@link standingPerformanceState}. */
export namespace standingPerformanceState {
  /** The synthetic state and the context from which its first entry is read. */
  export interface IResult {
    /** Context with an empty parameter record. */
    context: IAutoMovieMotionHumanActionContext;

    /** The synthetic state. */
    state: IAutoMovieMotionHumanPerformanceState;
  }
}
