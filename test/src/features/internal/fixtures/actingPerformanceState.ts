import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import { standingPerformanceState } from "./standingPerformanceState";

/**
 * A performance state among the given props whose person's actions are
 * replaced by the given ones, for unit tests of the readers of placed actions:
 * each action a copy of the standing fixture's first stand at its own placement,
 * its plan's contacts emptied and its given plan fields laid over. The state's
 * prepared grips and writers are cleared, so its readers assemble them from
 * these actions.
 *
 * @param props The props.
 * @param actions The actions' placements and plan fields.
 * @returns The state.
 */
export async function actingPerformanceState(
  props: IAutoMovieMotionHumanProp[],
  actions: readonly actingPerformanceState.IAction[],
): Promise<IAutoMovieMotionHumanPerformanceState> {
  const { state } = await standingPerformanceState(props);
  const person: IAutoMovieMotionHumanSegment.IPerson =
    state.people.get("actor")!;
  const template: IAutoMovieMotionHumanSegment = person.segments[0]!;
  const segments: IAutoMovieMotionHumanSegment[] = actions.map(
    (action: actingPerformanceState.IAction): IAutoMovieMotionHumanSegment => ({
      ...template,
      start: action.start,
      entryTime: action.entryTime ?? action.start,
      end: action.end,
      plan: {
        ...template.plan,
        contacts: [],
        duration: action.duration,
        ...action.plan,
      },
    }),
  );
  return {
    ...state,
    people: new Map([["actor", { ...person, segments, overlays: [] }]]),
    grips: new Map(),
    writers: new Map(),
  };
}

/** Companion types of {@link actingPerformanceState}. */
export namespace actingPerformanceState {
  /** One action's placement and plan fields. */
  export interface IAction {
    /** Its plan's zero, film seconds. */
    start: number;

    /** When it entered, film seconds; its start by default. */
    entryTime?: number;

    /** Its end, film seconds. */
    end: number;

    /** Its plan's duration, seconds. */
    duration: number;

    /** Plan fields laid over the stand's. */
    plan?: Partial<IAutoMovieMotionHumanActionPlan>;
  }
}
