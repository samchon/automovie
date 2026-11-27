import type {
  IAutoMovieHit,
  IAutoMoviePhysicalShape,
  IAutoMovieProjectile,
  IAutoMovieProjectileContinue,
  IAutoMovieProjectileFirstContact,
  IAutoMovieProjectileFlight,
  IAutoMovieProjectileState,
  IAutoMovieRigidTransform,
  IAutoMovieSphere,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ProjectileContinueImplementation } from "./internal/ProjectileContinueImplementation";
import { ProjectileDragFlightImplementation } from "./internal/ProjectileDragFlightImplementation";
import { ProjectileFirstContactImplementation } from "./internal/ProjectileFirstContactImplementation";
import { projectileSphereHit as projectileSphereHitImplementation } from "./internal/projectileSphereHit";
import { segmentSphere as segmentSphereImplementation } from "./internal/segmentSphere";

/** Samples projectile flight and resolves its continuation and contacts. */
export namespace AutoMoviePhysicalProjectile {
  /**
   * What a projectile does after a contact, by the outcome the caller decided:
   *
   * - `stick`: it stops at the contact, its point carried `depth` on along its
   *   velocity into the struck body, and rests there;
   * - `bounce`: it leaves on a new flight from the contact, its velocity relative
   *   to the struck surface (`surface`, at rest when absent) split on the normal:
   *   the normal part reversed and scaled by the restitution, and the sliding of
   *   the contact point reduced by Coulomb friction's impulse, `min(mu (1 + e)
   *   |v_n|, J*)`, where `J*` is the impulse that stops the sliding (the
   *   rigid-body impact model of Brach, Mechanical Impact Dynamics, 1991, ch. 4,
   *   with its critical impulse ratio). A particle slides at its tangential
   *   velocity and `J* = |v_t|`. A `ball` of radius `r` and gyration `k` slides
   *   at `v_t - r (w x n)` for its spin `w`, and its spin takes up part of the
   *   impulse, so `J* = |s| k / (1 + k)`: a ball arriving without spin on a
   *   gripping bounce keeps `1 / (1 + k)` of its tangential speed, 3/5 for a thin
   *   shell (Cross 2002, Am J Phys 70:1093), and leaves turning at `w + J (n x
   *   s^) / (k r)`, the spin the next bounce reads; when `roll` is given and the
   *   rebound would rise less than the body's radius above the surface under
   *   gravity pressing toward the surface, it rolls instead;
   * - `roll`: it rolls along the surface with its velocity's tangential part,
   *   slowed at the rolling-resistance coefficient times the gravity pressing it
   *   on the surface, `a = c max(0, -g_n)`, to rest at `v^2 / (2 a)`;
   * - `pass`: it continues through on the same flight, losing a share of its speed.
   *
   * Every coefficient is the caller's: the engine names no projectile.
   * Restitution and the lost-speed share are finite values in [0, 1]; friction,
   * rolling resistance and embedding depth remain finite and nonnegative.
   * Gravity's pull along a tilted surface is not modelled in a roll, so a roll on
   * a slope keeps the deceleration of a level one (stated, not hidden). An
   * explicit roll with outward normal gravity is rejected: an unbound surface
   * cannot hold that body against gravity. Neutral normal gravity permits a
   * zero-resistance roll; it does not turn a bounce into one.
   *
   * @param projectile The flight that made contact.
   * @param hit Its contact, with the surface's normal.
   * @param outcome What happens.
   * @returns The segment that follows, timed from the original flight's launch.
   * @throws {RangeError} When the hit has no normal, a coefficient is negative or
   *   not finite, restitution or speed loss exceeds one, or an explicit roll
   *   would need a surface to pull against outward gravity.
   */
  export function continueFlight(
    projectile: IAutoMovieProjectile,
    hit: IAutoMovieHit,
    outcome: IAutoMovieProjectileContinue.Outcome,
  ): IAutoMovieProjectileContinue.Segment {
    return ProjectileContinueImplementation.projectileContinue(projectile, hit, outcome);
  }

