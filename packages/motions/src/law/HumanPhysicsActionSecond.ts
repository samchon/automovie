import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBalance,
} from "@automovie/interface";

import { HumanPhysics } from "./HumanPhysics";
import { HumanPhysicsInvalid } from "./HumanPhysicsInvalid";

/** The action clock's numeric extent. */
type Timing = Pick<HumanPhysics.ITiming, "duration">;

/** Resolve a bound or request its local clock's named events. */
export function HumanPhysicsActionSecond(
  bound: IAutoMovieMotionHumanBalance.IBound,
  field: string,
  start: number,
  timing: Timing,
  resolve: HumanPhysics.Instant | undefined,
): HumanPhysicsActionSecond.Bound {
  const index: number = bound.index ?? 0;
  const offset: number = bound.offset ?? 0;
  if (index < 0)
    throw HumanPhysicsInvalid(
      field,
      index,
      "name a nonnegative integer event occurrence",
    );
  if (bound.of !== undefined) {
    if (resolve === undefined)
      throw HumanPhysicsInvalid(
        field,
        bound.of,
        "resolve that anchor in a performance",
      );
    return {
      kind: "second",
      value: resolve(HumanPhysics.instant(bound, bound.of)) - start,
    };
  }
  if (index === 0 && bound.event === "start")
    return { kind: "second", value: offset };
  if (index === 0 && bound.event === "end")
    return { kind: "second", value: timing.duration + offset };
  return {
    kind: "events",
    read: (events: readonly IAutoMovieMotionEvent[]): number => {
      let occurrence: number = 0;
      for (const event of events)
        if (event.name === bound.event && occurrence++ === index)
          return event.share * timing.duration + offset;
      throw HumanPhysicsInvalid(
        field,
        bound.event,
        "name an event and occurrence in the action's plan",
      );
    },
  };
}

/** The two ways a bound reaches its action-local second. */
export namespace HumanPhysicsActionSecond {
  /** A resolved direct bound or a named occurrence to read from the clock. */
  export type Bound =
    | {
        /** A start, end or resolved external instant. */
        kind: "second";

        /** Its action-local second. */
        value: number;
      }
    | {
        /** A named occurrence of the current action. */
        kind: "events";

        /** Resolve the occurrence against the local named events in order. */
        read(events: readonly IAutoMovieMotionEvent[]): number;
      };
}
