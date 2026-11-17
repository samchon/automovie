import { bracketedRoot } from "../math/bracketedRoot";
import type { resolveAutoMovieContactEvents } from "./resolveAutoMovieContactEvents";
import { sampleAutoMovieContactWeapon } from "./sampleAutoMovieContactWeapon";

/**
 * Find one weapon's first new contact on the resolver's scan grid, horizon
 * and live window: the first grid step whose signed gap is not positive
 * brackets the crossing with the clear sample before it, and the crossing is
 * found in that bracket by `bracketedRoot` to `RESOLUTION` seconds. The
 * second reported is the bracket's touching end, the latest second measured
 * at or inside the surface, so it is never a clear one. While the clear end
 * measures no gap (a weapon not yet live there) the bracket is halved instead.
 * A gap that jumps across zero is still bracketed, but the false-position
 * search's order of convergence is stated for a smooth gap only; its limit
 * of evaluations then decides how narrow the bracket gets.
 *
 * An initial contact is reported unless its body supplies a departure
 * certificate. A certificate either rules out another entry in this search
 * or supplies an actually clear instant with no new entry before it. Only
 * that initial pair is then inactive before that witness; other bodies keep
 * their original times. The caller's physical model owns that proof because
 * an opaque signed-distance function alone cannot determine departure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the live window, the grid, the crossing search with its resolution and the side reported, the case of an unmeasured clear end, the limitation for a discontinuous gap, conservative initial reporting, pair-local certificate meaning and unchanged time ordering.
 * @evidence contracts/development/implementation.md#principled-implementation The signed-gap scan brackets the first admitted crossing, and the Illinois false-position search (`bracketedRoot`, Dowell and Jarratt 1971) closes the bracket to `RESOLUTION`, a thousandth of the microsecond the contact specifications and hit ids resolve; the root stays inside the bracket, so the touching end it tracks is within that width of the crossing. Physical departure information establishes when a previously resolved pair can next enter; a clearance witness is checked against the actual pair gap before it is used.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pair-distance reader serves scan and witness validation; sampleAutoMovieContactWeapon supplies actual combined or legacy endpoints to every path. One minimum over eligible bodies serves the original crossing search. Event ordering remains in resolveAutoMovieContactEvents.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown departure preserves initial penetration/touch reporting. A clearance witness must be finite, strictly later, inside the live search and strictly outside the actual body. No epsilon, shifted query clock, permanent collider exclusion or bounce cap is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Work is proportional to bodies times the scan steps plus the crossing search's evaluations: superlinear on a smooth gap where a bisection to the same width takes about 23 halvings of a 1/120 s step, and at most the search's limit of 64. No measured count is claimed. Each initially contacting body may add its model's certificate cost and one actual witness check; opaque bodies add no certificate work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Sphere, capsule and tapered-capsule gaps share one reader. Each exact sample produces endpoints once for all bodies at that sample; witnesses also read actual endpoints through the shared primitive. The body supplies model-specific departure knowledge once per initial pair; all source/stop-dependent certificates are rebuilt for each event search, with no retained pose/time cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A lazy call-local map holds at most one scalar release time or no-entry marker per certified body. Returned ids/times retain no callback, body, certificate object or map.
 */
