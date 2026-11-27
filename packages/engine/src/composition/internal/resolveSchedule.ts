import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
  IAutoMovieSchedule,
  IAutoMovieScheduleContext,
  IAutoMovieScheduleEntry,
  IAutoMovieScheduleLaws,
  IAutoMovieScheduleWalk,
} from "@automovie/interface";

import { AutoMovieEngineScheduleCut } from "../AutoMovieEngineScheduleCut";
import { AutoMovieEngineSchedulePlace } from "../AutoMovieEngineSchedulePlace";
import { AutoMovieEngineScheduleWalk } from "../AutoMovieEngineScheduleWalk";

/*
 * Place a composition on the film clock with the production's pure laws.
 *
 * The walk is depth first in declaration order. A sequence starts each part at
 * the previous part's end; a parallel group starts every part at its own start
 * and ends at the latest end; `at` starts its part at the named anchor's
 * contact instant (its start when the timing gives no contact) plus the offset,
 * and the walk continues after the later of the cursor and that part's end. An
 * `at` that names an `event` reads that instant of the anchor, which may then
 * be a cue track of the laws, and one that names `align` asks the laws' `align`
 * when its part must start for that instant of the part's first intent to fall
 * there. An intent with `until` ends at its cut (a share of its duration, the
 * share of one of the events its timing names, or the share at which the
 * `until` law finds a proximity) and drops a contact after the cut; a proximity
 * the law reports as never met leaves the intent uncut, so it runs to its end,
 * while laws with no `until` at all cannot place a proximity cut and throw; the
 * entry records the cut, and the entry the next part of a sequence places there
 * records it as `interruptedBy`. For each intent the production's `timing`
 * gives its duration and optional contact offset, then `outcome` and `state`
 * read the entries placed so far, so an outcome may depend on earlier state.
 * Legacy untagged cuts are normalized before the walk. Canonical intents are
 * retained by reference, and legacy intents are copied once for the walk.
 * Callers keep shared intent and state records stable. Pure laws and unchanged
 * inputs give the same schedule.
 * Parameter composition: The composition.
 * Parameter laws: The production's pure timing, outcome and state functions.
 * Returns: The placed entries ordered by start time and the total duration.
 */
