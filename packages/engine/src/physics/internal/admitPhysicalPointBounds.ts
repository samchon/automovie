import type {
  IAutoMoviePhysicalPointBound,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
} from "@automovie/interface";

import { isPhysicalActuatorChain } from "./isPhysicalActuatorChain";

/*
 * Admit candidate-relative point intervals without inventing anatomy, axes or a
 * goal point.
 */
export function admitPhysicalPointBounds(
  profiles: Readonly<Record<string, IAutoMoviePhysicalProfile>>,
  body: string,
  bounds: readonly IAutoMoviePhysicalPointBound[],
  ids: Set<string>,
): void {
  if (bounds.length > 256) throw new Error("Invalid point relationship budget");
  const profile: IAutoMoviePhysicalProfile | undefined = Object.hasOwn(
    profiles,
    body,
  )
    ? profiles[body]
    : undefined;
  for (const bound of bounds) {
    const reference: IAutoMoviePhysicalProfile | undefined = Object.hasOwn(
      profiles,
      bound.reference.body,
    )
      ? profiles[bound.reference.body]
      : undefined;
    if (
      !profile ||
      !bound.id.trim() ||
      ids.has(bound.id) ||
      (bound.reference.shape !== undefined &&
        !reference?.segments.some(
          (segment: IAutoMoviePhysicalSegment): boolean =>
            segment.bone === bound.reference.bone &&
            segment.shapes.some(
              (shape: IAutoMoviePhysicalShape): boolean =>
                shape.id === bound.reference.shape,
            ),
        )) ||
      !reference?.segments.some(
        (segment: IAutoMoviePhysicalSegment): boolean =>
          segment.bone === bound.reference.bone,
      ) ||
      !isPhysicalActuatorChain(profile, bound.chain, bound.source.bone) ||
      Math.abs(Math.hypot(bound.axis.x, bound.axis.y, bound.axis.z) - 1) >
        1e-6 ||
      (bound.minimum === undefined && bound.maximum === undefined) ||
      (bound.minimum ?? -Infinity) > (bound.maximum ?? Infinity) ||
      bound.iterations < 1 ||
      bound.iterations > 32 ||
      bound.tolerance <= 0
    )
      throw new Error("Invalid physical point relationship");
    ids.add(bound.id);
  }
}
