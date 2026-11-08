import type {
  IAutoMoviePhysicalPointBound as Bound,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { isPhysicalActuatorChain } from "./isPhysicalActuatorChain";
import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";

/** Admit candidate-relative point intervals without inventing anatomy, axes or a goal point. */
export function admitPhysicalPointBounds(
  profiles: Readonly<Record<string, P>>,
  body: string,
  bounds: readonly Bound[],
  ids: Set<string>,
): void {
  if (!Array.isArray(bounds) || bounds.length > 256)
    throw new Error("Invalid point relationship budget");
  const profile: P | undefined = Object.hasOwn(profiles, body)
    ? profiles[body]
    : undefined;
  const point: (value: IAutoMovieVector3) => boolean = (
    value: IAutoMovieVector3,
  ): boolean => !!value && [value.x, value.y, value.z].every(scalar);
  for (const bound of bounds) {
    const reference: P | undefined =
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
            (segment: P.ISegment): boolean =>
              segment.bone === bound.reference.bone &&
              segment.shapes.some(
                (shape: P.IShape): boolean =>
                  shape.id === bound.reference.shape,
              ),
          ))) ||
      !reference?.segments.some(
        (segment: P.ISegment): boolean => segment.bone === bound.reference.bone,
      ) ||
      !isPhysicalActuatorChain(profile, bound.chain, bound.source.bone) ||
      !point(bound.axis) ||
      Math.abs(Math.hypot(bound.axis.x, bound.axis.y, bound.axis.z) - 1) >
        1e-6 ||
      (bound.minimum === undefined && bound.maximum === undefined) ||
      [bound.minimum, bound.maximum].some(
        (value: number | undefined): boolean =>
          value !== undefined && !scalar(value),
      ) ||
      (bound.minimum ?? -Infinity) > (bound.maximum ?? Infinity) ||
      !Number.isSafeInteger(bound.iterations) ||
      bound.iterations < 1 ||
      bound.iterations > 32 ||
      !(bound.tolerance > 0) ||
      !scalar(bound.tolerance)
    )
      throw new Error("Invalid physical point relationship");
    ids.add(bound.id);
  }
}
