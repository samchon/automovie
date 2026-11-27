import { type IAutoMovieProjectileState, type IAutoMovieProjectile, type IAutoMovieClip, type IAutoMovieBallisticSolution, type IAutoMovieVector3 } from "@automovie/interface";
import { projectileAt as projectileAtImplementation } from "./internal/projectileAt";
import { projectileTrajectory as projectileTrajectoryImplementation } from "./internal/projectileTrajectory";
import { solveBallisticLaunch as solveBallisticLaunchImplementation } from "./internal/solveBallisticLaunch";
import { solveMovingLaunch as solveMovingLaunchImplementation } from "./internal/solveMovingLaunch";

/**
 * The air's one owner: the density every drag law reads when its caller states
 * none, so an arrow, a ball and round shot fly through the same air.
 *
 * The value is the density of the ICAO Standard Atmosphere at mean sea level,
 * 1.225 kg/m³, defined there with the sea-level temperature 15 °C and pressure
 * 101 325 Pa (ICAO Doc 7488, Manual of the ICAO Standard Atmosphere; ISO
 * 2533:1975). A film's air at another height or temperature is the caller's to
 * state.
 */
export namespace AutoMovieEngineAir {
  /**
   * The density of the ICAO Standard Atmosphere at mean sea level, kg/m³: 1.225
   * (ICAO Doc 7488; ISO 2533:1975).
   */
  export const DENSITY: number = 1.225;

  /**
   * The speed of sound in the ICAO Standard Atmosphere at mean sea level, m/s:
   * 340.294 (ICAO Doc 7488), the same air as `DENSITY`.
   */
  export const SOUND: number = 340.294;

  /**
   * Evaluate a {@link IAutoMovieProjectile} at time `t` seconds. Without drag, the
   * closed form with no integration error: `p = origin + v·t + ½·g·t²`, `v(t) =
   * v
   *
   * - G·t`. With drag, the integrated flight of {@link projectileDragFlight}, which
   *   holds the launch state before `t = 0`. With an attitude, the state also
   *   carries the body's rotation: the model's `+Z`turned onto the velocity, the
   *   launch rotation turned about the spin axis by the rate times`t`, or the
   *   launch rotation kept.
   */
  export function projectileAt(p: IAutoMovieProjectile, t: number): IAutoMovieProjectileState {
    return projectileAtImplementation(p, t);
  }

  /**
   * Bake a projectile's flight into an {@link IAutoMovieClip} for its scene node:
   * position sampled from {@link projectileAt} at `fps`, plus a rotation track
   * that keeps the model's forward (+Z) pointing down the arc's velocity, so the
   * arrow noses over as it falls. This is the projectile half of the `launch`
   * verb (paired with the aim `solveBallisticLaunch` computed): the host applies
   * the clip to the thrown prop and plays it through `sampleClip`.
   *
   * Samples the closed-form solution, so there is no integration drift; the last
   * key lands exactly on `duration`.
   */
  export function projectileTrajectory(node: string, p: IAutoMovieProjectile, duration: number, fps?: number): IAutoMovieClip {
    return projectileTrajectoryImplementation(node, p, duration, fps);
  }

  /**
   * Solve the **launch velocity** that lands a projectile fired from `origin` at
   * fixed `speed` onto `target` under a constant `gravity`: the inverse of the
   * forward {@link projectileAt} simulation, and the missing half of the `launch`
   * verb (the model says "loose the arrow at speed s"; the engine finds the aim
   * that connects). Returns `null` when the target is out of range at that
   * speed.
   *
   * Under downward gravity a target has two firing arcs (a flat **direct** shot
   * and a lobbed **high** one) selected by `arc`; the direct arc is the default.
   * With zero gravity it degenerates to a straight shot along the sightline. The
   * horizontal solve uses the standard range equation `tanθ = (s² ± √(s⁴ −
   * g(g·d²
   *
   * - 2h·s²))) / (g·d)`; a purely vertical target is handled on its own (no
   *   horizontal direction to aim along).
   */
  export function solveBallisticLaunch(origin: IAutoMovieVector3, target: IAutoMovieVector3, speed: number, gravity?: IAutoMovieVector3, arc?: "direct" | "high"): IAutoMovieBallisticSolution | null {
    return solveBallisticLaunchImplementation(origin, target, speed, gravity, arc);
  }

  /**
   * Solve the launch that **leads a moving target**: the aim that lands the
   * projectile where the target _will be_, not where it is. `targetAt(t)` gives
   * the target's world position at flight-time `t` (e.g. its animated base plus
   * root travel). This is the reactive event the `launch` verb promises against a
   * mover ("shoot him off his galloping horse") without the model timing it.
   *
   * A fixed-point iteration on the time of flight: guess `t` from the target's
   * current distance, {@link solveBallisticLaunch aim} at `targetAt(t)`, take that
   * solve's `hitTime` as the next `t`, and repeat until it settles. It converges
   * when the target is slower than the projectile (each aim overshoots the last
   * miss by less); a target that outruns the shot never settles, so the loop is
   * capped at `iterations` and returns the closest solve found. Returns `null`
   * when the intercept is out of range at that speed (or the speed is
   * non-positive).
   */
  export function solveMovingLaunch(origin: IAutoMovieVector3, targetAt: (t: number) => IAutoMovieVector3, speed: number, gravity?: IAutoMovieVector3, arc?: "direct" | "high", iterations?: number): IAutoMovieBallisticSolution | null {
    return solveMovingLaunchImplementation(origin, targetAt, speed, gravity, arc, iterations);
  }
}
