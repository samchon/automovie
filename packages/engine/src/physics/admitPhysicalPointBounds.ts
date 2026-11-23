import type {
  IAutoMoviePhysicalPointBound,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";

import { isPhysicalActuatorChain } from "./isPhysicalActuatorChain";

/**
 * Admit candidate-relative point intervals without inventing anatomy, axes or a goal point.
 */
export function admitPhysicalPointBounds(
  profiles: Readonly<Record<string, IAutoMoviePhysicalProfile>>,
  body: string,
  bounds: readonly IAutoMoviePhysicalPointBound[],
  ids: Set<string>,
): void {
  if (!Array.isArray(bounds) || bounds.length > 256)
    throw new Error("Invalid point relationship budget");
  const profile: IAutoMoviePhysicalProfile | undefined = Object.hasOwn(
    profiles,
    body,
  )
    ? profiles[body]
    : undefined;
  const point: (value: IAutoMovieVector3) => boolean = (
    value: IAutoMovieVector3,
  ): boolean => !!value && [value.x, value.y, value.z].every(Number.isFinite);
  for (const bound of bounds) {
    const reference: IAutoMoviePhysicalProfile | undefined =
      bound?.reference &&
      typeof bound.reference.body === "string" &&
      Object.hasOwn(profiles, bound.reference.body)
        ? profiles[bound.reference.body]
        : undefined;
    if (
      !bound ||
      !profile ||
      typeof bound.id !== "string" ||
      !bound.id.trim() ||
      ids.has(bound.id) ||
      !bound.source ||
      !point(bound.source.localPoint) ||
      !bound.reference ||
      typeof bound.reference.body !== "string" ||
      typeof bound.reference.bone !== "string" ||
      (bound.reference.localPoint !== undefined) ===
        (bound.reference.shape !== undefined) ||
      (bound.reference.localPoint !== undefined &&
        !point(bound.reference.localPoint)) ||
      (bound.reference.shape !== undefined &&
        (typeof bound.reference.shape !== "string" ||
          !reference?.segments.some(
            (segment: IAutoMoviePhysicalSegment): boolean =>
              segment.bone === bound.reference.bone &&
              segment.shapes.some(
                (shape: IAutoMoviePhysicalShape): boolean =>
                  shape.id === bound.reference.shape,
              ),
          ))) ||
      !reference?.segments.some(
        (segment: IAutoMoviePhysicalSegment): boolean =>
          segment.bone === bound.reference.bone,
      ) ||
      !isPhysicalActuatorChain(profile, bound.chain, bound.source.bone) ||
      !point(bound.axis) ||
      Math.abs(Math.hypot(bound.axis.x, bound.axis.y, bound.axis.z) - 1) >
        1e-6 ||
      (bound.minimum === undefined && bound.maximum === undefined) ||
      [bound.minimum, bound.maximum].some(
        (value: number | undefined): boolean =>
          value !== undefined && !Number.isFinite(value),
      ) ||
      (bound.minimum ?? -Infinity) > (bound.maximum ?? Infinity) ||
      !Number.isSafeInteger(bound.iterations) ||
      bound.iterations < 1 ||
      bound.iterations > 32 ||
      !(bound.tolerance > 0) ||
      !Number.isFinite(bound.tolerance)
    )
      throw new Error("Invalid physical point relationship");
    ids.add(bound.id);
  }
}
