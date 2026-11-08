import type { IAutoMovieConstructionProfile } from "@automovie/interface";

import type { AutoMovieViewAxis } from "./AutoMovieViewAxis";

/**
 * Actual original curve families in one owned physical plane, before lofting.
 *
 * Declaration station lengths use metres; original queries and plane axes use
 * kernel millimetres. Curve-clock units stay with their original owner. The
 * caller keeps declarations, functions and dependencies immutable while any
 * prepared reader remains alive; changed revisions require a new preparation.
 *
 * @evidence contracts/common.md#principled-implementation References complete original functions and their actual domains with the same common plane owner, permitting nonpolar and nonconvex pieces without reconstruction.
 * @evidence contracts/common.md#clear-and-simple-design A closed pure declaration and existing axis interface accompany a key-to-original map; callable geometry stays outside the authoring AST.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Point0 is independent of actual total2; null means unavailable and never supplies zero derivatives. Common-plane agreement is an original-owner premise, not inferred from matching sampled points.
 * @evidence contracts/common.md#meaningful-documentation States units, immutable dependency lifetime, domains, callback exceptions and qualified derivative meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input type chooses no evaluator or composition algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Multiple pieces may reference one immutable original curve owner; implementations can share preparations only for unchanged actual inputs and effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns curve and plane closures and all transitive dependencies; prepared readers borrow them until released, without a global registry.
 */
export interface IAutoMovieConstructionProfileSource {
  /** Complete pure source declaration; no final chain or mesh supplies it. */
  definition: IAutoMovieConstructionProfile;

  /** Actual axis and its same-station derivatives, keyed by definition.plane. */
  plane: { id: string; axis: AutoMovieViewAxis.IAxis };

  /** Immutable actual local functions keyed by the declaration's source fields. */
  curves: ReadonlyMap<string, IAutoMovieConstructionProfileSource.ICurve>;

  /** Actual original region membership owners, needed only for declared trim keys. */
  regions?: ReadonlyMap<string, IAutoMovieConstructionProfileSource.IRegion>;
}

export namespace IAutoMovieConstructionProfileSource {
  /** Actual nonrectangular logical/material selection without fitting its boundary. */
  export interface IRegion {
    /** Actual physical station ownership, kernel millimetres. */
    domain: readonly [number, number];

    /** Membership of the same original field at its physical station and original curve clock. */
    contains(station: number, clock: number): boolean;

    /** Exact original clock intervals when available; null explicitly leaves boundary extraction unsupported. */
    intervals?(station: number): readonly (readonly [number, number])[] | null;
  }

  /** Two local plane coordinates, in millimetres per the indicated derivatives. */
  export type Vector = [number, number];

  /** Same original value and qualified phase derivatives at a fixed physical station. */
  export interface IPhase {
    /** Actual local point, kernel millimetres. */
    p: Vector;
    /** First derivative per original curve-clock unit. */
    t: Vector;
    /** Second original-clock derivative; null explicitly leaves this order unavailable. */
    tt: Vector | null;
  }

  /** Complete local physical-station/original-clock total-order-two reading. */
  export interface IJet {
    /** Local point, millimetres. */
    p: Vector;
    /** First derivative per physical station millimetre. */
    s: Vector;
    /** First derivative per original curve-clock unit. */
    t: Vector;
    /** Second derivative per station millimetre squared. */
    ss: Vector;
    /** Mixed derivative per station millimetre and original-clock unit. */
    st: Vector;
    /** Second derivative per original-clock unit squared. */
    tt: Vector;
  }

  /** An immutable generating owner, not boundary Taylor coefficients or a fit. */
  export interface ICurve {
    /** Actual physical station interval, kernel millimetres. */
    domain: readonly [number, number];

    /** Actual supported original-clock interval, in the original units. */
    clock: readonly [number, number];

    /** Actual original-clock period when the same function and available derivatives support periodic aliases; absent leaves a bounded open chart. */
    period?: number;

    /** Actual Point0; numeric failures and foreign callback exceptions remain observable. */
    point(station: number, clock: number): Vector;

    /** Actual phase1 with qualified phase2, or null; absence permits the same owner's complete jet to supply it. */
    phase?(station: number, clock: number): IPhase | null;

    /** Actual local total2, or null where unavailable; never finite-difference substitutes. */
    jet(station: number, clock: number): IJet | null;
  }
}
