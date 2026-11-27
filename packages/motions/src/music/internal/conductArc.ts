import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The baton tip between two ictuses: their straight line lifted by the rebound
 * arc `lift sin(pi u)` over the beat's share `u`, clamped to the beat, so the
 * tip leaves each ictus upward and falls into the next from above and every
 * ictus is its beat's lowest point (Rudolf, _The Grammar of Conducting_, 3rd
 * ed., 1995).
 * Parameter from: The ictus the beat leaves, world metres.
 * Parameter to: The ictus the beat falls into, world metres.
 * Parameter u: The beat's share, clamped to [0, 1].
 * Parameter lift: The rebound's height at mid-beat, metres.
 * Returns: The tip, world metres.
 */
export function conductArc(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  u: number,
  lift: number,
): IAutoMovieVector3 {
  const s: number = Math.min(1, Math.max(0, u));
  const line: IAutoMovieVector3 = Vector3.lerp(from, to, s);
  return { ...line, y: line.y + lift * Math.sin(Math.PI * s) };
}
