import type {
  IAutoMovieHit,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeNearest,
  IAutoMovieProjectile,
  IAutoMovieProjectileFirstContact,
  IAutoMovieProjectileState,
  IAutoMovieResolveContactEvents,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { resolveAutoMovieContactEvents } from "../composition/internal/resolveAutoMovieContactEvents";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalShapeNearest } from "./internal/physicalShapeNearest";
import { physicalShapeSegmentDistance } from "./physicalShapeSegmentDistance";
import { projectileAt } from "./internal/projectileAt";
import { projectileDragFlight } from "./projectileDragFlight";
import { projectilePlaneDeparture } from "./internal/projectilePlaneDeparture";
import { projectileShapeDeparture } from "./internal/projectileShapeDeparture";

/**
 * A projectile's first contact with any of several colliders over a span of its
 * flight: when, where on the struck surface, the surface's outward normal
 * there, and which collider.
 *
 * The projectile is a sphere about its flight's point, or a capsule from that
 * point to a tail fixed in its body (an arrow from its point back to its nock),
 * turned by its attitude. The sweep is the engine's one contact resolver
 * (`resolveAutoMovieContactEvents`) with the projectile as its single weapon
 * and each collider as a body measured by its own nearest-point reading, so the
 * scan, root refinement and the tie rule are the resolver's. Its step is chosen
 * from the flight so that the projectile moves less than `thickness` in one
 * step: `thickness` over the largest speed any point of the projectile reaches
 * in the span, which is the larger end speed for a drag-free flight (the
 * squared speed is convex in time), including an explicit zero drag factor;
 * positive drag uses the flight's finite global bound
 * (`projectileDragFlight.fastest`), plus a spinning tail's turning speed. A
 * collider thinner than `thickness` can be crossed within one step: the stated
 * blind spot, as the resolver states its own. The point and the normal are the
 * struck collider's nearest-point reading against the projectile at the contact
 * second. The scan reads only signed separation and can defer the surface
 * witness when the collider supplies an equivalent scalar reader.
 *
 * Initial touch or penetration is reported by default. After resolving that
 * episode, `departing` names its collider. A fixed plane can then classify
 * departure for a sphere or fixed-attitude tail from the normal motion of this
 * flight, deferring only that pair until actual positive clearance or proving
 * no fresh entry in the span. Later reentry and other colliders keep the
 * original scan. A convex shape in a fixed frame certifies the same departure
 * by its supporting plane at the contact, behind which it lies whole, and a
 * continuously bounded finite convex shape for a drag-free ball. Rotating tails
 * and opaque colliders retain initial reporting unless their physical model
 * supplies a certificate.
 *
 * @param projectile The flight.
 * @param colliders What it may meet; `projectileFirstContact.plane` and
 *   `projectileFirstContact.shape` build the common ones.
 * @param span Seconds since launch the search covers.
 * @param options The projectile's radius and tail, thinnest collider and
 *   optional already-resolved initial collider.
 * @returns The first contact, or null when the flight meets nothing in the
 *   span.
 * @throws {RangeError} When the span is not finite and forward, thickness is
 *   not finite and positive, radius is not finite and non-negative, a tail
 *   lacks an attitude, or a departure certificate is invalid.
 */
