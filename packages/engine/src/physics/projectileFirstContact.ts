import type {
  IAutoMoviePhysicalProfile,
  IAutoMovieVector3,
} from "@automovie/interface";

import { resolveAutoMovieContactEvents } from "../composition/resolveAutoMovieContactEvents";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { IAutoMovieHit } from "./IAutoMovieHit";
import type { IAutoMovieProjectile } from "./IAutoMovieProjectile";
import type { IAutoMovieProjectileState } from "./IAutoMovieProjectileState";
import { physicalShapeNearest } from "./physicalShapeNearest";
import { projectileAt } from "./projectileAt";
import { projectileDragFlight } from "./projectileDragFlight";
import { projectilePlaneDeparture } from "./projectilePlaneDeparture";

/**
 * A projectile's first contact with any of several colliders over a span of
 * its flight: when, where on the struck surface, the surface's outward
 * normal there, and which collider.
 *
 * The projectile is a sphere about its flight's point, or a capsule from
 * that point to a tail fixed in its body (an arrow from its point back to
 * its nock), turned by its attitude. The sweep is the engine's one contact
 * resolver (`resolveAutoMovieContactEvents`) with the projectile as its
 * single weapon and each collider as a body measured by its own nearest-point
 * reading, so the scan, the 24 bisections and the tie rule are the
 * resolver's. Its step is chosen from the flight so that the projectile
 * moves less than `thickness` in one step: `thickness` over the largest
 * speed any point of the projectile reaches in the span, which is the
 * larger end speed for a drag-free flight (the squared speed is convex in
 * time), the drag flight's bound otherwise (`projectileDragFlight.fastest`),
 * plus a spinning tail's turning speed. A collider thinner than `thickness`
 * can be crossed within one step: the stated blind spot, as the resolver
 * states its own. The point and the normal are the struck collider's
 * nearest-point reading against the projectile at the contact second.
 *
 * Initial touch or penetration is reported by default. After resolving that
 * episode, `departing` names its collider. A fixed plane can then classify
 * departure for a sphere or fixed-attitude tail from the normal motion of
 * this flight, deferring only that pair until actual positive clearance or
 * proving no fresh entry in the span. Later reentry and other colliders keep
 * the original scan. Rotating tails and opaque colliders retain initial
 * reporting unless their own physical model supplies a certificate.
 *
 * @param projectile The flight.
 * @param colliders What it may meet; `projectileFirstContact.plane` and `projectileFirstContact.shape` build the common ones.
 * @param span Seconds since launch the search covers.
 * @param options The projectile's radius and tail, thinnest collider and optional already-resolved initial collider.
 * @returns The first contact, or null when the flight meets nothing in the span.
 * @throws {RangeError} When the span is not finite and forward, thickness is not finite and positive, radius is not finite and non-negative, a tail lacks an attitude, or a departure certificate is invalid.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the projectile's shape, the sweep's owner, the step rule, the blind spot and where the normal comes from.
 * @evidence contracts/development/implementation.md#principled-implementation Continuous collision detection by the resolver's conservative scan and bisection, with the step bounded by the largest point speed so no collider of the stated thickness is stepped over.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, bound the speed, sweep with the one resolver, read the contact's point and normal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The step derives from the flight and stated thickness. Initial overlap is preserved unless the caller identifies a resolved episode and its collider supplies physical departure knowledge; no tolerance, time push, permanent collider removal or bounce cap masks that episode.
 * @evidence contracts/development/implementation.md#efficient-algorithms One nearest-point reading per eligible collider per scan step and bisection. An initially contacting collider may additionally classify departure once; the fixed plane probes actual normal clearance until a witness or representable-time exhaustion. This adds model work without changing the scan's thickness bound or blind spot.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the resolver's sweep, `physicalShapeNearest` for shapes and `projectileAt`'s memoised flight.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the flight's own memo.
 */
