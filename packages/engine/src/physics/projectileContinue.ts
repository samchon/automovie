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
    if (value < 0 || (maximum !== undefined && value > maximum)) {
      const range: string =
        maximum === undefined
          ? "non-negative"
          : `between 0 and ${maximum}`;
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
      const surface: IAutoMovieVector3 = outcome.surface ?? STILL;
      const ball: IAutoMovieProjectileContinue.IBall | undefined = outcome.ball;
      if (ball !== undefined) {
        if (ball.radius <= 0)
          throw new RangeError(
            `projectile ball radius must be positive, but was ${ball.radius}`,
          );
        if (ball.gyration <= 0)
          throw new RangeError(
            `projectile ball gyration must be positive, but was ${ball.gyration}`,
          );
      }

      // Newton's restitution and Coulomb's friction act on the velocity
      // relative to the struck surface.
      const relative: IAutoMovieVector3 = Vector3.subtract(
        state.velocity,
        surface,
      );
      const approach: number = Vector3.dot(relative, n);
      const across: IAutoMovieVector3 = Vector3.subtract(
        relative,
        Vector3.scale(n, approach),
      );
      const rebound: number = -outcome.restitution * approach;
      const spin: IAutoMovieVector3 = ball?.spin ?? STILL;

      // The contact point's sliding: a particle's tangential velocity, a
      // ball's less its spin's turn of the point a radius below its centre.
      const slide: IAutoMovieVector3 =
        ball === undefined
          ? across
          : Vector3.subtract(
              across,
              Vector3.scale(Vector3.cross(spin, n), ball.radius),
            );
      const slip: number = Vector3.length(slide);
      const stop: number =
        ball === undefined
          ? slip
          : (slip * ball.gyration) / (1 + ball.gyration);
      const impulse: number =
        slip > 0
          ? Math.min(
              outcome.friction * (1 + outcome.restitution) * Math.abs(approach),
              stop,
            )
          : 0;
      const along: IAutoMovieVector3 =
        slip > 0 ? Vector3.scale(slide, 1 / slip) : STILL;
      const kept: IAutoMovieVector3 = Vector3.subtract(
        across,
        Vector3.scale(along, impulse),
      );
      const velocity: IAutoMovieVector3 = Vector3.add(
        surface,
        Vector3.add(Vector3.scale(n, rebound), kept),
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
          Vector3.subtract(
            velocity,
            Vector3.scale(n, Vector3.dot(velocity, n)),
          ),
          outcome.roll.resistance,
          normalGravity,
        );
      return {
        kind: "flight",
        from: hit.time,
        ...(ball === undefined
          ? {}
          : {
              spin: Vector3.add(
                spin,
                Vector3.scale(
                  Vector3.cross(n, along),
                  impulse / (ball.gyration * ball.radius),
                ),
              ),
            }),
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

/** Companion types and the roll's reader of {@link projectileContinue}. */
export namespace projectileContinue {
  /**
   * A segment's centre and velocity at a second since the original launch: a
   * flight read from its own time zero, a roll's constant deceleration to rest,
   * a rest's place.
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

/** A surface at rest and a ball that does not turn. */
const STILL: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

