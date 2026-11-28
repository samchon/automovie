import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/** Data and callback contracts shared by the ResolveContactEvents operations. */
export namespace IAutoMovieResolveContactEvents {
  /** The stops so far: each stopped weapon's id with its contact second. */
  export type IStops = ReadonlyMap<string, number>;

  /** Actual initial pair state, with an ungated reader of its signed gap. */
  export interface IWeaponFrame {
    /** Sphere centre or capsule axis's first end, world metres. */
    position: IAutoMovieVector3;

    /**
     * Capsule axis's other end, world metres; absent exactly when the declared
     * weapon has no tail.
     */
    tail?: IAutoMovieVector3;
  }

  /** Actual initial pair state, with an ungated reader of its signed gap. */
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

    /** Actual pair gap at a second, before departure eligibility is applied. */
    at(seconds: number): number;
  }

  /** A physical certificate for the departure of one initially touching pair. */
  export type Departure = IDepartureFields<IClearance | INoEntry>;

  /**
   * Certify a separated instant before any new entry of the pair.
   *
   * The resolver checks that this instant lies after the initial query and
   * within the remaining search. It measures the actual gap at that instant and
   * requires a positive value.
   */
  export interface IClearance {
    /** Selects a separation witness within the search span. */
    kind: "clearance";

    /** Certified second in the same clock as the search. */
    seconds: number;
  }

  /** Certify that this initially touching pair has no new entry in the search. */
  export interface INoEntry {
    /** Selects suppression for this pair during the rest of the search. */
    kind: "no-entry";
  }

  /**
   * The seconds one search reads: `from + k * step` for k = 0, 1, 2, ..., the
   * last of them clipped to `to`. A search after a contact starts its grid at
   * that contact's second, so each search has its own.
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
   * `from` and `to`: for any two grid seconds a < b in [from, to], no point of
   * the weapon's sphere or capsule, or of the body's surface, moves more than
   * the bound times b - a from a to b. Finite and not negative, or undefined
   * where none is certified. Only the grid's seconds are bound, because the
   * scan reads no other second where it advances.
   *
   * @param from A grid second.
   * @param to A later second.
   * @returns The bound, or undefined.
   */
  export type Speed = (from: number, to: number) => number | undefined;

  /** One moving weapon. */
  export interface IWeapon {
    /** Unique id. */
    id: string;

    /** The body carrying it, whose own distance it ignores. */
    owner: string;

    /** The sphere's radius, metres; a capsule's radius at `position`. */
    radius: number;

    /**
     * A tapered capsule's radius at `tail`, metres: the capsule then narrows
     * (or widens) linearly from `radius` at `position` to this, the round cone
     * of a limb whose girth changes from one joint to the next. Absent for a
     * sphere and for a capsule of one radius.
     */
    tailRadius?: number;

    /**
     * The weapon's speed bound on one search's grid (`Speed`), prepared once a
     * search under that search's stops. With it, and a body's own, the gap
     * between the two closes on the grid no faster than the two bounds
     * together, so a clear gap rules out a contact at the grid seconds within
     * that gap over that rate, and the scan reads none of them. The scan asks
     * it from a grid second it read over a window that doubles from one grid
     * step, at most to the weapon's live end (with the body's over the same
     * window), so it is read no farther than twice what it certifies. A bound
     * that a point exceeds lets a contact be missed, so only a certified one is
     * stated; absent, every grid step is read.
     *
     * @param grid The search's grid.
     * @param stops The stops of the search.
     * @returns The bound's reader.
     */
    speed?(
      grid: IAutoMovieResolveContactEvents.IGrid,
      stops: IAutoMovieResolveContactEvents.IStops,
    ): IAutoMovieResolveContactEvents.Speed;

    /**
     * When the weapon starts to be live, seconds, finite; it meets nothing
     * before, whatever its path says. The span's start when absent.
     */
    from?: number;

    /**
     * When it stops being live, seconds, finite and not before `from`; it meets
     * nothing after, whatever its path says. The span's end when absent.
     */
    to?: number;

    /**
     * The rigid part this weapon is one capsule of, such as the three capsules
     * of one striking arm: when any weapon of a group stops, the part stops as
     * a whole, so the group's other weapons meet nothing after that second and
     * produce no event of their own. Absent, the weapon stops alone.
     */
    group?: string;

    /**
     * The sphere's centre on its free path at a second, world metres.
     *
     * @param seconds Seconds.
     * @param stops The stops so far.
     * @returns The centre.
     */
    position(
      seconds: number,
      stops: IAutoMovieResolveContactEvents.IStops,
    ): IAutoMovieVector3;

    /**
     * The other end of a capsule weapon's axis on its free path at a second,
     * world metres; absent for a sphere. The weapon is then every point of the
     * segment from `position` to `tail` swept by `radius`.
     *
     * @param seconds Seconds.
     * @param stops The stops so far.
     * @returns The axis's other end.
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
     */
    sample?(seconds: number, stops: IStops): IWeaponFrame;
  }

  /** One body the weapons may meet. */
  export interface IBody {
    /** Its id, matching the `owner` of the weapons it carries. */
    id: string;

    /**
     * The body's speed bound on one search's grid (`Speed`), prepared once a
     * search under that search's stops and read with a weapon's own
     * (`IWeapon.speed`), over the same doubling window from a grid second the
     * scan read and before the weapon's, so a body that holds still only for a
     * while is still bound there and one that cannot be bound costs the weapon
     * no read; absent, every grid step is read against this body.
     *
     * @param grid The search's grid.
     * @param stops The stops of the search.
     * @returns The bound's reader.
     */
    speed?(
      grid: IAutoMovieResolveContactEvents.IGrid,
      stops: IAutoMovieResolveContactEvents.IStops,
    ): IAutoMovieResolveContactEvents.Speed;

    /**
     * Certify departure of an already-present pair only when its physical model
     * establishes that phase. A clearance must have no new entry before it;
     * no-entry covers only this search span. Undefined or absent keeps the
     * original initial overlap/touch report. Opaque distance samples alone do
     * not justify a certificate. The resolver validates clearance against
     * at(seconds), and every other body keeps its original eligibility.
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
     * Given a taper, the segment is widened by a radius running linearly from
     * its first end's to its other end's, and the distance is that tapered
     * capsule's: the least over its points of the distance less the radius
     * there.
     *
     * @param a The segment's first end, world metres.
     * @param b Its other end, world metres.
     * @param seconds Seconds.
     * @param stops The stops so far.
     * @param taper The radii at `a` and at `b`, metres, for a tapered capsule
     *   weapon.
     * @returns Metres.
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
     * mutual, so it stops with the striker. Absent, or undefined, when the part
     * met carries none.
     *
     * @param a The striking weapon's centre, or its axis's first end, world
     *   metres.
     * @param b The axis's other end; the centre again for a sphere.
     * @param seconds The contact second.
     * @param stops The stops before this contact.
     * @param by The id of the body carrying the striking weapon.
     * @returns The id of one of this body's weapons, or undefined.
     */
    carried?(
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
      seconds: number,
      stops: IAutoMovieResolveContactEvents.IStops,
      by: string,
    ): string | undefined;
  }

  /** The input. */
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

  /** One stop. */
  export interface IEvent {
    /** The weapon that stopped. */
    weapon: string;

    /** The body it met. */
    against: string;

    /** The contact second. */
    seconds: number;
  }
}

// Preserve assignment of each public variant to an unknown-valued dictionary.
type IDepartureFields<Certificate> = {
  [Key in keyof Certificate]: Certificate[Key];
};
