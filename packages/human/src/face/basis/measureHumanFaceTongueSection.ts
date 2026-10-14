import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Measure a triangular tongue's protrusion and height within an incisal slab.
 * The passage evaluator consumes these geometric measurements; this function
 * admits no anatomical motion or aperture. Inputs are read-only: resident
 * triangle indices, finite projected coordinates and an orthonormal opening
 * frame. The passage caller supplies them from its admitted basis. Positions,
 * the origin and slab half-width use basis metres.
 *
 * Forward and height are affine on each triangle. The slab intersection is a
 * convex polygon whose extrema therefore occur at source corners inside the
 * slab or where an edge crosses either slab plane. Both sets are measured,
 * including triangles whose original corners all lie outside the slab. No
 * subdivision or sampling interval changes the answer. An empty intersection
 * reports null thickness instead of a negative infinity that would pass an
 * aperture comparison. This measures the piecewise linear surface, not an
 * interpolated biological volume, and floating-point rounding still applies.
 * Edge interpolation uses direct differences while their span is finite;
 * halving a subnormal distance first can erase a crossing. Only a span that
 * overflows between finite opposite endpoints uses half-scaled differences.
 *
 * @evidence contracts/common.md#principled-implementation Affine projected triangle coordinates attain slab-section extrema at contained corners or edge/plane intersections, so the full piecewise-linear section is measured without a sampling interval. Admitted source incidence and opening frame are caller premises; floating rounding and triangle geometry remain distinct from biological volume.
 * @evidence contracts/common.md#clear-and-simple-design One projection table serves every triangle; a small include operation accumulates height extrema and the result distinguishes absent section from zero thickness. Passage admission remains with the consuming evaluator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Edges crossing the slab are included even when all original corners lie outside; empty intersections return null instead of an accepting negative infinity. Overflowing finite forward differences use half-scaled interpolation while finite/subnormal differences retain their direct represented span.
 * @evidence contracts/common.md#meaningful-documentation Prose gives basis metre units, finite/incidence/frame premises, affine extrema, empty-section meaning, piecewise-linear scope and interpolation rounding limits.
 * @evidence contracts/performance.md#efficient-algorithms Projection costs O(V) storage/work and triangle scanning costs O(T), with three edges and two fixed slab planes per face; no tessellation or dense 3D sampling is allocated.
 * @evidence contracts/performance.md#reuse-equivalent-work Each vertex's forward/height projection is computed once and reused by all incident faces. One section supplies both aperture comparisons downstream; changed geometry/frame requires a new call rather than an id-only cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The V-entry projection table is local and only two scalar measurements transfer to the caller; input positions/indices remain unchanged and no source/query/task handle is retained.
 */
export function measureHumanFaceTongueSection(
  positions: readonly number[],
  indices: readonly number[],
  frame: {
    origin: IAutoMovieVector3;
    forward: IAutoMovieVector3;
    up: IAutoMovieVector3;
    slabMetres: number;
  },
): { protrudingMetres: number; thicknessMetres: number | null } {
  const projected: { forward: number; height: number }[] = [];
  for (let at: number = 0; at < positions.length; at += 3) {
    const offset: IAutoMovieVector3 = Vector3.subtract(
      Vector3.create(positions[at], positions[at + 1], positions[at + 2]),
      frame.origin,
    );
    projected.push({
      forward: Vector3.dot(offset, frame.forward),
      height: Vector3.dot(offset, frame.up),
    });
  }
  let protrudingMetres: number = 0;
  let low: number = Infinity;
  let high: number = -Infinity;
  const include: (height: number) => void = (height: number): void => {
    low = Math.min(low, height);
    high = Math.max(high, height);
  };
  for (let at: number = 0; at < indices.length; at += 3) {
    for (let corner: number = 0; corner < 3; corner++) {
      const first: { forward: number; height: number } =
        projected[indices[at + corner]];
      const second: { forward: number; height: number } =
        projected[indices[at + ((corner + 1) % 3)]];
      protrudingMetres = Math.max(protrudingMetres, first.forward);
      if (Math.abs(first.forward) <= frame.slabMetres) include(first.height);
      for (const plane of [-frame.slabMetres, frame.slabMetres]) {
        if (
          (first.forward < plane && second.forward > plane) ||
          (second.forward < plane && first.forward > plane)
        ) {
          const span: number = second.forward - first.forward;
          const fraction: number = Number.isFinite(span)
            ? (plane - first.forward) / span
            : (plane / 2 - first.forward / 2) /
              (second.forward / 2 - first.forward / 2);
          include((1 - fraction) * first.height + fraction * second.height);
        }
      }
    }
  }
  return {
    protrudingMetres,
    thicknessMetres: low === Infinity ? null : high - low,
  };
}
