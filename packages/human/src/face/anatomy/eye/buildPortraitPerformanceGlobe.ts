import type { IAutoMovieMesh } from "@automovie/interface";

import type { IPortraitEyeSphere } from "../../surface/structures/IPortraitEyeSphere";

/**
 * Construct one complete globe independent of eyelid visibility. Single pole
 * vertices and wrapped ring indices avoid collapsed rectangular pole cells.
 * The surrounding opaque tissues, not a changing optical mesh, hide the globe.
 *
 * The sphere is in the caller's frame and unit (the eye component passes head
 * millimetres, +Y superior, +Z anterior); its poles lie on the frame's Y axis.
 * Positions are exactly `center + radius * normal`, so each unit normal is the
 * analytic outward normal of the sphere and not a triangle average. Columns
 * (3 to 512) are the meridians and rows (2 to 512) the latitude bands, giving
 * `columns * (rows - 1) + 2` vertices and `2 * columns * (rows - 1)` triangles.
 * A non-finite or non-positive sphere, a count outside those ranges or a
 * placement that overflows finite coordinates throws.
 *
 * @evidence contracts/common.md#principled-implementation A latitude-longitude parameterization puts every vertex on the sphere by construction, and its analytic unit normals equal the exact sphere normals at those vertices. Collapsing each pole to one vertex with a wrapped ring of triangles removes the zero-area cells that a rectangular pole row would produce. The mesh is a polyhedral approximation whose chord sag falls with the counts, and no interior point is claimed to lie on the sphere.
 * @evidence contracts/common.md#clear-and-simple-design One function builds one closed sphere from a centre, a radius and two counts, with no option and no state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The sphere is a function of its arguments alone, with nothing named after a subject or fixture and no foreign method replaced.
 * @evidence contracts/common.md#meaningful-documentation The comment states the frame, the pole axis, the exact-normal property, the two counts and the vertex and triangle counts they give, and every refusal.
 * @evidence contracts/modeling.md#emitted-geometry The population is `columns * (rows - 1) + 2` vertices and `2 * columns * (rows - 1)` triangles, from the eye's two sampling parameters only: 5 vertices and 6 triangles at the 3 by 2 minimum and 261,634 vertices and 523,264 triangles at the 512 by 512 maximum, whatever the aperture or lid state. A complete closed surface is what a performed lid needs, because the lids can hide any part of the globe as they close, and a parametric sphere emits a population that follows the requested resolution instead of an individually placed primitive per feature; an icosphere would spread vertices more evenly but would not tie the count to the eye's two existing sampling parameters.
 * @evidence contracts/modeling.md#spatial-conventions Centre, radius and positions share one unit and one right-handed frame supplied by the caller, the poles are on its Y axis and normals are dimensionless; no conversion happens inside.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function emits one mesh and defines neither the sclera part that displays it nor the group that composes the eye.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes a sphere and two counts and defines no channel.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds one closed surface and joins no other part; the canthal hull and the ocular tissues that meet it are built by their own declarations from this same mesh.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value; the radius is the caller's.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits only geometric validity of a sphere and two tessellation counts and bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a face through.
 */
export function buildPortraitPerformanceGlobe(
  sphere: IPortraitEyeSphere,
  columns: number,
  rows: number,
): IAutoMovieMesh {
  if (
    ![sphere.center.x, sphere.center.y, sphere.center.z, sphere.radius].every(
      Number.isFinite,
    ) ||
    sphere.radius <= 0 ||
    !Number.isInteger(columns) ||
    columns < 3 ||
    columns > 512 ||
    !Number.isInteger(rows) ||
    rows < 2 ||
    rows > 512
  )
    throw new Error(
      "A performance globe needs a finite positive sphere and bounded integer sampling.",
    );
  const normals = [0, 1, 0];
  const indices: number[] = [];
  for (let row = 1; row < rows; row++) {
    const latitude = (Math.PI * row) / rows;
    for (let column = 0; column < columns; column++) {
      const longitude = (2 * Math.PI * column) / columns;
      normals.push(
        Math.sin(latitude) * Math.cos(longitude),
        Math.cos(latitude),
        Math.sin(latitude) * Math.sin(longitude),
      );
    }
  }
  const south = normals.length / 3;
  normals.push(0, -1, 0);
  for (let column = 0; column < columns; column++) {
    const next = (column + 1) % columns;
    indices.push(0, 1 + next, 1 + column);
    for (let row = 0; row < rows - 2; row++) {
      const a = 1 + row * columns + column,
        b = 1 + row * columns + next;
      indices.push(a, b, a + columns, b, b + columns, a + columns);
    }
    const last = 1 + (rows - 2) * columns;
    indices.push(last + column, last + next, south);
  }
  const center = [sphere.center.x, sphere.center.y, sphere.center.z];
  const positions = normals.map(
    (value, axis) => center[axis % 3] + sphere.radius * value,
  );
  if (!positions.every(Number.isFinite))
    throw new Error(
      "Globe placement exceeds representable construction coordinates.",
    );
  return { positions, normals, indices, uvs: null, skin: null };
}
