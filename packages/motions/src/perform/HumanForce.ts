import {
  type IAutoMovieImpact,
  type IAutoMovieImpactBody,
  Vector3,
  resolveImpact,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieInteractionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Forces on a performer as input to a performance (#3429): an impulse at an
 * instant (a blow, a shove, a hit) or a force sustained over a span (a load,
 * a pull, a braking support), each acting on a region or a point of a bone.
 *
 * Forces only inform the reactions a composition places, as layers never
 * start actions: a law reads the forces on its performer in its span
 * through its context (`IHumanActionContext.forces`), and the balance
 * outcome of an impulse is the engine's (`resolveAutoMovieBalanceOutcome`).
 * A hit becomes an impulse here and only here (`ofHit`), so a melee stop, a
 * projectile and a blast reach the body the same way.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two kinds of force, their units and frames, who reads them and the one conversion of a hit.
 * @evidence contracts/development/design.md#principled-representation Impulses in newton seconds at an instant and forces in newtons over a span, world frame, discriminated by kind, each on a region or a bone's point.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The force records, the hit conversion and the span reader the performance and the laws use; a soft prop's tension arrives as a sustained force (#3451).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The impulse of a hit is the engine's `resolveImpact` or the record's own momentum change, not a law's own formula.
 */
export namespace HumanForce {
  /** Where a force acts on the body: a surface region, or a point in a bone's frame. */
  export type At =
    | AutoMovieHumanoidRegion
    | { bone: AutoMovieHumanoidBone; point: IAutoMovieVector3 };

  /** An impulse at an instant. */
  export interface IImpulse {
    /** The discriminator. */
    kind: "impulse";

    /** The person it acts on. */
    subject: string;

    /** Where it acts. */
    at: At;

    /** Film seconds. */
    seconds: number;

    /** World newton seconds, on the body. */
    impulse: IAutoMovieVector3;
  }

  /** A force sustained over a span. */
  export interface ISustained {
    /** The discriminator. */
    kind: "sustained";

    /** The person it acts on. */
    subject: string;

    /** Where it acts. */
    at: At;

    /** Film seconds, start. */
    from: number;

    /** Film seconds, end. */
    to: number;

    /** World newtons on the body, constant or a pure function of film seconds. */
    force: IAutoMovieVector3 | ((seconds: number) => IAutoMovieVector3);
  }

  /** A force of either kind. */
  export type IForce = IImpulse | ISustained;

  /** The receiver of a hit: its mass and its velocity at the struck point. */
  export interface IReceiver {
    /** Kilograms. */
    mass: number;

    /** World metres per second at the struck point. */
    velocity: IAutoMovieVector3;
  }

  /**
   * The impulse a hit delivers to the struck person, the only conversion of
   * a hit record into a force (P1, #3480).
   *
   * A record carrying its own `impulse` (a blast) is taken unchanged. A
   * record with the striker's velocity after contact (`exit`, zero for a
   * stick) delivers the momentum the striker lost, `mass (velocity -
   * exit)`. Otherwise the two-mass normal impulse of the engine's
   * `resolveImpact` is taken across the struck surface's outward `normal`,
   * the receiver as one body and the striker as the other, with no
   * restitution, the least the contact can deliver, since the record names
   * none.
   *
   * @param hit The hit record.
   * @param receiver The struck person's mass and velocity.
   * @returns The impulse on the struck person, or null for a record that names no person, no velocity or no mass.
   */
  export function ofHit(
    hit: IAutoMovieInteractionEvent,
    receiver: IReceiver,
  ): IImpulse | null {
    if (hit.target === null) return null;
    const at: At = hit.region ?? {
      bone: hit.bone ?? "hips",
      point: { x: 0, y: 0, z: 0 },
    };
    const of = (impulse: IAutoMovieVector3): IImpulse => ({
      kind: "impulse",
      subject: hit.target!,
      at,
      seconds: hit.time,
      impulse,
    });
    if (hit.impulse !== undefined) return of(hit.impulse);
    if (hit.velocity === undefined || hit.mass === undefined) return null;
    if (hit.exit !== undefined)
      return of(
        Vector3.scale(Vector3.subtract(hit.velocity, hit.exit), hit.mass),
      );
    if (hit.normal === undefined) return null;
    const still: Pick<
      IAutoMovieImpactBody,
      "restitution" | "hardness" | "penetrability"
    > = { restitution: 0, hardness: 0, penetrability: 0 };
    const response: IAutoMovieImpact = resolveImpact(
      { mass: receiver.mass, velocity: receiver.velocity, ...still },
      { mass: hit.mass, velocity: hit.velocity, ...still },
      hit.normal,
    );

    // The engine's impulse acts along the normal on the striker; the
    // receiver takes its opposite.
    return of(Vector3.scale(response.impulse, -1));
  }

  /**
   * The forces on a person within a span: impulses at an instant inside it
   * and sustained forces that overlap it.
   *
   * @param forces Every force of the performance.
   * @param subject The person.
   * @param from Film seconds, start.
   * @param to Film seconds, end.
   * @returns The forces, in the order given.
   */
  export function within(
    forces: readonly IForce[],
    subject: string,
    from: number,
    to: number,
  ): IForce[] {
    return forces.filter(
      (f: IForce): boolean =>
        f.subject === subject &&
        (f.kind === "impulse"
          ? f.seconds >= from && f.seconds <= to
          : f.to >= from && f.from <= to),
    );
  }

  /**
   * A sustained force's value at a second.
   *
   * @param force The force.
   * @param seconds Film seconds.
   * @returns World newtons; zero outside its span.
   */
  export function at(force: ISustained, seconds: number): IAutoMovieVector3 {
    if (seconds < force.from || seconds > force.to) return { x: 0, y: 0, z: 0 };
    return typeof force.force === "function"
      ? force.force(seconds)
      : force.force;
  }
}
