import type { AutoMovieArchetypeCourse } from "../core";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import { EquineJump } from "./EquineJump";
import type { EquineObstacle } from "./EquineObstacle";
import type { QuadrupedStridePlan } from "./QuadrupedStridePlan";
import { leastEquineFlight } from "./leastEquineFlight";

/**
 * One candidate takeoff stride's best spot: the approach's strides lengthen or
 * shorten, each within the gait's declared timing spread at its speed, spread
 * from the leg's start to the push-off, to bring the takeoff to the spot whose
 * flight is least.
 *
 * Riders and horses adjust the approach's strides to meet a fence's takeoff;
 * here the adjustment is bounded by the measured between-horse spread of stride
 * time at the speed (`AutoMovieArchetypeQuadrupedGait.ITiming.deviation`), so
 * every adjusted stride keeps a measured clock.
 *
 * @param request The admitted jump.
 * @param plan The course plan.
 * @param trial Assemble the ride with moved landings, without a hold or with a
 *   flight's.
 * @param candidate The candidate's event phases.
 * @param gait The candidate stride's gait.
 * @returns The spot's flight and its seconds, or undefined when no spot takes
 *   off before the first obstacle and clears it within the leg.
 */
export function spotEquineTakeoff(
  request: EquineJump.IRequest,
  plan: AutoMovieArchetypeCourse.IPlan,
  trial: (
    moved: readonly QuadrupedStridePlan.IMoved[],
    flight: EquineJump.IFlight | undefined,
  ) => EquineJump.ITrial,
  candidate: EquineJump.ICandidate,
  gait: AutoMovieArchetypeQuadrupedGait.Gait,
): EquineJump.ISpot | undefined {
  const unflown: EquineJump.ITrial = trial(candidate.moved, undefined);
  const at = (phase: number): number => unflown.strides.secondsAt(phase);
  // A takeoff at or past the first obstacle has nothing left to jump.
  if (!(plan.at(at(candidate.takeoff)).distance < request.obstacles[0]!.from))
    return undefined;
  const nominal: EquineJump.IFlight = flown(
    unflown,
    candidate,
    EquineJump.LONGEST,
  );
  const midair: EquineObstacle.ISample = trial(
    candidate.moved,
    nominal,
  ).sample(nominal.hold.start + nominal.hold.duration / 2);

  // The adjustment's reach on each side, from the declared spread of stride time.
  const push: number = at(candidate.push);
  const window: number =
    push - Math.max(unflown.clock.start, plan.when(request.start));
  const timing: AutoMovieArchetypeQuadrupedGait.ITiming = unflown.clock.timing(
    gait,
    push,
  );
  const shifts: number[] = [0];
  if (window > 0 && timing.deviation > 0 && timing.stride > timing.deviation)
    for (const sign of [-1, 1]) {
      const reach: number =
        window *
        (1 - timing.stride / (timing.stride + sign * timing.deviation));
      for (let k: number = 1; k <= EquineJump.SPOTS; k++)
        shifts.push((reach * k) / EquineJump.SPOTS);
    }

  // A gap's landing is read once, where the unheld ride lands its first fore.
  const landed: EquineObstacle.ISample | undefined = request.obstacles.some(
    (obstacle: EquineObstacle.IObstacle): boolean => obstacle.top === 0,
  )
    ? unflown.sample(at(candidate.landing))
    : undefined;
  let best: EquineJump.ISpot | undefined;
  for (const shift of shifts) {
    const seconds: number | undefined = leastEquineFlight(
      request,
      plan,
      unflown,
      candidate,
      midair,
      unflown.centre,
      landed,
      shift,
    );
    if (seconds !== undefined && (best === undefined || seconds < best.seconds))
      best = {
        seconds,
        flight: flown(unflown, candidate, seconds, shift, window),
      };
  }
  return best;
}

/**
 * A candidate's flight of a given length, held on its unheld trial's clock, its
 * approach adjusted by a shift spread over a window before the push-off.
 */
function flown(
  unflown: EquineJump.ITrial,
  candidate: EquineJump.ICandidate,
  seconds: number,
  shift: number = 0,
  window: number = 0,
): EquineJump.IFlight {
  const at = (phase: number): number => unflown.strides.secondsAt(phase);
  return {
    moved: candidate.moved,
    hold: {
      start: at(candidate.hold) + shift,
      duration: seconds - (at(candidate.landing) - at(candidate.takeoff)),
    },
    ...(shift === 0
      ? {}
      : {
          stretch: {
            start: at(candidate.push) - window,
            duration: shift,
            over: window,
          },
        }),
    phase: candidate.hold,
    takeoff: candidate.takeoff,
    landing: candidate.landing,
    approach: candidate.approach,
    recovery: candidate.recovery,
    push: candidate.push,
    absorb: candidate.absorb,
  };
}
