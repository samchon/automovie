import type { IAutoMovieResolveContactEvents } from "@automovie/interface";

import { bracketedRoot } from "../math/bracketedRoot";
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
 * The search is one scan (`firstAutoMovieContactImpact.scan`) read to its
 * end or to the horizon; the resolver reads several weapons' scans a grid
 * step at a time instead.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the live window, the grid, the crossing search with its resolution and the side reported, the case of an unmeasured clear end, the limitation for a discontinuous gap, conservative initial reporting, pair-local certificate meaning and unchanged time ordering.
 * @evidence contracts/development/implementation.md#principled-implementation The signed-gap scan brackets the first admitted crossing, and the Illinois false-position search (`bracketedRoot`, Dowell and Jarratt 1971) closes the bracket to `RESOLUTION`, a thousandth of the microsecond the contact specifications and hit ids resolve; the root stays inside the bracket, so the touching end it tracks is within that width of the crossing. Physical departure information establishes when a previously resolved pair can next enter; a clearance witness is checked against the actual pair gap before it is used.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan owns the grid, the pair distances, the departure admission and the crossing search; this entry reads it alone against a horizon, and resolveAutoMovieContactEvents reads many in step. sampleAutoMovieContactWeapon supplies actual combined or legacy endpoints to every path.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown departure preserves initial penetration/touch reporting. A clearance witness must be finite, strictly later, inside the live search and strictly outside the actual body. No epsilon, shifted query clock, permanent collider exclusion or bounce cap is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Work is proportional to bodies times the scan steps plus the crossing search's evaluations: superlinear on a smooth gap where a bisection to the same width takes about 23 halvings of a 1/120 s step, and at most the search's limit of 64. The bracket's clear end is the gap the scan read one step before, not read again. Where a weapon and every body it can meet state a bound on the search's grid, a clear gap certifies the grid steps it cannot close within, which are not read (conservative advancement on the grid), with the same bracket and contact; each side's bound is prepared once a search, and a body's is asked only as far as the weapon's alone reaches. No measured count is claimed. Each initially contacting body may add its model's certificate cost and one actual witness check; opaque bodies add no certificate work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Sphere, capsule and tapered-capsule gaps share one reader. Each exact sample produces endpoints once for all bodies at that sample; witnesses also read actual endpoints through the shared primitive. The body supplies model-specific departure knowledge once per initial pair; all source/stop-dependent certificates are rebuilt for each event search, with no retained pose/time cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A lazy call-local map holds at most one scalar release time or no-entry marker per certified body, and the scan one gap of its last clear step, its weapon's speed reader and one per bounded body it asked, all released with the scan. Returned ids/times retain no callback, body, certificate object or map.
 */
export function firstAutoMovieContactImpact(
  weapon: IAutoMovieResolveContactEvents.IWeapon,
  input: IAutoMovieResolveContactEvents.IInput,
  stops: IAutoMovieResolveContactEvents.IStops,
  from: number,
  horizon: number,
): { against: string; seconds: number } | undefined {
  const scan: firstAutoMovieContactImpact.IScan =
    firstAutoMovieContactImpact.scan(weapon, input, stops, from);
  const start: { against: string; seconds: number } | undefined = scan.start();
  if (start !== undefined) return start;
  while (scan.step() !== Infinity) {
    if (scan.previous() >= horizon) return undefined;
    const hit: { against: string; seconds: number } | undefined =
      scan.advance();
    if (hit !== undefined) return hit;
  }
  return undefined;
}

/**
 * The scan behind {@link firstAutoMovieContactImpact}, for a reader of several
 * weapons a grid step at a time.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the scan is, its grid, each member's meaning and unit, and when a scan has ended.
 * @evidence contracts/development/design.md#principled-representation One weapon's search as a state read a grid step at a time: the initial contact, the next step's index, the last clear second and the step's reading, on the search's own grid so several scans share their seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One constructor and four readers, read by this entry alone against a horizon and by resolveAutoMovieContactEvents in step.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The scan keeps no pose, time table or result beyond its own last clear gap, and exposes neither its gap reader nor its departure certificates.
 */
export namespace firstAutoMovieContactImpact {
  /**
   * One weapon's scan of one search: its initial contact, then one grid step
   * a call. The grid is the search's, `from + k * step` clipped to the span's
   * end, so the scans of one search read the same seconds at the same step.
   */
  export interface IScan {
    /** The weapon's initial contact at the search's start, when the scan begins there; read once, before any step. */
    start(): { against: string; seconds: number } | undefined;

