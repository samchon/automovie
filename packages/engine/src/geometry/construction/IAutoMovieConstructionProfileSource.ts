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
 * @evidence contracts/development/design.md#principled-representation References complete original functions and their actual domains with the same common plane owner, permitting nonpolar and nonconvex pieces without reconstruction.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A closed pure declaration and existing axis interface accompany a key-to-original map; callable geometry stays outside the authoring AST.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Point0 is independent of actual total2; null means unavailable and never supplies zero derivatives. Common-plane agreement is an original-owner premise, not inferred from matching sampled points.
 * @evidence contracts/development/common.md#meaningful-documentation States units, immutable dependency lifetime, domains, callback exceptions and qualified derivative meaning.
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
  /**
   * Actual nonrectangular logical/material selection without fitting its boundary.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Actual nonrectangular logical/material selection without fitting its boundary.
   * @evidence contracts/development/design.md#principled-representation Represents Actual nonrectangular logical/material selection without fitting its boundary: interface of 3 members (`domain`, `contains`, `intervals`). Optional members `intervals` express documented absence, and the ranges its member docs state are left to runtime validation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IRegion` in packages/engine/src/geometry/construction/IAutoMovieConstructionProfileSource.ts; its surface is the 3 members listed and the text shows 24 other files naming it, mostly packages/human (16), movies (4), packages/engine (2), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IRegion {
    /** Actual physical station ownership, kernel millimetres. */
    domain: readonly [number, number];

    /**
     * Membership of the same original field at its physical station and original curve clock.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Membership of the same original field at its physical station and original curve clock.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Membership of the same original field at its physical station and original curve clock.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
     */
    contains(station: number, clock: number): boolean;

    /**
     * Exact original clock intervals when available; null explicitly leaves boundary extraction unsupported.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Exact original clock intervals when available; null explicitly leaves boundary extraction unsupported.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Exact original clock intervals when available; null explicitly leaves boundary extraction unsupported.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
     */
    intervals?(station: number): readonly (readonly [number, number])[] | null;
  }

  /**
   * Two local plane coordinates, in millimetres per the indicated derivatives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Two local plane coordinates, in millimetres per the indicated derivatives.
   * @evidence contracts/development/design.md#principled-representation Represents Two local plane coordinates, in millimetres per the indicated derivatives: type alias of 0 members (). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `Vector` in packages/engine/src/geometry/construction/IAutoMovieConstructionProfileSource.ts; its surface is the 0 members listed and the text shows 189 other files naming it, mostly packages/recovery (68), packages/human (57), packages/engine (35), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export type Vector = [number, number];

  /**
   * Same original value and qualified phase derivatives at a fixed physical station.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Same original value and qualified phase derivatives at a fixed physical station.
   * @evidence contracts/development/design.md#principled-representation Represents Same original value and qualified phase derivatives at a fixed physical station: interface of 3 members (`p`, `t`, `tt`); units and frames named in its text: local, second. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IPhase` in packages/engine/src/geometry/construction/IAutoMovieConstructionProfileSource.ts; its surface is the 3 members listed and the text shows 16 other files naming it, mostly packages/human (12), packages/engine (3), test (1), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IPhase {
    /** Actual local point, kernel millimetres. */
    p: Vector;
    /** First derivative per original curve-clock unit. */
    t: Vector;
    /** Second original-clock derivative; null explicitly leaves this order unavailable. */
    tt: Vector | null;
  }

  /**
   * Complete local physical-station/original-clock total-order-two reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Complete local physical-station/original-clock total-order-two reading.
   * @evidence contracts/development/design.md#principled-representation Represents Complete local physical-station/original-clock total-order-two reading: interface of 6 members (`p`, `s`, `t`, `ss`, `st`, `tt`); units and frames named in its text: local, second. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IJet` in packages/engine/src/geometry/construction/IAutoMovieConstructionProfileSource.ts; its surface is the 6 members listed and the text shows 143 other files naming it, mostly packages/human (53), test (48), packages/engine (42), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
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

  /**
   * An immutable generating owner, not boundary Taylor coefficients or a fit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: An immutable generating owner, not boundary Taylor coefficients or a fit.
   * @evidence contracts/development/design.md#principled-representation Represents An immutable generating owner, not boundary Taylor coefficients or a fit: interface of 6 members (`domain`, `clock`, `period`, `point`, `phase`, `jet`); units and frames named in its text: local. Optional members `period`, `phase` express documented absence, and the ranges its member docs state are left to runtime validation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `ICurve` in packages/engine/src/geometry/construction/IAutoMovieConstructionProfileSource.ts; its surface is the 6 members listed and the text shows 87 other files naming it, mostly packages/human (40), packages/engine (26), test (21), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; 2 optional members (`period`, `phase`) are independent fields rather than alternatives of one another as far as their docs state; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface ICurve {
    /** Actual physical station interval, kernel millimetres. */
    domain: readonly [number, number];

    /** Actual supported original-clock interval, in the original units. */
    clock: readonly [number, number];

    /** Actual original-clock period when the same function and available derivatives support periodic aliases; absent leaves a bounded open chart. */
    period?: number;

    /**
     * Actual Point0; numeric failures and foreign callback exceptions remain observable.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Actual Point0; numeric failures and foreign callback exceptions remain observable.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Actual Point0; numeric failures and foreign callback exceptions remain observable.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
     */
    point(station: number, clock: number): Vector;

    /**
     * Actual phase1 with qualified phase2, or null; absence permits the same owner's complete jet to supply it.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Actual phase1 with qualified phase2, or null; absence permits the same owner's complete jet to supply it.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Actual phase1 with qualified phase2, or null; absence permits the same owner's complete jet to supply it.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
     */
    phase?(station: number, clock: number): IPhase | null;

    /**
     * Actual local total2, or null where unavailable; never finite-difference substitutes.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Actual local total2, or null where unavailable; never finite-difference substitutes.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Actual local total2, or null where unavailable; never finite-difference substitutes.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
     */
    jet(station: number, clock: number): IJet | null;
  }
}
