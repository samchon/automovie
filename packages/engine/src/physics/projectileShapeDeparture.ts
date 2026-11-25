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
 * Let `u` be the initial centre minus a point carried by the collider, and `v`
 * the initial projectile velocity minus the caller's reference velocity. Every
 * fixed unit axis `m` that can separate the ball by time `h` must satisfy `m ·
 * u > radius - M h`, where `M` bounds the speed of that relative point. Scale
 * `u` by an upper bound `s` on its norm. The possible axes then lie in a cone
 * about `u / s`. Cauchy-Schwarz bounds their loss of projected opening by the
 * cone's chord radius times `|v|`. Subtract the translation's velocity
 * uncertainty and maximum rotational point speed to bound how fast support
 * advances. With strictly positive remaining opening, every axis that clears
 * within the prefix stays clear through it, even from a shallow overlap.
 *
 * The rotational speed bound is angular speed times reach about the parent
 * pivot, including the shape's local offset. This is the directional motion
 * bound used by conservative advancement (Catto, Continuous Collision, GDC
 * 2013, slides 20–23). Completeness after the positive witness is the ordinary
 * contact scan's guarantee.
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
    contact.gap === Infinity
  )
    return undefined;

  const bound: IAutoMovieProjectileFirstContact.IMotionBound | undefined =
    motion.bound(contact.from, contact.to);
  if (bound === undefined) return undefined;
  if (
    bound.to <= contact.from ||
    bound.to > contact.to ||
    bound.velocityError < 0 ||
    bound.angularSpeed < 0
  )
    throw new RangeError(
      "Projectile shape departure needs a motion bound within its search.",
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
  if (nearest.distance <= 0) return undefined;

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
  if (opening === Infinity || opening <= 0 || initial.speed === Infinity)
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
  if (movement === Infinity || room <= 0 || cone <= 0) return undefined;

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
  return gap !== Infinity && gap > 0
    ? { kind: "clearance", seconds }
    : undefined;
}

/** Frame admission for bounded finite projectile colliders. */
export namespace projectileShapeDeparture {
  /**
   * Admit a sampled rigid frame before the actual shape query uses it. The
   * returned borrowed metre translation and normalized rotation describe the
   * sampled pose; a nonfinite or materially non-unit frame throws RangeError,
   * even at a claimed clearance endpoint. Admitting individual poses
   * establishes no bound between them.
   *
   * @param frame A sampled parent pose in world metres.
   * @returns The same translation with the rotation normalized.
   */
  export function admitPose(
    frame: IAutoMovieRigidTransform,
  ): IAutoMovieRigidTransform {
    const q: IAutoMovieRigidTransform["rotation"] = frame.rotation;
    if (Math.abs(Math.hypot(q.x, q.y, q.z, q.w) - 1) > 1e-6)
      throw new RangeError(
        "Projectile shape departure needs a unit pose rotation.",
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
  while (root > 0 && root !== Infinity) {
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

/** Round upward, making an unrepresentable enclosure inconclusive. */
function upper(rounded: number): number {
  return rounded < Number.MAX_VALUE
    ? adjacentAutoMovieFloat64(rounded, true)
    : Infinity;
}

/** Round downward, making an unrepresentable enclosure inconclusive. */
function lower(rounded: number): number {
  return -upper(-rounded);
}

/** Fixed coordinate order for the componentwise enclosures. */
const AXES: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];
