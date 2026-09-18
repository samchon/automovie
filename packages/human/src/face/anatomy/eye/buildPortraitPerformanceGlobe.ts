
import type { IAutoMovieMesh } from "@automovie/interface";
import type { IPortraitEyeSphere } from "../../surface/IPortraitEyeSphere";
/**
 * Construct one complete globe independent of eyelid visibility. Single pole
 * vertices and wrapped ring indices avoid collapsed rectangular pole cells.
 * The surrounding opaque tissues, not a changing optical mesh, hide the globe.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Keeps a resident optical identity under animated eyelids.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression Does not shrink or refit the globe as the aperture closes.
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