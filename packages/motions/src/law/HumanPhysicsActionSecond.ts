import type { IAutoMovieMotionHumanBalance } from "@automovie/interface";

import { HumanPhysics } from "./HumanPhysics";
import { HumanPhysicsInvalid } from "./HumanPhysicsInvalid";

/** Resolve one open or close bound in the current action's seconds. */
export function HumanPhysicsActionSecond(
  bound: IAutoMovieMotionHumanBalance.IBound,
  field: string,
  start: number,
  timing: HumanPhysics.ITiming,
  resolve: HumanPhysics.Instant | undefined,
): number {
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
    return resolve(HumanPhysics.instant(bound, bound.of)) - start;
  }
  if (index === 0 && bound.event === "start") return offset;
  if (index === 0 && bound.event === "end") return timing.duration + offset;
  let occurrence: number = 0;
  for (const event of timing.events)
    if (event.name === bound.event && occurrence++ === index)
      return event.share * timing.duration + offset;
  throw HumanPhysicsInvalid(
    field,
    bound.event,
    "name an event and occurrence in the action's plan",
  );
}
