import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type ArchetypeCourse, ArchetypeFrame } from "../core";
import type { EquineJump } from "./EquineJump";
import type { EquineObstacle } from "./EquineObstacle";
import { EquinePitch } from "./EquinePitch";
import { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";

/** Rotations whose lowest Y reads a part's least X, greatest X, least Z and greatest Z. */
const SIDES: readonly IAutoMovieQuaternion[] = [
  Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
  Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, -90),
  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
];

/** One part's clearance over one obstacle: its need, its lowest point from the centre of mass and its window after takeoff. */
interface ILimit {
  /** Metres the part's lowest point must rise. */
  need: number;
  /** Height of that point above the centre of mass, metres. */
  up: number;
  /** Fore-aft position of the part ahead of the centre of mass, metres. */
  ahead: number;
  /** Seconds after takeoff the part reaches the obstacle. */
  first: number;
  /** Seconds after takeoff the part leaves it. */
  last: number;
}

/**
 * The least flight that lifts a candidate takeoff's displayed body over every obstacle by the clearance, as the trunk's plan flies it (`EquinePitch`): a closed-form bound with the trunk level, then a bisection with its turn.
 *
 * @param request The admitted jump.
 * @param plan The course plan.
 * @param unflown The candidate's trial assembly without a hold, whose clock gives its contact seconds.
 * @param candidate The candidate's event phases.
 * @param parts The displayed model parts at the middle of a flight, where the trunk is level and the limbs tucked.
 * @param centre The body's rest centre of mass, model metres.
 * @returns Seconds from final hind liftoff to first fore landing, or undefined when a part that must rise is already over an obstacle at takeoff, the speed is not constant through the jump, or the landing falls past the leg.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the posture read, the two stages and the cases without a flight.
 * @evidence contracts/development/implementation.md#principled-implementation With push-off P and landing stance A, the centre of mass, and with the trunk level the root, rises Y(τ) = v (P/2 + τ) − g τ²/2 a time τ after takeoff, where the takeoff velocity v = g T (T + A) / (2T + P + A) grows with the flight T. A part whose lowest point is y and whose extent along the path is [z⁻, z⁺] overlaps an obstacle [a, b] of top h while the root is in [a − z⁺, b − z⁻] and needs Y ≥ R = h + clearance − y there. Y is concave in τ, so each window end, reached τ = (e − s_T)/u after takeoff at ground speed u, needs v ≥ (R + g τ²/2)/(P/2 + τ); the largest such v gives the level bound T as the positive root of g T² + (g A − 2v) T − v (P + A) = 0. The trunk turns nose-down at `EquinePitch.TURN` about the centre, level at the flight's middle, which raises a point d ahead and e above the centre by e (cos φ − 1) + d sin φ; 40 halvings between the unheld flight and the level bound find the least flight whose parts clear at each window's ends and middle. A gap (a ditch) is crossed when the landing fore, read where the unheld ride lands it and moved on by the hold's distance, lands past its far edge by the clearance.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the contacts and windows, invert the level bound once, then halve.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A candidate with a part below an obstacle's top plus the clearance already over it at takeoff, or that lands past the leg, is discarded, never adjusted.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(P·O) for P parts and O obstacles, times 40 halvings.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The extents reuse the exact primitive floor reader.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number.
 */
