import type { IAutoMovieVector3 } from "@automovie/interface";

import type { resolveAutoMovieContactEvents } from "./resolveAutoMovieContactEvents";
import { sampleAutoMovieContactWeapon } from "./sampleAutoMovieContactWeapon";

/**
 * Find one weapon's first new contact, retaining the resolver's scan grid,
 * horizon, live window and twenty-four bisections.
 *
 * An initial contact is reported unless its body supplies a departure
 * certificate. A certificate either rules out another entry in this search
 * or supplies an actually clear instant with no new entry before it. Only
 * that initial pair is then inactive before that witness; other bodies keep
 * their original times. The caller's physical model owns that proof because
 * an opaque signed-distance function alone cannot determine departure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the live window, original grid and bisection count, conservative initial reporting, pair-local certificate meaning and unchanged time ordering.
 * @evidence contracts/development/implementation.md#principled-implementation The signed-gap scan brackets the first admitted crossing and bisects it twenty-four times. Physical departure information establishes when a previously resolved pair can next enter; a clearance witness is checked against the actual pair gap before it is used.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pair-distance reader serves scan and witness validation; one minimum over eligible bodies serves the original crossing search. Event ordering remains in resolveAutoMovieContactEvents.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown departure preserves initial penetration/touch reporting. A clearance witness must be finite, strictly later, inside the live search and strictly outside the actual body. No epsilon, shifted query clock, permanent collider exclusion or bounce cap is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Original body times scan-step work and twenty-four bisections remain. Each actual gap returns its scalar minimum without allocating an intermediate winner record per query/improving body; only the original contact outputs consume the current winner identity. Initially contacting bodies retain model certificate cost and actual witness checks; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Sphere, capsule and tapered-capsule gaps share one actual pair reader and each logical sample reads its actual frame once. Scalar minimum and current winner id are selected in the same ordered body loop; no earlier pose, time or gap is substituted. Physical departure knowledge remains once per initial pair and is rebuilt for each source/stop-dependent search.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A lazy call-local map holds at most one release time/no-entry marker per certified body. One current winner-id scalar is reset at every gap query and ends with this synchronous search; returned ids/times retain no callback, body, certificate object, sampled frame or map.
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
  let departures: Map<resolveAutoMovieContactEvents.IBody, number | null> | undefined;
  /** Read both actual ends once, only for the sample currently being measured. */
  const frame: (seconds: number) => resolveAutoMovieContactEvents.IWeaponFrame = (seconds: number): resolveAutoMovieContactEvents.IWeaponFrame =>
    sampleAutoMovieContactWeapon(weapon, seconds, stops);

  /** The same actual pair measurement, before any departure eligibility gate. */
  const distance: (
    body: resolveAutoMovieContactEvents.IBody,
    t: number,
    p: IAutoMovieVector3,
    q: IAutoMovieVector3 | undefined,
  ) => number = (
    body: resolveAutoMovieContactEvents.IBody,
    t: number,
    p: IAutoMovieVector3,
    q: IAutoMovieVector3 | undefined,
  ): number => {
    if (q !== undefined && body.axis === undefined)
      throw new Error(
        `Body ${body.id} measures no segment for capsule weapon ${weapon.id}`,
      );
    return q === undefined
      ? body.distance(p, t, stops) - weapon.radius
      : weapon.tailRadius === undefined
        ? body.axis!(p, q, t, stops) - weapon.radius
        : body.axis!(p, q, t, stops, [weapon.radius, weapon.tailRadius]);
  };
  /** Only the current measurement's winner, reset before every actual gap query. */
  let against: string = "";
  const gap: (t: number, initial?: boolean) => number = (
    t: number,
    initial: boolean = false,
  ): number => {
    against = "";
    if (t < live || t > (weapon.to ?? Infinity)) return Infinity;
    const sampled: resolveAutoMovieContactEvents.IWeaponFrame = frame(t);
    const p: IAutoMovieVector3 = sampled.position;
    const q: IAutoMovieVector3 | undefined = sampled.tail;
    let best: number = Infinity;
    for (const body of input.bodies) {
      if (body.id === weapon.owner) continue;
      const release: number | null | undefined = departures?.get(body);
      if (release === null || (release !== undefined && t < release)) continue;
      const d: number = distance(body, t, p, q);
      if (initial && d <= 0 && body.departure !== undefined) {
        const proof: resolveAutoMovieContactEvents.Departure | undefined =
          body.departure({
            weapon,
            from,
            to: until,
            stops,
            gap: d,
            at: (seconds: number): number => {
              const at: resolveAutoMovieContactEvents.IWeaponFrame = frame(seconds);
              return distance(body, seconds, at.position, at.tail);
            },
          });
        if (proof !== undefined) {
          if (proof.kind === "no-entry") {
            departures ??= new Map();
            departures.set(body, null);
            continue;
          }
          if (proof.kind !== "clearance")
            throw new RangeError("Unknown initial contact departure certificate");
          if (
            !Number.isFinite(proof.seconds) ||
            !(proof.seconds > from && proof.seconds <= until)
          )
            throw new RangeError("Contact departure clearance is outside its search");
          const at: resolveAutoMovieContactEvents.IWeaponFrame = frame(proof.seconds);
          const clearance: number = distance(
            body,
            proof.seconds,
            at.position,
            at.tail,
          );
          if (!(Number.isFinite(clearance) && clearance > 0))
            throw new RangeError("Contact departure has no positive clearance");
          departures ??= new Map();
          departures.set(body, proof.seconds);
          continue;
        }
      }
      if (d < best) {
        best = d;
        against = body.id;
      }
    }
    return best;
  };
  if (until < from) return undefined;
  const first: number =
    live > from ? Math.max(1, Math.floor((live - from) / input.step)) : 1;
  if (first === 1) {
    if (gap(from, true) <= 0) return { against, seconds: from };
  }
  let previous: number = first === 1 ? from : from + (first - 1) * input.step;
  for (let k: number = first; ; k++) {
    if (previous >= horizon) return undefined;
    const t: number = Math.min(input.to, from + k * input.step);
    if (gap(t) <= 0) {
      let lo: number = previous;
      let hi: number = t;
      for (let i: number = 0; i < 24; i++) {
        const mid: number = (lo + hi) / 2;
        if (gap(mid) <= 0) hi = mid;
        else lo = mid;
      }
      gap(hi);
      return { against, seconds: hi };
    }
    if (t >= until) return undefined;
    previous = t;
  }
}
