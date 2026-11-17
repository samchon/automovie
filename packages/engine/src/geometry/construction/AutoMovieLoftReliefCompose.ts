import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import type { AutoMovieLoftJet } from "./AutoMovieLoftJet";
import { AutoMovieLoftRelief } from "./AutoMovieLoftRelief";
import type { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieLoftRelief } from "./IAutoMovieLoftRelief";

/** A fresh mutable world vector, in mm per the named derivative order. */
type V = AutoMovieSolidVector.Vec3;

/**
 * Shared relief addition for native originals and existing chain consumers.
 * Each operation preserves the original consumer's arithmetic order. Height,
 * shift and phase-turn evaluation remain owned by AutoMovieLoftRelief.
 *
 * @evidence contracts/development/design.md#principled-representation Separates Point0, phase-only and physical2 capabilities over the same immutable feature list and physical mm/radian chart.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three operations serve FullSource, LoftPoint, CapRead and LoftJet without a second relief field evaluator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No derivative is fabricated, no source is refitted and no chain is introduced; final numeric admission remains with the existing callers.
 * @evidence contracts/development/common.md#meaningful-documentation Names fresh mutable input ownership, derivative capabilities and the shared feature authority.
 */
export namespace AutoMovieLoftReliefCompose {
  /**
   * Add relief values to a fresh Point0; collapsed selects the existing pole refusal.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Adds h(s,t)e(t) using the existing height and direction owners, with the same zero-height skip and component addition order as LoftPoint.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Point0 reads no physical source2; the pole guard retains CapRead's feature-vanishing premise.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not infer missing derivatives or normalize axes; actual height/direction callback failures propagate and callers retain their numeric admission.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(R) feature queries with bounded local cubic support per field; shifted height keeps its existing two-field cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One height and at most one direction reading serve each feature's three components.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no vectors, features or external resources.
   * @evidence contracts/development/common.md#meaningful-documentation Gives mm/radian inputs, fresh mutable point ownership and the collapsed-pole refusal.
   */
  export function point(
    p: V,
    reliefs: readonly IAutoMovieLoftRelief[],
    s: number,
    t: number,
    collapsed: boolean = false,
  ): void {
    for (const relief of reliefs) {
      const h: [number, number, number] = AutoMovieLoftRelief.height(
        relief,
        s,
        t,
      );
      admitPole(h, collapsed);
      const d: number = h[0];
      if (d === 0) continue;
      const e: V = AutoMovieLoftRelief.direction(relief, t)[0];
      for (let k: number = 0; k < 3; k++) p[k]! += d * e[k]!;
    }
  }

  /**
   * Add relief value/phase data to fresh p/t vectors without station2.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Applies p+=he and p_t+=h_t e+h e_t in the same per-feature/component order as LoftPoint.phaseSampler and CapRead.phase.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Keeps phase-only capability independent of physical2 while sharing pole admission.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No finite differences, source2 request, zero replacement or changed zero-height arithmetic is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(R) height/direction queries with fixed-size component arithmetic and existing shift costs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each feature's height and direction are shared by p and its phase tangent.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   * @evidence contracts/development/common.md#meaningful-documentation p uses mm and t mm/radian; inputs are fresh mutable vectors.
   */
  export function phase(
    value: { p: V; t: V },
    reliefs: readonly IAutoMovieLoftRelief[],
    s: number,
    t: number,
    collapsed: boolean = false,
  ): void {
    for (const relief of reliefs) {
      const h: [number, number, number] = AutoMovieLoftRelief.height(
        relief,
        s,
        t,
      );
      admitPole(h, collapsed);
      const [e, e1]: [V, V, V] = AutoMovieLoftRelief.direction(relief, t);
      for (let k: number = 0; k < 3; k++) {
        value.p[k]! += h[0] * e[k]!;
        value.t[k]! += h[2] * e[k]! + h[0] * e1[k]!;
      }
    }
  }

  /**
   * Add full relief physical2 to a fresh world jet in station mm and phase radians.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Moves LoftJet's existing six-vector product rule verbatim: e has no station dependence and h includes the existing shift map's analytic total2.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One addition owner follows each caller's bare world and optional legacy-lift composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the nested sum order and zero-jet skip; missing source2 remains the caller's explicit failure and no AD or relief field is duplicated.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(R) feature queries with fixed six-vector arithmetic; each feature reads at most two local tensor-product fields through the existing owner.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One height jet and one direction jet supply all six output vectors.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   * @evidence contracts/development/common.md#meaningful-documentation Names physical derivative coordinates, fresh mutable ownership and preserved arithmetic order.
   */
  export function jet(
    value: AutoMovieLoftJet.IJet,
    reliefs: readonly IAutoMovieLoftRelief[],
    s: number,
    t: number,
  ): void {
    for (const relief of reliefs) {
      const h: number[] = AutoMovieLoftRelief.jet(relief, s, t);
      if (h.every((x: number): boolean => x === 0)) continue;
      const [e, e1, e2]: [V, V, V] = AutoMovieLoftRelief.direction(relief, t);
      value.p = sum(value.p, scale(e, h[0]!));
      value.s = sum(value.s, scale(e, h[1]!));
      value.t = sum(sum(value.t, scale(e, h[2]!)), scale(e1, h[0]!));
      value.ss = sum(value.ss, scale(e, h[3]!));
      value.st = sum(sum(value.st, scale(e, h[4]!)), scale(e1, h[1]!));
      value.tt = sum(
        sum(sum(value.tt, scale(e, h[5]!)), scale(e1, 2 * h[2]!)),
        scale(e2, h[0]!),
      );
    }
  }
}

/** A retained collapsed pole requires every feature's value/first orders to vanish. */
function admitPole(height: readonly number[], collapsed: boolean): void {
  if (collapsed && height.some((x: number): boolean => x !== 0))
    throw new AutoMovieLoftAdmissionError(
      "A deformed pole has no retained collapsed cap value.",
    );
}

/** Preserve LoftJet's left-associated zero-initialized vector sum exactly. */
function sum(...vectors: V[]): V {
  const out: V = [0, 0, 0];
  for (const vector of vectors)
    for (let k: number = 0; k < 3; k++) out[k] += vector[k]!;
  return out;
}

/** The original component-wise scalar multiplication, without regrouping. */
function scale(vector: readonly number[], factor: number): V {
  return [vector[0]! * factor, vector[1]! * factor, vector[2]! * factor];
}