export function leastEquineFlight(
  request: EquineJump.IRequest,
  plan: ArchetypeCourse.IPlan,
  unflown: EquineJump.ITrial,
  candidate: EquineJump.ICandidate,
  parts: readonly IAutoMovieModelPart[],
  centre: IAutoMovieVector3,
): number | undefined {
  const at = (phase: number): number => unflown.strides.secondsAt(phase);
  const lift: number = at(candidate.takeoff);
  const touch: number = at(candidate.landing);
  const push: number = lift - at(candidate.push);
  const absorb: number = at(candidate.absorb) - touch;
  const state: ArchetypeCourse.IState = plan.at(lift);
  const u: number = state.speed;
  if (
    !(u > 0) ||
    [candidate.approach, candidate.recovery].some(
      (phase: number): boolean => plan.at(at(phase)).speed !== u,
    )
  )
    return undefined;
  const g: number = AutoMovieGravity.STANDARD;
  const limits: ILimit[] = [];
  let launch: number = 0;
  for (const part of parts) {
    if (
      part.geometry.type !== "primitive" ||
      part.geometry.shape.type === "plane"
    )
      continue;
    const low: number = QuadrupedRestFloor(part);
    const [, , rearmost, negatedForemost]: readonly number[] = SIDES.map(
      (rotation: IAutoMovieQuaternion): number =>
        QuadrupedRestFloor({
          ...part,
          transform: ArchetypeFrame.compose(
            {
              rotation,
              translation: { x: 0, y: 0, z: 0 },
              scale: ArchetypeFrame.UNIT,
            },
            part.transform!,
          ),
        }),
    );
    for (const obstacle of request.obstacles) {
      const need: number = obstacle.top + request.clearance - low;
      // The root overlaps the obstacle from its start less the part's foremost model Z to its end less the rearmost.
      const ends: readonly number[] = [
        obstacle.from + negatedForemost!,
        obstacle.to - rearmost!,
      ].map((end: number): number => (end - state.distance) / u);
      // A part that must rise but is already over the obstacle at takeoff discards the candidate; one high enough, such as the trunk above a ditch, may be.
      if (!ends.every((tau: number): boolean => tau > 0)) {
        if (need > 0) return undefined;
        continue;
      }
      for (const tau of ends)
        if (need > 0)
          launch = Math.max(
            launch,
            (need + (g * tau * tau) / 2) / (push / 2 + tau),
          );
      limits.push({
        need,
        up: low - centre.y,
        ahead: part.transform!.translation.z - centre.z,
        first: Math.min(...ends),
        last: Math.max(...ends),
      });
    }
  }
  const b: number = g * absorb - 2 * launch;
  const level: number =
    (-b + Math.sqrt(b * b + 4 * g * launch * (push + absorb))) / (2 * g);

  // The trunk's turn lifts the forehand early and the hindquarters late; the least flight that clears with it lies between the unheld one and the level bound.
  const clears = (flight: number): boolean => {
    const speed: number =
      (g * flight * (flight + absorb)) / (2 * flight + push + absorb);
    return limits.every((limit: ILimit): boolean =>
      [limit.first, (limit.first + limit.last) / 2, limit.last].every(
        (tau: number): boolean => {
          const angle: number = EquinePitch.TURN * (flight / 2 - tau);
          return (
            speed * (push / 2 + tau) -
              (g * tau * tau) / 2 +
              limit.up * (Math.cos(angle) - 1) +
              limit.ahead * Math.sin(angle) >=
            limit.need
          );
        },
      ),
    );
  };
  let short: number = touch - lift;
  let least: number = Math.max(short, level);
  if (clears(short)) least = short;
  else if (clears(least))
    for (let step: number = 0; step < 40; step++) {
      const middle: number = (short + least) / 2;
      if (clears(middle)) least = middle;
      else short = middle;
    }

  // A gap is also crossed by the landing fore, which lands, the hold's distance later, past its far edge by the clearance.
  const gaps: readonly EquineObstacle.IObstacle[] = request.obstacles.filter(
    (obstacle: EquineObstacle.IObstacle): boolean => obstacle.top === 0,
  );
  if (gaps.length > 0) {
    const landed: EquineObstacle.ISample = unflown.sample(touch);
    const hoof: IAutoMovieModelPart = landed.parts.find(
      (part: IAutoMovieModelPart): boolean =>
        part.id === QuadrupedBody.BONES[candidate.moved[1]!.limb][3],
    )!;
    const foothold: number =
      plan.at(touch).distance +
      Vector3.dot(
        Vector3.subtract(
          ArchetypeFrame.compose(landed.placement, hoof.transform!).translation,
          landed.placement.translation,
        ),
        Quaternion.rotateVector(landed.placement.rotation, {
          x: 0,
          y: 0,
          z: 1,
        }),
      );
    for (const gap of gaps)
      least = Math.max(
        least,
        touch - lift + (gap.to + request.clearance - foothold) / u,
      );
  }

  // After the hold every later event moves on by the held seconds at the same speed.
  const recovery: number =
    plan.at(at(candidate.recovery)).distance + u * (least - (touch - lift));
  return recovery <= request.end && plan.at(plan.when(recovery)).speed === u
    ? least
    : undefined;
}
