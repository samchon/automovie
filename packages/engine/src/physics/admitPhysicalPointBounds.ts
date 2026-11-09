import type {
  IAutoMoviePhysicalPointBound as Bound,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { isPhysicalActuatorChain } from "./isPhysicalActuatorChain";
import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";

/**
 * Admit candidate-relative point intervals without inventing anatomy, axes or a goal point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Admit candidate-relative point intervals without inventing anatomy, axes or a goal point) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Admit candidate-relative point intervals without inventing anatomy, axes or a goal point) directly over its typed inputs (`profiles`, `body`, `bounds`, `ids`) as nested iteration of depth 3 (every over [value.x, value.y, value.z]; for-of over bounds; some over reference?.segments), delegating to `Array.isArray`, `Object.hasOwn`, `ids.has`, `point`, `isPhysicalActuatorChain`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 256, 0.000001, 32, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 64 lines and 4 top-level statements that reuses `Array.isArray`, `Object.hasOwn`, `ids.has`, `point`, `isPhysicalActuatorChain` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 256, 0.000001, 32 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `profiles`, `body`, `bounds`, `ids`; the dominant cost is nested iteration of depth 3 (every over [value.x, value.y, value.z]; for-of over bounds; some over reference?.segments), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
 */
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
