import {
  type IAutoMovieBallisticSolution,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { AutoMovieEngineGravity } from "../AutoMovieEngineGravity";

/*
 * Solve the **launch velocity** that lands a projectile fired from `origin` at
 * fixed `speed` onto `target` under a constant `gravity`: the inverse of the
 * forward projectileAt simulation, and the missing half of the `launch`
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
export const solveBallisticLaunch: (
  origin: IAutoMovieVector3,
  target: IAutoMovieVector3,
  speed: number,
  gravity?: IAutoMovieVector3,
  arc?: "direct" | "high",
) => IAutoMovieBallisticSolution | null = (
  origin: IAutoMovieVector3,
  target: IAutoMovieVector3,
  speed: number,
  gravity: IAutoMovieVector3 = AutoMovieEngineGravity.DOWN,
  arc: "direct" | "high" = "direct",
): IAutoMovieBallisticSolution | null => {
  if (speed <= 0) return null;

  const delta: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(target, origin);
  const g: number = AutoMovieEngineVector3.length(gravity);

  // No gravity: a straight shot down the sightline.
  if (g < 1e-9) {
    const range: number = AutoMovieEngineVector3.length(delta);
    if (range < 1e-9 || speed <= 0) return null;
    return {
      velocity: AutoMovieEngineVector3.scale(AutoMovieEngineVector3.normalize(delta), speed),
      hitTime: range / speed,
    };
  }

  const up: IAutoMovieVector3 = AutoMovieEngineVector3.scale(gravity, -1 / g); // unit "up" (against gravity)
  const h: number = AutoMovieEngineVector3.dot(delta, up); // signed height along up
  const horizontal: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    delta,
    AutoMovieEngineVector3.scale(up, h),
  );
  const d: number = AutoMovieEngineVector3.length(horizontal);
  const s2: number = speed * speed;

  // Purely vertical target: fire straight up/down; solve when it reaches h.
  if (d < 1e-9) {
    // origin + v·t + ½·(−g)·t² = h with v = ±speed along up, i.e.
    // ½·g·t² − v·t + h = 0 → t = (v ± √(v²−2gh)) / g. `arc` picks among the
    // strictly-positive crossings exactly as the range equation's ±root does
    // (#1142): `direct` is the faster, lower flight (the rising first contact
    // overhead; fired straight down at a target below), `high` the lobbed one
    // (the descending re-crossing overhead; fired up and falling past a target
    // below). Firing away from the target contributes no positive root, so the
    // sweep over both muzzle signs self-selects the feasible flights.
    let best: IAutoMovieBallisticSolution | null = null;
    for (const v of [speed, -speed]) {
      const disc: number = v * v - 2 * g * h;
      if (disc < 0) continue;
      const root: number = Math.sqrt(disc);
      for (const t of [(v - root) / g, (v + root) / g]) {
        if (t <= 1e-9) continue;
        if (
          best === null ||
          (arc === "high" ? t > best.hitTime : t < best.hitTime)
        )
          best = { velocity: AutoMovieEngineVector3.scale(up, v), hitTime: t };
      }
    }
    return best;
  }

  // Range equation for the launch angle θ above the horizontal.
  const disc: number = s2 * s2 - g * (g * d * d + 2 * h * s2);
  if (disc < 0) return null; // out of range at this speed
  const root: number = Math.sqrt(disc);
  const tanTheta: number = (s2 + (arc === "high" ? root : -root)) / (g * d);
  const cosTheta: number = 1 / Math.sqrt(1 + tanTheta * tanTheta);
  const sinTheta: number = tanTheta * cosTheta;

  const horizontalDir: IAutoMovieVector3 = AutoMovieEngineVector3.scale(horizontal, 1 / d);
  const velocity: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    AutoMovieEngineVector3.scale(horizontalDir, speed * cosTheta),
    AutoMovieEngineVector3.scale(up, speed * sinTheta),
  );
  return { velocity, hitTime: d / (speed * cosTheta) };
};
