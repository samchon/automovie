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
 * share reads only the same displacement fraction, with identical admission,
 * endpoint clipping and polynomial arithmetic, without derivative work or a
 * profile record. It serves existing shape/clock consumers that use only s.
 *
 * @param u Normalized time, any finite number.
 * @returns The share `s`, its rate `ds` and its acceleration `dds`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Cites the model, gives the normalized-time polynomial, boundary values, out-of-range hold, derivative units and the explicit scalar share variant's identical admission/arithmetic without derivative output.
 * @evidence contracts/development/implementation.md#principled-implementation The closed-form minimum-jerk solution of Flash and Hogan 1985 is evaluated with the original u2=u*u, u3=u2*u and u3*(10-15*u+6*u2) grouping. Both reads use that same owner; full profiles additionally evaluate the unchanged first/second derivative polynomials.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One private kernel owns finite admission, endpoints and polynomial expressions. The original function selects its complete profile and share selects its actual scalar-only demand, without a second easing rule or caller-supplied calculation hook.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonfinite time throws before clipping in both reads. Zero/negative and one/greater endpoints keep the original literal values; interior powers/grouping and full-profile derivatives remain unchanged. No sample reduction, tolerance, derivative approximation or fixture condition is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Both reads take constant work; scalar-only consumers omit two derivative polynomials and one three-field profile allocation. Full profiles retain all original polynomial work and one fresh result, with no sampling or loop. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing complete-profile and scalar share consumers use the same exact admission/endpoint/polynomial owner. Every current u is evaluated normally; no profile, time or result is cached across requests.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Complete reads return one fresh three-number profile and share returns one number. Neither path retains time, caller state or outputs, and no collection, handle, task or global cache is acquired.
 */
export function minimumJerk(u: number): minimumJerk.IProfile {
  return evaluate(u, true) as minimumJerk.IProfile;
}

/** The two actual output demands, selected only by this module's public reads. */
type IReading = minimumJerk.IProfile | number;

/** One admission/clipping/polynomial owner, with derivatives only when demanded. */
function evaluate(u: number, derivatives: boolean): IReading {
  if (!Number.isFinite(u)) throw new Error("Minimum-jerk time must be finite");
  if (u <= 0) return derivatives ? { s: 0, ds: 0, dds: 0 } : 0;
  if (u >= 1) return derivatives ? { s: 1, ds: 0, dds: 0 } : 1;
  const u2: number = u * u;
  const u3: number = u2 * u;
  const s: number = u3 * (10 - 15 * u + 6 * u2);
  if (!derivatives) return s;
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Existing physical readers retain the three-value profile; actual shape/clock consumers may explicitly request share without manufacturing unwanted derivatives. No vector form or generic demand construction kit is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Callers still scale a displacement; the scalar entry inherits the same admitted time and endpoint/polynomial rule rather than a second approximation or cached profile.
 */
export namespace minimumJerk {
  /**
   * The same normalized displacement fraction s, without derivative work or a
   * profile record. Any finite time is admitted and outside [0,1] holds the
   * corresponding endpoint; nonfinite time keeps the original refusal.
   */
  export function share(u: number): number {
    return evaluate(u, false) as number;
  }

  /** The profile at one instant. */
  export interface IProfile {
    /** Share of the movement done, in [0, 1]. */
    s: number;

    /** Rate of the share per unit normalized time. */
    ds: number;

    /** Acceleration of the share per unit normalized time squared. */
    dds: number;
  }
}
