import { IAutoMovieSubjectBox, IAutoMovieVector3 } from "@automovie/interface";

/**
 * The axis-aligned bound of one local box carried through a column-major affine
 * matrix.
 *
 * All eight corners go through the full matrix before the bound is taken, so a
 * rotated box widens rather than being re-fitted to its local extent, and a
 * negative scale on an axis still yields an ordered box. The matrix's last row
 * is ignored, so a projective matrix is treated as affine. A `NaN` entry or
 * corner propagates into the result.
 *
 * @param box Local box, `min` and `max` corners in the matrix's source frame.
 * @param matrix Sixteen numbers, column-major, as `Matrix4` stores them.
 * @returns A new world box.
 */
export const transformedBoxBounds = (
  box: IAutoMovieSubjectBox,
  matrix: readonly number[],
): IAutoMovieSubjectBox => {
  const min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  const max: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        const wx: number =
          matrix[0]! * x + matrix[4]! * y + matrix[8]! * z + matrix[12]!;
        const wy: number =
          matrix[1]! * x + matrix[5]! * y + matrix[9]! * z + matrix[13]!;
        const wz: number =
          matrix[2]! * x + matrix[6]! * y + matrix[10]! * z + matrix[14]!;
        min.x = Math.min(min.x, wx);
        min.y = Math.min(min.y, wy);
        min.z = Math.min(min.z, wz);
        max.x = Math.max(max.x, wx);
        max.y = Math.max(max.y, wy);
        max.z = Math.max(max.z, wz);
      }
  return { min, max };
};
