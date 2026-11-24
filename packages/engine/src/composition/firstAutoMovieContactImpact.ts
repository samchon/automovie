import type { IAutoMovieResolveContactEvents } from "@automovie/interface";

import { bracketedRoot } from "../math/bracketedRoot";
import { sampleAutoMovieContactWeapon } from "./sampleAutoMovieContactWeapon";

/**
 * Find one weapon's first new contact on the resolver's scan grid, horizon and
 * live window: the first grid step whose signed gap is not positive brackets
 * the crossing with the clear sample before it, and the crossing is found in
 * that bracket by `bracketedRoot` to `RESOLUTION` seconds. The second reported
 * is the bracket's touching end, the latest second measured at or inside the
 * surface, so it is never a clear one. While the clear end measures no gap (a
 * weapon not yet live there) the bracket is halved instead, down to the
 * resolution or to two adjacent doubles, whichever is wider. A gap that jumps
 * across zero is still bracketed, but the false-position search's order of
 * convergence is stated for a smooth gap only; its limit of evaluations then
 * decides how narrow the bracket gets.
 *
 * An initial contact is reported unless its body supplies a departure
 * certificate. A certificate either rules out another entry in this search or
 * supplies an actually clear instant with no new entry before it. Only that
 * initial pair is then inactive before that witness; other bodies keep their
 * original times. The caller's physical model owns that proof because an opaque
 * signed-distance function alone cannot determine departure.
 *
 * Where the weapon and a body both state a speed bound, a gap read on the grid
 * clears that body for the grid seconds within the gap over the two bounds
 * together (conservative advancement, Mirtich 1996), so the scan reads it again
 * only as the gap could close; where every body is cleared, the scan skips the
 * cleared grid seconds altogether. A body without a bound is read at every grid
 * step.
 *
 * The search is one scan (`firstAutoMovieContactImpact.scan`) read to its end
 * or to the horizon; the resolver reads several weapons' scans a grid step at a
 * time instead.
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
 */
export namespace firstAutoMovieContactImpact {
  /**
   * One weapon's scan of one search: its initial contact, then one grid step a
   * call. The grid is the search's, `from + k * step` clipped to the span's
   * end, so the scans of one search read the same seconds at the same step.
   */
  export interface IScan {
    /**
     * The weapon's initial contact at the search's start, when the scan begins
     * there; read once, before any step.
     */
    start(): { against: string; seconds: number } | undefined;

    /**
     * The grid step the next `advance` reads, 1 or more; Infinity once the scan
     * has ended (a contact found, the live window passed, or no window at
     * all).
     */
    step(): number;

    /**
     * The second of the step before the next one: the latest second the scan
     * has found clear or left unread.
     */
    previous(): number;

    /**
     * Read the next grid step: the contact whose crossing lies in the bracket
     * it closes, or undefined when the step is clear.
     */
    advance(): { against: string; seconds: number } | undefined;
  }

