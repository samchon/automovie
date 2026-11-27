import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
} from "@automovie/interface";

/**
 * The struck surface a held stick strikes (a cymbal's `edge`, a drum's `head`):
 * the named `surface` contact of a fixed, still, unarticulated prop whose
 * contact faces straight up at the action's start, within rounding.
 *
 * @param read The struck prop's reader.
 * @param seconds The action's start, film seconds.
 * @param id The surface's contact id.
 * @returns The surface, or none when the prop does not admit a stroke.
 */
export function struckSurface(
  read: IAutoMovieMotionHumanPropReader,
  seconds: number,
  id: string,
): IAutoMovieAffordance | undefined {
  const surface: IAutoMovieAffordance | undefined = read.prop.affordances?.find(
    (a: IAutoMovieAffordance): boolean => a.id === id && a.kind === "surface",
  );
  if (
    surface === undefined ||
    read.prop.fixed !== true ||
    read.prop.motion !== undefined ||
    read.prop.point !== undefined ||
    (read.prop.hasArticulations ?? read.prop.articulate !== undefined) ||
    Quaternion.rotateVector(
      Quaternion.multiply(read.frame(seconds).rotation, surface.frame.rotation),
      { x: 0, y: 1, z: 0 },
    ).y <
      1 - 1e-9
  )
    return undefined;
  return surface;
}
