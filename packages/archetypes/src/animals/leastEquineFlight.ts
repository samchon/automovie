import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
} from "../core";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { EquineJump } from "./EquineJump";
import type { EquineObstacle } from "./EquineObstacle";
import { EquinePitch } from "./EquinePitch";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";

/**
 * Rotations whose lowest Y reads a part's least X, greatest X, least Z and
 * greatest Z.
 */
const SIDES: readonly IAutoMovieQuaternion[] = [
  Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
  Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, -90),
  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
];

/**
 * One part's clearance over one obstacle: its need, its lowest point from the
 * centre of mass and its window after takeoff.
 */
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
 * The least flight that lifts a candidate takeoff's displayed body over every
 * obstacle by the clearance, as the trunk's plan flies it (`EquinePitch`): a
 * closed-form bound with the trunk level, then a bisection with its turn.
 *
 * @param request The admitted jump.
 * @param plan The course plan.
 * @param unflown The candidate's trial assembly without a hold, whose clock
 *   gives its contact seconds.
 * @param candidate The candidate's event phases.
 * @param midair The displayed model at the middle of a flight, where the
 *   trunk is level and the limbs tucked.
 * @param centre The body's rest centre of mass, model metres.
 * @param landed The unheld ride's displayed parts and placement at its first
 *   fore landing, read when the jump has a gap.
 * @param shift Film seconds the approach's stride adjustment moves the takeoff
 *   and every later event, positive later.
 * @returns Seconds from final hind liftoff to first fore landing, or undefined
 *   when the body is over an obstacle before the push-off begins, the speed is
 *   not constant through the jump, or the landing falls past the leg.
 */
export function leastEquineFlight(
  request: EquineJump.IRequest,
  plan: AutoMovieArchetypeCourse.IPlan,
  unflown: EquineJump.ITrial,
  candidate: EquineJump.ICandidate,
  midair: EquineObstacle.ISample,
  centre: IAutoMovieVector3,
  landed: EquineObstacle.ISample | undefined,
  shift: number,
): number | undefined {
  const at = (phase: number): number => unflown.strides.secondsAt(phase);
  const lift: number = at(candidate.takeoff) + shift;
  const touch: number = at(candidate.landing) + shift;
  const push: number = at(candidate.takeoff) - at(candidate.push);
  const absorb: number = at(candidate.absorb) - at(candidate.landing);
  const state: AutoMovieArchetypeCourse.IState = plan.at(lift);
  const u: number = state.speed;
  if (
    !(u > 0) ||
    plan.at(at(candidate.approach)).speed !== u ||
    plan.at(at(candidate.recovery) + shift).speed !== u
  )
    return undefined;
  const g: number = AutoMovieGravity.STANDARD;
  const limits: ILimit[] = [];
  let launch: number = 0;
  for (const part of midair.parts) {
    if (
      part.geometry.type === "primitive"
        ? part.geometry.shape.type === "plane"
        : midair.cells?.get(part.id)?.geometry !== part.geometry
    )
      continue;
    const low: number = QuadrupedRestFloor(part, midair.cells);
    const [, , rearmost, negatedForemost]: readonly number[] = SIDES.map(
      (rotation: IAutoMovieQuaternion): number =>
        QuadrupedRestFloor(
          {
            ...part,
            transform: AutoMovieArchetypeFrame.compose(
              {
                rotation,
                translation: { x: 0, y: 0, z: 0 },
                scale: AutoMovieArchetypeFrame.UNIT,
              },
              part.transform!,
            ),
          },
          midair.cells,
        ),
    );
    for (const obstacle of request.obstacles) {
      const need: number = obstacle.top + request.clearance - low;
      // The root overlaps the obstacle from its start less the part's foremost model Z to its end less the rearmost.
      const ends: readonly number[] = [
        obstacle.from + negatedForemost!,
        obstacle.to - rearmost!,
      ].map((end: number): number => (end - state.distance) / u);
      // A part may already be over the obstacle while the hinds push, as a head held high over a fence is; over it before the push-off begins, the body has not jumped it.
      if (!ends.every((tau: number): boolean => tau > -push)) return undefined;
      for (const tau of ends)
        if (need > 0 && tau > 0)
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
          // In the push-off the centre rises at constant acceleration and the trunk turns up toward its takeoff angle; in the flight, the parabola and the constant turn.
          const pushed: number = (push + tau) / push;
          const angle: number =
            tau < 0
              ? EquinePitch.TURN * (flight / 2) * pushed * pushed
              : EquinePitch.TURN * (flight / 2 - tau);
          return (
            (tau < 0
              ? (speed * push * pushed * pushed) / 2
              : speed * (push / 2 + tau) - (g * tau * tau) / 2) +
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
  if (gaps.length > 0 && landed !== undefined) {
    const hoof: IAutoMovieModelPart = landed.parts.find(
      (part: IAutoMovieModelPart): boolean =>
        part.id ===
        AutoMovieArchetypeQuadrupedBody.BONES[candidate.moved[1]!.limb][3],
    )!;
    const foothold: number =
      plan.at(touch).distance +
      Vector3.dot(
        Vector3.subtract(
          AutoMovieArchetypeFrame.compose(landed.placement, hoof.transform!)
            .translation,
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
    plan.at(at(candidate.recovery) + shift).distance +
    u * (least - (touch - lift));
  return recovery <= request.end && plan.at(plan.when(recovery)).speed === u
    ? least
    : undefined;
}