  /**
   * Begin one weapon's scan of one search.
   *
   * @param weapon The weapon.
   * @param input The resolver's input, for the bodies, the span's end and the
   *   grid's step.
   * @param stops The stops so far, unchanged during the scan.
   * @param from The search's start, seconds.
   * @returns The scan.
   * @throws {RangeError} When the search's start or span end is not finite, the
   *   step is not positive and finite, or the grid's step count from the start
   *   to the end is not a safe integer.
   */
  export function scan(
    weapon: IAutoMovieResolveContactEvents.IWeapon,
    input: IAutoMovieResolveContactEvents.IInput,
    stops: IAutoMovieResolveContactEvents.IStops,
    from: number,
  ): IScan {
    // The grid's steps are counted by a whole-number index `next`: a span or
    // step that is not finite, or a count past 2^53 where `next + 1` stops
    // moving, gives a scan that never reaches the span's end.
    if (
      input.step <= 0 ||
      Math.ceil((input.to - from) / input.step) > Number.MAX_SAFE_INTEGER
    )
      throw new RangeError(
        `A contact scan needs a finite span and a positive finite step with a safe-integer count, got ${from} to ${input.to} by ${input.step}`,
      );
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

    // Each body's own advancement: the second before which the two bounds
    // together leave its gap clear at every grid second, from the grid second
    // it was last read. A body whose bound has not run out is not read on a
    // grid step, so where one body cannot be bound the others still are read
    // only as their gaps could close.
    const ahead: Map<IAutoMovieResolveContactEvents.IBody, number> = new Map();
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
      k: number,
    ): number => {
      if (weapon.speed === undefined || body.speed === undefined || !(d > 0))
        return 0;
      let reader: IAutoMovieResolveContactEvents.Speed | undefined =
        bounds.get(body);
      if (reader === undefined) {
        reader = body.speed(grid, stops);
        bounds.set(body, reader);
      }

      // Both bounds are asked over a window from this grid second `k` to a
      // later grid second, a number of steps that doubles from one: a bound
      // over the window certifies the grid seconds within the gap over the two
      // bounds together where that time lies inside the window, and every
      // second to the live end where the window reaches it. So neither side is
      // read farther than twice the stretch certified, nor past the end. A
      // window either side cannot bound keeps what the window before it
      // certified: the whole of it, since the time that window gave was no
      // shorter. The body is asked first: a body that cannot be bound costs
      // the weapon no read. The window ends on the grid's own second (the
      // scan's own expression of it), so a side bounding the grid seconds it
      // holds reads exactly those.
      let kept: number = 0;
      for (let m: number = 1; ; m *= 2) {
        const end: number = Math.min(until, from + (k + m) * input.step);
        const h: number = end - t;
        const other: number | undefined = certified(
          reader(t, end),
          `body ${body.id}`,
        );
        if (other === undefined) return kept;
        moving ??= weapon.speed(grid, stops);
        const own: number | undefined = certified(
          moving(t, end),
          `weapon ${weapon.id}`,
        );
        if (own === undefined) return kept;
        const time: number = own + other > 0 ? d / (own + other) : Infinity;
        if (time < h || !(end < until)) return time;
        kept = h;
      }
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
      certify?: number,
    ) => { distance: number; against: string } = (
      t: number,
      initial: boolean = false,
      certify?: number,
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
        const advanced: number | undefined =
          certify === undefined ? undefined : ahead.get(body);
        if (advanced !== undefined && t < advanced) {
          free = Math.min(free, advanced - t);
          continue;
        }
        const d: number = distance(body, t, frame);

        // On the grid the gap closes no faster than the two bounds together.
        const certified: number =
          certify !== undefined ? clear(body, t, d, certify) : 0;
        free = Math.min(free, certified);
        if (certified > 0) ahead.set(body, t + certified);
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
            if (!(proof.seconds > from && proof.seconds <= until))
              throw new RangeError(
                "Contact departure clearance is outside its search",
              );
            const clearance: number = distance(
              body,
              proof.seconds,
              sampleAutoMovieContactWeapon(weapon, proof.seconds, stops),
            );
            if (!(clearance > 0))
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
          next,
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
          while (clear === Infinity && inside - lo > RESOLUTION) {
            const mid: number = (lo + inside) / 2;

            // Past 2^23 s adjacent doubles lie farther apart than the
            // resolution; a midpoint rounding onto an end would repeat the
            // same bracket forever, so the bracket ends there unmeasured.
            if (!(mid > lo && mid < inside)) break;
            const d: number = measure(mid);
            if (d > 0) {
              lo = mid;
              clear = d;
            }
          }
          if (clear !== Infinity && inside - lo > RESOLUTION) {
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
 * The bracket width at which a contact's second is taken, seconds: a thousandth
 * of the microsecond the contact specifications and a hit's id resolve (`1e-6`
 * s), so the second read at that precision does not depend on where in the
 * bracket the search stopped.
 */
const RESOLUTION: number = 1e-9;
