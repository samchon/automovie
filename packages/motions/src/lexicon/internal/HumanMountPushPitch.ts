import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanMountPush } from "./HumanMountPush";
import { HumanMountPushSquare } from "./HumanMountPushSquare";

/*
 * The turn of a foot about a point of its own (its ball), in the knee's plane,
 * that leaves its ankle bent by exactly `target` once the knee has followed the
 * moved ankle, in closed form. Turning the foot moves the ankle about the ball,
 * so the shank leans anew and a turn by the bend's excess alone falls short of
 * it. With the foot and the shank asked at `target` to each other, the two turn
 * together as one rigid piece: the knee, `b` along the shank from the ankle, is
 * then `ball + R(θ) c` for the fixed `c = (ankle
 *
 * - Ball) + b (cos target n + sin target t)`(the foot's normal`n`and toes`t`in
 *   the plane), so it runs on a circle about the ball, and the thigh holds it
 *   on the circle of radius`a`about the hip. The knee is their meeting point,
 *   the two circles' intersection, on the pole's side of the leg and the nearer
 *   of the two to the foot as placed; circles that do not meet give their
 *   nearest points, the leg at its reach as`bend` reads it.
 * Parameter body: The body, whose thigh and shank lengths are read.
 * Parameter hip: The hip joint, world metres.
 * Parameter ankle: The ankle, world metres.
 * Parameter pole: The knee's pole, world metres.
 * Parameter rotation: The foot's world rotation.
 * Parameter pivot: The point the foot turns about, world metres.
 * Parameter target: The ankle's bend to leave, degrees.
 * Returns: The turn; null for a degenerate leg.
 */
export function HumanMountPushPitch(
  body: IAutoMovieMotionHumanBody,
  hip: IAutoMovieVector3,
  ankle: IAutoMovieVector3,
  pole: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  pivot: IAutoMovieVector3,
  target: number,
): HumanMountPush.IPitch | null {
  const reach: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(ankle, hip);
  if (AutoMovieEngineVector3.length(reach) < 1e-9) return null;
  const u: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(reach);
  const w: IAutoMovieVector3 | null = HumanMountPushSquare(
    AutoMovieEngineVector3.subtract(pole, hip),
    u,
  );
  if (w === null) return null;
  const hinge: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(AutoMovieEngineVector3.cross(u, w));
  const flat = (v: IAutoMovieVector3): IAutoMovieVector3 =>
    AutoMovieEngineVector3.subtract(v, AutoMovieEngineVector3.scale(hinge, AutoMovieEngineVector3.dot(hinge, v)));
  const normal: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    flat(AutoMovieEngineQuaternion.rotateVector(rotation, { x: 0, y: 1, z: 0 })),
  );
  const toes: IAutoMovieVector3 | null = HumanMountPushSquare(
    flat(AutoMovieEngineQuaternion.rotateVector(rotation, { x: 0, y: 0, z: 1 })),
    normal,
  );
  if (toes === null) return null;

  // In-plane coordinates about the hip: x along the leg, y toward the pole.
  const plane = (v: IAutoMovieVector3): IPoint => ({
    x: AutoMovieEngineVector3.dot(v, u),
    y: AutoMovieEngineVector3.dot(v, w),
  });
  const radians: number = target * AutoMovieEngineQuaternion.DEG2RAD;
  const a: number = body.measure.thigh;
  const centre: IPoint = plane(AutoMovieEngineVector3.subtract(pivot, hip));
  const c: IPoint = plane(
    AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.subtract(ankle, pivot),
      AutoMovieEngineVector3.scale(
        AutoMovieEngineVector3.add(
          AutoMovieEngineVector3.scale(normal, Math.cos(radians)),
          AutoMovieEngineVector3.scale(toes, Math.sin(radians)),
        ),
        body.measure.shank,
      ),
    ),
  );
  const rho: number = Math.hypot(c.x, c.y);
  const d: number = Math.hypot(centre.x, centre.y);
  if (rho < 1e-9 || d < 1e-9) return null;

  // The knees where the circle about the pivot meets the thigh's circle about the hip, or the nearest points where they do not meet.
  const e: IPoint = { x: centre.x / d, y: centre.y / d };
  const knees: IPoint[] = [];
  if (d > a + rho || d < Math.abs(a - rho)) {
    const toward: number = d > a + rho || rho > a ? -1 : 1;
    knees.push({
      x: centre.x + toward * rho * e.x,
      y: centre.y + toward * rho * e.y,
    });
  } else {
    const along: number = (d * d + a * a - rho * rho) / (2 * d);
    const off: number = Math.sqrt(Math.max(0, a * a - along * along));
    for (const sign of [1, -1])
      knees.push({
        x: along * e.x - sign * off * e.y,
        y: along * e.y + sign * off * e.x,
      });
  }

  // Each knee's turn of `c`, and whether it bends toward the pole off the moved leg.
  const p: IPoint = plane(AutoMovieEngineVector3.subtract(pole, hip));
  const a0: IPoint = plane(AutoMovieEngineVector3.subtract(ankle, pivot));
  const turns: IKneeTurn[] = knees.map((k: IPoint): IKneeTurn => {
    const r: IPoint = { x: k.x - centre.x, y: k.y - centre.y };
    const angle: number = Math.atan2(
      c.x * r.y - c.y * r.x,
      c.x * r.x + c.y * r.y,
    );
    const cos: number = Math.cos(angle);
    const sin: number = Math.sin(angle);
    const leg: IPoint = {
      x: centre.x + cos * a0.x - sin * a0.y,
      y: centre.y + sin * a0.x + cos * a0.y,
    };
    const across = (q: IPoint): number => leg.x * q.y - leg.y * q.x;
    return { angle, poled: across(k) * across(p) >= 0 };
  });

  // The knee on the pole's side, the nearer of two to the foot as placed.
  const poled: IKneeTurn[] = turns.filter((t: IKneeTurn): boolean => t.poled);
  const chosen: IKneeTurn = (poled.length > 0 ? poled : turns).reduce(
    (best: IKneeTurn, t: IKneeTurn): IKneeTurn =>
      Math.abs(t.angle) < Math.abs(best.angle) ? t : best,
  );
  const degrees: number = chosen.angle / AutoMovieEngineQuaternion.DEG2RAD;
  return {
    axis: hinge,
    degrees,
    down:
      AutoMovieEngineVector3.dot(AutoMovieEngineVector3.cross(normal, toes), hinge) >= 0 ? degrees : -degrees,
  };
}

/*
 * A point in the knee's plane, metres from the hip along the leg (`x`) and
 * toward the pole (`y`).
 */
interface IPoint {
  /*
   * Along the leg.
   */
  x: number;

  /*
   * Toward the pole.
   */
  y: number;
}

/*
 * One meeting of the knee's two circles (`pitch`).
 */
interface IKneeTurn {
  /*
   * The turn that brings the knee there, radians about the hinge.
   */
  angle: number;

  /*
   * Whether the knee bends toward the pole off the moved leg.
   */
  poled: boolean;
}