export function projectileFirstContact(
  projectile: IAutoMovieProjectile,
  colliders: readonly IAutoMovieProjectileFirstContact.ICollider[],
  span: IAutoMovieProjectileFirstContact.ISpan,
  options: IAutoMovieProjectileFirstContact.IOptions,
): IAutoMovieHit | null {
  if (span.to <= span.from)
    throw new RangeError(
      `projectile contact span ${span.from} to ${span.to} is not forward`,
    );
  if (options.thickness <= 0)
    throw new RangeError(
      `projectile contact thickness must be positive, but was ${options.thickness}`,
    );
  if (options.radius < 0)
    throw new RangeError(
      `projectile contact radius must be non-negative, but was ${options.radius}`,
    );
  if (options.tail !== undefined && projectile.attitude === undefined)
    throw new RangeError(
      "a projectile with a tail needs an attitude to turn it",
    );
  if (colliders.length === 0) return null;

  // The resolver's weapon needs an owner no collider is named after.
  const ids: ReadonlySet<string> = new Set(
    colliders.map(
      (c: IAutoMovieProjectileFirstContact.ICollider): string => c.id,
    ),
  );
  let owner: string = "projectile";
  while (ids.has(owner)) owner = `${owner}'`;

  const step: number = projectileFirstContact.step(projectile, span, options);

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
  const events: IAutoMovieResolveContactEvents.IEvent[] =
    resolveAutoMovieContactEvents({
      weapons: [
        {
          id: owner,
          owner,
          radius: options.radius,
          position: (seconds: number): IAutoMovieVector3 =>
            projectileAt(projectile, seconds).position,
          sample: (
            seconds: number,
          ): IAutoMovieResolveContactEvents.IWeaponFrame => {
            const state: IAutoMovieProjectileState = projectileAt(
              projectile,
              seconds,
            );
            return { position: state.position, tail: tail(state) };
          },
          ...(options.tail === undefined
            ? {}
            : {
                tail: (seconds: number): IAutoMovieVector3 =>
                  tail(projectileAt(projectile, seconds))!,
              }),
          // Every point of the flight moves no faster over a window than the
          // step's own bound reads over it (`projectileFirstContact.speed`).
          speed:
            (): IAutoMovieResolveContactEvents.Speed =>
            (from: number, to: number): number =>
              projectileFirstContact.speed(projectile, { from, to }, options),
        },
      ],
      bodies: colliders.map(
        (
          c: IAutoMovieProjectileFirstContact.ICollider,
        ): IAutoMovieResolveContactEvents.IBody => {
          const departure: IAutoMovieProjectileFirstContact.ICollider["departure"] =
            c.departure;
          const scalar: IAutoMovieProjectileFirstContact.ICollider["distance"] =
            c.distance;
          const distance: NonNullable<
            IAutoMovieProjectileFirstContact.ICollider["distance"]
          > =
            scalar === undefined
              ? (a, b, seconds): number => c.nearest(a, b, seconds).distance
              : scalar.bind(c);
          const moving: IAutoMovieProjectileFirstContact.ICollider["speed"] =
            c.speed;
          return {
            id: c.id,
            ...(moving === undefined
              ? {}
              : {
                  speed:
                    (): IAutoMovieResolveContactEvents.Speed =>
                    (from: number, to: number): number | undefined =>
                      moving.call(c, from, to),
                }),
            distance: (point: IAutoMovieVector3, seconds: number): number =>
              distance(point, point, seconds),
            axis: (
              a: IAutoMovieVector3,
              b: IAutoMovieVector3,
              seconds: number,
            ): number => distance(a, b, seconds),
            ...(departure === undefined
              ? {}
              : {
                  departure: (
                    contact: IAutoMovieResolveContactEvents.IInitialContact,
                  ): IAutoMovieResolveContactEvents.Departure | undefined =>
                    departure.call(c, projectile, options, contact),
                }),
          };
        },
      ),
      from: span.from,
      to: span.to,
      step,
    });
  const first: IAutoMovieResolveContactEvents.IEvent | undefined = events[0];
  if (first === undefined) return null;
  const collider: IAutoMovieProjectileFirstContact.ICollider = colliders.find(
    (c: IAutoMovieProjectileFirstContact.ICollider): boolean =>
      c.id === first.against,
  )!;
  const [a, b] = segment(first.seconds);
  const near: IAutoMovieProjectileFirstContact.INearest = collider.nearest(
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

/** Companion types and collider builders of {@link projectileFirstContact}. */
export namespace projectileFirstContact {
  /**
   * The sweep's step: `thickness` over the largest speed any point of the
   * projectile reaches in the span, so it moves less than the thinnest collider
   * in one step. A drag-free flight's squared speed is convex in time, so its
   * two endpoint speeds bound the span; positive drag uses the flight's finite
   * global bound; a spinning tail adds its turning speed. A step longer than
   * the span, an infinite one where the thickness outruns any speed, is the
   * span itself. A collider's departure certificate reads the same step as the
   * scan's next grid second.
   *
   * @param projectile The flight.
   * @param span Seconds since launch the search covers.
   * @param options The projectile's tail and the thinnest collider.
   * @returns The step, seconds.
   */
  export function step(
    projectile: IAutoMovieProjectile,
    span: IAutoMovieProjectileFirstContact.ISpan,
    options: IAutoMovieProjectileFirstContact.IOptions,
  ): number {
    const fastest: number = speed(projectile, span, options);
    return Math.min(
      span.to - span.from,
      fastest > 0 ? options.thickness / fastest : Infinity,
    );
  }

  /**
   * The largest speed any point of the projectile reaches between two seconds
   * since launch, metres per second: a drag-free flight's larger end speed (its
   * squared speed is convex in time), a drag flight's finite global bound
   * (`projectileDragFlight.fastest`), plus a spinning tail's turning speed. The
   * sweep's step and its conservative advancement both read it.
   *
   * @param projectile The flight.
   * @param span Seconds since launch.
   * @param options The projectile's tail.
   * @returns The bound, metres per second.
   */
  export function speed(
    projectile: IAutoMovieProjectile,
    span: IAutoMovieProjectileFirstContact.ISpan,
    options: IAutoMovieProjectileFirstContact.IOptions,
  ): number {
    // Zero drag with gravity has no finite all-time bound. Its finite-span
    // squared speed is convex, so the two endpoint speeds bound this search.
    const flightBound: number | undefined =
      projectile.drag === undefined
        ? undefined
        : (projectile.flight ?? projectileDragFlight(projectile)).fastest;
    const centre: number =
      flightBound === undefined || flightBound === Infinity
        ? Math.max(
            Vector3.length(projectileAt(projectile, span.from).velocity),
            Vector3.length(projectileAt(projectile, span.to).velocity),
          )
        : flightBound;
    const reach: number =
      options.tail === undefined ? 0 : Vector3.length(options.tail);
    const turning: number =
      projectile.attitude?.kind === "spin"
        ? ((Math.abs(projectile.attitude.rate) * Math.PI) / 180) * reach
        : 0;
    return centre + turning;
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
  ): IAutoMovieProjectileFirstContact.ICollider {
    const n: IAutoMovieVector3 = Vector3.normalize(normal);
    /** The signed plane height of one endpoint. */
    const height = (endpoint: IAutoMovieVector3): number =>
      Vector3.dot(Vector3.subtract(endpoint, point), n);
    return {
      id,
      speed: (): number => 0,
      distance: (a, b): number => Math.min(height(a), height(b)),
      departure: (
        projectile: IAutoMovieProjectile,
        options: IAutoMovieProjectileFirstContact.IOptions,
        contact: IAutoMovieResolveContactEvents.IInitialContact,
      ): IAutoMovieResolveContactEvents.Departure | undefined =>
        projectilePlaneDeparture(id, n, projectile, options, contact),
      nearest: (
        a: IAutoMovieVector3,
        b: IAutoMovieVector3,
      ): IAutoMovieProjectileFirstContact.INearest => {
        const da: number = height(a);
        const db: number = height(b);
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
   * An admitted convex collider placed by a fixed frame or by a reading on the
   * supplied flight clock. A fixed frame certifies an explicitly resolved
   * departure by the shape's supporting plane at the contact
   * (`projectilePlaneDeparture` with that plane's normal): the shape lies
   * behind the plane, so a projectile that leaves the plane cannot enter it
   * before the plane's witness. A continuous pose can certify one for a
   * positive-radius sphere on a drag-free flight. The proof only reaches an
   * observed positive clearance for this pair. An opaque reader, or missing
   * continuous bounds, preserves initial contact.
   *
   * @param id The collider's id.
   * @param shape The shape, in its parent's frame.
   * @param pose A fixed parent pose, an opaque pose reader or a continuously
   *   bounded pose path in launch seconds.
   * @returns The collider.
   */
  export function shape(
    id: string,
    shape: IAutoMoviePhysicalShape,
    pose:
      | IAutoMovieRigidTransform
      | ((seconds: number) => IAutoMovieRigidTransform)
      | IAutoMovieProjectileFirstContact.IContinuousPose,
  ): IAutoMovieProjectileFirstContact.ICollider {
    const motion: IAutoMovieProjectileFirstContact.IContinuousPose | undefined =
      typeof pose !== "function" && "bound" in pose ? pose : undefined;
    const read: (seconds: number) => IAutoMovieRigidTransform =
      typeof pose === "function"
        ? pose
        : "bound" in pose
          ? (seconds): IAutoMovieRigidTransform =>
              projectileShapeDeparture.admitPose(pose.at(seconds))
          : (): IAutoMovieRigidTransform => pose;
    const geometry: IAutoMoviePhysicalShape =
      motion === undefined
        ? shape
        : {
            ...shape,
            transform: projectileShapeDeparture.admitPose(shape.transform),
          };
    const still: IAutoMovieRigidTransform | undefined =
      typeof pose === "function" || "bound" in pose ? undefined : pose;
    const fixed:
      | ReturnType<typeof physicalShapeSegmentDistance.prepare>
      | undefined =
      still === undefined
        ? undefined
        : physicalShapeSegmentDistance.prepare(still, geometry);
    return {
      id,
      ...(motion !== undefined
        ? {
            departure: (
              projectile: IAutoMovieProjectile,
              options: IAutoMovieProjectileFirstContact.IOptions,
              contact: IAutoMovieResolveContactEvents.IInitialContact,
            ): IAutoMovieResolveContactEvents.Departure | undefined =>
              projectileShapeDeparture(
                id,
                geometry,
                read,
                motion,
                projectile,
                options,
                contact,
              ),
          }
        : still !== undefined
          ? {
              // A shape in a fixed frame does not move.
              speed: (): number => 0,
              // A fixed convex shape lies behind its supporting plane at the
              // contact, so a projectile leaving that plane leaves the shape:
              // the plane's own departure proof holds for it.
              departure: (
                projectile: IAutoMovieProjectile,
                options: IAutoMovieProjectileFirstContact.IOptions,
                contact: IAutoMovieResolveContactEvents.IInitialContact,
              ): IAutoMovieResolveContactEvents.Departure | undefined => {
                if (options.departing !== id) return undefined;
                const state: IAutoMovieProjectileState = projectileAt(
                  projectile,
                  contact.from,
                );
                const end: IAutoMovieVector3 =
                  options.tail === undefined || state.rotation === undefined
                    ? state.position
                    : Vector3.add(
                        state.position,
                        Quaternion.rotateVector(state.rotation, options.tail),
                      );
                return projectilePlaneDeparture(
                  id,
                  physicalShapeNearest(still, geometry, state.position, end)
                    .normal,
                  projectile,
                  options,
                  contact,
                );
              },
            }
          : {}),
      distance: (a, b, seconds): number =>
        fixed === undefined
          ? physicalShapeSegmentDistance(read(seconds), geometry, a, b)
          : fixed(a, b),
      nearest: (
        a: IAutoMovieVector3,
        b: IAutoMovieVector3,
        seconds: number,
      ): IAutoMovieProjectileFirstContact.INearest => {
        const near: IAutoMoviePhysicalShapeNearest.IResult =
          physicalShapeNearest(read(seconds), geometry, a, b);
        return {
          distance: near.distance,
          point: near.point,
          normal: near.normal,
        };
      },
    };
  }
}
