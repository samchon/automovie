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
 * @evidence contracts/common.md#principled-implementation Height and forward distance are affine over a triangle. Intersecting it with two half-spaces gives a convex polygon, so height extrema lie at retained corners or edge/plane intersections; the function evaluates every such candidate rather than sampling only source vertices. Empty intersections remain explicit.
 * @evidence contracts/common.md#clear-and-simple-design Project source positions once, then measure corners and edge intersections in one pass over resident triangles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same triangle/slab construction applies to every tongue, without a subject-specific sampling threshold or compensating thickness.
 * @evidence contracts/common.md#meaningful-documentation States the consumer, admitted-input preconditions, affine derivation, read-only ownership, empty-section meaning and the piecewise linear approximation.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres in the caller's opening frame; forward and up are orthogonal unit directions about the lower-incisor origin.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Measures an existing surface and owns no part or composition.
 * @evidenceExclude contracts/modeling.md#parameter-channels Reads already posed geometry and defines or consumes no form channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits measurements only, without changing the tongue's primitive population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Constructs no boundary between anatomical parts.
 * @evidenceExclude contracts/modeling.md#rendered-observation Owns no displayed part or joint; the performed tongue's owner observes it.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Contains no anatomical dimension or tissue law; its slab is a caller-supplied measurement domain.
 * @evidenceExclude contracts/anatomy.md#permitted-range Does not admit or combine an anatomical control; the passage evaluator compares the returned measurement to apertures.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Provides no input through which an author shapes a human form.
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
  for (let at = 0; at < positions.length; at += 3) {
    const offset = Vector3.subtract(
      Vector3.create(positions[at], positions[at + 1], positions[at + 2]),
      frame.origin,
    );
    projected.push({
      forward: Vector3.dot(offset, frame.forward),
      height: Vector3.dot(offset, frame.up),
    });
  }
  let protrudingMetres = 0;
  let low = Infinity;
  let high = -Infinity;
  const include = (height: number): void => {
    low = Math.min(low, height);
    high = Math.max(high, height);
  };
  for (let at = 0; at < indices.length; at += 3) {
    for (let corner = 0; corner < 3; corner++) {
      const first = projected[indices[at + corner]];
      const second = projected[indices[at + ((corner + 1) % 3)]];
      protrudingMetres = Math.max(protrudingMetres, first.forward);
      if (Math.abs(first.forward) <= frame.slabMetres) include(first.height);
      for (const plane of [-frame.slabMetres, frame.slabMetres]) {
        if (
          (first.forward < plane && second.forward > plane) ||
          (second.forward < plane && first.forward > plane)
        ) {
          const span = second.forward - first.forward;
          const fraction = Number.isFinite(span)
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