export function firstAutoMovieContactImpact(
  weapon: resolveAutoMovieContactEvents.IWeapon,
  input: resolveAutoMovieContactEvents.IInput,
  stops: resolveAutoMovieContactEvents.IStops,
  from: number,
  horizon: number,
): { against: string; seconds: number } | undefined {
  const live: number = weapon.from ?? -Infinity;
  const until: number = Math.min(input.to, weapon.to ?? Infinity);
  let departures:
    | Map<resolveAutoMovieContactEvents.IBody, number | null>
    | undefined;

  /** The same actual pair measurement, before any departure eligibility gate. */
  const distance: (
    body: resolveAutoMovieContactEvents.IBody,
    t: number,
    frame: resolveAutoMovieContactEvents.IWeaponFrame,
  ) => number = (
    body: resolveAutoMovieContactEvents.IBody,
    t: number,
    frame: resolveAutoMovieContactEvents.IWeaponFrame,
  ): number => {
    if (frame.tail !== undefined && body.axis === undefined)
      throw new Error(
        `Body ${body.id} measures no segment for capsule weapon ${weapon.id}`,
      );
    return frame.tail === undefined
      ? body.distance(frame.position, t, stops) - weapon.radius
      : weapon.tailRadius === undefined
        ? body.axis!(frame.position, frame.tail, t, stops) - weapon.radius
        : body.axis!(frame.position, frame.tail, t, stops, [
            weapon.radius,
            weapon.tailRadius,
          ]);
  };
  const gap: (
    t: number,
    initial?: boolean,
  ) => { distance: number; against: string } = (
    t: number,
    initial: boolean = false,
  ): { distance: number; against: string } => {
    if (t < live || t > (weapon.to ?? Infinity))
      return { distance: Infinity, against: "" };
    const frame: resolveAutoMovieContactEvents.IWeaponFrame =
      sampleAutoMovieContactWeapon(weapon, t, stops);
    let best: { distance: number; against: string } = {
      distance: Infinity,
      against: "",
    };
    for (const body of input.bodies) {
      if (body.id === weapon.owner) continue;
      const release: number | null | undefined = departures?.get(body);
      if (release === null || (release !== undefined && t < release)) continue;
      const d: number = distance(body, t, frame);
      if (initial && d <= 0 && body.departure !== undefined) {
        const proof: resolveAutoMovieContactEvents.Departure | undefined =
          body.departure({
            weapon,
            from,
            to: until,
            stops,
            gap: d,
            at: (seconds: number): number =>
              distance(
                body,
                seconds,
                sampleAutoMovieContactWeapon(weapon, seconds, stops),
              ),
          });
        if (proof !== undefined) {
          if (proof.kind === "no-entry") {
            departures ??= new Map();
            departures.set(body, null);
            continue;
          }
          if (proof.kind !== "clearance")
            throw new RangeError(
              "Unknown initial contact departure certificate",
            );
          if (
            !Number.isFinite(proof.seconds) ||
            !(proof.seconds > from && proof.seconds <= until)
          )
            throw new RangeError(
              "Contact departure clearance is outside its search",
            );
          const clearance: number = distance(
            body,
            proof.seconds,
            sampleAutoMovieContactWeapon(weapon, proof.seconds, stops),
          );
          if (!(Number.isFinite(clearance) && clearance > 0))
            throw new RangeError("Contact departure has no positive clearance");
          departures ??= new Map();
          departures.set(body, proof.seconds);
          continue;
        }
      }
      if (d < best.distance) best = { distance: d, against: body.id };
    }
    return best;
  };
  if (until < from) return undefined;
  const first: number =
    live > from ? Math.max(1, Math.floor((live - from) / input.step)) : 1;
  if (first === 1) {
    const start: { distance: number; against: string } = gap(from, true);
    if (start.distance <= 0) return { against: start.against, seconds: from };
  }
  let previous: number = first === 1 ? from : from + (first - 1) * input.step;
  for (let k: number = first; ; k++) {
    if (previous >= horizon) return undefined;
    const t: number = Math.min(input.to, from + k * input.step);
    const reached: { distance: number; against: string } = gap(t);
    if (reached.distance <= 0) {
      // The crossing lies between the last clear sample and this one. The
      // contact is reported on the touching side: the latest second measured
      // at or inside the surface, which is the bracket's touching end.
      let inside: number = t;
      let within: number = reached.distance;
      let against: string = reached.against;
      const measure: (seconds: number) => number = (seconds: number): number => {
        const at: { distance: number; against: string } = gap(seconds);
        if (at.distance <= 0) {
          inside = seconds;
          within = at.distance;
          against = at.against;
        }
        return at.distance;
      };

      // A weapon not yet live measures no gap. Halve toward the contact
      // until the clear end has one, as a bisection reads it: clear.
      let lo: number = previous;
      let clear: number = measure(lo);
      while (!Number.isFinite(clear) && inside - lo > RESOLUTION) {
        const mid: number = (lo + inside) / 2;
        const d: number = measure(mid);
        if (d > 0) {
          lo = mid;
          clear = d;
        }
      }
      if (Number.isFinite(clear) && inside - lo > RESOLUTION) {
        const ends: readonly [number, number, number, number] = [lo, clear, inside, within];
        bracketedRoot(
          (seconds: number): number =>
            seconds === ends[0] ? ends[1] : seconds === ends[2] ? ends[3] : measure(seconds),
          ends[0],
          ends[2],
          RESOLUTION,
        );
      }
      return { against, seconds: inside };
    }
    if (t >= until) return undefined;
    previous = t;
  }
}

/**
 * The bracket width at which a contact's second is taken, seconds: a
 * thousandth of the microsecond the contact specifications and a hit's id
 * resolve (`1e-6` s), so the second read at that precision does not depend
 * on where in the bracket the search stopped.
 */
const RESOLUTION: number = 1e-9;
