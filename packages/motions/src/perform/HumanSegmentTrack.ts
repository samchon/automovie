import { poseJointCodec } from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";

import { AutoMovieMotionHumanAudit } from "../audit/AutoMovieMotionHumanAudit";
import { AutoMovieMotionHumanAuditSpin } from "../audit/AutoMovieMotionHumanAuditSpin";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { humanRig } from "../posture/humanRig";
import { HumanSegment } from "./HumanSegment";
import type { HumanSegmentPoseSeeds } from "./HumanSegmentPoseSeeds";
import { HumanSegmentTrackLeaf } from "./HumanSegmentTrackLeaf";
import { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/**
 * A placed action's displayed pose compiled into a track once its resolved
 * person is admitted ({@link enable}; no caller admits one at present), so a
 * pose at a new second is an interval lookup,
 * a quadratic, the range clamp and a closed-form correction of the planted
 * limbs, with no iterative limb fit.
 *
 * The track spans the seconds its action is the person's active one. Every
 * instant where the displayed pose may lose smoothness is a seam: the
 * action's events, contact windows, flight, plan end and entering
 * transition's cut and decay; its overlays' entries, fades, ends, events and
 * windows; the layers' windows and fades; the holds' starts and ends; and
 * every resolved weapon stop. Seams split the span, and each part is split
 * evenly into intervals no longer than {@link FILL}. An interval is tried as
 * one leaf through the exact displayed poses at its two ends and its middle
 * (`HumanSegmentTrackLeaf`), checked against the exact poses at its two
 * quarter points; one that fails is halved, a fixed binary tree whose
 * outcome depends only on the exact poses, never on the order of queries.
 * Halving stops at {@link SHORTEST}: an interval that has not passed by then
 * is shown by the exact evaluator, as is a flight, a span shorter than that,
 * any second outside the track and every second before the performance is
 * resolved. A second that is a knot is read from its leaf like any other,
 * which reproduces the knot's angles and root and passes the same clamp.
 *
 * Error contract, at both quarter points of every leaf: every bone's world
 * joint centre within {@link POSITION} of the exact pose's and its world
 * orientation within {@link ORIENTATION}, each scaled by {@link QUARTER}.
 * The exact displayed poses read while knots are evaluated are themselves
 * exact and uncached ({@link building}), so a knot never depends on
 * another track's interpolation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the domain, the seams, the tree, every fallback, how a knot second is read and the error contract with its constants.
 * @evidence contracts/development/design.md#principled-representation Film seconds throughout; a track per placed action and person, each node an interval in one of four states (unread, leaf, split, exact).
 * @evidence contracts/development/design.md#minimal-and-owned-surface The displayed evaluator reads pose and building; state construction calls enable and HumanSegment.forget calls forget; the constants are the contract's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Tracks live in a weak map keyed by the person record, so no consumer's record grows a member; no action, body or test is named.
 */
export namespace HumanSegmentTrack {
  /**
   * The joint-centre bound at a leaf's quarter points, metres: the
   * continuity audit's jump limit (`AutoMovieMotionHumanAudit.LIMITS.jump`,
   * 5 mm, also the slip and lift bound) over 4. An error e at every sample
   * changes a step between two samples by at most 2e and a step's departure
   * from its neighbours' mean, the reading the audit resolves, by at most
   * 4e, so the interpolation alone cannot raise a departure past the limit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the source limit and the derivation of the factor.
   * @evidence contracts/development/design.md#principled-representation One length compared with a joint centre's distance.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the leaf check.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Derived from the audit's own owner constant, not tuned to a motion.
   */
  export const POSITION: number = AutoMovieMotionHumanAudit.LIMITS.jump / 4;

  /**
   * The bone-orientation bound at a leaf's quarter points, degrees: the spin
   * audit's snap limit (`AutoMovieMotionHumanAuditSpin.SNAP`) over 4, by the
   * same departure argument as {@link POSITION}.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the source limit and the factor.
   * @evidence contracts/development/design.md#principled-representation One angle compared with a bone's world turn between two poses.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the leaf check.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Derived from the audit's owner constant.
   */
  export const ORIENTATION: number = AutoMovieMotionHumanAuditSpin.SNAP / 4;

  /**
   * The share of a quadratic leaf's largest leading error read at its
   * quarter points: the error's leading term is f'''/6 · s³ · (v³ - v) for v
   * from -1 to 1 over the half interval s, whose magnitude is 0.375 at the
   * quarter points v = ±1/2 and 2/(3√3) ≈ 0.385 at its peaks v = ±1/√3. A
   * reading within QUARTER of a bound therefore keeps the leading error
   * within the bound across the whole leaf; higher-order terms, the clamp
   * and the correction are not covered by this factor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the derivation and what it does not cover.
   * @evidence contracts/development/design.md#principled-representation A dimensionless ratio.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the leaf check.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ratio of two values of one polynomial, no fitted number.
   */
  export const QUARTER: number = 0.375 / (2 / (3 * Math.sqrt(3)));

  /**
   * The longest interval tried as one leaf, seconds (provisional, a cost
   * bound only: a longer root costs at most one failed check before halving,
   * and accuracy is fixed by the check, not by this length).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit and that it bounds cost, not error.
   * @evidence contracts/development/design.md#principled-representation One duration.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read when a track is compiled.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Marked provisional; no verdict depends on it.
   */
  export const FILL: number = 0.5;

  /**
   * The shortest leaf, seconds: one frame of the densest grid the
   * vocabulary's readers sample, 120 Hz. A leaf costs at least two exact
   * evaluations, so a shorter one would cost more than the exact evaluator
   * at that rate; an interval that fails at this length is shown exactly.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the rate it comes from and why.
   * @evidence contracts/development/design.md#principled-representation One duration.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read when a track is compiled and when a node is halved.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A cost limit; failing it falls back to the exact path, never to a looser check.
   */
  export const SHORTEST: number = 1 / 120;

  /**
   * Whether a knot is being evaluated. While one is, every displayed pose is
   * the exact evaluator's, read and stored in no cache.
   *
   * @returns Whether any knot evaluation is under way.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the meaning and its effect on the displayed evaluator.
   * @evidence contracts/development/implementation.md#principled-implementation A depth counter raised around each knot evaluation, synchronous so no other work interleaves.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Counts every nested knot, so an inner evaluation ending cannot clear an outer one's mode.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads one counter.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function building(): boolean {
    return depth > 0;
  }

  /**
   * Let a resolved person's actions be shown through tracks from now on.
   * No caller admits a person at present: interpolated poses broke exact
   * identities between films (an overlay's unclaimed channels) and their
   * knot and check evaluations cost more than the exact reads they replaced,
   * so every pose is exact until a redesigned build policy is admitted.
   *
   * @param person The person, once every placement, contact, flight and end of their performance is final.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the precondition and that no caller admits a person now, with the reasons.
   * @evidence contracts/development/implementation.md#principled-implementation A person with an entry in the weak map is tracked; before it, every pose is exact, as contacts and flights are resolved against exact poses.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map insertion, idempotent.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Existing tracks are kept on a repeated call.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Coordinates no work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The weak map releases the person's tracks with the person record.
   */
  export function enable(person: HumanSegment.IPerson): void {
    if (!TRACKS.has(person)) TRACKS.set(person, new Map());
  }

  /**
   * Drop every track of a person, for when what they show has changed.
   *
   * @param person The person.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when it is called.
   * @evidence contracts/development/implementation.md#principled-implementation Clears the person's compiled tracks; an enabled person rebuilds them on demand.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional clear.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the enabled state, which belongs to resolution, not to a change of plan.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant plus the map's release.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Coordinates no work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Releases every knot and leaf of the person.
   */
  export function forget(person: HumanSegment.IPerson): void {
    TRACKS.get(person)?.clear();
  }

  /**
   * The tracked displayed pose of an active action at a second, or none
   * where the exact evaluator must show it.
   *
   * @param person The person.
   * @param segment The action active at the second.
   * @param seconds Film seconds.
   * @param evaluate The exact displayed evaluation of the action at a second with a fresh preparation, returning its final goals.
   * @returns A fresh pose, or undefined for the exact path.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the fresh result and when none is returned.
   * @evidence contracts/development/implementation.md#principled-implementation Compiles the action's track on first demand, finds the interval holding the second by binary search and descends the tree, settling each unread node on the way by the quarter-point check.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Domain check, interval search and one descent loop; node settling and knots are private helpers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every unsupported case returns undefined so the caller runs the exact evaluator; no tolerance is relaxed on failure.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(log N) search over N intervals and O(depth) descent; a node's first settling costs at most three new exact evaluations (its middle once, two quarter points), every later query in its leaf none.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Knots are shared by exact film second across the nodes that meet there; equivalence holds because a knot is a pure function of the resolved person and its second, and forget drops every knot when that changes.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The person's weak-map entry owns its tracks until forget or the person's release; a track holds at most 4 · ceil(FILL / SHORTEST) + 1 knots per interval and one leaf per settled node.
   */
  export function pose(
    person: HumanSegment.IPerson,
    segment: HumanSegment.ISegment,
    seconds: number,
    evaluate: (seconds: number, prepared: prepareHumanSegmentPose.IPrepared) => HumanSegmentPoseSeeds.ISeeded,
  ): IAutoMoviePose | undefined {
    const tracks: Map<HumanSegment.ISegment, ITrack> | undefined = TRACKS.get(person);
    if (tracks === undefined) return undefined;
    let track: ITrack | undefined = tracks.get(segment);
    if (track === undefined) {
      track = compile(person, segment, evaluate);
      tracks.set(segment, track);
    }
    if (!(seconds >= track.from && seconds <= track.to)) return undefined;

    // Even a second that is a knot is read from its leaf, so its value never
    // depends on which neighbouring node happened to be settled first.
    let node: INode | undefined = find(track.tops, seconds);
    while (node !== undefined) {
      if (node.state === "unread") settle(track, node);
      if (node.state === "exact") return undefined;
      if (node.state === "leaf") return HumanSegmentTrackLeaf.emit(node.leaf!, seconds, track.context);
      node = seconds < node.children![1].from ? node.children![0] : node.children![1];
    }
    return undefined;
  }
}

/** Nested knot evaluations under way. */
let depth: number = 0;

/** Each enabled person's tracks by action. */
const TRACKS: WeakMap<HumanSegment.IPerson, Map<HumanSegment.ISegment, ITrack>> = new WeakMap();

/** One action's compiled track. */
interface ITrack {
  /** First film second it shows. */
  from: number;

  /** Last film second it shows. */
  to: number;

  /** The intervals between seams and fills, ascending. */
  tops: INode[];

  /** Exact poses by film second. */
  knots: Map<number, HumanSegmentTrackLeaf.IKnot>;

  /** The body context every leaf shares. */
  context: HumanSegmentTrackLeaf.IContext;

  /** A fresh evaluation preparation sharing the body's static ROM metadata. */
  prepare: () => prepareHumanSegmentPose.IPrepared;

  /** The exact evaluator of the action. */
  evaluate: (seconds: number, prepared: prepareHumanSegmentPose.IPrepared) => HumanSegmentPoseSeeds.ISeeded;
}

/** One interval of a track's tree. */
interface INode {
  /** Start, film seconds. */
  from: number;

  /** End, film seconds. */
  to: number;

  /** Not yet checked, a leaf, halved, or shown exactly. */
  state: "unread" | "leaf" | "split" | "exact";

  /** The compiled interval, for a leaf. */
  leaf?: HumanSegmentTrackLeaf.ILeaf;

  /** The two halves, for a split node. */
  children?: [INode, INode];
}

/** Compile an action's domain, seams and intervals; the tree itself is read lazily. */
function compile(
  person: HumanSegment.IPerson,
  segment: HumanSegment.ISegment,
  evaluate: ITrack["evaluate"],
): ITrack {
  const body: HumanSegment.IPerson["performer"]["body"] = person.performer.body;
  const prepare: () => prepareHumanSegmentPose.IPrepared = prepareHumanSegmentPose.queries(body);
  const track: ITrack = {
    from: segment.entryTime,
    to: segment.entryTime,
    tops: [],
    knots: new Map(),
    context: { body, clamp: prepare().clamp, codec: poseJointCodec(humanRig(body)) },
    prepare,
    evaluate,
  };

  // The action is the active one from its entry until a later-placed action
  // enters (`HumanSegmentSelection.last`), and its plan moves until its end.
  const index: number = person.segments.indexOf(segment);
  if (index < 0) return track;
  let to: number = Math.max(segment.entryTime, segment.end);
  for (let j: number = index + 1; j < person.segments.length; j++)
    to = Math.min(to, person.segments[j]!.entryTime);
  if (!(to - segment.entryTime >= HumanSegmentTrack.SHORTEST)) return track;
  track.to = to;

  const seams: number[] = [track.from, track.to, ...instants(person, segment)]
    .filter((t: number): boolean => Number.isFinite(t) && t >= track.from && t <= track.to)
    .sort((a: number, b: number): number => a - b);
  const kept: number[] = [];
  for (const t of seams) if (kept.length === 0 || t - kept[kept.length - 1]! > 1e-9) kept.push(t);
  kept[kept.length - 1] = track.to;

  // A flight's root is the staged or physical rotation owner's, shown exactly.
  const flight: [number, number] | undefined =
    segment.plan.flight === undefined
      ? undefined
      : [
          segment.start + segment.plan.flight.from * segment.plan.duration,
          segment.start + segment.plan.flight.to * segment.plan.duration,
        ];
  for (let i: number = 0; i + 1 < kept.length; i++) {
    const from: number = kept[i]!;
    const length: number = kept[i + 1]! - from;
    const airborne: boolean =
      flight !== undefined && from >= flight[0] - 1e-9 && kept[i + 1]! <= flight[1] + 1e-9;
    if (airborne || length < HumanSegmentTrack.SHORTEST) {
      track.tops.push({ from, to: kept[i + 1]!, state: "exact" });
      continue;
    }
    const parts: number = Math.ceil(length / HumanSegmentTrack.FILL - 1e-9);
    for (let k: number = 0; k < parts; k++)
      track.tops.push({
        from: from + (length * k) / parts,
        to: k + 1 === parts ? kept[i + 1]! : from + (length * (k + 1)) / parts,
        state: "unread",
      });
  }
  return track;
}

/** Every instant where the action's displayed pose may lose smoothness. */
function instants(person: HumanSegment.IPerson, segment: HumanSegment.ISegment): number[] {
  const out: number[] = [];
  const of = (s: HumanSegment.ISegment): void => {
    const at = (share: number): number => s.start + share * s.plan.duration;
    out.push(s.entryTime, s.end, s.start + s.plan.duration);
    for (const e of s.plan.events) out.push(at(e.share));
    for (const c of s.plan.contacts) out.push(at(c.from), at(c.to));
    if (s.plan.flight !== undefined) out.push(at(s.plan.flight.from), at(s.plan.flight.to));
  };
  of(segment);
  if (segment.transition !== undefined)
    out.push(segment.transition.cut, segment.transition.cut + segment.transition.blend);
  for (const overlay of person.overlays) {
    of(overlay);
    out.push(overlay.entryTime + HumanSegment.FADE, overlay.end - HumanSegment.FADE, overlay.end + HumanSegment.FADE);
  }
  for (const l of person.layers) out.push(l.from, l.from - l.fade, l.from + l.fade, l.to, l.to - l.fade, l.to + l.fade);
  for (const h of person.holds) out.push(h.from, h.until);
  for (const s of person.stops.values()) out.push(s);
  return out;
}

/** The interval holding a second. */
function find(tops: readonly INode[], seconds: number): INode | undefined {
  let lo: number = 0;
  let hi: number = tops.length - 1;
  while (lo <= hi) {
    const mid: number = (lo + hi) >> 1;
    const node: INode = tops[mid]!;
    if (seconds < node.from) hi = mid - 1;
    else if (seconds > node.to) lo = mid + 1;
    else return node;
  }
  return undefined;
}

/** Check an unread node: a leaf when both quarter points hold, else halved or exact. */
function settle(track: ITrack, node: INode): void {
  const middle: number = (node.from + node.to) / 2;
  const leaf: HumanSegmentTrackLeaf.ILeaf | null = HumanSegmentTrackLeaf.create(
    track.context,
    knot(track, node.from),
    knot(track, middle),
    knot(track, node.to),
  );
  if (leaf === null) {
    node.state = "exact";
    return;
  }
  const holds = (seconds: number): boolean => {
    const e: { position: number; orientation: number } = HumanSegmentTrackLeaf.error(
      track.context.body,
      HumanSegmentTrackLeaf.emit(leaf, seconds, track.context),
      knot(track, seconds).pose,
    );
    return (
      e.position <= HumanSegmentTrack.POSITION * HumanSegmentTrack.QUARTER &&
      e.orientation <= HumanSegmentTrack.ORIENTATION * HumanSegmentTrack.QUARTER
    );
  };
  if (holds((node.from + middle) / 2) && holds((middle + node.to) / 2)) {
    node.state = "leaf";
    node.leaf = leaf;
    return;
  }
  if ((node.to - node.from) / 2 < HumanSegmentTrack.SHORTEST) {
    node.state = "exact";
    return;
  }
  node.state = "split";
  node.children = [
    { from: node.from, to: middle, state: "unread" },
    { from: middle, to: node.to, state: "unread" },
  ];
}

/** The exact pose at a second, evaluated once per track with every nested display exact. */
function knot(track: ITrack, seconds: number): HumanSegmentTrackLeaf.IKnot {
  const known: HumanSegmentTrackLeaf.IKnot | undefined = track.knots.get(seconds);
  if (known !== undefined) return known;
  const seeded: HumanSegmentPoseSeeds.ISeeded = exact(track, seconds);
  const planted: Set<IHumanPosture.Limb> = new Set();
  for (const [limb, goal] of Object.entries(seeded.limbs ?? {}) as [IHumanPosture.Limb, IHumanPosture.IGoal][])
    if (goal.planted === true) planted.add(limb);
  const made: HumanSegmentTrackLeaf.IKnot = { seconds, pose: copy(seeded.pose), planted };
  track.knots.set(seconds, made);
  return made;
}

/** One exact evaluation with every display it reads exact, restoring the mode on return or throw. */
function exact(track: ITrack, seconds: number): HumanSegmentPoseSeeds.ISeeded {
  ++depth;
  try {
    return track.evaluate(seconds, track.prepare());
  } finally {
    --depth;
  }
}

/** A pose's independent copy. */
function copy(pose: IAutoMoviePose): IAutoMoviePose {
  return {
    skeleton: pose.skeleton,
    root:
      pose.root === null
        ? null
        : {
            translation: { ...pose.root.translation },
            rotation: { ...pose.root.rotation },
            scale: { ...pose.root.scale },
          },
    joints: pose.joints.map((j: IAutoMoviePose["joints"][number]): IAutoMoviePose["joints"][number] => ({ ...j })),
  };
}
