import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * Data and callback contracts shared by the ResolveContactEvents operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation World-metre sphere/capsule and body queries share a seconds clock and weapon-ID stop map. Departure uses a discriminated certificate union; optional tail, axis and taper combinations still need compatible caller-supplied geometry.
 * @evidence contracts/development/design.md#principled-representation World-metre sphere/capsule and body queries share a seconds clock and weapon-ID stop map.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieContactEvents consumes caller-owned geometric readers and emits weapon/body contact seconds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Departure uses a discriminated certificate union; optional tail, axis and taper combinations still need compatible caller-supplied geometry.
 */
export namespace IAutoMovieResolveContactEvents {
  /**
   * The stops so far: each stopped weapon's id with its contact second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Weapon IDs map to their resolved contact time in seconds in the resolver clock. ReadonlyMap prevents mutation through this view; it neither freezes the underlying map nor admits time values.
   * @evidence contracts/development/design.md#principled-representation Weapon IDs map to their resolved contact time in seconds in the resolver clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The resolver passes one read-only view to weapon paths and body readers during a search.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts ReadonlyMap prevents mutation through this view; it neither freezes the underlying map nor admits time values.
   */
  export type IStops = ReadonlyMap<string, number>;

  /**
   * Actual initial pair state, with an ungated reader of its signed gap.
   *
   * @evidence contracts/development/common.md#meaningful-documentation One initial pair carries its nonpositive metre gap, seconds search span, current stops and ungated gap reader. The at reader reports actual pair geometry; a departure certificate cannot be inferred from sparse distance samples alone.
   * @evidence contracts/development/design.md#principled-representation One initial pair carries its nonpositive metre gap, seconds search span, current stops and ungated gap reader.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The resolver passes this state to the body's optional departure certifier before first-impact search.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The at reader reports actual pair geometry; a departure certificate cannot be inferred from sparse distance samples alone.
   */
  export interface IInitialContact {
    /** The sphere or capsule whose already-present contact is being classified. */
    weapon: IAutoMovieResolveContactEvents.IWeapon;

    /** Initial search second, in the weapon's clock. */
    from: number;

    /** Search end, clipped to the weapon's live end. */
    to: number;

    /** Current stops, unchanged during this first-impact search. */
    stops: IAutoMovieResolveContactEvents.IStops;

    /** Measured initial pair gap, metres; zero or negative. */
    gap: number;

    /**
     * Actual pair gap at a second, before departure eligibility is applied.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the seconds argument and actual ungated pair gap in metres, independent of departure eligibility.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; resolveAutoMovieContactEvents and the caller's physical-model readers own the numerical method under the documented units and input premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; resolveAutoMovieContactEvents and the caller's physical-model readers own executable decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by resolveAutoMovieContactEvents and the caller's physical-model readers.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; resolveAutoMovieContactEvents and the caller's physical-model readers own its evaluation cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; resolveAutoMovieContactEvents and the caller's physical-model readers decide whether calls share coefficients, identities or mutable state.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; resolveAutoMovieContactEvents and the caller's physical-model readers own references retained by the supplied callable.
     */
    at(seconds: number): number;
  }

  /**
   * Physical knowledge of this initial episode; absence keeps initial reporting.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The clearance branch carries a later seconds instant; the no-entry branch certifies the complete current search span. The discriminant prevents a no-entry certificate from requiring a meaningless time; proof of physical departure remains the producer's obligation.
   * @evidence contracts/development/design.md#principled-representation The clearance branch carries a later seconds instant; the no-entry branch certifies the complete current search span.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Body physical models produce certificates consumed and checked by resolveAutoMovieContactEvents.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The discriminant prevents a no-entry certificate from requiring a meaningless time; proof of physical departure remains the producer's obligation.
   */
  export type Departure =
    | {
        /** No new entry occurs before this genuinely separated instant. */
        kind: "clearance";

        /** Strictly later in-span second whose actual pair gap is positive. */
        seconds: number;
      }
    | {
        /** The physical model rules out a new entry over this search span. */
        kind: "no-entry";
      };

  /**
   * One moving weapon.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A world-metre centre and optional tail describe a sphere or capsule with a finite seconds live span. Tail and tailRadius remain optional to preserve existing sphere, uniform-capsule and tapered-capsule uses; compatible combinations need runtime/caller admission.
   * @evidence contracts/development/design.md#principled-representation A world-metre centre and optional tail describe a sphere or capsule with a finite seconds live span.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Caller-owned path functions supply moving geometry to the resolver, indexed by unique weapon and carrying-body IDs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Tail and tailRadius remain optional to preserve existing sphere, uniform-capsule and tapered-capsule uses; compatible combinations need runtime/caller admission.
   */
  export interface IWeapon {
    /** Unique id. */
    id: string;

    /** The body carrying it, whose own distance it ignores. */
    owner: string;

    /** The sphere's radius, metres; a capsule's radius at `position`. */
    radius: number;