export function projectileFirstContact(
  projectile: IAutoMovieProjectile,
  colliders: readonly projectileFirstContact.ICollider[],
  span: { from: number; to: number },
  options: projectileFirstContact.IOptions,
): IAutoMovieHit | null {
  if (!(Number.isFinite(span.from) && Number.isFinite(span.to) && span.to > span.from))
    throw new RangeError(
      `projectile contact span ${span.from} to ${span.to} is not finite and forward`,
    );
  if (!(Number.isFinite(options.thickness) && options.thickness > 0))
    throw new RangeError(
      `projectile contact thickness must be finite and positive, but was ${options.thickness}`,
    );
  if (!(Number.isFinite(options.radius) && options.radius >= 0))
    throw new RangeError(
      `projectile contact radius must be finite and non-negative, but was ${options.radius}`,
    );
  if (options.tail !== undefined && projectile.attitude === undefined)
    throw new RangeError(
      "a projectile with a tail needs an attitude to turn it",
    );
  if (colliders.length === 0) return null;

  // The resolver's weapon needs an owner no collider is named after.
  const ids: ReadonlySet<string> = new Set(
    colliders.map((c: projectileFirstContact.ICollider): string => c.id),
  );
  let owner: string = "projectile";
  while (ids.has(owner)) owner = `${owner}'`;

  // The largest speed of any point of the projectile over the span.
  const centre: number =
    projectile.drag === undefined
      ? Math.max(
          Vector3.length(projectileAt(projectile, span.from).velocity),
          Vector3.length(projectileAt(projectile, span.to).velocity),
        )
      : projectileDragFlight(projectile).fastest;
  const reach: number =
    options.tail === undefined ? 0 : Vector3.length(options.tail);
  const turning: number =
    projectile.attitude?.kind === "spin"
      ? ((Math.abs(projectile.attitude.rate) * Math.PI) / 180) * reach
      : 0;
  const fastest: number = centre + turning;
  const step: number =
    fastest > 0 ? options.thickness / fastest : span.to - span.from;

  const tail = (
    state: IAutoMovieProjectileState,
  ): IAutoMovieVector3 | undefined =>
    options.tail === undefined
      ? undefined
      : Vector3.add(
          state.position,
          Quaternion.rotateVector(state.rotation!, options.tail),
        );
  const segment = (seconds: number): [IAutoMovieVector3, IAutoMovieVector3] => {
    const state: IAutoMovieProjectileState = projectileAt(projectile, seconds);
    return [state.position, tail(state) ?? state.position];
  };
  const events: resolveAutoMovieContactEvents.IEvent[] =
    resolveAutoMovieContactEvents({
      weapons: [
        {
          id: owner,
          owner,
          radius: options.radius,
          position: (seconds: number): IAutoMovieVector3 =>
            projectileAt(projectile, seconds).position,
          ...(options.tail === undefined
            ? {}
            : {
                tail: (seconds: number): IAutoMovieVector3 =>
                  tail(projectileAt(projectile, seconds))!,
              }),
        },
      ],
      bodies: colliders.map(
        (c: projectileFirstContact.ICollider): resolveAutoMovieContactEvents.IBody => {
          const departure: projectileFirstContact.ICollider["departure"] = c.departure;
          return {
            id: c.id,
            distance: (point: IAutoMovieVector3, seconds: number): number =>
              c.nearest(point, point, seconds).distance,
            axis: (
              a: IAutoMovieVector3,
              b: IAutoMovieVector3,
              seconds: number,
            ): number => c.nearest(a, b, seconds).distance,
            ...(departure === undefined ? {} : {
              departure: (
                contact: resolveAutoMovieContactEvents.IInitialContact,
              ): resolveAutoMovieContactEvents.Departure | undefined =>
                departure.call(c, projectile, options, contact),
            }),
          };
        },
      ),
      from: span.from,
      to: span.to,
      step,
    });
  const first: resolveAutoMovieContactEvents.IEvent | undefined = events[0];
  if (first === undefined) return null;
  const collider: projectileFirstContact.ICollider = colliders.find(
    (c: projectileFirstContact.ICollider): boolean => c.id === first.against,
  )!;
  const [a, b] = segment(first.seconds);
  const near: projectileFirstContact.INearest = collider.nearest(
    a,
    b,
    first.seconds,
  );
  return {
    time: first.seconds,
    point: near.point,
    normal: near.normal,
    collider: collider.id,
  };
}

/**
 * Companion types and collider builders of {@link projectileFirstContact}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
 * @evidence contracts/development/design.md#principled-representation A collider is a nearest-point reading of a segment at a second, optionally with physical departure knowledge for a resolved initial episode; a plane and a placed shape are its builders. The resolved collider id is separate from geometry and never removes later entry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a caller gives and the two builders the engine's own colliders need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A person's colliders are the caller's reading, never a shape the engine guesses.
 */
