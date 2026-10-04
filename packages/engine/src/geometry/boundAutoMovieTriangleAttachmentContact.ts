import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { adjacentAutoMovieFloat64 as outward } from "../math/adjacentAutoMovieFloat64";
import { measureAutoMovieProjectionIntervals } from "./measureAutoMovieProjectionIntervals";

/**
 * Bound every possible contact of an anchored fan with one original support face.
 * fan[0] is the already registered root; the other two vertices are the actual
 * row corners. The caller must first establish its canonical sampler authority.
 * This calculation does not license an arbitrary supplied root or skip another
 * host triangle. Coordinates are represented metres in the same frame.
 *
 * An approximate stored face normal supplies a direction, not an exact plane.
 * Outward intervals enclose the whole host projection slab. If its maximum is H,
 * root deficit is delta=max(0,H-root.low) and both corner gaps are at least s>0,
 * any contact's total non-root barycentric weight is at most delta/(delta+s).
 * Its Euclidean displacement from the root is bounded by that weight times
 * the maximum corner L1 distance. Thus shallow emergence amplifies travel in
 * the explicit denominator; coordinate displacement is never a ray-travel bound.
 * A nonpositive corner gap or collapsed current support leaves proof false.
 * Neither winding nor this cap asserts biological tissue volume or burial.
 *
 * This cap covers every point of the complete fan, not a selected nearest
 * witness. Other host faces require their own strict separation proof. The
 * resident mesh query pairs this owner with canonical seat/feature admission.
 * Inputs remain read-only and the scalar record is owned.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Bounds complete attachment-face contact instead of exempting a whole fan because its root is one zero-distance witness.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Restricts possible fan contact to an outward-enclosed root cap on one original support triangle while leaving other faces unpaid.
 * @author Samchon
 */
export function boundAutoMovieTriangleAttachmentContact(
  fan: readonly IAutoMovieVector3[],
  support: readonly IAutoMovieVector3[],
): { proved: boolean; cap: number; cornerGap: number; rootDeficit: number } {
  if (
    fan.length !== 3 ||
    support.length !== 3 ||
    ![...fan, ...support].every(
      (p) =>
        p !== undefined && p !== null && [p.x, p.y, p.z].every(Number.isFinite),
    )
  )
    throw new Error(
      "Attachment contact needs complete finite fan and support triangles.",
    );
  const u = Vector3.subtract(support[1], support[0]),
    v = Vector3.subtract(support[2], support[0]);
  const scale = Math.max(
    ...[u, v].flatMap((p) => [Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)]),
  );
  if (!Number.isFinite(scale))
    throw new Error("Attachment support differences must remain finite.");
  if (scale === 0)
    return { proved: false, cap: 0, cornerGap: 0, rootDeficit: 0 };
  const scaled = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: p.x / scale,
    y: p.y / scale,
    z: p.z / scale,
  });
  const direction = Vector3.cross(scaled(u), scaled(v));
  const measured = measureAutoMovieProjectionIntervals(
    [...support, ...fan],
    direction,
    support[0],
  );
  if (measured.normUpper === 0)
    return { proved: false, cap: 0, cornerGap: 0, rootDeficit: 0 };
  const high = Math.max(...measured.intervals.slice(0, 3).map((p) => p[1]));
  const deficit = Math.max(0, outward(high - measured.intervals[3][0], true));
  const gap = outward(
    Math.min(...measured.intervals.slice(4).map((p) => p[0])) - high,
    false,
  );
  if (!(gap > 0))
    return { proved: false, cap: 0, cornerGap: gap, rootDeficit: deficit };
  const fraction = Math.min(
    1,
    outward(deficit / outward(deficit + gap, false), true),
  );
  let length = 0;
  for (const corner of fan.slice(1)) {
    let l1 = 0;
    for (const axis of ["x", "y", "z"] as const) {
      const difference = corner[axis] - fan[0][axis];
      const absolute = Math.max(
        Math.abs(outward(difference, false)),
        Math.abs(outward(difference, true)),
      );
      l1 = outward(l1 + absolute, true);
    }
    length = Math.max(length, l1);
  }
  return {
    proved: true,
    cap: outward(length * fraction, true),
    cornerGap: gap,
    rootDeficit: deficit,
  };
}