  /**
   * A segment's centre and velocity at a second since the original launch: a
   * flight read from its own time zero, a roll's constant deceleration to rest,
   * a rest's place.
   *
   * @param segment The segment.
   * @param seconds Seconds since the original launch, at or after `from`.
   * @returns The state.
   */
  export function continuedAt(
    segment: IAutoMovieProjectileContinue.Segment,
    seconds: number,
  ): IAutoMovieProjectileState {
    return ProjectileContinueImplementation.continuedProjectileAt(segment, seconds);
  }

  /**
   * A projectile's flight under gravity and quadratic drag, read by time: `dx/dt
   * = v`, `dv/dt = gravity - k |v| v` with `k = rho Cd A / (2 m)`, solved by the
   * engine's one fixed-step integrator (`integrateMotionTrajectory`, classical
   * Runge-Kutta read by cubic Hermite) from the launch.
   *
   * The step is chosen once per flight by step doubling (Press et al., Numerical
   * Recipes, 3rd ed., 2007, sec. 17.2): from the integrator's own default step,
   * the step is halved until one step and two half steps from the launch differ,
   * divided by 15 (the fourth-order method's `2^4 - 1`), by no more than
   * `TOLERANCE` metres per second of the step, so the error over a flight of `T`
   * seconds stays near `TOLERANCE T`. The probe starts at the launch with the
   * speed the flight can reach at most: a body faster than its terminal speed
   * `sqrt(|g| / k)` only slows, one slower only approaches it, so the speed never
   * exceeds the larger of the two, where the drag's acceleration is largest. With
   * zero drag and nonzero gravity the global speed bound is Infinity; the finite
   * launch speed suffices for the step probe because acceleration is constant.
   * The halving stops at the 52 bits of a double's mantissa, past which a step
   * cannot shrink.
   *
   * The flight is integrated in chunks of `CHUNK` steps, each started from the
   * previous chunk's end, so a read far along the flight integrates only up to
   * its chunk, and every chunk depends on the launch alone: reads in any order
   * give the same values. Finite times before launch read the launch state;
   * nonfinite requests throw before any chunks are allocated. Projectile data
   * must remain unchanged while its reader is used.
   *
   * @param projectile A projectile with drag.
   * @returns The flight's reader.
   * @throws {RangeError} When launch vectors, speed/gravity norms, drag
   *   coefficients or their derived positive-drag bound are invalid or
   *   unrepresentable; reader methods also reject nonfinite times.
   */
  export function dragFlight(
    projectile: IAutoMovieProjectile,
  ): IAutoMovieProjectileFlight {
    return ProjectileDragFlightImplementation.projectileDragFlight(projectile);
  }

  /**
   * The error a flight may gather per second, metres: a tenth of the millimetre
   * within which a flight's arrival is accepted (#3470: an arrow's arrival
   * within 1 ms and 1 mm), so a flight of up to ten seconds stays inside it.
   */
  export const DRAG_TOLERANCE: number = ProjectileDragFlightImplementation.DRAG_TOLERANCE;

