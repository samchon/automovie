import type {
  IAutoMovieCameraIntent,
  IAutoMovieFilmOptics,
  IAutoMovieResolveLensAt,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * Resolve the lens a directly rendered frame draws at one shot-local second:
 * the authored stop and the focused depth.
 *
 * The active intent is the one with the greatest `start` at or before the
 * second. It resolves `null`, a frame drawn sharp at every depth, when no
 * intent has started, when the active intent authored no `fNumber`, when it
 * names no lens subject, or when the focused depth is not in front of the
 * camera.
 *
 * The focused depth of a mark `P` is its distance along the camera's forward
 * axis, `(P − C) · forward`, in metres, measured from where the camera stands
 * at this second, so a dolly toward a fixed mark shortens it. Inside a pull the
 * depth eases from the first mark's `z0` to the second's `z1` as `z0 + (z1 −
 * z0) × s(u)`, with `u = (t − start) / (end − start)` and `s(u) = u²(3 − 2u)`,
 * which starts and lands with zero rate as a focus puller's hand does; before
 * `start` the first mark holds and after `end` the second. Marks are world
 * points recorded when the shot was compiled, so a subject that walks away from
 * its mark goes soft: there is no follow focus.
 *
 * @param props The shot's intents, the second and the camera's placement.
 * @returns The stop and the focused depth, or null.
 */
export const resolveAutoMovieLensAt: (
  props: IAutoMovieResolveLensAt.IProps,
) => IAutoMovieFilmOptics.ILens | null = (
  props: IAutoMovieResolveLensAt.IProps,
): IAutoMovieFilmOptics.ILens | null => {
  let active: IAutoMovieCameraIntent | null = null;
  for (const intent of props.intents)
    if (
      intent.start <= props.seconds &&
      (active === null || intent.start > active.start)
    )
      active = intent;
  if (active === null || active.fNumber === undefined || active.focus === null)
    return null;

  const forward: IAutoMovieVector3 = Vector3.normalize(props.forward);
  const depth: (mark: IAutoMovieVector3) => number = (
    mark: IAutoMovieVector3,
  ): number => Vector3.dot(Vector3.subtract(mark, props.position), forward);
  const near: number = depth(active.focus);
  const pull: IAutoMovieCameraIntent["focusPull"] = active.focusPull;
  let focusDistance: number = near;
  if (pull !== undefined && props.seconds > pull.start) {
    const u: number = Math.min(
      1,
      (props.seconds - pull.start) / (pull.end - pull.start),
    );
    focusDistance = near + (depth(pull.to) - near) * u * u * (3 - 2 * u);
  }
  return focusDistance > 0 ? { fNumber: active.fNumber, focusDistance } : null;
};
