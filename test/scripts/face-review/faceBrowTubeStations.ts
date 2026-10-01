import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Read the existing eight-sided tube lattice after its metric conversion.
 * Its row has eight ring vertices plus a repeated UV-seam vertex. The eight
 * unique vertices define the centre; the largest actual vertex radius encloses
 * the row. Convex hulls of successive enclosing balls contain every connecting
 * triangle. This is a geometric envelope, not a follicle or biological radius.
 * Positions/radii remain metres; fresh station arrays own every result.
 */
export function faceBrowTubeStations(mesh: IAutoMovieMesh, segments: number):
  { point: number[]; radius: number }[] {
  if (!Number.isInteger(segments) || segments < 1 ||
      mesh.positions.length !== 27 * (segments + 1) || !mesh.positions.every(Number.isFinite))
    throw new Error("Brow tube stations need the finite eight-sided metric lattice.");
  return Array.from({ length: segments + 1 }, (_, row) => {
    const points = Array.from({ length: 8 }, (_, column) => mesh.positions.slice(27 * row + 3 * column, 27 * row + 3 * column + 3));
    const point = [0, 1, 2].map((axis) => points.reduce((sum, value) => sum + value[axis] / 8, 0));
    const ring = [...points, mesh.positions.slice(27 * row + 24, 27 * row + 27)];
    return { point, radius: Math.max(...ring.map((value) => Math.hypot(...value.map((coordinate, axis) => coordinate - point[axis])))) };
  });
}
