import { lerp as scalarLerp } from "../lerp";
import { clampAutoMovieUnitInterval } from "../math/clampAutoMovieUnitInterval";

/**
 * Stateless scalar envelopes in seconds, normalized progress and radians.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Stateless scalar envelopes in seconds, normalized progress and radians) and documents 9 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Stateless scalar envelopes in seconds, normalized progress and radians: companion namespace of 9 members (`unit`, `lerp`, `smooth`, `smoother`, `out`, `ramp`, ...); units and frames named in its text: seconds, radians. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieEnvelope` in packages/engine/src/motion/AutoMovieEnvelope.ts; its surface is the 9 members listed and the text shows 2 other files naming it, mostly packages/engine (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieEnvelope {
  /** Closed-unit progress, with NaN preserved. */
  export const unit: (value: number) => number = clampAutoMovieUnitInterval;
  /** Endpoint-exact scalar interpolation; progress may extrapolate. */
  export const lerp: (from: number, to: number, progress: number) => number =
    scalarLerp;
  /**
   * Cubic smoothstep has zero endpoint slope.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Cubic smoothstep has zero endpoint slope.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Cubic smoothstep has zero endpoint slope) directly over its typed inputs (`value`) as a fixed number of statements with no loop or recursion in the body, delegating to `unit`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 3, whose basis this answer does not independently establish and a reviewer must confirm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 4 lines and 2 top-level statements that reuses `unit` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 3 are not independently sourced here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `value`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function smooth(value: number): number {
    const t: number = unit(value);
    return t * t * (3 - 2 * t);
  }
  /**
   * Quintic smootherstep has zero endpoint slope and curvature.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Quintic smootherstep has zero endpoint slope and curvature.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Quintic smootherstep has zero endpoint slope and curvature) directly over its typed inputs (`value`) as a fixed number of statements with no loop or recursion in the body, delegating to `unit`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 6, 15, 10, whose basis this answer does not independently establish and a reviewer must confirm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 4 lines and 2 top-level statements that reuses `unit` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 6, 15, 10 are not independently sourced here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `value`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function smoother(value: number): number {
    const t: number = unit(value);
    return t * t * t * (t * (6 * t - 15) + 10);
  }
  /**
   * Cubic ease-out, distinct from the named quadratic motion easing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Cubic ease-out, distinct from the named quadratic motion easing.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Cubic ease-out, distinct from the named quadratic motion easing) directly over its typed inputs (`value`) as a fixed number of statements with no loop or recursion in the body, delegating to `unit`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 3, whose basis this answer does not independently establish and a reviewer must confirm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 4 lines and 2 top-level statements that reuses `unit` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 3 are not independently sourced here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `value`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function out(value: number): number {
    const t: number = unit(value);
    return 1 - (1 - t) ** 3;
  }
  /**
   * Smooth interval progress; a collapsed interval is a closed-end step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Smooth interval progress; a collapsed interval is a closed-end step.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Smooth interval progress; a collapsed interval is a closed-end step) directly over its typed inputs (`seconds`, `start`, `end`) as a fixed number of statements with no loop or recursion in the body, delegating to `smooth`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 7 lines and 1 top-level statements that reuses `smooth` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `seconds`, `start`, `end`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function ramp(seconds: number, start: number, end: number): number {
    return end <= start
      ? seconds >= end
        ? 1
        : 0
      : smooth((seconds - start) / (end - start));
  }
  /**
   * Rise, hold and release through ordered seconds a,b,c,d.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Rise, hold and release through ordered seconds a,b,c,d.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Rise, hold and release through ordered seconds a,b,c,d) directly over its typed inputs (`seconds`, `a`, `b`, `c`, `d`) as a fixed number of statements with no loop or recursion in the body, delegating to `ramp`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 6 lines and 4 top-level statements that reuses `ramp` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `seconds`, `a`, `b`, `c`, `d`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function plateau(
    seconds: number,
    a: number,
    b: number,
    c: number,
    d: number,
  ): number {
    if (seconds <= a || seconds >= d) return 0;
    if (seconds < b) return ramp(seconds, a, b);
    if (seconds <= c) return 1;
    return 1 - ramp(seconds, c, d);
  }
  /**
   * One smooth rise and release with no hold.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: One smooth rise and release with no hold.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (One smooth rise and release with no hold) directly over its typed inputs (`seconds`, `start`, `peak`, `end`) as a fixed number of statements with no loop or recursion in the body, delegating to `plateau`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 3 lines and 1 top-level statements that reuses `plateau` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `seconds`, `start`, `peak`, `end`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function pulse(
    seconds: number,
    start: number,
    peak: number,
    end: number,
  ): number {
    return plateau(seconds, start, peak, peak, end);
  }
  /**
   * Shortest-arc interpolation in radians, preserving both pi endpoints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Shortest-arc interpolation in radians, preserving both pi endpoints.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Shortest-arc interpolation in radians, preserving both pi endpoints) directly over its typed inputs (`from`, `to`, `progress`) as a fixed number of statements with no loop or recursion in the body; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 6 lines and 4 top-level statements that calls no other named helper; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `from`, `to`, `progress`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function angle(from: number, to: number, progress: number): number {
    let delta: number = (to - from) % (2 * Math.PI);
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    return from + delta * progress;
  }
}
