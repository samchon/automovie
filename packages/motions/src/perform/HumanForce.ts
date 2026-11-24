import { Vector3, resolveImpact } from "@automovie/engine";
import type {
  AutoMovieHumanForceSite,
  IAutoMovieImpact,
  IAutoMovieImpactBodyState,
  IAutoMovieInteractionEvent,
  IAutoMovieMotionHumanForce,
  IAutoMovieMotionHumanImpulse,
  IAutoMovieMotionHumanSustainedForce,
  IAutoMovieVector3,
} from "@automovie/interface";

/** The alternatives of `OfHitStill`'s site. */
type OfHitStill = "restitution" | "hardness" | "penetrability";

/**
 * Forces on a performer as input to a performance: an impulse at an instant (a
 * blow, a shove, a hit) or a force sustained over a span (a load, a pull, a
 * braking support), each acting on a region or a point of a bone.
 *
 * Forces only inform the reactions a composition places, as layers never start
 * actions: a law reads the forces on its performer in its span through its
 * context (`IHumanActionContext.forces`), and the balance outcome of an impulse
 * is the engine's (`resolveAutoMovieBalanceOutcome`). A hit becomes an impulse
 * here and only here (`ofHit`), so a melee stop, a projectile and a blast reach
 * the body the same way.
 */
export namespace HumanForce {
  /**
   * The impulse a hit delivers to the struck person, the only conversion of a
   * hit record into a force (P1).
   *
   * A record carrying its own `impulse` (a blast) is taken unchanged. A record
   * with the striker's velocity after contact (`exit`, zero for a stick)
   * delivers the momentum the striker lost, `mass (velocity - exit)`. Otherwise
   * the two-mass normal impulse of the engine's `resolveImpact` is taken across
   * the struck surface's outward `normal`, the receiver as one body and the
   * striker as the other, with no restitution, the least the contact can
   * deliver, since the record names none.
   *
   * @param hit The hit record.
   * @param receiver The struck person's mass and velocity.
   * @returns The impulse on the struck person, or null for a record that names
   *   no person, no velocity or no mass.
   */
  export function ofHit(
    hit: IAutoMovieInteractionEvent,
    receiver: IAutoMovieMotionHumanForce.IReceiver,
  ): IAutoMovieMotionHumanImpulse | null {
    if (hit.target === null) return null;
    const at: AutoMovieHumanForceSite = hit.region ?? {
      bone: hit.bone ?? "hips",
      point: { x: 0, y: 0, z: 0 },
    };
    const of = (impulse: IAutoMovieVector3): IAutoMovieMotionHumanImpulse => ({
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
    const still: Pick<IAutoMovieImpactBodyState, OfHitStill> = {
      restitution: 0,
      hardness: 0,
      penetrability: 0,
    };
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
   * The forces on a person within a span: impulses at an instant inside it and
   * sustained forces that overlap it.
   *
   * @param forces Every force of the performance.
   * @param subject The person.
   * @param from Film seconds, start.
   * @param to Film seconds, end.
   * @returns The forces, in the order given.
   */
  export function within(
    forces: readonly IAutoMovieMotionHumanForce[],
    subject: string,
    from: number,
    to: number,
  ): IAutoMovieMotionHumanForce[] {
    return forces.filter(
      (f: IAutoMovieMotionHumanForce): boolean =>
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
  export function at(
    force: IAutoMovieMotionHumanSustainedForce,
    seconds: number,
  ): IAutoMovieVector3 {
    if (seconds < force.from || seconds > force.to) return { x: 0, y: 0, z: 0 };
    return typeof force.force === "function"
      ? force.force(seconds)
      : force.force;
  }
}