  /**
   * Steps per chunk: a memory bound no flight reads, about a thousand knots of
   * six numbers per chunk.
   */
  export const DRAG_CHUNK: number = ProjectileDragFlightImplementation.DRAG_CHUNK;

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
   * (`AutoMoviePhysicalProjectile.dragFlight.fastest`), plus a spinning tail's turning speed. A
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
   * @param colliders What it may meet; `AutoMoviePhysicalProjectile.planeCollider` and
   *   `AutoMoviePhysicalProjectile.shapeCollider` build the common ones.
   * @param span Seconds since launch the search covers.
   * @param options The projectile's radius and tail, thinnest collider and
   *   optional already-resolved initial collider.
   * @returns The first contact, or null when the flight meets nothing in the
   *   span.
   * @throws {RangeError} When the span is not finite and forward, thickness is
   *   not finite and positive, radius is not finite and non-negative, a tail
   *   lacks an attitude, or a departure certificate is invalid.
   */
  export function firstContact(
    projectile: IAutoMovieProjectile,
    colliders: readonly IAutoMovieProjectileFirstContact.ICollider[],
    span: IAutoMovieProjectileFirstContact.ISpan,
    options: IAutoMovieProjectileFirstContact.IOptions,
  ): IAutoMovieHit | null {
    return ProjectileFirstContactImplementation.projectileFirstContact(projectile, colliders, span, options);
  }

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
  export function contactStep(
    projectile: IAutoMovieProjectile,
    span: IAutoMovieProjectileFirstContact.ISpan,
    options: IAutoMovieProjectileFirstContact.IOptions,
  ): number {
    return ProjectileFirstContactImplementation.projectileContactStep(projectile, span, options);
  }

  /**
   * The largest speed any point of the projectile reaches between two seconds
   * since launch, metres per second: a drag-free flight's larger end speed (its
   * squared speed is convex in time), a drag flight's finite global bound
   * (`AutoMoviePhysicalProjectile.dragFlight.fastest`), plus a spinning tail's turning speed. The
   * sweep's step and its conservative advancement both read it.
   *
   * @param projectile The flight.
   * @param span Seconds since launch.
   * @param options The projectile's tail.
   * @returns The bound, metres per second.
   */
  export function contactSpeed(
    projectile: IAutoMovieProjectile,
    span: IAutoMovieProjectileFirstContact.ISpan,
    options: IAutoMovieProjectileFirstContact.IOptions,
  ): number {
    return ProjectileFirstContactImplementation.projectileContactSpeed(projectile, span, options);
  }

  /**
   * A fixed plane, solid on the side its normal points away from: the ground.
   *
   * @param id The collider's id.
   * @param point A point of the plane, world metres.
   * @param normal Its outward normal, non-zero.
   * @returns The collider.
   */
  export function planeCollider(
    id: string,
    point: IAutoMovieVector3,
    normal: IAutoMovieVector3,
  ): IAutoMovieProjectileFirstContact.ICollider {
    return ProjectileFirstContactImplementation.projectilePlaneCollider(id, point, normal);
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
  export function shapeCollider(
    id: string,
    shape: IAutoMoviePhysicalShape,
    pose: | IAutoMovieRigidTransform | ((seconds: number) => IAutoMovieRigidTransform) | IAutoMovieProjectileFirstContact.IContinuousPose,
  ): IAutoMovieProjectileFirstContact.ICollider {
    return ProjectileFirstContactImplementation.projectileShapeCollider(id, shape, pose);
  }

  /**
   * March a {@link IAutoMovieProjectile} over `[0, tMax]` in `steps` straight
   * segments and return the first time/point its path enters `sphere`, or `null`
   * if it never does within the window. Sampling the arc as segments keeps the
   * test exact per segment (the projectile is smooth, so a modest `steps`
   * resolves the contact time closely).
   */
  export function sphereHit(
    projectile: IAutoMovieProjectile,
    sphere: IAutoMovieSphere,
    tMax: number,
    steps?: number,
  ): IAutoMovieHit | null {
    return projectileSphereHitImplementation(projectile, sphere, tMax, steps);
  }

  /**
   * First intersection of the segment `a→b` with a sphere, as the parameter `s ∈
   * [0, 1]` where contact begins (`a + s·(b−a)`), or `null` if the segment never
   * touches the sphere. If `a` already lies inside, returns `0`.
   *
   * Solves `|a + s·d − c|² = r²` (a quadratic in `s`) and returns the entry root
   * that falls within the segment. A degenerate segment (`a == b`) reduces to a
   * point-in-sphere test.
   */
  export function segmentSphere(
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    c: IAutoMovieVector3,
    radius: number,
  ): number | null {
    return segmentSphereImplementation(a, b, c, radius);
  }
}