export function resolveSchedule(
  composition: IAutoMovieComposition,
  laws: IAutoMovieScheduleLaws,
): IAutoMovieSchedule {
  const walk: IAutoMovieScheduleWalk.IWalk = AutoMovieEngineScheduleWalk.create(laws);
  // A parallel group's parts are placed in declaration order. A law reading
  // a subject another part of its own group holds reads them as placed at
  // the group's start (`IAutoMovieScheduleContext.meeting`); a law reading a
  // subject whose actions a waiting part of another group holds places that
  // part first (`IAutoMovieScheduleContext.demand`): a topological order over
  // the reads, so a production need not declare the read subject's chain
  // before the reader's. A part already being placed when a demand asks for
  // it is a cycle of reads, and so is a part that names an anchor a part
  // being placed has not yet placed, past its leading actions that do not.
  const waiting: IAutoMovieSchedulePart[] = [];
  // The parts being placed, outermost first.
  const placing: IAutoMovieSchedulePart[] = [];
  let demanding: number = 0;
  // A sequence part is placed from where a demand's prefix left it
  // (`IAutoMovieScheduleProgress`), any other part whole.
  const placePart = (part: IAutoMovieSchedulePart): number => {
    part.status = "placing";
    placing.push(part);
    try {
      if (part.node.type === "sequence") {
        part.progress ??= fresh(part.start);
        advance(part.node.parts, part.progress);
        part.end = part.progress.at;
      } else part.end = place(part.node, part.start);
    } finally {
      placing.pop();
    }
    part.status = "placed";
    waiting.splice(waiting.indexOf(part), 1);
    return part.end;
  };
  // A sequence part waiting on an anchor a part being placed declares has
  // its leading actions that do not wait on it placed now, up to the first
  // that does: a person's actions before the one that answers the anchored
  // action are read as placed (a pick-up before the disarm that answers the
  // take), never as the entry they started from. Returns whether any action
  // was placed.
  const placePrefix = (
    part: IAutoMovieSchedulePart,
    readers: readonly IAutoMovieSchedulePart[],
  ): boolean => {
    if (part.node.type !== "sequence") return false;
    const progress: IAutoMovieScheduleProgress = (part.progress ??= fresh(
      part.start,
    ));
    const from: number = progress.next;
    part.status = "placing";
    placing.push(part);
    ++demanding;
    try {
      advance(
        part.node.parts,
        progress,
        (child: IAutoMovieComposition): boolean =>
          waits(references(child), readers),
      );
    } finally {
      --demanding;
      placing.pop();
      part.status = "pending";
    }
    if (progress.next >= part.node.parts.length) {
      part.status = "placed";
      part.end = progress.at;
      waiting.splice(waiting.indexOf(part), 1);
    }
    return progress.next > from;
  };
  // Whether a composition names an anchor a part being placed declares and
  // has not yet placed (in an `at`, a cut's `of` or its intents' parameters,
  // where a law names the action it answers): placing it now would read an
  // anchor not yet there.
  const waits = (
    named: ReadonlySet<string>,
    readers: readonly IAutoMovieSchedulePart[],
  ): boolean =>
    readers.some((reader: IAutoMovieSchedulePart): boolean =>
      [...reader.anchors].some(
        (anchor: string): boolean =>
          !walk.anchors.has(anchor) && named.has(anchor),
      ),
    );
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
    // A part that waits on an anchor a part being placed declares (`waits`)
    // has only its leading actions that do not wait placed (`placePrefix`);
    // past them the two read each other.
    if (next !== undefined && waits(next.references, placing))
      return placePrefix(next, [...placing]) ? "placed" : "cycle";
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
  // A sequence's parts placed in order from its progress, each from the
  // previous one's end, until one the caller holds back (`until`). The entry
  // an intent's cut interrupts is the first one the next part places, found
  // by that part's leading intent: a demand may place another part's entries
  // among them.
  const advance = (
    parts: readonly IAutoMovieComposition[],
    progress: IAutoMovieScheduleProgress,
    until?: (part: IAutoMovieComposition) => boolean,
  ): void => {
    for (; progress.next < parts.length; ++progress.next) {
      const part: IAutoMovieComposition = parts[progress.next]!;
      if (until !== undefined && until(part)) return;
      const first: number = walk.entries.length;
      progress.at = place(part, progress.at);
      const leading: IAutoMovieIntent | undefined =
        AutoMovieEngineScheduleWalk.leading(part);
      const own: number = walk.entries.findIndex(
        (e: IAutoMovieScheduleEntry, i: number): boolean =>
          i >= first && e.intent === leading,
      );
      if (progress.cut !== undefined && own >= 0)
        walk.interrupted.set(progress.cut, own);
      progress.cut =
        part.type === "intent" &&
        walk.last !== undefined &&
        walk.entries[walk.last]!.intent === part.intent &&
        walk.entries[walk.last]!.cut !== undefined
          ? walk.last
          : undefined;
    }
  };
  const place = (node: IAutoMovieComposition, start: number): number => {
    if (node.type === "intent")
      return AutoMovieEngineSchedulePlace.intent(walk, node.intent, start);
    if (node.type === "sequence") {
      const progress: IAutoMovieScheduleProgress = fresh(start);
      advance(node.parts, progress);
      return progress.at;
    }
    if (node.type === "parallel") {
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
    return AutoMovieEngineSchedulePlace.at(walk, node, start, place);
  };
  const end: number = place(normalizeCuts(composition, new WeakMap()), 0);
  const sorted: IAutoMovieScheduleEntry[] = [...walk.entries].sort(
    (a: IAutoMovieScheduleEntry, b: IAutoMovieScheduleEntry): number =>
      a.start - b.start || a.index - b.index,
  );
  let duration: number = end;
  for (const entry of walk.entries)
    if (entry.end > duration) duration = entry.end;
  return {
    entries: sorted.map((e: IAutoMovieScheduleEntry) =>
      walk.interrupted.has(e.index)
        ? { ...e, interruptedBy: walk.interrupted.get(e.index)! }
        : e,
    ),
    duration,
  };
}

/*
 * Share authored nodes and intents wherever their cuts are already tagged.
 */
function normalizeCuts(
  node: IAutoMovieComposition,
  normalized: WeakMap<IAutoMovieIntent, IAutoMovieIntent>,
): IAutoMovieComposition {
  if (node.type === "intent") {
    const intent: IAutoMovieIntent = node.intent;
    const authored: IAutoMovieIntent.IUntil | undefined = intent.until;
    if (authored === undefined) return node;
    const known: IAutoMovieIntent | undefined = normalized.get(intent);
    if (known !== undefined) return { ...node, intent: known };
    const until: IAutoMovieIntent.IUntil =
      AutoMovieEngineScheduleCut.normalize(authored);
    if (until === authored) return node;
    const canonical: IAutoMovieIntent = { ...intent, until };
    normalized.set(intent, canonical);
    return { ...node, intent: canonical };
  }
  if (node.type === "at") {
    const part: IAutoMovieComposition = normalizeCuts(node.part, normalized);
    return part === node.part ? node : { ...node, part };
  }
  let parts: IAutoMovieComposition[] | undefined;
  for (const [index, part] of node.parts.entries()) {
    const canonical: IAutoMovieComposition = normalizeCuts(part, normalized);
    if (canonical !== part) {
      parts ??= [...node.parts];
      parts[index] = canonical;
    }
  }
  return parts === undefined ? node : { ...node, parts };
}

/*
 * A part of a parallel group: where it starts, its placing state and end, and
 * the subjects whose actions it holds.
 */
interface IAutoMovieSchedulePart {
  /*
   * The part.
   */
  node: IAutoMovieComposition;

  /*
   * Its group's start, film seconds.
   */
  start: number;

  /*
   * Its end once placed, film seconds.
   */
  end: number;

  /*
   * Whether it waits, is being placed, or is placed.
   */
  status: AutoMovieSchedulePartStatus;

  /*
   * The subjects of its intents.
   */
  subjects: ReadonlySet<string>;

  /*
   * The anchors its intents declare.
   */
  anchors: ReadonlySet<string>;

  /*
   * The names it may refer an anchor by: its `at` parts' anchors, its cuts'
   * `of` and every string its intents' parameters hold.
   */
  references: ReadonlySet<string>;

  /*
   * Every part of its group, itself included.
   */
  siblings: readonly IAutoMovieSchedulePart[];

  /*
   * How far a sequence part is placed, once a demand placed its leading
   * actions.
   */
  progress?: IAutoMovieScheduleProgress;
}

/*
 * How far a sequence is placed: its next part, where that part starts, and the
 * entry its cut waits to name the interrupter of.
 */
interface IAutoMovieScheduleProgress {
  /*
   * The index of the next part to place.
   */
  next: number;

  /*
   * Where the next part starts, film seconds.
   */
  at: number;

  /*
   * The entry whose cut the next part's leading intent interrupts, if any.
   */
  cut: number | undefined;
}

/*
 * A sequence's progress before any part is placed.
 */
function fresh(start: number): IAutoMovieScheduleProgress {
  return { next: 0, at: start, cut: undefined };
}

/*
 * A parallel part's placing state.
 */
type AutoMovieSchedulePartStatus = "pending" | "placing" | "placed";

/*
 * The subjects of a composition's intents.
 */
function subjects(node: IAutoMovieComposition): Set<string> {
  const out: Set<string> = new Set();
  const visit = (n: IAutoMovieComposition): void => {
    if (n.type === "intent") out.add(n.intent.subject);
    else if (n.type === "at") visit(n.part);
    else n.parts.forEach(visit);
  };
  visit(node);
  return out;
}

/*
 * The names a composition may refer an anchor by: the anchor of each `at` part,
 * the `of` of each cut, and every string its intents' parameters hold, where a
 * law names the anchored action it answers. A string that is no anchor's name
 * is read only against the anchors of the parts being placed, so it can at most
 * hold a partner at what they had placed, as a cycle is held.
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
    if (n.type === "intent") {
      strings(n.intent.parameters);
      if (n.intent.until?.type === "anchor-event") out.add(n.intent.until.of);
    } else if (n.type === "at") {
      out.add(n.anchor);
      visit(n.part);
    } else n.parts.forEach(visit);
  };
  visit(node);
  return out;
}

/*
 * The anchors a composition's intents declare.
 */
function anchors(node: IAutoMovieComposition): Set<string> {
  const out: Set<string> = new Set();
  const visit = (n: IAutoMovieComposition): void => {
    if (n.type === "intent") {
      if (n.intent.anchor !== undefined) out.add(n.intent.anchor);
    } else if (n.type === "at") visit(n.part);
    else n.parts.forEach(visit);
  };
  visit(node);
  return out;
}