    /**
     * A tapered capsule's radius at `tail`, metres: the capsule then narrows
     * (or widens) linearly from `radius` at `position` to this, the round
     * cone of a limb whose girth changes from one joint to the next. Absent
     * for a sphere and for a capsule of one radius.
     */
    tailRadius?: number;

    /** When the weapon starts to be live, seconds, finite; it meets nothing before, whatever its path says. The span's start when absent. */
    from?: number;

    /** When it stops being live, seconds, finite and not before `from`; it meets nothing after, whatever its path says. The span's end when absent. */
    to?: number;

    /**
     * The sphere's centre on its free path at a second, world metres.
     *
     * @param seconds Seconds.
     * @param stops The stops so far.
     * @returns The centre.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the free-path centre in world metres, seconds clock and current weapon-stop context.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; resolveAutoMovieContactEvents and the caller's physical-model readers own the numerical method under the documented units and input premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; resolveAutoMovieContactEvents and the caller's physical-model readers own executable decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by resolveAutoMovieContactEvents and the caller's physical-model readers.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; resolveAutoMovieContactEvents and the caller's physical-model readers own its evaluation cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; resolveAutoMovieContactEvents and the caller's physical-model readers decide whether calls share coefficients, identities or mutable state.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; resolveAutoMovieContactEvents and the caller's physical-model readers own references retained by the supplied callable.
     */
    position(
      seconds: number,
      stops: IAutoMovieResolveContactEvents.IStops,
    ): IAutoMovieVector3;

    /**
     * The other end of a capsule weapon's axis on its free path at a second,
     * world metres; absent for a sphere. The weapon is then every point of
     * the segment from `position` to `tail` swept by `radius`.
     *
     * @param seconds Seconds.
     * @param stops The stops so far.
     * @returns The axis's other end.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the optional capsule axis endpoint in world metres and the shared seconds/stop context; absence selects a sphere.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; resolveAutoMovieContactEvents and the caller's physical-model readers own the numerical method under the documented units and input premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; resolveAutoMovieContactEvents and the caller's physical-model readers own executable decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by resolveAutoMovieContactEvents and the caller's physical-model readers.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; resolveAutoMovieContactEvents and the caller's physical-model readers own its evaluation cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; resolveAutoMovieContactEvents and the caller's physical-model readers decide whether calls share coefficients, identities or mutable state.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; resolveAutoMovieContactEvents and the caller's physical-model readers own references retained by the supplied callable.
     */
    tail?(
      seconds: number,
      stops: IAutoMovieResolveContactEvents.IStops,
    ): IAutoMovieVector3;
  }

  /**
   * One body the weapons may meet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation World-metre signed-distance readers share the weapon seconds clock and report positive values outside. Capsule queries require axis support; optional readers express actual capabilities, and the interface cannot certify distance-field accuracy.
   * @evidence contracts/development/design.md#principled-representation World-metre signed-distance readers share the weapon seconds clock and report positive values outside.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The body's physical model owns distance, optional segment distance, departure and carried-weapon readers used by the resolver.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Capsule queries require axis support; optional readers express actual capabilities, and the interface cannot certify distance-field accuracy.
   */
  export interface IBody {
    /** Its id, matching the `owner` of the weapons it carries. */
    id: string;

    /**
     * Certify departure of an already-present pair only when its physical
     * model establishes that phase. A clearance must have no new entry before
     * it; no-entry covers only this search span. Undefined or absent keeps
     * the original initial overlap/touch report. Opaque distance samples alone
     * do not justify a certificate. The resolver validates clearance against
     * at(seconds), and every other body keeps its original eligibility.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States physical-certificate responsibility, clearance validation, search-span scope and the reporting behavior when no certificate is supplied.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; resolveAutoMovieContactEvents and the caller's physical-model readers own the numerical method under the documented units and input premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; resolveAutoMovieContactEvents and the caller's physical-model readers own executable decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by resolveAutoMovieContactEvents and the caller's physical-model readers.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; resolveAutoMovieContactEvents and the caller's physical-model readers own its evaluation cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; resolveAutoMovieContactEvents and the caller's physical-model readers decide whether calls share coefficients, identities or mutable state.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; resolveAutoMovieContactEvents and the caller's physical-model readers own references retained by the supplied callable.
     */
    departure?(
      contact: IAutoMovieResolveContactEvents.IInitialContact,
    ): IAutoMovieResolveContactEvents.Departure | undefined;

    /**
     * The signed distance from a point to the body's surface at a second,
     * metres: positive outside.
     *
     * @param point World metres.
     * @param seconds Seconds.
     * @param stops The stops so far.
     * @returns Metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the world-metre query point, seconds clock, current stops and positive-outside signed metre distance.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; resolveAutoMovieContactEvents and the caller's physical-model readers own the numerical method under the documented units and input premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; resolveAutoMovieContactEvents and the caller's physical-model readers own executable decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by resolveAutoMovieContactEvents and the caller's physical-model readers.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; resolveAutoMovieContactEvents and the caller's physical-model readers own its evaluation cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; resolveAutoMovieContactEvents and the caller's physical-model readers decide whether calls share coefficients, identities or mutable state.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; resolveAutoMovieContactEvents and the caller's physical-model readers own references retained by the supplied callable.
     */
    distance(
      point: IAutoMovieVector3,
      seconds: number,
      stops: IAutoMovieResolveContactEvents.IStops,
    ): number;

