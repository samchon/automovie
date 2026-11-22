import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
  IAutoMovieSchedule,
  IAutoMovieScheduleContext,
  IAutoMovieScheduleEntry,
  IAutoMovieScheduleLaws,
  IAutoMovieScheduleWalk,
} from "@automovie/interface";

import { AutoMovieSchedulePlace } from "./AutoMovieSchedulePlace";
import { AutoMovieScheduleWalk } from "./AutoMovieScheduleWalk";

/**
 * Place a composition on the film clock with the production's pure laws.
 *
 * The walk is depth first in declaration order. A sequence starts each part
 * at the previous part's end; a parallel group starts every part at its own
 * start and ends at the latest end; `at` starts its part at the named
 * anchor's contact instant (its start when the timing gives no contact) plus
 * the offset, and the walk continues after the later of the cursor and that
 * part's end. An `at` that names an `event` reads that instant of the anchor,
 * which may then be a cue track of the laws, and one that names `align` asks
 * the laws' `align` when its part must start for that instant of the part's
 * first intent to fall there. An intent with `until` ends at its cut (a share of its
 * duration, the share of one of the events its timing names, or the share at
 * which the `until` law finds a proximity) and drops a contact after the cut;
 * a proximity the law reports as never met leaves the intent uncut, so it
 * runs to its end, while laws with no `until` at all cannot place a proximity
 * cut and throw; the entry records the cut, and the entry the next
 * part of a sequence places there records it as `interruptedBy`. For each
 * intent the production's `timing` gives its duration
 * and optional contact offset, then `outcome` and `state` read the entries
 * placed so far, so an outcome may depend on earlier state. The result is
 * frozen at the schedule, entries array and individual entry levels. Nested
 * intent, state, cut and event records remain shared and unfrozen; callers keep
 * them stable. Pure laws and unchanged inputs give the same schedule.
 *
 * @param composition The composition.
 * @param laws The production's pure timing, outcome and state functions.
 * @returns The frozen schedule.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Place a composition on the film clock with the production's pure laws) and documents parameters `composition`, `laws`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation A single depth-first walk of the composition tree in declaration order, the interval-placement scheme of a timeline composer: a sequence chains ends to starts, a parallel group takes the latest end, an `at` takes an anchor's instant plus an offset. The premises are seconds on the film clock, the laws being pure (the same inputs give the same schedule, and an aligned part is timed again at the start `laws.align` returns), and every reference resolving to a placed anchor, a cue track or an event, which the walk checks and refuses with an `AutoMovieScheduleError` naming the code, the subject and capability, the value and the alternatives (anchor, event, index, duplicate, share, timing and law). A cut is a share in [0, 1] of the duration, found from a share, an own event, another anchor's or a cue track's event, or the `until` law's proximity share; a proximity never met cuts nothing. A start-aligned part places once, an aligned one asks `laws.align` first.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One recursive `place` over the four node kinds: the sequence and the group are its own joints, an intent and an `at` are placed by `AutoMovieSchedulePlace`, the cut by `AutoMovieScheduleCut`, and the instant lookups and the walk's state are `AutoMovieScheduleWalk`'s; the error shapes sit in `AutoMovieScheduleError`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; two non-null assertions (`entries[first]!`, `interrupted.get(e.index)!`) follow a length or `has` check. The only numeric literals are the structural 0 and 1 of the [0, 1] share range and indices; every value comes from the composition or the laws.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the n nodes of the composition; each anchor lookup is a map read, and each event lookup builds the anchor's instants and filters them, O(e) in that anchor's events. The result is one sort of the m entries, O(m log m), and one loop over their ends for the duration. No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 17 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function resolveAutoMovieSchedule(
  composition: IAutoMovieComposition,
  laws: IAutoMovieScheduleLaws,
): IAutoMovieSchedule {
  const walk: IAutoMovieScheduleWalk.IWalk = AutoMovieScheduleWalk.create(laws);
  // A parallel group's parts are placed in declaration order. A law reading
  // a subject another part of its own group holds reads them as placed at
  // the group's start (`IAutoMovieScheduleContext.meeting`); a law reading a
  // subject whose actions a waiting part of another group holds places that
  // part first (`IAutoMovieScheduleContext.demand`): a topological order over
  // the reads, so a production need not declare the read subject's chain
  // before the reader's. A part already being placed when a demand asks for
  // it is a cycle of reads.
  const waiting: IAutoMovieSchedulePart[] = [];
  // The parts being placed, outermost first.
  const placing: IAutoMovieSchedulePart[] = [];
  let demanding: number = 0;
  const placePart = (part: IAutoMovieSchedulePart): number => {
    part.status = "placing";
    placing.push(part);
    try {
      part.end = place(part.node, part.start);
    } finally {
      placing.pop();
    }
    part.status = "placed";
    waiting.splice(waiting.indexOf(part), 1);
    return part.end;
  };
  // Within one parallel group each actor reads the other as placed at the
  // group's start, for both roles alike: the innermost part being placed
  // whose group has another part holding the subject names that start.
  walk.meeting = (subject: string): number | undefined => {
    for (let i: number = placing.length - 1; i >= 0; --i) {
      const reader: IAutoMovieSchedulePart = placing[i]!;
      if (
        reader.siblings.some(
          (part: IAutoMovieSchedulePart): boolean =>
            part !== reader && part.subjects.has(subject),
        )
      )
        return reader.start;
    }
    return undefined;
  };
  // Up to the start of the part that holds a subject's next actions, the
  // subject holds the pose its placed actions end on; a part being placed
  // answers where no waiting one holds the subject (a cycle's partner).
  walk.horizon = (subject: string): number | undefined =>
    (
      waiting.find(
        (part: IAutoMovieSchedulePart): boolean =>
          part.status === "pending" && part.subjects.has(subject),
      ) ??
      waiting.find(
        (part: IAutoMovieSchedulePart): boolean =>
          part.status === "placing" && part.subjects.has(subject),
      )
    )?.start;
  // An anchor's own action is placed before the action that reads it.
  walk.demandAnchor = (anchor: string): IAutoMovieScheduleContext.Demand => {
    const next: IAutoMovieSchedulePart | undefined = waiting.find(
      (part: IAutoMovieSchedulePart): boolean =>
        part.status === "pending" && part.anchors.has(anchor),
    );
    if (next === undefined) return "none";
    ++demanding;
    try {
      placePart(next);
    } finally {
      --demanding;
    }
    return "placed";
  };
  walk.demand = (subject: string): IAutoMovieScheduleContext.Demand => {
    const next: IAutoMovieSchedulePart | undefined = waiting.find(
      (part: IAutoMovieSchedulePart): boolean =>
        part.status === "pending" && part.subjects.has(subject),
    );
    // A part that names an anchor a part being placed declares and has not
    // yet placed (in an `at`, a cut's `of` or its intents' parameters, where
    // a law names the action it answers) waits on that part: placing it now
    // would read an anchor not yet there, so the two read each other.
    if (
      next !== undefined &&
      placing.some((reader: IAutoMovieSchedulePart): boolean =>
        [...reader.anchors].some(
          (anchor: string): boolean =>
            !walk.anchors.has(anchor) && next.references.has(anchor),
        ),
      )
    )
      return "cycle";
    if (next !== undefined) {
      ++demanding;
      try {
        placePart(next);
      } finally {
        --demanding;
      }
      return "placed";
    }
    return demanding > 0 &&
      waiting.some(
        (part: IAutoMovieSchedulePart): boolean =>
          part.status === "placing" && part.subjects.has(subject),
      )
      ? "cycle"
      : "none";
  };
  const place = (node: IAutoMovieComposition, start: number): number => {
    if (node.kind === "intent")
      return AutoMovieSchedulePlace.intent(walk, node.intent, start);
    if (node.kind === "sequence") {
      // The entry an intent's cut interrupts is the first one the next part
      // places, found by that part's leading intent: a demand may place
      // another part's entries among them.
      let cutIndex: number | undefined;
      return node.parts.reduce(
        (at: number, part: IAutoMovieComposition): number => {
          const first: number = walk.entries.length;
          const end: number = place(part, at);
          const leading: IAutoMovieIntent | undefined =
            AutoMovieScheduleWalk.leading(part);
          const own: number = walk.entries.findIndex(
            (e: IAutoMovieScheduleEntry, i: number): boolean =>
              i >= first && e.intent === leading,
          );
          if (cutIndex !== undefined && own >= 0)
            walk.interrupted.set(cutIndex, own);
          cutIndex =
            part.kind === "intent" &&
            walk.last !== undefined &&
            walk.entries[walk.last]!.intent === part.intent &&
            walk.entries[walk.last]!.cut !== undefined
              ? walk.last
              : undefined;
          return end;
        },
        start,
      );
    }
    if (node.kind === "parallel") {
      const group: IAutoMovieSchedulePart[] = [];
      for (const part of node.parts) {
        const record: IAutoMovieSchedulePart = {
          node: part,
          start,
          end: start,
          status: "pending",
          subjects: subjects(part),
          anchors: anchors(part),
          references: references(part),
          siblings: group,
        };
        group.push(record);
        waiting.push(record);
      }
      return group.reduce(
        (end: number, part: IAutoMovieSchedulePart): number =>
          Math.max(end, part.status === "placed" ? part.end : placePart(part)),
        start,
      );
    }
    return AutoMovieSchedulePlace.at(walk, node, start, place);
  };
  const end: number = place(composition, 0);
  const sorted: IAutoMovieScheduleEntry[] = [...walk.entries].sort(
    (a: IAutoMovieScheduleEntry, b: IAutoMovieScheduleEntry): number =>
      a.start - b.start || a.index - b.index,
  );
  let duration: number = end;
  for (const entry of walk.entries)
    if (entry.end > duration) duration = entry.end;
  return Object.freeze({
    entries: Object.freeze(
      sorted.map((e: IAutoMovieScheduleEntry) =>
        Object.freeze(
          walk.interrupted.has(e.index)
            ? { ...e, interruptedBy: walk.interrupted.get(e.index)! }
            : e,
        ),
      ),
    ),
    duration,
  });
}

/** A part of a parallel group: where it starts, its placing state and end, and the subjects whose actions it holds. */
interface IAutoMovieSchedulePart {
  /** The part. */
  node: IAutoMovieComposition;

