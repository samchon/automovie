import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";
import type { IAutoMovieConstructionProfile } from "./IAutoMovieConstructionProfile";
import type { IAutoMovieViewAxis } from "./IAutoMovieViewAxis";

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
  plane: {
    /** Must equal definition.plane; Profile.create rejects a different owner address. */
    id: string;

    /** Borrowed physical-station frame owner, queried in millimetres; point/phase need at, total2 additionally needs jet. */
    axis: IAutoMovieViewAxis.IAxis;
  };

  /** Immutable actual local functions keyed by the declaration's source fields. */
  curves: ReadonlyMap<string, IAutoMovieConstructionProfileSource.ICurve>;

  /** Actual original region membership owners, needed only for declared trim keys. */
  regions?: ReadonlyMap<string, IAutoMovieConstructionProfileSource.IRegion>;
}

/**
 * Original local curve and region capabilities used by profile preparation.
 *
 * @evidence contracts/development/design.md#principled-representation Local millimetre values use physical-station millimetres and each original curve's own clock, before piece normalization.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ProfileSurface, ProfilePhase and the prepared region reader consume these owners directly.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nullable derivative orders and optional trim extraction expose actual capability rather than synthetic completion.
 * @evidence contracts/development/common.md#meaningful-documentation Names units, consumers and independent capability availability.
 */
export namespace IAutoMovieConstructionProfileSource {
  /**
     * Actual nonrectangular logical/material selection without fitting its boundary.
     *
     * The source map retains this owner for prepared contains queries. Its
     * domain must cover the region's authored active domain after conversion to
     * millimetres. Callback exceptions propagate; preparation checks coverage,
     * not the geometric truth of membership or interval boundaries.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines physical domain coverage, original-clock input and retained callback lifetime.
     * @evidence contracts/development/design.md#principled-representation Membership and optional exact intervals describe the same original trim without replacing it with a fitted polygon.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Prepared profile contains uses the original predicate after checking piece and active station ownership; interval extraction remains an optional source capability.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing intervals or a null result leave extraction unavailable; an empty result instead declares no retained interval at that station.
     */
    export interface IRegion {
      /** Actual physical station ownership, kernel millimetres. */
      domain: readonly [number, number];
  
      /**
       * Membership of the same original field at its physical station and original curve clock.
       *
       * @evidence contracts/development/common.md#meaningful-documentation Names physical-station millimetres and the original clock rather than the prepared piece's normalized coordinate.
       * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Membership of the same original field at its physical station and original curve clock.
       * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
       * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
       * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
       * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
       * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
       */
      contains(station: number, clock: number): boolean;
  
      /**
       * Exact retained intervals in the original curve-clock units at station
       * millimetres. Absence or null leaves boundary extraction unavailable;
       * an empty array means no retained interval. Consumers must treat returned
       * arrays as borrowed readonly data. Profile preparation does not call this
       * optional capability or validate its ordering.
       *
       * @evidence contracts/development/common.md#meaningful-documentation Defines original-clock intervals, absent/null versus empty results, readonly borrowing and lack of preparation-time extraction checks.
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
     * Same original value and qualified phase derivatives at a fixed physical station.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Gives local millimetres and original-clock derivative orders, including unavailable phase2.
     * @evidence contracts/development/design.md#principled-representation Fixed-station phase capability requires first order while independently qualifying second order with null.
     * @evidence contracts/development/design.md#minimal-and-owned-surface ProfilePhase reads these values into fresh world vectors without retaining or mutating the source arrays.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts ProfilePhase checks finite supplied pairs; null second order is not replaced by a zero vector.
     */
    export interface IPhase {
      /** Actual local point, kernel millimetres. */
      p: AutoMovieVector2Tuple;

      /** First derivative per original curve-clock unit. */
      t: AutoMovieVector2Tuple;

      /** Second original-clock derivative; null explicitly leaves this order unavailable. */
      tt: AutoMovieVector2Tuple | null;
    }

