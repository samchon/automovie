import type {
  IAutoMovieHit,
  IAutoMovieProjectile,
  IAutoMovieProjectileContinue,
  IAutoMovieProjectileState,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { projectileAt } from "./projectileAt";

/**
 * What a projectile does after a contact, by the outcome the caller decided:
 *
 * - `stick`: it stops at the contact, its point carried `depth` on along its
 *   velocity into the struck body, and rests there;
 * - `bounce`: it leaves on a new flight from the contact, its velocity's
 *   normal part reversed and scaled by the restitution and its tangential
 *   part reduced by Coulomb friction's impulse, `min(mu (1 + e) |v_n|,
 *   |v_t|)` (the rigid-body impact model of Brach, Mechanical Impact
 *   Dynamics, 1991, ch. 4); when `roll` is given and the rebound would rise
 *   less than the body's radius above the surface under gravity pressing
 *   toward the surface, it rolls instead;
 * - `roll`: it rolls along the surface with its velocity's tangential part,
 *   slowed at the rolling-resistance coefficient times the gravity pressing
 *   it on the surface, `a = c max(0, -g_n)`, to rest at `v^2 / (2 a)`;
 * - `pass`: it continues through on the same flight, losing a share of its
 *   speed.
 *
 * Every coefficient is the caller's: the engine names no projectile.
 * Restitution and the lost-speed share are finite values in [0, 1]; friction,
 * rolling resistance and embedding depth remain finite and nonnegative.
 * Gravity's pull along a tilted surface is not modelled in a roll, so a roll
 * on a slope keeps the deceleration of a level one (stated, not hidden).
 * An explicit roll with outward normal gravity is rejected: an unbound
 * surface cannot hold that body against gravity. Neutral normal gravity
 * permits a zero-resistance roll; it does not turn a bounce into one.
 *
 * @param projectile The flight that made contact.
 * @param hit Its contact, with the surface's normal.
 * @param outcome What happens.
 * @returns The segment that follows, timed from the original flight's launch.
 * @throws {RangeError} When the hit has no normal, a coefficient is negative or not finite, restitution or speed loss exceeds one, or an explicit roll would need a surface to pull against outward gravity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States every outcome's law, its source and the slope it does not model.
 * @evidence contracts/development/implementation.md#principled-implementation Newton's restitution on the normal part and Coulomb's impulse limit on the tangential part. A roll's constant resistance uses compressive normal gravity only; the e²v_n²/(2g_n) rebound-height test is applicable only with inward gravity. Outward gravity cannot bind a body to a ceiling or wall.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the state at contact, split the velocity on the normal, one branch per outcome.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Restitution and lost-speed shares outside [0,1] refuse rather than adding energy or clamping an invalid loss to a stop. Other coefficients keep their finite nonnegative domain. A rebound below the radius becomes a roll only when the caller gives one and gravity actually returns it to the surface; an explicit roll needing tensile surface force throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per contact.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A new flight is a projectile record read by `projectileAt` like the first.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function projectileContinue(
  projectile: IAutoMovieProjectile,
  hit: IAutoMovieHit,
  outcome: IAutoMovieProjectileContinue.Outcome,
): IAutoMovieProjectileContinue.Segment {
  if (hit.normal === undefined)
    throw new RangeError(
      "a projectile continues only from a contact with a normal",
    );
  const state: IAutoMovieProjectileState = projectileAt(projectile, hit.time);
  const n: IAutoMovieVector3 = Vector3.normalize(hit.normal);
  const vn: number = Vector3.dot(state.velocity, n);
  const normal: IAutoMovieVector3 = Vector3.scale(n, vn);
  const tangent: IAutoMovieVector3 = Vector3.subtract(state.velocity, normal);
  const admit: (name: string, value: number, maximum?: number) => void = (
    name: string,
    value: number,
    maximum?: number,
  ): void => {
    if (
      !(
        Number.isFinite(value) &&
        value >= 0 &&
        (maximum === undefined || value <= maximum)
      )
    ) {
      const range: string =
        maximum === undefined
          ? "finite and non-negative"
          : `finite and between 0 and ${maximum}`;
      throw new RangeError(
        `projectile ${name} must be ${range}, but was ${value}`,
      );
    }
  };
  const held: { rotation?: IAutoMovieQuaternion } =
    state.rotation === undefined ? {} : { rotation: state.rotation };
  const roll = (
    velocity: IAutoMovieVector3,
    resistance: number,
    normalGravity: number,
  ): IAutoMovieProjectileContinue.Segment => {
    admit("rolling resistance", resistance);
    if (normalGravity > 0)
      throw new RangeError(
        "a projectile cannot roll against outward normal gravity",
      );
    const deceleration: number = resistance * Math.max(0, -normalGravity);
    const speed: number = Vector3.length(velocity);
    const lasting: number =
      deceleration > 0 ? speed / deceleration : speed > 0 ? Infinity : 0;
    return {
      kind: "roll",
      from: hit.time,
      origin: state.position,
      velocity,
      deceleration,
      until: hit.time + lasting,
      ...held,
    };
  };
  switch (outcome.kind) {
    case "stick": {
      admit("embedding depth", outcome.depth);
      const speed: number = Vector3.length(state.velocity);
      return {
        kind: "rest",
        from: hit.time,
        position:
          speed > 0
            ? Vector3.add(
                state.position,
                Vector3.scale(state.velocity, outcome.depth / speed),
              )
            : state.position,
        ...held,
      };
    }
    case "bounce": {
      admit("restitution", outcome.restitution, 1);
      admit("friction", outcome.friction);
      if (outcome.roll !== undefined) {
        admit("rolling radius", outcome.roll.radius);
        admit("rolling resistance", outcome.roll.resistance);
      }
      const rebound: number = -outcome.restitution * vn;
      const slip: number = Vector3.length(tangent);
      const kept: number =
        slip > 0
          ? Math.max(
              0,
              slip -
                outcome.friction * (1 + outcome.restitution) * Math.abs(vn),
            ) / slip
          : 0;
      const velocity: IAutoMovieVector3 = Vector3.add(
        Vector3.scale(n, rebound),
        Vector3.scale(tangent, kept),
      );

      // Only inward gravity can return the rebound to this surface.
      const normalGravity: number = Vector3.dot(projectile.gravity, n);
      const pull: number = Math.max(0, -normalGravity);
      if (
        outcome.roll !== undefined &&
        (pull > 0 ? (rebound * rebound) / (2 * pull) : Infinity) <
          outcome.roll.radius
      )
        return roll(
          Vector3.scale(tangent, kept),
          outcome.roll.resistance,
          normalGravity,
        );
      return {
        kind: "flight",
        from: hit.time,
        projectile: {
          ...projectile,
          origin: state.position,
          velocity,
          ...(projectile.attitude === undefined ||
          projectile.attitude.kind === "velocity"
            ? {}
            : {
                attitude: {
                  ...projectile.attitude,
                  ...(state.rotation === undefined
                    ? {}
                    : { rotation: state.rotation }),
                },
              }),
        },
      };
    }
    case "roll":
      return roll(
        tangent,
        outcome.resistance,
        Vector3.dot(projectile.gravity, n),
      );
    case "pass": {
      admit("speed loss", outcome.loss, 1);
      return {
        kind: "flight",
        from: hit.time,
        projectile: {
          ...projectile,
          origin: state.position,
          velocity: Vector3.scale(state.velocity, 1 - outcome.loss),
          ...(projectile.attitude === undefined ||
          projectile.attitude.kind === "velocity"
            ? {}
            : {
                attitude: {
                  ...projectile.attitude,
                  ...(state.rotation === undefined
                    ? {}
                    : { rotation: state.rotation }),
                },
              }),
        },
      };
    }
  }
}

/**
 * Companion types and the roll's reader of {@link projectileContinue}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and time base.
 * @evidence contracts/development/design.md#principled-representation A closed union of four outcomes and of three segments: a new flight, a roll and a rest.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a caller decides and what it reads back.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every coefficient is the caller's.
 */
export namespace projectileContinue {
  /**
   * A segment's centre and velocity at a second since the original launch:
   * a flight read from its own time zero, a roll's constant deceleration to
   * rest, a rest's place.
   *
   * @param segment The segment.
   * @param seconds Seconds since the original launch, at or after `from`.
   * @returns The state.
   */
  export function at(
    segment: IAutoMovieProjectileContinue.Segment,
    seconds: number,
  ): IAutoMovieProjectileState {
    switch (segment.kind) {
      case "flight":
        return projectileAt(segment.projectile, seconds - segment.from);
      case "roll": {
        const t: number = Math.min(seconds, segment.until) - segment.from;
        const speed: number = Vector3.length(segment.velocity);
        const along: IAutoMovieVector3 =
          speed > 0
            ? Vector3.scale(segment.velocity, 1 / speed)
            : segment.velocity;
        const moving: number = Math.max(0, speed - segment.deceleration * t);
        return {
          position: Vector3.add(
            segment.origin,
            Vector3.scale(
              along,
              speed * t - 0.5 * segment.deceleration * t * t,
            ),
          ),
          velocity: Vector3.scale(along, moving),
          ...(segment.rotation === undefined
            ? {}
            : { rotation: segment.rotation }),
        };
      }
      case "rest":
        return {
          position: segment.position,
          velocity: { x: 0, y: 0, z: 0 },
          ...(segment.rotation === undefined
            ? {}
            : { rotation: segment.rotation }),
        };
    }
  }
}
