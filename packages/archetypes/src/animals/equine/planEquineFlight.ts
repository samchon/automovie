import type { AutoMovieArchetypeCourse } from "../../core/index";
import { EquineJump } from "./EquineJump";
import { EquineObstacle } from "./EquineObstacle";
import type { QuadrupedStridePlan } from "../quadruped/QuadrupedStridePlan";

/*
 * Plan a jump's flight and confirm it on the flown body: the closed-form plan
 * (`EquineJump.plan`), then rounds that measure every displayed part over the
 * obstacles (`EquineObstacle.shortfall`), lengthening the held flight by a
 * shortfall's request and shortening it by half a surplus until the tightest
 * part clears within `EquineJump.SETTLE`, at most `EquineJump.ROUNDS` times.
 * Parameter archetype: The source archetype name.
 * Parameter request: The admitted jump.
 * Parameter plan: The course plan.
 * Parameter trial: Assemble the ride with moved landings and, once known, the
 * flight, skipping the footing check.
 * Returns: The flight that clears every obstacle by the clearance.
 * As `EquineJump.plan` refuses an approach.
 * When the flight still falls short after the last round.
 */
export function planEquineFlight(
  archetype: string,
  request: EquineJump.IRequest,
  plan: AutoMovieArchetypeCourse.IPlan,
  trial: (
    moved: readonly QuadrupedStridePlan.IMoved[],
    flight: EquineJump.IFlight | undefined,
  ) => EquineJump.ITrial,
): EquineJump.IFlight {
  let flight: EquineJump.IFlight = EquineJump.plan(
    archetype,
    request,
    plan,
    trial,
  );
  for (let round: number = 0; ; round++) {
    const flown: EquineJump.ITrial = trial(flight.moved, flight);
    const extra: number = EquineObstacle.shortfall(
      plan,
      request.start,
      request.obstacles,
      request.clearance,
      flown.strides.secondsAt(flight.takeoff),
      flown.strides.secondsAt(flight.landing),
      flown.sample,
    );
    if (extra <= 0 && extra > -EquineJump.SETTLE) return flight;
    if (round === EquineJump.ROUNDS) {
      if (extra <= 0) return flight;
      throw new RangeError(
        `The jump's flight still misses its clearance by ${extra} s after ${round} rounds`,
      );
    }

    // A shortfall extends the hold by its whole request; a surplus shortens it by half, so the flight approaches the least clearing one from the clear side.
    const duration: number =
      flight.hold.duration + (extra > 0 ? extra : extra / 2);
    if (!(duration > 0)) return flight;
    flight = { ...flight, hold: { ...flight.hold, duration } };
  }
}
