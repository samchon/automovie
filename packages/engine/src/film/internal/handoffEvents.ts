import type { IAutoMovieInteractionEvent } from "@automovie/interface";

import { eventTimeKey } from "./eventTimeKey";

/** The four handoff kinds in emission order, each with the end it fires at. */
const HANDOFF_KINDS: ReadonlyArray<
  readonly [IAutoMovieInteractionEvent["kind"], "start" | "end"]
> = [
  ["grab", "start"],
  ["attach", "start"],
  ["detach", "end"],
  ["release", "end"],
];

/**
 * The four scripted-cue events one `attachTo` handoff emits: the child is
 * grabbed and attached at `start`, then detached and released at `end`.
 *
 * Every event names the child as both `actor` and `object` and the parent as
 * `target`, carries no contact point or reaction, and records `actionIndex`,
 * the authored action's index, so a reader can trace it back. Its id is
 * `<kind>:<child>:<parent>:<time>` with the time written by
 * {@link eventTimeKey}. Repeated participant pairs in one formatted time bin
 * collide, and participant ids containing colons can make the delimiter join
 * ambiguous; this constructor does not enforce uniqueness. Times are shot-local
 * seconds. {@link coupleObjects} calls this once per handoff it bakes; a staged
 * mount emits no events at all.
 *
 * @param child Coupled child node id.
 * @param parent Parent node id whose bone carries the child.
 * @param start Shot-local second the child is grabbed and attached.
 * @param end Shot-local second the child is detached and released.
 * @param actionIndex Index of the authored `attachTo` action.
 * @returns Four new events in grab, attach, detach, release order.
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
