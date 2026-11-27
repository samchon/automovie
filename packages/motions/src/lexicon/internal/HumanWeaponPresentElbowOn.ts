import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The elbow one upper arm from the shoulder and one forearm from the wrist
 * nearest a direction, or undefined when the wrist lies past the arm's reach.
 */
export function HumanWeaponPresentElbowOn(
  shoulder: IAutoMovieVector3,
  wrist: IAutoMovieVector3,
  upper: number,
  fore: number,
  toward: IAutoMovieVector3,
): IAutoMovieVector3 | undefined {
  const span: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(wrist, shoulder);
  const d: number = AutoMovieEngineVector3.length(span);
  if (!(d > 1e-9) || d >= upper + fore || d <= Math.abs(upper - fore))
    return undefined;
  const axis: IAutoMovieVector3 = AutoMovieEngineVector3.scale(span, 1 / d);
  const along: number = (d * d + upper * upper - fore * fore) / (2 * d);
  const radius: number = Math.sqrt(Math.max(0, upper * upper - along * along));
  const square: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    toward,
    AutoMovieEngineVector3.scale(axis, AutoMovieEngineVector3.dot(toward, axis)),
  );
  if (!(AutoMovieEngineVector3.length(square) > 1e-9)) return undefined;
  return AutoMovieEngineVector3.add(
    AutoMovieEngineVector3.add(shoulder, AutoMovieEngineVector3.scale(axis, along)),
    AutoMovieEngineVector3.scale(AutoMovieEngineVector3.normalize(square), radius),
  );
}
