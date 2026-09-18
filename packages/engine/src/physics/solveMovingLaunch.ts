import { IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";
import { finiteVector } from "../geometry/finiteVector";
import { IAutoMovieBallisticSolution } from "./IAutoMovieBallisticSolution";
import { solveBallisticLaunch } from "./solveBallisticLaunch";

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
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Resolves an analytic intercept against a declared moving target path.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Keeps moving-target interception inside the bounded analytic tier.
 * @author Samchon
 */
export const solveMovingLaunch = (
  origin: IAutoMovieVector3,
  targetAt: (t: number) => IAutoMovieVector3,
  speed: number,
  gravity: IAutoMovieVector3 = { x: 0, y: -9.81, z: 0 },
  arc: "direct" | "high" = "direct",
  iterations = 8,
): IAutoMovieBallisticSolution | null => {
  if (!Number.isFinite(speed)) return null;
  if (!(speed > 0)) return null;
  if (!finiteVector(origin)) return null;
  if (!finiteVector(gravity)) return null;
  if (!validArc(arc)) return null;
  if (!Number.isInteger(iterations)) return null;
  if (iterations < 1) return null;

  const initialTarget = targetAt(0);
  if (!finiteVector(initialTarget)) return null;

  // Track the closest solve by fixed-point residual |hitTime − t|, not just the
  // last iterate: when the target outpaces the fixed point the iteration can
  // oscillate rather than settle, and the final guess need not be the nearest
  // one visited. Converged shots hit the `settled` early-out, where the last
  // iterate IS the minimum, so tracking only changes the un-settled tail.
  let t = Vector3.length(Vector3.subtract(initialTarget, origin)) / speed;
  let best: IAutoMovieBallisticSolution | null = null;
  let bestResidual = Infinity;
  for (let i = 0; i < iterations; ++i) {
    const solution = solveBallisticLaunch(
      origin,
      targetAt(t),
      speed,
      gravity,
      arc,
    );
    if (solution === null) return null; // out of range at this iterate
    const residual = Math.abs(solution.hitTime - t);
    if (residual < bestResidual) {
      bestResidual = residual;
      best = solution;
    }
    if (residual < 1e-6) return best; // settled onto the meeting point
    t = solution.hitTime;
  }
  return best; // capped without settling: the closest lead found
};
