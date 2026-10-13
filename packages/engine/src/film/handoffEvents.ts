import { IAutoMovieInteractionEvent } from "@automovie/interface";

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
 * {@link eventTimeKey}, unique within a shot as long as one child is not handed
 * to the same parent twice at one instant. Times are shot-local seconds.
 * {@link coupleObjects} calls this once per handoff it bakes; a staged mount
 * emits no events at all.
 *
 * @param child Coupled child node id.
 * @param parent Parent node id whose bone carries the child.
 * @param start Shot-local second the child is grabbed and attached.
 * @param end Shot-local second the child is detached and released.
 * @param actionIndex Index of the authored `attachTo` action.
 * @returns Four new events in grab, attach, detach, release order.
 *
 * @evidence contracts/common.md#principled-implementation A fixed table of the four handoff kinds mapped to the shared envelope, so the pairing of kinds with the start and end instants is data rather than four hand-written literals; the id embeds kind, participants and the canonical time key, which keeps it unique under the stated premise.
 * @evidence contracts/common.md#clear-and-simple-design Separated from `coupleObjects` so the coupling baker states what it bakes while the event envelope, its id format and its order live in one place.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every handoff gets the same four events with the same envelope; nothing depends on which child, parent or bone is involved.
 * @evidence contracts/common.md#meaningful-documentation States the four kinds and their instants, the role each id plays in the envelope, the null point and reaction, the id format and its uniqueness premise, the time unit, the caller, and that mounts emit nothing.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: four events built from a four-entry table.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure constructor of one handoff's events that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the four returned events.
 */
export const handoffEvents = (
  child: string,
  parent: string,
  start: number,
  end: number,
  actionIndex: number,
): IAutoMovieInteractionEvent[] =>
  HANDOFF_KINDS.map(
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
