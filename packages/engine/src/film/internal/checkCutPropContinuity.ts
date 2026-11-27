import type {
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieEditPlan,
  IAutoMovieNodeChannel,
  IAutoMovieSampledChannel,
  IAutoMovieSequence,
  IAutoMovieSequenceEntry,
  IAutoMovieShot,
  IAutoMovieTrack,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { channelKey } from "../../resolve/internal/channelKey";
import { sampleClipSequence } from "../../resolve/internal/sampleClipSequence";
import { AutoMovieEngineViolationCollector } from "../../validation/AutoMovieEngineViolationCollector";

/*
 * Check declared prop channels across adjoining plays of the same staged set.
 * Layout admission must already have checked spans, ids and references. Report
 * missing, unreadable or discontinuous samples and differences beyond the
 * stated tolerance on the requirement's path in plan order. The editor marks
 * which props need to match, as in the [Orlando continuity
 * script](https://www.bfi.org.uk/inside-the-archive/features/continuity-script-sally-potters-orlando).
 */
export function checkCutPropContinuity(
  sequence: IAutoMovieSequence,
  requirements: readonly PropRequirement[],
  shotById: (id: string) => IAutoMovieShot,
  out: IAutoMovieViolationCollector,
): void {
  const demands: Map<number, IBoundaryDemand> = new Map();
  const checks: Check[] = [];

  // Compile valid requirements into distinct boundary demands before sampling.
  // Queue admission findings so they retain their order among comparison findings.
  for (let index: number = 0; index < requirements.length; index++) {
    const requirement: PropRequirement = requirements[index]!;
    const path: string = `$input.requiredPropContinuity[${index}]`;
    const findings: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
    const demand: IBoundaryDemand | undefined = compileBoundaryDemand(
      sequence,
      requirement,
      path,
      shotById,
      findings,
    );
    if (demand === undefined) checks.push({ violations: findings.items });
    else {
      demands.set(requirement.entry, demand);
      checks.push({ path, requirement });
    }
  }

  const pairs: Map<number, IBoundaryPair> = new Map();
  for (const [entry, demand] of demands)
    pairs.set(entry, {
      left: sampleBoundary(demand.outgoing, demand.end, true),
      end: demand.end,
      right: sampleBoundary(demand.incoming, demand.start, false),
      start: demand.start,
    });

  for (const check of checks) {
    if ("violations" in check) {
      out.items.push(...check.violations);
      continue;
    }
    const {
      path,
      requirement,
    }: { path: string; requirement: PropRequirement } = check;
    const { entry, node, component, tolerance }: PropRequirement = requirement;
    const { left, end, right, start }: IBoundaryPair = pairs.get(entry)!;
    const key: string = channelKey({ kind: "node", node, path: component });
    const leftValue: number[] | undefined = readBoundary(
      left,
      key,
      `outgoing entry ${entry - 1} at ${end}s`,
      path,
      out,
    );
    const rightValue: number[] | undefined = readBoundary(
      right,
      key,
      `incoming entry ${entry} at ${start}s`,
      path,
      out,
    );
    if (leftValue === undefined || rightValue === undefined) continue;

    const distance: number | undefined = channelDistance(
      component,
      leftValue,
      rightValue,
      path,
      out,
    );
    if (distance === undefined) continue;
    if (distance > tolerance)
      out.push(
        "range",
        path,
        `prop "${node}" ${component} changes by ${distance} across entries ${entry - 1} and ${entry}; tolerance is ${tolerance}`,
        distance,
        distance - tolerance,
      );
  }
}

/*
 * One declared prop-channel requirement.
 */
type PropRequirement = NonNullable<
  IAutoMovieEditPlan["requiredPropContinuity"]
>[number];

/*
 * One boundary sample, or the sampling fault that prevented it.
 */
type Boundary =
  | {
      channels: Map<string, IAutoMovieSampledChannel>;
      discontinuities: Set<string>;
    }
  | { fault: string };

/*
 * A hard cut's two shot-local reads, shared by every valid requirement on it.
 */
interface IBoundaryDemand {
  /*
   * Object clips from the shot leaving the cut.
   */
  outgoing: readonly IAutoMovieClip[];

  /*
   * Shot-local end of the outgoing play, in seconds.
   */
  end: number;

  /*
   * Object clips from the shot entering the cut.
   */
  incoming: readonly IAutoMovieClip[];

  /*
   * Shot-local start of the incoming play, in seconds.
   */
  start: number;
}

/*
 * The two once-sampled reads and their source times for reporting.
 */
interface IBoundaryPair {
  /*
   * The outgoing sample and its local time in seconds.
   */
  left: Boundary;
  end: number;

  /*
   * The incoming sample and its local time in seconds.
   */
  right: Boundary;
  start: number;
}

/*
 * One plan item in original order, ready to compare or report.
 */
type Check =
  | { path: string; requirement: PropRequirement }
  | { violations: IAutoMovieConstraintViolation[] };

/*
 * Validate one requirement and bind the two source times and clip lists it asks
 * to sample.
 */
function compileBoundaryDemand(
  sequence: IAutoMovieSequence,
  requirement: PropRequirement,
  path: string,
  shotById: (id: string) => IAutoMovieShot,
  out: IAutoMovieViolationCollector,
): IBoundaryDemand | undefined {
  const { entry, component, tolerance }: PropRequirement = requirement;
  if (entry < 1 || entry >= sequence.shots.length)
    out.push(
      "range",
      `${path}.entry`,
      "incoming entry must be an integer indexing a play after the first",
      entry,
    );
  out.range(
    `${path}.tolerance`,
    tolerance,
    0,
    component === "rotation" ? Math.PI : Infinity,
    "prop continuity tolerance",
  );
  if (out.items.length > 0) return undefined;

  const before: IAutoMovieSequenceEntry = sequence.shots[entry - 1]!;
  const after: IAutoMovieSequenceEntry = sequence.shots[entry]!;
  if (after.transition !== null) {
    out.push(
      "type",
      `${path}.entry`,
      "prop continuity requires a hard cut into the addressed entry",
      entry,
    );
    return undefined;
  }
  const beforeShot: IAutoMovieShot = shotById(before.shot);
  const afterShot: IAutoMovieShot = shotById(after.shot);
  if (beforeShot.scene !== afterShot.scene) {
    out.push(
      "type",
      `${path}.entry`,
      "prop continuity requires both shots to reference the same staged scene",
      entry,
    );
    return undefined;
  }

  return {
    outgoing: beforeShot.objectMotions,
    end:
      before.exactSourceEnd ??
      (before.trim === null
        ? beforeShot.duration
        : before.trim.start + before.trim.duration),
    incoming: afterShot.objectMotions,
    start: after.trim?.start ?? 0,
  };
}

/*
 * Sample the boundary once and mark outgoing channels whose inclusive sample
 * cannot establish their left limit.
 */
function sampleBoundary(
  clips: readonly IAutoMovieClip[],
  time: number,
  outgoing: boolean,
): Boundary {
  try {
    const channels: Map<string, IAutoMovieSampledChannel> = sampleClipSequence(
      clips,
      time,
    );
    const discontinuities: Set<string> = new Set();
    if (outgoing) {
      // Playback grants authority to the latest first key, breaking ties by
      // later clip order. Only that track can make the inclusive sample unsafe.
      const starts: Map<string, number> = new Map();
      for (const clip of clips) {
        const wraps: boolean =
          clip.loop && clip.duration > 0 && time % clip.duration === 0;
        const local: number =
          clip.loop && clip.duration > 0 ? time % clip.duration : time;
        for (const track of clip.tracks) {
          const first: number = track.times[0]!;
          if (first > time) continue;
          const key: string = channelKey(track.channel);
          if (first < (starts.get(key) ?? -Infinity)) continue;
          starts.set(key, first);
          if (first === time || wraps || stepsAt(track, local))
            discontinuities.add(key);
          else discontinuities.delete(key);
        }
      }
    }
    return { channels, discontinuities };
  } catch (error) {
    return { fault: error instanceof Error ? error.message : String(error) };
  }
}

/*
 * A STEP track changes at every key after its first, including its last key.
 */
function stepsAt(track: IAutoMovieTrack, time: number): boolean {
  return (
    track.interpolation === "step" &&
    time > track.times[0]! &&
    track.times.includes(time)
  );
}

/*
 * Refuse absent, unreadable or non-finite values at the addressed boundary.
 */
function readBoundary(
  boundary: Boundary,
  key: string,
  side: string,
  path: string,
  out: IAutoMovieViolationCollector,
): number[] | undefined {
  if ("fault" in boundary) {
    out.push(
      "type",
      path,
      `${side} object motion could not be sampled: ${boundary.fault}`,
      key,
    );
    return undefined;
  }
  const value: number[] | undefined = boundary.channels.get(key)?.value;
  if (boundary.discontinuities.has(key))
    out.push(
      "type",
      path,
      `${side} requires a left limit at a track start, STEP key or loop wrap`,
      key,
    );
  else if (value === undefined)
    out.push(
      "type",
      path,
      `${side} lacks an active object-motion track for the requested prop channel`,
      key,
    );
  else return value;
  return undefined;
}

/*
 * Compare magnitudes in channel units, using the sign-invariant short rotation
 * arc for unit quaternions.
 */
function channelDistance(
  component: IAutoMovieNodeChannel["path"],
  left: number[],
  right: number[],
  path: string,
  out: IAutoMovieViolationCollector,
): number | undefined {
  if (component === "rotation") {
    const a: number = Math.hypot(...left);
    const b: number = Math.hypot(...right);
    const count: number = out.items.length;
    out.unitQuaternion(
      path,
      { x: left[0]!, y: left[1]!, z: left[2]!, w: left[3]! },
      "outgoing prop rotation",
    );
    out.unitQuaternion(
      path,
      { x: right[0]!, y: right[1]!, z: right[2]!, w: right[3]! },
      "incoming prop rotation",
    );
    if (out.items.length !== count) return undefined;
    const delta: number[] = left.map(
      (v: number, i: number): number => v / a - right[i]! / b,
    );
    const sum: number[] = left.map(
      (v: number, i: number): number => v / a + right[i]! / b,
    );
    // The two chord lengths are proportional to sine and cosine of a
    // quarter angle. Choosing the shorter chord folds antipodal signs.
    const difference: number = Math.hypot(...delta);
    const addition: number = Math.hypot(...sum);
    return (
      4 *
      Math.atan2(Math.min(difference, addition), Math.max(difference, addition))
    );
  }
  if (left.length !== right.length) {
    out.push(
      "type",
      path,
      "prop morph samples must have the same target count",
      right.length,
    );
    return undefined;
  }

  if (component === "translation")
    return Math.hypot(
      left[0]! - right[0]!,
      left[1]! - right[1]!,
      left[2]! - right[2]!,
    );
  let max: number = 0;
  for (let i: number = 0; i < left.length; i++)
    max = Math.max(max, Math.abs(left[i]! - right[i]!));
  return max;
}