  /**
     * Complete local physical-station/original-clock total-order-two reading.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Each local pair states its physical-station/original-clock derivative order and millimetre numerator.
     * @evidence contracts/development/design.md#principled-representation Complete total2 requires all mixed and pure second orders for composition with the moving physical plane.
     * @evidence contracts/development/design.md#minimal-and-owned-surface ProfileSurface rescales clock derivatives and combines these values with the original plane's total2; ProfilePhase can also read its phase subset.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Finite pairs are checked at queries; derivative correctness on the full original neighborhood remains the function owner's premise.
     */
    export interface IJet {
      /** Local point, millimetres. */
      p: AutoMovieVector2Tuple;

      /** First derivative per physical station millimetre. */
      s: AutoMovieVector2Tuple;

      /** First derivative per original curve-clock unit. */
      t: AutoMovieVector2Tuple;

      /** Second derivative per station millimetre squared. */
      ss: AutoMovieVector2Tuple;

      /** Mixed derivative per station millimetre and original-clock unit. */
      st: AutoMovieVector2Tuple;

      /** Second derivative per original-clock unit squared. */
      tt: AutoMovieVector2Tuple;
    }

  /**
     * An immutable generating owner, not boundary Taylor coefficients or a fit.
     *
     * Prepared surfaces retain this curve and its dependencies by reference.
     * Point, phase and jet query the same local function at station millimetres
     * and its original clock. Keep all three and their domains unchanged while
     * readers exist. Foreign callback/getter exceptions propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States original units, retained ownership, query exception behavior and independent derivative availability.
     * @evidence contracts/development/design.md#principled-representation Point0, phase1/qualified phase2 and complete physical total2 remain distinct capabilities of one generating function.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Profile preparation uses actual domains and point/jet callbacks; ProfilePhase uses phase when supplied and otherwise the same jet's phase subset.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Preparation checks finite increasing domains and positive declared period, while query readers admit finite values and regular physical2 without numerical derivative substitutes.
     */
    export interface ICurve {
      /** Actual physical station interval, kernel millimetres. */
      domain: readonly [number, number];
  
      /** Actual supported original-clock interval, in the original units. */
      clock: readonly [number, number];
  
      /** Actual original-clock period when the same function and available derivatives support periodic aliases; absent leaves a bounded open chart. */
      period?: number;
  
      /**
       * Actual local point in millimetres at physical station millimetres and
       * original clock. It may remain available at a collapsed tip where jet is
       * null. Readers validate finite pairs and build their own world vectors.
       *
       * @evidence contracts/development/common.md#meaningful-documentation States physical station and original-clock arguments, local millimetre output and Point0 availability independent of tip derivatives.
       * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Actual Point0; numeric failures and foreign callback exceptions remain observable.
       * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
       * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
       * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
       * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
       * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
       */
      point(station: number, clock: number): AutoMovieVector2Tuple;
  
      /**
       * Actual fixed-station phase reading at station millimetres and original
       * clock. An absent method falls back to this owner's jet; an implemented
       * method returning null is a refusal and does not fall back. A nonnull
       * reading may still have tt=null. Readers do not mutate its arrays.
       *
       * @evidence contracts/development/common.md#meaningful-documentation Distinguishes absent-method fallback, explicit null refusal and a nonnull reading with unavailable second order.
       * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Actual phase1 with qualified phase2, or null; absence permits the same owner's complete jet to supply it.
       * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
       * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
       * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
       * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
       * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
       */
      phase?(station: number, clock: number): IAutoMovieConstructionProfileSource.IPhase | null;
  
      /**
       * Complete local total2 at station millimetres and original clock, or
       * null where unavailable. A prepared surface jet request converts null
       * into an admission exception and requires a complete plane jet too.
       * Consumers read the returned arrays without mutation or long-term retention.
       *
       * @evidence contracts/development/common.md#meaningful-documentation Defines complete local total2, its source units, null admission failure and nonmutating temporary consumption.
       * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the contract it fixes is: Actual local total2, or null where unavailable; never finite-difference substitutes.
       * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
       * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
       * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; the cost an implementation may incur is not constrained by this signature.
       * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
       * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so it carries no method of its own and each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
       */
      jet(station: number, clock: number): IAutoMovieConstructionProfileSource.IJet | null;
    }
}
