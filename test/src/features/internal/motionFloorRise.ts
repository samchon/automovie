import { physicalShapeBounds } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { HumanColliders } from "@automovie/motions/internal";

import type { motionComplaints } from "./motionComplaints";
import { motionHumanBody } from "./motionHumanBody";
import { motionHumanLaw } from "./motionHumanLaw";
import { motionHumanStance } from "./motionHumanStance";

/**
 * Measure a complete entry and rise on the actual skeleton at 120 Hz.
 * @param all Route-attributed refusals and measurements.
 * @param name The original specimen for the chosen route.
 * @param label The floor base and rise pattern.
 * @param composition The unmodified public entrance and get-up sequence.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stage, sampling scale and output.
 * @evidence contracts/development/implementation.md#principled-implementation Each finite difference spans 1/120 s; the post-blend floor comparison uses the exact minimum world height of the actual posed shapes. End hips use the separate quiet posture.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A single traversal checks frame displacement and floor height; the last frame also supplies both foot contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the original seed, casts, 30 m/s, 5 mm floor, 10 mm foot and 20 mm hip limits.
 * @evidence contracts/development/implementation.md#efficient-algorithms Requests the original FK grid and exact phase edges, measuring only the needed vertical extent of each shape.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Consecutive regular samples share their previous frame; each route is constructed once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only complaints escape the caller's route.
 */
export function motionFloorRise(
  all: motionComplaints.IGatherer,
  name: motionHumanBody.Name,
  label: string,
  composition: IAutoMovieMotionHumanChain,
): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
  let performance: IAutoMovieMotionHumanPerformance;
  try {
    performance = motionHumanLaw.perform(
      "get-up",
      [{ subject: "a", body }],
      composition,
    ).performance;
  } catch (error) {
    all.check(
      `${name} ${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
    return;
  }
  const stood: number = motionHumanStance(body).get("hips")!.worldPosition.y;
  const lowest = (bones: Bones, of: RegExp): number => {
    let low: number = Infinity;
    for (const { bone, pose, shapes } of HumanColliders.placed(body, bones))
      if (of.test(bone))
        for (const shape of shapes)
          low = Math.min(low, physicalShapeBounds.lowest(pose, shape));
    return low;
  };
  const placed: IAutoMovieMotionHumanSegment = performance.segments("a")[1]!;
  let fastest: number = 0;
  let fastestBone: AutoMovieHumanoidBone = "hips";
  let fastestAt: number = placed.entryTime;
  let deepest: number = 0;
  let deepestAt: number = placed.entryTime;
  const from: number = placed.entryTime - 0.1;
  const floorStart: number = placed.entryTime + (placed.transition?.blend ?? 0);
  // The speed standard is a 120 Hz finite difference. Exact seam and
  // endpoint observations get their own 1/120 s predecessor, even if
  // they coincide with the regular grid to floating-point precision.
  const times: Set<number> = new Set([
    placed.entryTime,
    floorStart,
    placed.end,
  ]);
  for (let index: number = 1; from + index * STEP < placed.end; index++)
    times.add(from + index * STEP);
  let previous: number = from;
  let before: Bones = performance.bones("a", previous);
  for (const seconds of [...times].sort(
    (a: number, b: number): number => a - b,
  )) {
    const predecessor: number = seconds - STEP;
    // Four rounded operations form a grid time. Bound their accumulated
    // error relative to the film time before borrowing the prior frame.
    const roundoff: number =
      4 * Number.EPSILON * Math.max(1, Math.abs(seconds));
    const prior: Bones =
      Math.abs(previous - predecessor) <= roundoff
        ? before
        : performance.bones("a", predecessor);
    const now: Bones = performance.bones("a", seconds);
    for (const [bone, b] of now) {
      const a: IAutoMovieResolvedBone = prior.get(bone)!;
      const speed: number =
        Math.hypot(
          b.worldPosition.x - a.worldPosition.x,
          b.worldPosition.y - a.worldPosition.y,
          b.worldPosition.z - a.worldPosition.z,
        ) / STEP;
      if (speed > fastest) {
        fastest = speed;
        fastestBone = bone;
        fastestAt = seconds;
      }
    }
    // The floor is read on the rise's own posture, once the entering
    // transition has carried off the act before's offset.
    const depth: number = seconds >= floorStart ? -lowest(now, /./) : 0;
    if (depth > deepest) {
      deepest = depth;
      deepestAt = seconds;
    }
    previous = seconds;
    before = now;
  }
  all.check(
    `${name} ${label}: the fastest joint centre is the ${fastestBone} at ${fastest.toFixed(1)} m/s at ${fastestAt.toFixed(3)} s, below 30 expected`,
    fastest <= 30,
  );
  all.check(
    `${name} ${label}: the body sinks ${(deepest * 1000).toFixed(1)} mm under the floor at ${deepestAt.toFixed(2)} s, within 5 expected`,
    deepest <= 0.005,
  );
  const end: Bones = before;
  const hips: number = end.get("hips")!.worldPosition.y;
  const feet: number = Math.max(
    lowest(end, /^left(Foot|Toes)$/),
    lowest(end, /^right(Foot|Toes)$/),
  );
  all.check(
    `${name} ${label}: at the end the hips joint is ${(hips * 1000).toFixed(0)} mm high, the stance's ${(stood * 1000).toFixed(0)} within 20 expected, and the higher foot ${(feet * 1000).toFixed(1)} mm off the floor, within 10 expected`,
    Math.abs(hips - stood) <= 0.02 && feet <= 0.01,
  );
}

/** World joint transforms evaluated at a single film instant. */
type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

/** Cadence of the continuity bound, seconds. */
const STEP: number = 1 / 120;
