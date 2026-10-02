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
 * @evidence contracts/common.md#principled-implementation The corneal front is the sphere of the given curvature radius written as a sag relative to the underlying globe's sag at the same radius, both measured from the aperture rim, so at the rim the shell sits exactly the declared lift above the support and towards the centre it domes by the difference of the two sags. The back surface is the same surface displaced by a constant axial thickness, and an outer wall closes the boundary. Each approximation is stated: the shell is a rendering surface, its back is an offset and not a second curvature, and no physiological completeness is claimed.
 * @evidence contracts/common.md#clear-and-simple-design One function turns one description into one closed shell by three steps in order, rings of the front, the offset back and the rim wall, with the pole handled by a single centre vertex and no option.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shell is a function of its input record only; nothing is named after a subject or fixture and no compensating path masks an invalid dimension, which throws.
 * @evidence contracts/common.md#meaningful-documentation The comment states the sag construction, the back surface and wall, the counts and their formula, every refusal, and that the count is independent of aperture and lids.
 * @evidence contracts/modeling.md#emitted-geometry The population is `2 * (1 + radialSamples * columns)` vertices and `4 * columns * radialSamples` triangles from the eye's iris sampling parameters only: at the 3 columns by 1 ring minimum it is 8 vertices and 12 triangles, and it grows linearly in each parameter (for example 64 columns by 8 rings is 1,026 vertices and 2,048 triangles), whatever the iris radius or the lids. The function sets no maximum count. A parametric revolved surface with one centre vertex is the representation the regular cap needs, and only the per-column extent, not a per-feature primitive, expresses lid clipping.
 * @evidence contracts/modeling.md#spatial-conventions Every length is head millimetres in one right-handed frame with +Z anterior, the centre is an in-plane point and the depth comes from the support surface, and the shell stays in millimetres until the metric part builder converts it once.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function emits one shell mesh and defines neither the part identity that displays it nor the eye group; the eye builder names and groups it.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes the eye's corneal and iris dimensions and defines no channel.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds one closed shell whose two surfaces meet at one shared rim ring; the skin that meets the eye near this shell is built by the contact and lid declarations from this same mesh.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value of its own; the radii and curvatures are its input's, and their basis belongs to the eye shape and its admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines and converts no input a caller shapes a face through.
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
      (value) => !Number.isFinite(value) || value <= 0 || value > input.radius,
    ) ||
    !Number.isInteger(input.radialSamples) ||
    input.radialSamples < 1
  )
    throw new Error(
      "Corneal dimensions need a finite aperture, valid curvatures and a positive closed-shell thickness.",
    );
  const columns = input.extents.length,
    positions: number[] = [],
    indices: number[] = [];
  const cornealRim = Math.sqrt(input.curvature ** 2 - input.radius ** 2);
  const globeRim = Math.sqrt(input.globeRadius ** 2 - input.radius ** 2);
  const point = (radius: number, angle: number): void => {
    const x = input.center.x + radius * Math.cos(angle),
      y = input.center.y - radius * Math.sin(angle);
    const sag =
      Math.sqrt(input.curvature ** 2 - radius ** 2) -
      cornealRim -
      (Math.sqrt(input.globeRadius ** 2 - radius ** 2) - globeRim);
    const z = input.surface(x, y) + input.rimLift + sag;
    if (!Number.isFinite(z))
      throw new Error(
        "The corneal support surface must provide a finite height.",
      );
    positions.push(x, y, z);
  };
  point(0, 0);
  for (let row = 1; row <= input.radialSamples; row++)
    for (let column = 0; column < columns; column++)
      point(
        (input.extents[column] * row) / input.radialSamples,
        (2 * Math.PI * column) / columns,
      );
  for (let column = 0; column < columns; column++)
    indices.push(0, 1 + ((column + 1) % columns), 1 + column);
  for (let row = 0; row < input.radialSamples - 1; row++)
    for (let column = 0; column < columns; column++) {
      const a = 1 + row * columns + column,
        b = 1 + row * columns + ((column + 1) % columns),
        c = a + columns,
        d = b + columns;
      indices.push(a, b, c, b, d, c);
    }
  const frontCount = positions.length / 3,
    frontFaces = indices.length;
  for (let i = 0; i < frontCount; i++)
    positions.push(
      positions[3 * i],
      positions[3 * i + 1],
      positions[3 * i + 2] - input.thickness,
    );
  for (let i = 0; i < frontFaces; i += 3)
    indices.push(
      indices[i] + frontCount,
      indices[i + 2] + frontCount,
      indices[i + 1] + frontCount,
    );
  for (let column = 0; column < columns; column++) {
    const a = 1 + (input.radialSamples - 1) * columns + column,
      b = 1 + (input.radialSamples - 1) * columns + ((column + 1) % columns);
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
