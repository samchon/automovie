import type { IAutoMovieInteractionEvent } from "@automovie/interface";

import { eventTimeKey } from "./eventTimeKey";

/*
 * The four scripted-cue events one `attachTo` handoff emits: the child is
 * grabbed and attached at `start`, then detached and released at `end`.
 *
 * Every event names the child as both `actor` and `object` and the parent as
 * `target`, carries no contact point or reaction, and records `actionIndex`,
 * the authored action's index, so a reader can trace it back. Its id is
 * `<kind>:<child>:<parent>:<time>` with the time written by
 * eventTimeKey. Repeated participant pairs in one formatted time bin
 * collide, and participant ids containing colons can make the delimiter join
 * ambiguous; this constructor does not enforce uniqueness. Times are shot-local
 * seconds. coupleObjects calls this once per handoff it bakes; a staged
 * mount emits no events at all.
 * Parameter child: Coupled child node id.
 * Parameter parent: Parent node id whose bone carries the child.
 * Parameter start: Shot-local second the child is grabbed and attached.
 * Parameter end: Shot-local second the child is detached and released.
 * Parameter actionIndex: Index of the authored `attachTo` action.
 * Returns: Four new events in grab, attach, detach, release order.
 */
export function handoffEvents(
  child: string,
  parent: string,
  start: number,
  end: number,
  actionIndex: number,
): IAutoMovieInteractionEvent[] {
  return HANDOFF_KINDS.map(
    ([kind, at]: readonly [
      IAutoMovieInteractionEvent["kind"],
      "start" | "end",
    ]): IAutoMovieInteractionEvent => {
      const time: number = at === "start" ? start : end;
      return {
        id: `${kind}:${child}:${parent}:${eventTimeKey(time)}`,
        kind,
        source: "scriptedCue",
        time,
        actor: child,
        target: parent,
        object: child,
        point: null,
        actionIndex,
        reaction: null,
      };
    },
  );
}

/*
 * The four handoff kinds in emission order, each with the end it fires at.
 */
const HANDOFF_KINDS: ReadonlyArray<
  readonly [IAutoMovieInteractionEvent["kind"], "start" | "end"]
> = [
  ["grab", "start"],
  ["attach", "start"],
  ["detach", "end"],
  ["release", "end"],
];