export namespace projectileFirstContact {
  /** Where a segment comes nearest a collider. */
  export interface INearest {
    /** Signed distance, metres; negative when the segment enters. */
    distance: number;

    /** The nearest point of the collider's surface, world metres. */
    point: IAutoMovieVector3;

    /** The collider's outward unit normal there. */
    normal: IAutoMovieVector3;
  }

  /** Something a flight may meet. */
  export interface ICollider {
    /** Unique id among the colliders. */
    id: string;

    /**
     * Certify departure of an explicitly resolved initial episode using this
     * collider's physical model. Unknown motion returns undefined and retains
     * ordinary overlap reporting; a witness is checked by the shared resolver.
     */
    departure?(
      projectile: IAutoMovieProjectile,
      options: IOptions,
      contact: resolveAutoMovieContactEvents.IInitialContact,
    ): resolveAutoMovieContactEvents.Departure | undefined;

    /**
     * Where a world segment comes nearest it at a second; a point when both
     * ends coincide.
     *
     * @param a One end, world metres.
     * @param b The other end, world metres.
     * @param seconds Seconds since the flight's launch.
     * @returns The reading.
     */
    nearest(
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
      seconds: number,
    ): INearest;
  }

  /** The projectile's size and the thinnest collider the search must see. */
  export interface IOptions {
    /**
     * Collider whose initial contact was already resolved by a continuation.
     * Only a physical departure certificate may defer this pair; absent or
     * unknown, initial overlap/touch is still reported. Other colliders and
     * this collider's later entry remain in the same sweep.
     */
    departing?: string;
    /** The projectile's radius, metres; 0 for a point. */
    radius: number;

    /** A capsule's other end in the body's own frame from the flight's point, metres; a sphere when absent. Needs an attitude. */
    tail?: IAutoMovieVector3;

    /** The thinnest collider the search must not step over, metres; positive. */
    thickness: number;
  }

  /**
   * A fixed plane, solid on the side its normal points away from: the ground.
   *
   * @param id The collider's id.
   * @param point A point of the plane, world metres.
   * @param normal Its outward normal, non-zero.
   * @returns The collider.
   */
  export function plane(
    id: string,
    point: IAutoMovieVector3,
    normal: IAutoMovieVector3,
  ): ICollider {
    const n: IAutoMovieVector3 = Vector3.normalize(normal);
    return {
      id,
      departure: (
        projectile: IAutoMovieProjectile,
        options: IOptions,
        contact: resolveAutoMovieContactEvents.IInitialContact,
      ): resolveAutoMovieContactEvents.Departure | undefined =>
        projectilePlaneDeparture(id, n, projectile, options, contact),
      nearest: (a: IAutoMovieVector3, b: IAutoMovieVector3): INearest => {
        const da: number = Vector3.dot(Vector3.subtract(a, point), n);
        const db: number = Vector3.dot(Vector3.subtract(b, point), n);
        const low: IAutoMovieVector3 = da <= db ? a : b;
        const d: number = Math.min(da, db);
        return {
          distance: d,
          point: Vector3.subtract(low, Vector3.scale(n, d)),
          normal: n,
        };
      },
    };
  }

  /**
   * An admitted collider shape placed by a pose that may move with time: an
   * archetype's part, a target butt.
   *
   * @param id The collider's id.
   * @param shape The shape, in its parent's frame.
   * @param pose The parent's world pose at a second since the launch.
   * @returns The collider.
   */
  export function shape(
    id: string,
    shape: IAutoMoviePhysicalProfile.IShape,
    pose: (seconds: number) => IAutoMoviePhysicalProfile.ITransform,
  ): ICollider {
    return {
      id,
      nearest: (
        a: IAutoMovieVector3,
        b: IAutoMovieVector3,
        seconds: number,
      ): INearest => {
        const near: physicalShapeNearest.IResult = physicalShapeNearest(
          pose(seconds),
          shape,
          a,
          b,
        );
        return {
          distance: near.distance,
          point: near.point,
          normal: near.normal,
        };
      },
    };
  }
}

