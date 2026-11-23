import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * Data and callback contracts shared by the ResolveContactEvents operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation World-metre sphere/capsule and body queries share a seconds clock and weapon-ID stop map. Departure uses a discriminated certificate union; optional tail, axis and taper combinations still need compatible caller-supplied geometry.
 * @evidence contracts/development/design.md#principled-representation World-metre sphere/capsule and body queries share a seconds clock and weapon-ID stop map.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieContactEvents consumes caller-owned geometric readers and emits weapon/body contact seconds. A search's grid and the speed bound on it let each side state its own certified bound per search.
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
  export interface IWeaponFrame {
    /** Sphere centre or capsule axis's first end, world metres. */
    position: IAutoMovieVector3;

    /** Capsule axis's other end, world metres; absent exactly when the declared weapon has no tail. */
    tail?: IAutoMovieVector3;
  }

  /**
   * Actual initial pair state, with an ungated reader of its signed gap.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieResolveContactEvents.IInitialContact: Actual initial pair state, with an ungated reader of its signed gap.
   * @evidence contracts/development/design.md#principled-representation One record of weapon, from, to, stops, gap, at.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Its producer fills it and the enclosing IAutoMovieResolveContactEvents contract's readers use it; nothing else is declared.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with its producer.
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
   * The seconds one search reads: `from + k * step` for k = 0, 1, 2, ...,
   * the last of them clipped to `to`. A search after a contact starts its
   * grid at that contact's second, so each search has its own.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the grid's seconds, the clipped last step and that each search after a contact has its own grid.
   * @evidence contracts/development/design.md#principled-representation A first second, a span end and a positive step are exactly what determines the seconds a search reads.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The resolver hands it to a weapon's and a body's speed readers, which prepare their bound for that search.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No second is cached; a positive finite step remains the resolver's admission.
   */
  export interface IGrid {
    /** The search's first second. */
    from: number;

    /** The span's end, where the last step is clipped. */
    to: number;

    /** The step, seconds; positive. */
    step: number;
  }

  /**
   * A bound on a search's grid, metres a second, between two of its seconds
   * `from` and `to`: for any two grid seconds a < b in [from, to], no point
   * of the weapon's sphere or capsule, or of the body's surface, moves more
   * than the bound times b - a from a to b. Finite and not negative, or
   * undefined where none is certified. Only the grid's seconds are bound,
   * because the scan reads no other second where it advances.
   *
   * @param from A grid second.
   * @param to A later second.
   * @returns The bound, or undefined.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both seconds, the metre-a-second bound over grid seconds only and the undefined uncertified case.
   * @evidence contracts/development/design.md#principled-representation A reader of one interval's bound, so a side that holds still only for a while can state a tighter bound there.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `IWeapon.speed` and `IBody.speed`; the first-impact scan reads it where it advances.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only a certified bound may be returned; undefined keeps every grid step read.
   */
  export type Speed = (from: number, to: number) => number | undefined;

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

    /**
     * The weapon's speed bound on one search's grid (`Speed`), prepared once
     * a search under that search's stops. With it, and a body's own, the gap
     * between the two closes on the grid no faster than the two bounds
     * together, so a clear gap rules out a contact at the grid seconds
     * within that gap over that rate, and the scan reads none of them. The
     * scan asks it from a grid second it read over a window that doubles
     * from one grid step, at most to the weapon's live end (with the
     * body's over the same window), so it is read no farther than twice
     * what it certifies. A
     * bound that a point exceeds lets a contact be missed, so only a
     * certified one is stated; absent, every grid step is read.
     *
     * @param grid The search's grid.
     * @param stops The stops of the search.
     * @returns The bound's reader.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the search grid and stops it is prepared for and the metre-a-second bound reader it returns.
     */
    speed?(
      grid: IAutoMovieResolveContactEvents.IGrid,
      stops: IAutoMovieResolveContactEvents.IStops,
    ): IAutoMovieResolveContactEvents.Speed;

    /** When the weapon starts to be live, seconds, finite; it meets nothing before, whatever its path says. The span's start when absent. */
    from?: number;

    /** When it stops being live, seconds, finite and not before `from`; it meets nothing after, whatever its path says. The span's end when absent. */
    to?: number;

    /**
     * The rigid part this weapon is one capsule of, such as the three
     * capsules of one striking arm: when any weapon of a group stops, the
     * part stops as a whole, so the group's other weapons meet nothing after
     * that second and produce no event of their own. Absent, the weapon stops
     * alone.
     */
    group?: string;

    /**
     * The sphere's centre on its free path at a second, world metres.
     *
     * @param seconds Seconds.
     * @param stops The stops so far.
     * @returns The centre.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the free-path centre in world metres, seconds clock and current weapon-stop context.
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
     */
    tail?(
      seconds: number,
      stops: IAutoMovieResolveContactEvents.IStops,
    ): IAutoMovieVector3;

    /**
     * Produce the actual endpoints together for this exact second and current
     * stops. When present, replaces position and tail calls for a geometry
     * query; tail presence must agree with the weapon's declared kind. The
     * resolver retains no sample across queries or changes to stops.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieResolveContactEvents.IWeapon.sample: Produce the actual endpoints together for this exact second and current stops.
     */
    sample?(seconds: number, stops: IStops): IWeaponFrame;
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
     * The body's speed bound on one search's grid (`Speed`), prepared once a
     * search under that search's stops and read with a weapon's own
     * (`IWeapon.speed`), over the same doubling window from a grid second
     * the scan read and before the weapon's, so a body that holds still
     * only for a while is still bound there and one that cannot be bound
     * costs the weapon no read; absent, every
     * grid step is read against this body.
     *
     * @param grid The search's grid.
     * @param stops The stops of the search.
     * @returns The bound's reader.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the search grid and stops it is prepared for and the metre-a-second bound reader it returns.
     */
    speed?(
      grid: IAutoMovieResolveContactEvents.IGrid,
      stops: IAutoMovieResolveContactEvents.IStops,
    ): IAutoMovieResolveContactEvents.Speed;

    /**
     * Certify departure of an already-present pair only when its physical
     * model establishes that phase. A clearance must have no new entry before
     * it; no-entry covers only this search span. Undefined or absent keeps
     * the original initial overlap/touch report. Opaque distance samples alone
     * do not justify a certificate. The resolver validates clearance against
     * at(seconds), and every other body keeps its original eligibility.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States physical-certificate responsibility, clearance validation, search-span scope and the reporting behavior when no certificate is supplied.
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
