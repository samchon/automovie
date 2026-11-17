import type {
  IAutoMovieResolveContactEvents,
  IAutoMovieVector3,
} from "@automovie/interface";

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
 * @evidence contracts/development/implementation.md#efficient-algorithms Original work is proportional to bodies times the scan steps plus twenty-four bisections. Each initially contacting body may add its model's certificate cost and one actual witness check; opaque bodies add no certificate work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Sphere, capsule and tapered-capsule gaps share one reader. The body supplies model-specific departure knowledge once per initial pair; all source/stop-dependent certificates are rebuilt for each event search.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A lazy call-local map holds at most one scalar release time or no-entry marker per certified body. Returned ids/times retain no callback, body, certificate object or map.
 */
export function firstAutoMovieContactImpact(
  weapon: IAutoMovieResolveContactEvents.IWeapon,
  input: IAutoMovieResolveContactEvents.IInput,
  stops: IAutoMovieResolveContactEvents.IStops,
  from: number,
  horizon: number,
): { against: string; seconds: number } | undefined {
  const live: number = weapon.from ?? -Infinity;
  const until: number = Math.min(input.to, weapon.to ?? Infinity);
  let departures:
    | Map<IAutoMovieResolveContactEvents.IBody, number | null>
    | undefined;

  /** The same actual pair measurement, before any departure eligibility gate. */
  const distance: (
    body: IAutoMovieResolveContactEvents.IBody,
    t: number,
    p: IAutoMovieVector3,
    q: IAutoMovieVector3 | undefined,
  ) => number = (
    body: IAutoMovieResolveContactEvents.IBody,
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
  const gap: (
    t: number,
    initial?: boolean,
  ) => { distance: number; against: string } = (
    t: number,
    initial: boolean = false,
  ): { distance: number; against: string } => {
    if (t < live || t > (weapon.to ?? Infinity))
      return { distance: Infinity, against: "" };
    const p: IAutoMovieVector3 = weapon.position(t, stops);
    const q: IAutoMovieVector3 | undefined = weapon.tail?.(t, stops);
    let best: { distance: number; against: string } = {
      distance: Infinity,
      against: "",
    };
    for (const body of input.bodies) {
      if (body.id === weapon.owner) continue;
      const release: number | null | undefined = departures?.get(body);
      if (release === null || (release !== undefined && t < release)) continue;
      const d: number = distance(body, t, p, q);
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
                weapon.position(seconds, stops),
                weapon.tail?.(seconds, stops),
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
            weapon.position(proof.seconds, stops),
            weapon.tail?.(proof.seconds, stops),
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
    if (gap(t).distance <= 0) {
      let lo: number = previous;
      let hi: number = t;
      for (let i: number = 0; i < 24; i++) {
        const mid: number = (lo + hi) / 2;
        if (gap(mid).distance <= 0) hi = mid;
        else lo = mid;
      }
      return { against: gap(hi).against, seconds: hi };
    }
    if (t >= until) return undefined;
    previous = t;
  }
}
