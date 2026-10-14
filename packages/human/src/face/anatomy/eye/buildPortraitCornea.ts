import type { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { IPortraitCornea } from "./structures/IPortraitCornea";

/**
 * Construct a closed optical shell with a single vertex at each axial pole.
 * Positions remain in millimetres until createMetricMeshPart creates model data.
 *
 * At radius r, subtract the globe's sag from the corneal sphere's sag, each
 * measured relative to the declared unclipped aperture radius. Adding that
 * difference to surface(x,y) retains the fitted eye's support and rim lift.
 * Angular clipping shortens the same surface at the eyelid; it does not refit
 * curvature independently for each column.
 *
 * The back surface is an axial offset, not a second physiological curvature.
 * Reverse its triangle winding and join the outer rim so material volume has a
 * manifold boundary. The single centre vertices avoid degenerate pole quads.
 *
 * With `columns` angular samples (one per extent) and `radialSamples` rings,
 * the shell has `2 * (1 + radialSamples * columns)` vertices and
 * `4 * columns * radialSamples` triangles: each surface is a fan of `columns`
 * triangles about the centre plus two triangles per cell of the remaining
 * rings, and a wall of `2 * columns` triangles joins the two outermost rings.
 * At least three columns are required. The count follows the two sampling
 * parameters and never the size of the aperture or the number of lids. A
 * non-finite dimension, a curvature radius not above the aperture radius, a
 * globe radius below the curvature radius, a rim lift not above the thickness,
 * an extent not in (0, radius], fewer than three columns, a non-integral ring
 * count and a support height that is not finite all throw.
 *
 * @evidence contracts/common.md#principled-implementation Corneal-minus-globe sag over the declared aperture modifies one support, then axial back offset and rim faces close the same shell.
 * @evidence contracts/common.md#clear-and-simple-design Input admission, polar shell construction and actual-incidence normal computation are one owner; downstream metric publication converts millimetres once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid curvature/thickness/extent/support refuses; axial backing is an authored construction rather than a second physiological curvature fit.
 * @evidence contracts/common.md#meaningful-documentation The prose states units, sag law, clipping meaning, exact lattice counts and invalid input behavior.
 * @evidence contracts/performance.md#efficient-algorithms C angular extents and R radial intervals require O(CR) coordinates/faces and actual-incidence normal work, with no independent upper sampling cap here.
 * @evidence contracts/performance.md#reuse-equivalent-work Each front point is reused for its back offset and ring wall; globe/corneal rim sag scalars are computed once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned mesh arrays own the shell; input extents/support remain borrowed and no cache, task or resource is retained.
 */
export function buildPortraitCornea(input: IPortraitCornea): IAutoMovieMesh {
  if (
    ![
      input.center.x,
      input.center.y,
      input.radius,
      input.curvature,
      input.globeRadius,
      input.thickness,
      input.rimLift,
    ].every(Number.isFinite) ||
    input.radius <= 0 ||
    input.curvature <= input.radius ||
    input.globeRadius < input.curvature ||
    input.thickness <= 0 ||
    input.rimLift <= input.thickness ||
    input.extents.length < 3 ||
    input.extents.some(
      (value: number): boolean  => !Number.isFinite(value) || value <= 0 || value > input.radius,
    ) ||
    !Number.isInteger(input.radialSamples) ||
    input.radialSamples < 1
  )
    throw new Error(
      "Corneal dimensions need a finite aperture, valid curvatures and a positive closed-shell thickness.",
    );
  const columns: number = input.extents.length,
    positions: number[] = [],
    indices: number[] = [];
  const cornealRim: number = Math.sqrt(input.curvature ** 2 - input.radius ** 2);
  const globeRim: number = Math.sqrt(input.globeRadius ** 2 - input.radius ** 2);
  const point: (radius: number, angle: number) => void = (radius: number, angle: number): void => {
    const x: number = input.center.x + radius * Math.cos(angle),
      y: number = input.center.y - radius * Math.sin(angle);
    const sag: number =
      Math.sqrt(input.curvature ** 2 - radius ** 2) -
      cornealRim -
      (Math.sqrt(input.globeRadius ** 2 - radius ** 2) - globeRim);
    const z: number = input.surface(x, y) + input.rimLift + sag;
    if (!Number.isFinite(z))
      throw new Error(
        "The corneal support surface must provide a finite height.",
      );
    positions.push(x, y, z);
  };
  point(0, 0);
  for (let row: number = 1; row <= input.radialSamples; row++)
    for (let column: number = 0; column < columns; column++)
      point(
        (input.extents[column] * row) / input.radialSamples,
        (2 * Math.PI * column) / columns,
      );
  for (let column: number = 0; column < columns; column++)
    indices.push(0, 1 + ((column + 1) % columns), 1 + column);
  for (let row: number = 0; row < input.radialSamples - 1; row++)
    for (let column: number = 0; column < columns; column++) {
      const a: number = 1 + row * columns + column,
        b: number = 1 + row * columns + ((column + 1) % columns),
        c: number = a + columns,
        d: number = b + columns;
      indices.push(a, b, c, b, d, c);
    }
  const frontCount: number = positions.length / 3,
    frontFaces: number = indices.length;
  for (let i: number = 0; i < frontCount; i++)
    positions.push(
      positions[3 * i],
      positions[3 * i + 1],
      positions[3 * i + 2] - input.thickness,
    );
  for (let i: number = 0; i < frontFaces; i += 3)
    indices.push(
      indices[i] + frontCount,
      indices[i + 2] + frontCount,
      indices[i + 1] + frontCount,
    );
  for (let column: number = 0; column < columns; column++) {
    const a: number = 1 + (input.radialSamples - 1) * columns + column,
      b: number = 1 + (input.radialSamples - 1) * columns + ((column + 1) % columns);
    indices.push(a, b, a + frontCount, b, b + frontCount, a + frontCount);
  }
  return {
    positions,
    indices,
    normals: areaWeightedNormals(positions, indices),
    uvs: null,
    skin: null,
  };
}
