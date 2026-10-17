import type { V3 } from "../geometry/V3.ts";
import { dot } from "../geometry/dot.ts";
import { len } from "../geometry/len.ts";
import { mul } from "../geometry/mul.ts";
import { norm } from "../geometry/norm.ts";
import { sub } from "../geometry/sub.ts";

/**
 * Projects a registered orientation onto a plane perpendicular to a unit axis.
 * A parallel or zero direction is an unsupported frame and fails explicitly.
 *
 * @evidence contracts/common.md#principled-implementation Uses orthogonal projection v minus n times dot(v,n), with a unit axis supplied by the chain normalization.
 * @evidence contracts/common.md#clear-and-simple-design The same projection defines palm and transported digit frames.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not substitute a world direction when registered orientation is degenerate.
 * @evidence contracts/common.md#meaningful-documentation Declares the unit-axis premise and explicit degenerate-frame failure.
 * @evidence contracts/performance.md#efficient-algorithms Computes fixed-size vector operations in constant time and space.
 * @evidence contracts/performance.md#reuse-equivalent-work Performs one projection with no cache or duplicated source lookup.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one vector and acquires no handles or retained state.
 */
export function handPerpendicular(direction: V3, unitAxis: V3): V3 {
  if (Math.abs(len(unitAxis) - 1) > 1e-6)
    throw new Error("Hand frame axis must be unit length");
  const projected: V3 = sub(direction, mul(unitAxis, dot(direction, unitAxis)));
  if (len(projected) < 1e-9)
    throw new Error("Hand frame direction is parallel to its axis");
  return norm(projected);
}