    /** The grid step the next `advance` reads, 1 or more; Infinity once the scan has ended (a contact found, the live window passed, or no window at all). */
    step(): number;

    /** The second of the step before the next one: the latest second the scan has found clear or left unread. */
    previous(): number;

    /** Read the next grid step: the contact whose crossing lies in the bracket it closes, or undefined when the step is clear. */
    advance(): { against: string; seconds: number } | undefined;
  }

  /**
   * Begin one weapon's scan of one search.
   *
   * @param weapon The weapon.
   * @param input The resolver's input, for the bodies, the span's end and the grid's step.
   * @param stops The stops so far, unchanged during the scan.
   * @param from The search's start, seconds.
   * @returns The scan.
   */
  export function scan(
    weapon: IAutoMovieResolveContactEvents.IWeapon,
    input: IAutoMovieResolveContactEvents.IInput,
    stops: IAutoMovieResolveContactEvents.IStops,
    from: number,
  ): IScan {
    const live: number = weapon.from ?? -Infinity;
    const until: number = Math.min(input.to, weapon.to ?? Infinity);
    let departures:
      | Map<IAutoMovieResolveContactEvents.IBody, number | null>
      | undefined;

    // How long after the last grid gap read, seconds, no body can be met at
    // a grid second: the least over the bodies of the clear gap over the
    // rate it can close at on this search's grid (the weapon's and the
    // body's bounds together), 0 where a bound is not stated or the weapon
    // is not live. Each side's bound is prepared once for this search, the
    // weapon's when first asked (after a body has read the stops), a
    // body's when it is first asked.
    let safe: number = 0;
    const grid: IAutoMovieResolveContactEvents.IGrid = {
      from,
      to: input.to,
      step: input.step,
    };
    let moving: IAutoMovieResolveContactEvents.Speed | undefined;
    const bounds: Map<
      IAutoMovieResolveContactEvents.IBody,
      IAutoMovieResolveContactEvents.Speed
    > = new Map();
    const certified = (
      value: number | undefined,
      owner: string,
    ): number | undefined => {
      if (value !== undefined && !(value >= 0 && value < Infinity))
        throw new RangeError(
          `Contact ${owner} states a speed bound that is not finite and non-negative`,
        );
      return value;
    };
    const clear = (
      body: IAutoMovieResolveContactEvents.IBody,
      t: number,
      d: number,
    ): number => {
      if (weapon.speed === undefined || body.speed === undefined || !(d > 0))
        return 0;
      moving ??= weapon.speed(grid, stops);
      const own: number | undefined = certified(
        moving(t, until),
        `weapon ${weapon.id}`,
      );
      if (own === undefined) return 0;

      // The body is asked only as far as the weapon's bound alone could
      // certify: any longer stretch the two certify together lies within it.
      let reader: IAutoMovieResolveContactEvents.Speed | undefined =
        bounds.get(body);
      if (reader === undefined) {
        reader = body.speed(grid, stops);
        bounds.set(body, reader);
      }
      const other: number | undefined = certified(
        reader(t, own > 0 ? Math.min(until, t + d / own) : until),
        `body ${body.id}`,
      );
      if (other === undefined) return 0;
      return own + other > 0 ? d / (own + other) : Infinity;
    };

    /** The same actual pair measurement, before any departure eligibility gate. */
    const distance: (
      body: IAutoMovieResolveContactEvents.IBody,
      t: number,
      frame: IAutoMovieResolveContactEvents.IWeaponFrame,
    ) => number = (
      body: IAutoMovieResolveContactEvents.IBody,
      t: number,
      frame: IAutoMovieResolveContactEvents.IWeaponFrame,
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
      certify?: boolean,
    ) => { distance: number; against: string } = (
      t: number,
      initial: boolean = false,
      certify: boolean = false,
    ): { distance: number; against: string } => {
      safe = 0;
      if (t < live || t > (weapon.to ?? Infinity))
        return { distance: Infinity, against: "" };
      let free: number = Infinity;
      const frame: IAutoMovieResolveContactEvents.IWeaponFrame =
        sampleAutoMovieContactWeapon(weapon, t, stops);
      let best: { distance: number; against: string } = {
        distance: Infinity,
        against: "",
      };
      for (const body of input.bodies) {
        if (body.id === weapon.owner) continue;
        const release: number | null | undefined = departures?.get(body);
        if (release === null) continue;
        if (release !== undefined && t < release) {
          free = Math.min(free, release - t);
          continue;
        }
        const d: number = distance(body, t, frame);

        // On the grid the gap closes no faster than the two bounds together.
        free = Math.min(free, certify ? clear(body, t, d) : 0);
        if (initial && d <= 0 && body.departure !== undefined) {
          const proof: IAutoMovieResolveContactEvents.Departure | undefined =
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
              throw new RangeError(
                "Contact departure has no positive clearance",
              );
            departures ??= new Map();
            departures.set(body, proof.seconds);
            continue;
          }
        }
        if (d < best.distance) best = { distance: d, against: body.id };
      }
      safe = free;
      return best;
    };
    const first: number =
      live > from ? Math.max(1, Math.floor((live - from) / input.step)) : 1;

