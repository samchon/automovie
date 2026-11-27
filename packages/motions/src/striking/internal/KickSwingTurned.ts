import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * A segment turned from one direction to another by a share of the angle
 * between them, on their great arc, its length going linearly: a joint's turn,
 * not a chord. Opposite directions have no arc of their own, so they turn about
 * a horizontal axis across the first.
 * Parameter from: The segment's first direction, carrying its first length.
 * Parameter to: The segment's last direction, carrying its last length.
 * Parameter share: The share of the turn, 0 at `from` and 1 at `to`.
 * Returns: The turned segment.
 */
export function KickSwingTurned(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  share: number,
): IAutoMovieVector3 {
  const a: number = AutoMovieEngineVector3.length(from);
  const b: number = AutoMovieEngineVector3.length(to);
  if (a < 1e-9 || b < 1e-9) return AutoMovieEngineVector3.lerp(from, to, share);
  const u: IAutoMovieVector3 = AutoMovieEngineVector3.scale(from, 1 / a);
  const v: IAutoMovieVector3 = AutoMovieEngineVector3.scale(to, 1 / b);
  const angle: number = Math.acos(Math.min(1, Math.max(-1, AutoMovieEngineVector3.dot(u, v))));
  const sine: number = Math.sin(angle);
  const length: number = a + (b - a) * share;
  if (angle < 1e-6) return AutoMovieEngineVector3.scale(AutoMovieEngineVector3.lerp(u, v, share), length);
  if (sine < 1e-6) {
    const across: IAutoMovieVector3 = AutoMovieEngineVector3.cross(
      u,
      Math.abs(u.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 },
    );
    return AutoMovieEngineVector3.scale(
      AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.fromAxisAngle(
          AutoMovieEngineVector3.normalize(across),
          (angle * share) / AutoMovieEngineQuaternion.DEG2RAD,
        ),
        u,
      ),
      length,
    );
  }
  return AutoMovieEngineVector3.scale(
    AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.scale(u, Math.sin((1 - share) * angle) / sine),
      AutoMovieEngineVector3.scale(v, Math.sin(share * angle) / sine),
    ),
    length,
  );
}
