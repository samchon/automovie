import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * A deflected ball's rebound off a palm facing it: the incoming velocity at the
 * touch, read from the ball's flight over the same short span the staged catch
 * samples its approach (`min(contact / 2, 1e-4)` s), comes back as `v - (1 +
 * e)(v . n) n = -e v`, the normal impact of a sphere on a surface held still
 * through the touch.
 * Parameter object: The ball's centre at a second of the catch.
 * Parameter contact: The touch, seconds.
 * Parameter restitution: The ball's coefficient of restitution.
 * Parameter intercept: The authored touch, for the refusal.
 * Returns: The outgoing velocity, m/s.
 * When the ball is not moving at the touch.
 */
export function stageDeflectRebound(
  object: (seconds: number) => IAutoMovieVector3,
  contact: number,
  restitution: number,
  intercept: number = contact,
): IAutoMovieVector3 {
  const span: number = Math.min(contact / 2, 1e-4);
  const incoming: IAutoMovieVector3 = Vector3.scale(
    Vector3.subtract(object(contact), object(contact - span)),
    1 / span,
  );
  if (!(Vector3.length(incoming) > 0))
    throw new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "intercept",
      value: intercept,
      reason: "the ball is not moving at the touch",
      fix: "deflect the ball in flight",
    });
  return Vector3.scale(incoming, -restitution);
}