    /**
     * The signed distance from a segment to the body's surface at a second,
     * metres: the least signed distance over the segment's points, positive
     * when the whole segment is outside. Required to meet capsule weapons.
     * Given a taper, the segment is widened by a radius running linearly
     * from its first end's to its other end's, and the distance is that
     * tapered capsule's: the least over its points of the distance less the
     * radius there.
     *
     * @param a The segment's first end, world metres.
     * @param b Its other end, world metres.
     * @param seconds Seconds.
     * @param stops The stops so far.
     * @param taper The radii at `a` and at `b`, metres, for a tapered capsule weapon.
     * @returns Metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States segment endpoint frames, seconds, optional metre taper radii and the least signed distance convention needed by capsule queries.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; resolveAutoMovieContactEvents and the caller's physical-model readers own the numerical method under the documented units and input premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; resolveAutoMovieContactEvents and the caller's physical-model readers own executable decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by resolveAutoMovieContactEvents and the caller's physical-model readers.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; resolveAutoMovieContactEvents and the caller's physical-model readers own its evaluation cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; resolveAutoMovieContactEvents and the caller's physical-model readers decide whether calls share coefficients, identities or mutable state.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; resolveAutoMovieContactEvents and the caller's physical-model readers own references retained by the supplied callable.
     */
    axis?(
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
      seconds: number,
      stops: IAutoMovieResolveContactEvents.IStops,
      taper?: readonly [number, number],
    ): number;

    /**
     * The body's own weapon carried by the part a striking weapon met, when
     * that weapon is still on its free path at the second: the contact is
     * mutual, so it stops with the striker. Absent, or undefined, when the
     * part met carries none.
     *
     * @param a The striking weapon's centre, or its axis's first end, world metres.
     * @param b The axis's other end; the centre again for a sphere.
     * @param seconds The contact second.
     * @param stops The stops before this contact.
     * @param by The id of the body carrying the striking weapon.
     * @returns The id of one of this body's weapons, or undefined.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States contact-point frames, contact second, prior stops and the optional carried weapon identity returned for a mutual stop.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; resolveAutoMovieContactEvents and the caller's physical-model readers own the numerical method under the documented units and input premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature exposes the callback boundary; resolveAutoMovieContactEvents and the caller's physical-model readers own executable decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration supplies no algorithm, compensation or fallback; the actual behavior is implemented by resolveAutoMovieContactEvents and the caller's physical-model readers.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no traversal or allocation strategy; resolveAutoMovieContactEvents and the caller's physical-model readers own its evaluation cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration schedules no work; resolveAutoMovieContactEvents and the caller's physical-model readers decide whether calls share coefficients, identities or mutable state.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no storage or handles; resolveAutoMovieContactEvents and the caller's physical-model readers own references retained by the supplied callable.
     */
    carried?(
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
      seconds: number,
      stops: IAutoMovieResolveContactEvents.IStops,
      by: string,
    ): string | undefined;
  }

  /**
   * The input.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Moving weapons and bodies share an ordered seconds search span and a positive seconds scan step. Array types do not enforce unique identities, valid spans or positive step; the resolver and geometric producers own those premises.
   * @evidence contracts/development/design.md#principled-representation Moving weapons and bodies share an ordered seconds search span and a positive seconds scan step.
   * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieContactEvents consumes the caller's geometry arrays synchronously to build stop events.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Array types do not enforce unique identities, valid spans or positive step; the resolver and geometric producers own those premises.
   */
  export interface IInput {
    /** The weapons. */
    weapons: readonly IAutoMovieResolveContactEvents.IWeapon[];

    /** The bodies. */
    bodies: readonly IAutoMovieResolveContactEvents.IBody[];

    /** Span start, seconds. */
    from: number;

    /** Span end, seconds. */
    to: number;

    /** Scan step, seconds; positive. */
    step: number;
  }

  /**
   * One stop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation One resolved weapon/body pair records its stopping instant in the input seconds clock. A receipt contains actual identity keys, not sampled geometry or a general collision-free certificate.
   * @evidence contracts/development/design.md#principled-representation One resolved weapon/body pair records its stopping instant in the input seconds clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieContactEvents publishes these scalar receipts for downstream motion stops.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A receipt contains actual identity keys, not sampled geometry or a general collision-free certificate.
   */
  export interface IEvent {
    /** The weapon that stopped. */
    weapon: string;

    /** The body it met. */
    against: string;

    /** The contact second. */
    seconds: number;
  }
}
