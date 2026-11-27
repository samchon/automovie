import type { IAutoMoviePhysicalRecoveryState } from "@automovie/interface";

import { AutoMovieEnginePhysicalStanceBalance } from "./AutoMovieEnginePhysicalStanceBalance";


/** The seat and the load filter of {@link AutoMovieEnginePhysicalStanceSeat}. */
export namespace AutoMovieEnginePhysicalStanceSeat {
  /**
   * Advance one stance foot's seating by one substep, in place.
   *
   * - Seated: its sole's far edge rises by the outline's span times the sine of
   *   its turn from the plant; it leaves seated above
   *   `AutoMovieEnginePhysicalStanceBalance.UNSEAT` and returns below `RESEAT`, each held for
   *   `DWELL` (Coros, Beaudoin and van de Panne 2010, Section 3.3).
   * - Load: the floor's measured normal force, low-passed over
   *   `LOAD_SECONDS`; it decides lift-off and touchdown only.
   * - Bearing: whether the foot can carry the centre of pressure is geometry, a
   *   sole point within the contact skin of the floor, never its measured load,
   *   which is itself the result of where the command put the centre of
   *   pressure: a foot the command left unloaded could otherwise never be
   *   commanded again. A grounded foot's share ramps toward one over `FADE`, so
   *   a foot that touches down joins the support continuously (Kim, Jorgensen
   *   and Sentis 2018); a lifted one bears nothing at once.
   * - Flatness: its share ramps toward whether it is grounded and seated.
   * - Entry: a foot out of contact, no floor constraint on it and its load under
   *   `RELEASE` of the weight, has left the holds, and its share is zero; once
   *   it touches again the share ramps toward one over `FADE`, the upper bound
   *   of its normal force ramping in with it, mirrored at lift-off, and the foot
   *   is added with zero error at the pose it touched in (design-4017-qp3,
   *   Section 3, rules 2 and 3; Herzog et al. 2016, Section 5.3).
   *
   * @param input The seat, the sole's present height spread, metres, the
   *   floor's measured normal force on the foot this substep, newtons, whether
   *   the foot is grounded, whether a floor constraint touches it this substep,
   *   the body's weight, newtons, the present local seconds and the substep,
   *   seconds.
   * @returns Whether the foot touched again this substep after it had left the
   *   holds, so its anchor is latched where it stands.
   */
  export function advance(input: Parameters<typeof updateSeat>[0]): ReturnType<typeof updateSeat> {
    return updateSeat(input);
  }
  /** One stance foot's seating, as the recovery state keeps it. */
  export type ISeat = NonNullable<
    IAutoMoviePhysicalRecoveryState["seating"]
  >[string];

  /**
   * A load low-passed over `AutoMovieEnginePhysicalStanceBalance.LOAD_SECONDS`, so a single
   * substep's contact flicker does not decide it.
   *
   * @param previous The filtered load so far, newtons.
   * @param measured This substep's load, newtons.
   * @param dt The substep, seconds.
   * @returns The filtered load, newtons.
   */
  export function lowPass(
    previous: number,
    measured: number,
    dt: number,
  ): number {
    return (
      previous +
      (measured - previous) *
        Math.min(1, dt / AutoMovieEnginePhysicalStanceBalance.LOAD_SECONDS)
    );
  }
}

function updateSeat(input: {
  seat: AutoMovieEnginePhysicalStanceSeat.ISeat;
  spread: number;
  load: number;
  grounded: boolean;
  touching: boolean;
  weight: number;
  seconds: number;
  dt: number;
}): boolean {
  const { seat } = input;

  // The sole's own relief is latched when its stance begins, so a curved
  // sole is not read as lifted; an edge lifting raises the spread past it.
  const lift: number = Math.max(0, input.spread - (seat.relief ?? input.spread));
  const opposite: boolean = seat.seated
    ? lift > AutoMovieEnginePhysicalStanceBalance.UNSEAT
    : lift < AutoMovieEnginePhysicalStanceBalance.RESEAT;
  if (!opposite) seat.since = input.seconds;
  else if (input.seconds - seat.since >= AutoMovieEnginePhysicalStanceBalance.DWELL) {
    seat.seated = !seat.seated;
    seat.since = input.seconds;
  }
  seat.load = AutoMovieEnginePhysicalStanceSeat.lowPass(seat.load ?? 0, input.load, input.dt);
  const step: number = input.dt / AutoMovieEnginePhysicalStanceBalance.FADE;
  const toward = (share: number, target: number): number =>
    share + Math.max(-step, Math.min(step, target - share));
  seat.bearing = input.grounded ? toward(seat.bearing ?? 1, 1) : 0;
  seat.flat = toward(seat.flat ?? 1, input.grounded && seat.seated ? 1 : 0);
  const left: boolean =
    !input.touching &&
    seat.load < AutoMovieEnginePhysicalStanceBalance.RELEASE * input.weight;
  const entered: boolean = seat.entry === 0 && !left;
  seat.entry = left ? 0 : toward(seat.entry ?? 1, 1);
  return entered;
}