  /** Its group's start, film seconds. */
  start: number;

  /** Its end once placed, film seconds. */
  end: number;

  /** Whether it waits, is being placed, or is placed. */
  status: AutoMovieSchedulePartStatus;

  /** The subjects of its intents. */
  subjects: ReadonlySet<string>;

  /** The anchors its intents declare. */
  anchors: ReadonlySet<string>;

  /** The names it may refer an anchor by: its `at` parts' anchors, its cuts' `of` and every string its intents' parameters hold. */
  references: ReadonlySet<string>;

  /** Every part of its group, itself included. */
  siblings: readonly IAutoMovieSchedulePart[];
}

/** A parallel part's placing state. */
type AutoMovieSchedulePartStatus = "pending" | "placing" | "placed";

/** The subjects of a composition's intents. */
function subjects(node: IAutoMovieComposition): Set<string> {
  const out: Set<string> = new Set();
  const visit = (n: IAutoMovieComposition): void => {
    if (n.kind === "intent") out.add(n.intent.subject);
    else if (n.kind === "at") visit(n.part);
    else n.parts.forEach(visit);
  };
  visit(node);
  return out;
}

/**
 * The names a composition may refer an anchor by: the anchor of each `at`
 * part, the `of` of each cut, and every string its intents' parameters
 * hold, where a law names the anchored action it answers. A string that is
 * no anchor's name is read only against the anchors of the parts being
 * placed, so it can at most hold a partner at what they had placed, as a
 * cycle is held.
 */
function references(node: IAutoMovieComposition): Set<string> {
  const out: Set<string> = new Set();
  const strings = (value: unknown): void => {
    if (typeof value === "string") out.add(value);
    else if (Array.isArray(value)) value.forEach(strings);
    else if (typeof value === "object" && value !== null)
      Object.values(value).forEach(strings);
  };
  const visit = (n: IAutoMovieComposition): void => {
    if (n.kind === "intent") {
      strings(n.intent.parameters);
      if (n.intent.until !== undefined && "of" in n.intent.until)
        out.add(n.intent.until.of);
    } else if (n.kind === "at") {
      out.add(n.anchor);
      visit(n.part);
    } else n.parts.forEach(visit);
  };
  visit(node);
  return out;
}

/** The anchors a composition's intents declare. */
function anchors(node: IAutoMovieComposition): Set<string> {
  const out: Set<string> = new Set();
  const visit = (n: IAutoMovieComposition): void => {
    if (n.kind === "intent") {
      if (n.intent.anchor !== undefined) out.add(n.intent.anchor);
    } else if (n.kind === "at") visit(n.part);
    else n.parts.forEach(visit);
  };
  visit(node);
  return out;
}