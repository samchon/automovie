import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/** Data and callback contracts shared by the ResolveContactEvents operations. */
export namespace IAutoMovieResolveContactEvents {
  /** The stops so far: each stopped weapon's id with its contact second. */
  export type IStops = ReadonlyMap<string, number>;

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

  /** Physical knowledge of this initial episode; absence keeps initial reporting. */
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
     */
    tail?(
      seconds: number,
      stops: IAutoMovieResolveContactEvents.IStops,
    ): IAutoMovieVector3;
  }

  /** One body the weapons may meet. */
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
