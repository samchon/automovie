import type { IAutoMovieMinimumJerk } from "@automovie/interface";

import { bracketedBisection } from "../math/bracketedBisection";

/**
 * The minimum-jerk normalized profile and its first two derivatives: the
 * share of a point-to-point movement completed at normalized time `u`.
 *
 * Flash and Hogan (1985, J. Neurosci. 5:1688) showed that unconstrained
 * point-to-point arm movements follow the trajectory minimizing integrated
 * squared jerk, which for rest-to-rest motion is the quintic
 * `s(u) = 10 u^3 - 15 u^4 + 6 u^5`: zero velocity and acceleration at both
 * ends and a bell-shaped speed profile peaking at `u = 0.5` with 1.875 times
 * the mean speed. Outside `[0, 1]` the profile holds its end value with zero
 * derivatives, so a sum of units can be evaluated at any time.
 *
 * Derivatives are with respect to `u`; divide the first by the duration and
 * the second by its square for seconds.
 * share reads only the displacement fraction and rate only the first
 * derivative, with identical admission, endpoint clipping and the selected
 * polynomial arithmetic, without the unused fields or a profile record.
 * The position uses `s(u) = 1 - s(1 - u)` above one half to keep the share
 * in [0, 1] even at representable times immediately before the endpoint.
 *
 * @param u Normalized time, any finite number.
 * @returns The share `s`, its rate `ds` and its acceleration `dds`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the normalized-time equations, bounded position and its symmetry near one, boundary holds, derivative units and the scalar reads' field selection.
 * @evidence contracts/development/implementation.md#principled-implementation The closed-form Flash and Hogan quintic evaluates its position on the first half and reflects the result above the midpoint. The reflection uses a small, nonnegative remaining share. Derivatives keep the original normalized-time expressions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One private kernel owns finite admission, endpoints and polynomial expressions. The original function selects a complete profile and share/rate select one actual scalar demand, without a second easing rule or caller-supplied calculation hook.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonfinite time throws before clipping. All finite interior times use the same quintic identity, and time at or beyond either endpoint holds that exact position with literal zero derivatives.
 * @evidence contracts/development/implementation.md#efficient-algorithms All demands take constant work. Share evaluates just the position. Rate evaluates just the first derivative. Full profiles reuse the squared time on the lower half and allocate one result.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Complete profiles and their share/rate consumers share exact admission, endpoints and selected polynomial expressions. Every current u is evaluated normally; no profile, time or result is cached across requests.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Complete reads return one fresh three-number profile and scalar reads return one number. No demand retains time, caller state or outputs, and no collection, handle, task or global cache is acquired.
 */
export function minimumJerk(u: number): IAutoMovieMinimumJerk.IProfile {
  return evaluate(u, "profile") as IAutoMovieMinimumJerk.IProfile;
}

/** Actual output demands selected only by this module's public reads. */
type IDemand = "profile" | "share" | "rate";
type IReading = IAutoMovieMinimumJerk.IProfile | number;

/** One admission/clipping/polynomial owner, evaluating only demanded fields. */
function evaluate(u: number, demand: IDemand): IReading {
  if (!Number.isFinite(u)) throw new Error("Minimum-jerk time must be finite");
  if (u <= 0) return demand === "profile" ? { s: 0, ds: 0, dds: 0 } : 0;
  if (u >= 1)
    return demand === "profile"
      ? { s: 1, ds: 0, dds: 0 }
      : demand === "share"
        ? 1
        : 0;
  const reflected: boolean = demand !== "rate" && u > 0.5;
  const t: number = reflected ? 1 - u : u;
  const t2: number = t * t;
  if (demand === "rate") return 30 * t2 * (1 - 2 * u + t2);
  const firstHalf: number = t2 * t * (10 - 15 * t + 6 * t2);
  const s: number = reflected ? 1 - firstHalf : firstHalf;
  if (demand === "share") return s;
  const u2: number = reflected ? u * u : t2;
  return {
    s,
    ds: 30 * u2 * (1 - 2 * u + u2),
    dds: 60 * u * (1 - 3 * u + 2 * u2),
  };
}

/**
 * Companion types of {@link minimumJerk}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's unit.
 * @evidence contracts/development/design.md#principled-representation A share and its derivatives in normalized time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Physical readers retain the three-value profile; shape/clock consumers request share, arrest-speed consumers request rate, and consumers that need the instant a share is reached (a swing's unit, a step's plant window) request time, without manufacturing unused fields. No vector form or generic demand construction kit is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Callers still scale displacement or duration themselves; both scalar entries inherit the same admitted time and endpoint/polynomial rule rather than a second approximation or cached profile.
 */
export namespace minimumJerk {
  /**
   * The same normalized displacement fraction s, without derivative work or a
   * profile record. Any finite time is admitted and outside [0,1] holds the
   * corresponding endpoint; nonfinite time keeps the original refusal.
   */
  export function share(u: number): number {
    return evaluate(u, "share") as number;
  }

  /**
   * The first derivative ds with respect to normalized time, without the
   * displacement, second derivative or profile record. Finite times outside
   * [0,1] return literal zero; nonfinite time keeps the original refusal.
   */
  export function rate(u: number): number {
    return evaluate(u, "rate") as number;
  }

  /**
   * The normalized time at which the profile has covered a share of its
   * travel, the inverse of `share`: 0 for a share of none or less, 1 for the
   * whole travel or more, and otherwise the time `share` reaches it at, by
   * bisection to 2^-48 of the unit, since the quintic is strictly increasing
   * on [0, 1] and has no closed-form inverse. A nonfinite share is refused.
   */
  export function time(travel: number): number {
    if (!Number.isFinite(travel))
      throw new Error("A minimum-jerk share must be finite");
    if (travel <= 0) return 0;
    if (travel >= 1) return 1;
    return bracketedBisection(
      (u: number): boolean => share(u) < travel,
      0,
      1,
      2 ** -48,
    );
  }
}
