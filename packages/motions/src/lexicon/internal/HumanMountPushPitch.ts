import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanMountPush } from "./HumanMountPush";
import { HumanMountPushSquare } from "./HumanMountPushSquare";

/**
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
 *
 * @param body The body, whose thigh and shank lengths are read.
 * @param hip The hip joint, world metres.
 * @param ankle The ankle, world metres.
 * @param pole The knee's pole, world metres.
 * @param rotation The foot's world rotation.
 * @param pivot The point the foot turns about, world metres.
 * @param target The ankle's bend to leave, degrees.
 * @returns The turn; null for a degenerate leg.
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
  const reach: IAutoMovieVector3 = Vector3.subtract(ankle, hip);
  if (Vector3.length(reach) < 1e-9) return null;
  const u: IAutoMovieVector3 = Vector3.normalize(reach);
  const w: IAutoMovieVector3 | null = HumanMountPushSquare(
    Vector3.subtract(pole, hip),
    u,
  );
  if (w === null) return null;
  const hinge: IAutoMovieVector3 = Vector3.normalize(Vector3.cross(u, w));
  const flat = (v: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.subtract(v, Vector3.scale(hinge, Vector3.dot(hinge, v)));
  const normal: IAutoMovieVector3 = Vector3.normalize(
    flat(Quaternion.rotateVector(rotation, { x: 0, y: 1, z: 0 })),
  );
  const toes: IAutoMovieVector3 | null = HumanMountPushSquare(
    flat(Quaternion.rotateVector(rotation, { x: 0, y: 0, z: 1 })),
    normal,
  );
  if (toes === null) return null;

  // In-plane coordinates about the hip: x along the leg, y toward the pole.
  const plane = (v: IAutoMovieVector3): IPoint => ({
    x: Vector3.dot(v, u),
    y: Vector3.dot(v, w),
  });
  const radians: number = target * Quaternion.DEG2RAD;
  const a: number = body.measure.thigh;
  const centre: IPoint = plane(Vector3.subtract(pivot, hip));
  const c: IPoint = plane(
    Vector3.add(
      Vector3.subtract(ankle, pivot),
      Vector3.scale(
        Vector3.add(
          Vector3.scale(normal, Math.cos(radians)),
          Vector3.scale(toes, Math.sin(radians)),
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
  const p: IPoint = plane(Vector3.subtract(pole, hip));
  const a0: IPoint = plane(Vector3.subtract(ankle, pivot));
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
  const degrees: number = chosen.angle / Quaternion.DEG2RAD;
  return {
    axis: hinge,
    degrees,
    down:
      Vector3.dot(Vector3.cross(normal, toes), hinge) >= 0 ? degrees : -degrees,
  };
}

/**
 * A point in the knee's plane, metres from the hip along the leg (`x`) and
 * toward the pole (`y`).
 */
interface IPoint {
  /** Along the leg. */
  x: number;

  /** Toward the pole. */
  y: number;
}

/** One meeting of the knee's two circles (`pitch`). */
interface IKneeTurn {
  /** The turn that brings the knee there, radians about the hinge. */
  angle: number;

  /** Whether the knee bends toward the pole off the moved leg. */
  poled: boolean;
}
