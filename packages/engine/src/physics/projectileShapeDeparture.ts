import type {
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeNearest,
  IAutoMovieProjectile,
  IAutoMovieProjectileFirstContact,
  IAutoMovieProjectileState,
  IAutoMovieResolveContactEvents,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { adjacentAutoMovieFloat64 } from "../math/adjacentAutoMovieFloat64";
import { physicalShapeNearest } from "./physicalShapeNearest";
import { projectileAt } from "./projectileAt";

/**
 * Certify a separating prefix for one resolved sphere and finite convex shape.
 *
 * Let `u` be the initial centre minus a point carried by the collider, and
 * `v` the initial projectile velocity minus the caller's reference velocity.
 * Every fixed unit axis `m` that can separate the ball by time `h` must satisfy
 * `m · u > radius - M h`, where `M` bounds the speed of that relative point.
 * Scale `u` by an upper bound `s` on its norm. The possible axes then lie in
 * a cone about `u / s`. Cauchy-Schwarz bounds their loss of projected opening
 * by the cone's chord radius times `|v|`. Subtract the translation's velocity
 * uncertainty and maximum rotational point speed to bound how fast support
 * advances. With strictly positive remaining opening, every axis that clears
 * within the prefix stays clear through it, even from a shallow overlap.
 *
 * The rotational speed bound is angular speed times reach about the parent
 * pivot, including the shape's local offset. This is the directional motion
 * bound used by conservative advancement (Catto, Continuous Collision,
 * GDC 2013, slides 20–23). Completeness after the positive witness is the
 * ordinary contact scan's guarantee.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Declares the launch clock, moving convex solid, admitted sphere path, actual positive-gap witness and monotone-support separation proof.
 * @evidence contracts/development/implementation.md#principled-implementation A carried point restricts every possible separating axis, and a chord bound and Cauchy-Schwarz control its projected relative velocity. Angular speed times pivot radius bounds every point's support advance. Positive lower intervals prove no entry before the actual gap witness, even when an already resolved overlap starts inside the ball's radius.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the named initial episode and interval, obtain one actual shape anchor, bound support motion, and verify a positive gap through the resolver's unmodified reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A weak bound, missing motion information, unsupported flight or unrepresentable proof retains initial contact. No time epsilon, trajectory samples passed off as a bound, or permanent exclusion hides a later entry.
 * @evidence contracts/development/implementation.md#efficient-algorithms One reached closest-point query, constant scalar work and one actual clearance measurement. A rotating hull additionally scans its local points once to bound its reach. Other pairs and unmarked sweeps do no proof work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the existing flight and physical nearest owners and supplies the shared contact resolver's existing clearance protocol.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Bounds and samples are call-local, and only a scalar clearance time survives a successful proof.
 */
export function projectileShapeDeparture(
  id: string,
  shape: IAutoMoviePhysicalShape,
  read: (seconds: number) => IAutoMovieRigidTransform,
  motion: IAutoMovieProjectileFirstContact.IContinuousPose,
  projectile: IAutoMovieProjectile,
  options: IAutoMovieProjectileFirstContact.IOptions,
  contact: IAutoMovieResolveContactEvents.IInitialContact,
): IAutoMovieResolveContactEvents.Departure | undefined {
  if (
    options.departing !== id ||
    options.radius <= 0 ||
    options.tail !== undefined ||
    projectile.drag !== undefined ||
    !Number.isFinite(contact.gap)
  )
    return undefined;

  const bound: IAutoMovieProjectileFirstContact.IMotionBound | undefined =
    motion.bound(contact.from, contact.to);
  if (bound === undefined) return undefined;
  if (
    !(
      Number.isFinite(bound.to) &&
      bound.to > contact.from &&
      bound.to <= contact.to &&
      finite(bound.referenceVelocity) &&
      Number.isFinite(bound.velocityError) &&
      bound.velocityError >= 0 &&
      Number.isFinite(bound.angularSpeed) &&
      bound.angularSpeed >= 0
    )
  )
    throw new RangeError(
      "Projectile shape departure needs a finite motion bound within its search.",
    );

  const centre: IAutoMovieProjectileState = projectileAt(
    projectile,
    contact.from,
  );
  const nearest: IAutoMoviePhysicalShapeNearest.IResult = physicalShapeNearest(
    read(contact.from),
    shape,
    centre.position,
    centre.position,
  );
  if (
    !(
      Number.isFinite(nearest.distance) &&
      nearest.distance > 0 &&
      finite(nearest.point)
    )
  )
    return undefined;

  const rotation: number =
    bound.angularSpeed === 0
      ? 0
      : upper(bound.angularSpeed * shapeReach(shape));
  const acceleration: number = oneNorm(projectile.gravity);
  const uncertainty: number = upper(bound.velocityError + rotation);
  const initial: { speed: number; offsetNorm: number; projection: number } =
    relativeMotion(
      projectile,
      contact.from,
      nearest.point,
      bound.referenceVelocity,
    );
  const opening: number = lower(
    lower(initial.projection / initial.offsetNorm) - uncertainty,
  );
  if (
    !(Number.isFinite(opening) && opening > 0 && Number.isFinite(initial.speed))
  )
    return undefined;

  // Allocate half the available speed to direction variation and one quarter
  // to acceleration. The remaining quarter makes all these projections grow.
  const cone: number = lower(lower(opening / initial.speed) / 2);
  const accelerationBudget: number = lower(opening / 4);
  const movement: number = upper(
    upper(initial.speed + uncertainty) + accelerationBudget,
  );
  const room: number = lower(
    lower(options.radius - initial.offsetNorm) +
      lower(lower(lower(initial.offsetNorm * cone) * cone) / 2),
  );
  if (!(Number.isFinite(movement) && room > 0 && cone > 0)) return undefined;

  const duration: number =
    Math.min(
      room / movement,
      acceleration > 0 ? accelerationBudget / acceleration : Infinity,
    ) / 2;
  const seconds: number = Math.min(bound.to, contact.from + duration);
  const elapsed: number = upper(seconds - contact.from);
  if (
    !(
      seconds > contact.from &&
      upper(elapsed * movement) <= room &&
      upper(elapsed * acceleration) <= accelerationBudget
    )
  )
    return undefined;

  const gap: number = contact.at(seconds);
  return Number.isFinite(gap) && gap > 0
    ? { kind: "clearance", seconds }
    : undefined;
}

/**
 * Frame admission for bounded finite projectile colliders.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Shares one rigid frame admission across the shape builder's scalar, nearest and clearance reads.
 * @evidence contracts/development/design.md#principled-representation Each borrowed metre translation and normalized rotation defines the actual shape pose independently of the interval bound.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps pose admission with the single consumer of bounded rigid motion, without changing the legacy pose readers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Finite and unit-norm endpoints establish no continuous bound by themselves.
 */
export namespace projectileShapeDeparture {
  /**
   * Admit a sampled rigid frame before the actual shape query uses it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The returned borrowed metre translation and normalized rotation describe the sampled pose. A malformed frame throws even at a claimed clearance endpoint.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the rigid transform's documented unit-norm admission and the common quaternion normalization for a binary64 rotation representation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One finite/unit admission and one normalized rotation whose geometry the scalar and full readers share.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A materially non-unit or nonfinite sample cannot support a rigid-motion proof. Admission of individual poses establishes no bound between them.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A fixed-size transform admission.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the common Quaternion normalization owner.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a frame without acquiring or retaining resources.
   */
  export function admitPose(
    frame: IAutoMovieRigidTransform,
  ): IAutoMovieRigidTransform {
    const q: IAutoMovieRigidTransform["rotation"] = frame.rotation;
    if (
      !finite(frame.position) ||
      !(Math.abs(Math.hypot(q.x, q.y, q.z, q.w) - 1) <= 1e-6)
    )
      throw new RangeError(
        "Projectile shape departure needs a finite rigid pose.",
      );
    return { position: frame.position, rotation: Quaternion.normalize(q) };
  }
}

/** Enclose the launch-clock relative vectors and their cross projection. */
function relativeMotion(
  projectile: IAutoMovieProjectile,
  from: number,
  anchor: IAutoMovieVector3,
  reference: IAutoMovieVector3,
): { speed: number; offsetNorm: number; projection: number } {
  let speed2: number = 0;
  let offset2: number = 0;
  let projection: number = 0;
  const timeSquared: number = from * from;
  const halfLow: number = Math.max(0, lower(lower(timeSquared) / 2));
  const halfHigh: number = upper(upper(timeSquared) / 2);
  for (const axis of AXES) {
    const gravity: number = projectile.gravity[axis];
    const initial: number = projectile.velocity[axis];
    const origin: number = projectile.origin[axis];
    const gain: number = gravity * from;
    const vLow: number = lower(lower(initial + lower(gain)) - reference[axis]);
    const vHigh: number = upper(upper(initial + upper(gain)) - reference[axis]);
    const drift: number = initial * from;
    const near: number = Math.min(gravity * halfLow, gravity * halfHigh);
    const far: number = Math.max(gravity * halfLow, gravity * halfHigh);
    const uLow: number = lower(
      lower(lower(origin + lower(drift)) + lower(near)) - anchor[axis],
    );
    const uHigh: number = upper(
      upper(upper(origin + upper(drift)) + upper(far)) - anchor[axis],
    );
    const vAbs: number = Math.max(Math.abs(vLow), Math.abs(vHigh));
    const uAbs: number = Math.max(Math.abs(uLow), Math.abs(uHigh));
    speed2 = upper(speed2 + upper(vAbs * vAbs));
    offset2 = upper(offset2 + upper(uAbs * uAbs));
    projection = lower(
      projection +
        lower(Math.min(uLow * vLow, uLow * vHigh, uHigh * vLow, uHigh * vHigh)),
    );
  }
  return {
    speed: sqrtUpper(speed2),
    offsetNorm: sqrtUpper(offset2),
    projection,
  };
}

/** Raise a candidate norm until its lower squared endpoint encloses the sum. */
function sqrtUpper(square: number): number {
  let root: number = Math.sqrt(square);
  while (root > 0 && Number.isFinite(root)) {
    const squared: number = root * root;
    if (squared === Infinity || lower(squared) >= square) break;
    root = upper(root);
  }
  return root;
}

/** Upper Euclidean reach of the whole shape about its parent origin. */
function shapeReach(shape: IAutoMoviePhysicalShape): number {
  const offset: number = oneNorm(shape.transform.position);
  switch (shape.kind) {
    case "sphere":
      return upper(offset + shape.radius);
    case "capsule":
      return upper(offset + upper(shape.halfLength + shape.radius));
    case "box":
      return upper(offset + oneNorm(shape.halfExtents));
    case "hull": {
      let radius: number = 0;
      for (const point of shape.points)
        radius = Math.max(radius, oneNorm(point));
      return upper(offset + radius);
    }
  }
}

/** The one-norm encloses the Euclidean norm using only directed additions. */
function oneNorm(vector: IAutoMovieVector3): number {
  return upper(
    upper(Math.abs(vector.x) + Math.abs(vector.y)) + Math.abs(vector.z),
  );
}

/** Whether every world component is finite. */
function finite(vector: IAutoMovieVector3 | undefined | null): boolean {
  return vector != null && AXES.every((axis) => Number.isFinite(vector[axis]));
}

/** Round upward, making an unrepresentable enclosure inconclusive. */
function upper(rounded: number): number {
  return Number.isFinite(rounded) && rounded < Number.MAX_VALUE
    ? adjacentAutoMovieFloat64(rounded, true)
    : Infinity;
}

/** Round downward, making an unrepresentable enclosure inconclusive. */
function lower(rounded: number): number {
  return -upper(-rounded);
}

/** Fixed coordinate order for the componentwise enclosures. */
const AXES: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];
