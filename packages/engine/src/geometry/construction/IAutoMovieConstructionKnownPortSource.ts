import type { IAutoMovieConstructionKnownPort } from "@automovie/interface";

import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Actual original field and chart-map owners of a known port.
 *
 * The immutable invocation owns these functions before either side is lofted.
 * Maps read original field-chart coordinates, with their actual parameter units;
 * their input order is (original clock, normalized transverse), while the
 * returned kernel surface uses (transverse, clock) and transposed total2.
 * world fields use kernel millimetres. A null map total2 stays unavailable.
 * Runtime evaluators preserve foreign callback/getter exceptions unchanged.
 *
 * @evidence contracts/development/design.md#principled-representation Both existing SolidSurface fields and exact chart maps supply the actual whole neighboring functions needed by composition's total2 chain rule.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Explicit lookup maps connect the pure closed band descriptor to actual generating owners without a second sampled representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither a map key nor a matching rail position proves C2 or shared binding; supplied maps must differentiate their own actual point map on the full rectangle, and sources must be original owned fields.
 * @evidence contracts/development/common.md#meaningful-documentation States clock/chart/world units, immutable source lifetime and unavailable/exception behavior.
 */
export interface IAutoMovieConstructionKnownPortSource {
  /** Closed original-port declaration, immutable during consumption. */
  definition: IAutoMovieConstructionKnownPort;

  /** Actual original neighboring fields, not completed-loft contact reconstructions. */
  fields: ReadonlyMap<string, IAutoMovieSolidSurface>;

  /** Actual maps into those field charts, covering the whole declared rectangle. */
  maps: ReadonlyMap<string, IAutoMovieConstructionKnownPortSource.IMap>;
}

export namespace IAutoMovieConstructionKnownPortSource {
  /**
   * Pair of field-chart coordinates, with that field's original parameter units.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Pair of field-chart coordinates, with that field's original parameter units.
   * @evidence contracts/development/design.md#principled-representation Represents Pair of field-chart coordinates, with that field's original parameter units: type alias of 0 members (). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `Vector` in packages/engine/src/geometry/construction/IAutoMovieConstructionKnownPortSource.ts; its surface is the 0 members listed and the text shows 189 other files naming it, mostly packages/recovery (68), packages/human (57), packages/engine (35), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export type Vector = [number, number];

  /**
   * Complete total2 of the actual map from band clock u and normalized transverse v.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Complete total2 of the actual map from band clock u and normalized transverse v.
   * @evidence contracts/development/design.md#principled-representation Represents Complete total2 of the actual map from band clock u and normalized transverse v: interface of 6 members (`p`, `u`, `v`, `uu`, `uv`, `vv`); units and frames named in its text: second. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IJet` in packages/engine/src/geometry/construction/IAutoMovieConstructionKnownPortSource.ts; its surface is the 6 members listed and the text shows 143 other files naming it, mostly packages/human (53), test (48), packages/engine (42), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IJet {
    /** Actual field-chart point. */
    p: Vector;
    /** First derivative per band tangential-clock unit. */
    u: Vector;
    /** First derivative per normalized band transverse unit. */
    v: Vector;
    /** Second tangential derivative. */
    uu: Vector;
    /** Mixed tangential/transverse derivative. */
    uv: Vector;
    /** Second transverse derivative. */
    vv: Vector;
  }

  /**
   * One original source-chart correspondence over the full band rectangle.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: One original source-chart correspondence over the full band rectangle.
   * @evidence contracts/development/design.md#principled-representation Represents One original source-chart correspondence over the full band rectangle: interface of 4 members (`domain`, `transverse`, `point`, `jet`). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IMap` in packages/engine/src/geometry/construction/IAutoMovieConstructionKnownPortSource.ts; its surface is the 4 members listed and the text shows 8 other files naming it, mostly packages/human (5), test (2), packages/engine (1), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IMap {
    /** Actual tangential-clock domain in the same units as definition.domain. */
    domain: readonly [number, number];

    /** Actual normalized transverse domain, containing the entire interval [0,1]. */
    transverse: readonly [number, number];

    /**
     * Actual field-chart point, independent of derivative availability.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Actual field-chart point, independent of derivative availability.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Actual field-chart point, independent of derivative availability.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
     */
    point(u: number, v: number): Vector;

    /**
     * Actual map total2, or null where genuinely unavailable.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Actual map total2, or null where genuinely unavailable.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Actual map total2, or null where genuinely unavailable.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
     */
    jet(u: number, v: number): IJet | null;
  }
}
