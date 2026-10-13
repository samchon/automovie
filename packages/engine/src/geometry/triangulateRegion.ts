import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { IAutoMovieRegionTriangulation } from "./IAutoMovieRegionTriangulation";
import { canonicalRegion } from "./canonicalRegion";
import { trianglesOf } from "./trianglesOf";

/**
 * Validate one planar region, wind it canonically, and ear-clip it, naming the
 * region `label` in any diagnostic.
 *
 * {@link triangulateAutoMovieRegion} calls it with `polygon`, and region
 * extrusion with its own label, so the author learns which region holds a bad
 * ring.
 *
 * @param outer Outer boundary in `x, y` metres, any winding.
 * @param holes Voids inside the outer boundary.
 * @param label Name of the region in diagnostics.
 * @returns The canonical layout with its counter-clockwise triangles.
 * @throws Error with the first ring diagnostic, or when floating-point search finds no hole bridge or ear.
 *
 * @evidence contracts/common.md#principled-implementation Composition of `canonicalRegion`, which admits the rings and fixes winding by signed area, and `trianglesOf`, which bridges holes and ear-clips; the triangles index the canonical points, so they are attached to the layout they were computed from.
 * @evidence contracts/common.md#clear-and-simple-design The labelled pairing of layout and triangles shared by the public entry and region extrusion, while a loft calls the two halves separately because it triangulates only its caps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no repair or fallback between the two steps; either one's refusal propagates unchanged.
 * @evidence contracts/common.md#meaningful-documentation States what it composes, who calls it with which label, each parameter's unit and role, and the refusals.
 * @evidence contracts/performance.md#efficient-algorithms One validation and layout pass and one triangulation, with no repeated work; costs are answered on `canonicalRegion` and `trianglesOf`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one region per call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the layout's arrays are spread into the returned record beside the new triangle array.
 */
export const triangulateRegion = (
  outer: readonly IAutoMovieProfilePoint[],
  holes: ReadonlyArray<readonly IAutoMovieProfilePoint[]>,
  label: string,
): IAutoMovieRegionTriangulation => {
  const region: Omit<IAutoMovieRegionTriangulation, "triangles"> =
    canonicalRegion(outer, holes, label);
  return { ...region, triangles: trianglesOf(region) };
};
