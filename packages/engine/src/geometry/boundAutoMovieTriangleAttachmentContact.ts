import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { adjacentAutoMovieFloat64 as outward } from "../math/adjacentAutoMovieFloat64";
import type { IAutoMovieProjectionIntervals } from "./IAutoMovieProjectionIntervals";
import type { IAutoMovieTriangleAttachmentContactBound } from "./IAutoMovieTriangleAttachmentContactBound";
import { measureAutoMovieProjectionIntervals } from "./measureAutoMovieProjectionIntervals";

/**
 * Bound how far from its root any contact of an anchored fan with one support
 * triangle can lie.
 *
 * `fan[0]` is the root, already registered on the support by the caller's
 * canonical seat check, and `fan[1]` and `fan[2]` are the row's actual
 * corners; `support` is one original host triangle. Both are metres in one
 * frame and are only read. The function trusts the root's registration and
 * says nothing about any other host triangle, which needs its own strict
 * separation proof; the resident separation query supplies both.
 *
 * The support's stored face normal is only a direction. Outward intervals
 * enclose the whole support slab along it; with H its top, the root's deficit
 * is delta = max(0, H - root low) and the corners' smallest clearance above H
 * is s. When s > 0, a contact point's combined non-root barycentric weight is
 * at most delta / (delta + s), so its distance from the root is at most that
 * weight times the larger corner L1 distance from the root. A shallow
 * emergence therefore enlarges the cap through the explicit denominator. A
 * nonpositive s or a collapsed support leaves the proof false. Neither the
 * winding nor the cap says anything about tissue volume or burial.
 *
 * Throws when either triangle is not three finite vertices, when the support's
 * edge differences overflow, or, through the shared enclosure arithmetic, when
 * an enclosure step overflows.
 *
 * @param fan Root followed by the two row corners.
 * @param support One original host triangle.
 * @returns The proof flag, the cap in metres, and the slab quantities behind it.
 *
 * @evidence contracts/common.md#principled-implementation Barycentric slab argument: along the support's direction every contact point lies inside the support slab, and a fan point's height is the barycentric blend of root and corner heights, so its non-root weight w satisfies w*s <= (1-w)*delta; every subtraction, division and L1 sum is rounded outward so the cap encloses the exact bound.
 * @evidence contracts/common.md#clear-and-simple-design Projection enclosure is delegated to `measureAutoMovieProjectionIntervals`; this function only forms the slab quantities and the cap, while seat validation and the strict test of other triangles stay in the separation query.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The cap covers every point of the complete fan rather than a nearest witness, a degenerate support or nonpositive corner gap reports an unproved zero cap instead of a guessed one, and the support's edges are scaled by their largest component only to keep the cross product finite.
 * @evidence contracts/common.md#meaningful-documentation States what each vertex is, what the caller must already have proved, the slab construction and its formula, when the proof fails, what it does not assert, and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms Constant work: one cross product, one six-point projection and two three-axis L1 sums.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function evaluated once per attachment support by each separation call; the caller keeps the resulting caps.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns an owned four-field record and keeps no reference to either triangle.
 */
export function boundAutoMovieTriangleAttachmentContact(
  fan: readonly IAutoMovieVector3[],
  support: readonly IAutoMovieVector3[],
): IAutoMovieTriangleAttachmentContactBound {
  const vertices: IAutoMovieVector3[] = [...support, ...fan];
  if (
    fan.length !== 3 ||
    support.length !== 3 ||
    !vertices.every(
      (p: IAutoMovieVector3 | undefined | null): boolean =>
        p !== undefined &&
        p !== null &&
        Number.isFinite(p.x) &&
        Number.isFinite(p.y) &&
        Number.isFinite(p.z),
    )
  )
    throw new Error(
      "Attachment contact needs complete finite fan and support triangles.",
    );
  const u: IAutoMovieVector3 = Vector3.subtract(support[1]!, support[0]!);
  const v: IAutoMovieVector3 = Vector3.subtract(support[2]!, support[0]!);
  const scale: number = Math.max(
    Math.abs(u.x),
    Math.abs(u.y),
    Math.abs(u.z),
    Math.abs(v.x),
    Math.abs(v.y),
    Math.abs(v.z),
  );
  if (!Number.isFinite(scale))
    throw new Error("Attachment support differences must remain finite.");
  if (scale === 0)
    return { proved: false, cap: 0, cornerGap: 0, rootDeficit: 0 };
  const direction: IAutoMovieVector3 = Vector3.cross(
    { x: u.x / scale, y: u.y / scale, z: u.z / scale },
    { x: v.x / scale, y: v.y / scale, z: v.z / scale },
  );
  const measured: IAutoMovieProjectionIntervals =
    measureAutoMovieProjectionIntervals(vertices, direction, support[0]);
  if (measured.normUpper === 0)
    return { proved: false, cap: 0, cornerGap: 0, rootDeficit: 0 };
  // Intervals follow `vertices`: three support corners, the root, two corners.
  const slab: [number, number][] = measured.intervals;
  const top: number = Math.max(slab[0]![1], slab[1]![1], slab[2]![1]);
  const deficit: number = Math.max(0, outward(top - slab[3]![0], true));
  const gap: number = outward(Math.min(slab[4]![0], slab[5]![0]) - top, false);
  if (!(gap > 0))
    return { proved: false, cap: 0, cornerGap: gap, rootDeficit: deficit };
  const fraction: number = Math.min(
    1,
    outward(deficit / outward(deficit + gap, false), true),
  );
  let length: number = 0;
  for (const corner of [fan[1]!, fan[2]!]) {
    let l1: number = 0;
    for (const axis of ["x", "y", "z"] as const) {
      const difference: number = corner[axis] - fan[0]![axis];
      l1 = outward(
        l1 +
          Math.max(
            Math.abs(outward(difference, false)),
            Math.abs(outward(difference, true)),
          ),
        true,
      );
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