    // The next step, the second before it and, when the scan read that
    // second, the gap it read there: clear, since the scan went on.
    let next: number = until < from ? Infinity : first;
    let previous: number = first === 1 ? from : from + (first - 1) * input.step;
    let cleared: number | undefined;
    return {
      start: (): { against: string; seconds: number } | undefined => {
        if (next === Infinity || first !== 1) return undefined;
        const start: { distance: number; against: string } = gap(from, true);
        if (start.distance <= 0) {
          next = Infinity;
          return { against: start.against, seconds: from };
        }
        cleared = start.distance;
        return undefined;
      },
      step: (): number => next,
      previous: (): number => previous,
      advance: (): { against: string; seconds: number } | undefined => {
        if (next === Infinity) return undefined;
        const t: number = Math.min(input.to, from + next * input.step);
        const reached: { distance: number; against: string } = gap(
          t,
          false,
          true,
        );
        if (reached.distance <= 0) {
          // The crossing lies between the last clear sample and this one. The
          // contact is reported on the touching side: the latest second measured
          // at or inside the surface, which is the bracket's touching end.
          let inside: number = t;
          let within: number = reached.distance;
          let against: string = reached.against;
          const measure: (seconds: number) => number = (
            seconds: number,
          ): number => {
            const at: { distance: number; against: string } = gap(seconds);
            if (at.distance <= 0) {
              inside = seconds;
              within = at.distance;
              against = at.against;
            }
            return at.distance;
          };

          // A weapon not yet live measures no gap. Halve toward the contact
          // until the clear end has one, as a bisection reads it: clear. The
          // clear end is the step before, whose gap the scan has read when
          // it read that step.
          let lo: number = previous;
          let clear: number = cleared ?? measure(lo);
          while (!Number.isFinite(clear) && inside - lo > RESOLUTION) {
            const mid: number = (lo + inside) / 2;
            const d: number = measure(mid);
            if (d > 0) {
              lo = mid;
              clear = d;
            }
          }
          if (Number.isFinite(clear) && inside - lo > RESOLUTION) {
            const ends: readonly [number, number, number, number] = [
              lo,
              clear,
              inside,
              within,
            ];
            bracketedRoot(
              (seconds: number): number =>
                seconds === ends[0]
                  ? ends[1]
                  : seconds === ends[2]
                    ? ends[3]
                    : measure(seconds),
              ends[0],
              ends[2],
              RESOLUTION,
            );
          }
          next = Infinity;
          return { against, seconds: inside };
        }
        previous = t;
        cleared = reached.distance;
        next = t >= until ? Infinity : next + 1;

        // Conservative advancement (Mirtich 1996): nothing is met before
        // `t + safe`, so the grid steps short of it are clear unread. The
        // scan resumes at the first step not certified, with the step before
        // it as the bracket's clear end, which is the bracket every step
        // read would have left; a window certified to its end is finished.
        if (next !== Infinity && safe > 0) {
          if (t + safe > until) next = Infinity;
          else {
            let clear: number = Math.floor((t + safe - from) / input.step);
            while (clear >= next && !(from + clear * input.step < t + safe))
              --clear;
            if (clear >= next) {
              previous = from + clear * input.step;
              cleared = undefined;
              next = clear + 1;
            }
          }
        }
        return undefined;
      },
    };
  }
}

/**
 * The bracket width at which a contact's second is taken, seconds: a
 * thousandth of the microsecond the contact specifications and a hit's id
 * resolve (`1e-6` s), so the second read at that precision does not depend
 * on where in the bracket the search stopped.
 */
const RESOLUTION: number = 1e-9;
