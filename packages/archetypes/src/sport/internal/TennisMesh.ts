import type {
  IAutoMovieMesh,
  IAutoMovieProfilePoint,
} from "@automovie/interface";

/*
 * Accumulates the narrow strips of a tennis string bed, net or binding into one
 * indexed rigid mesh per finish.
 */
export class TennisMesh {
  /*
   * Indexed XYZ vertices in metres, with normals derived from the wound
   * triangles.
   */
  public readonly mesh: IAutoMovieMesh & { indices: number[] } = {
    positions: [],
    indices: [],
    normals: null,
    uvs: null,
    skin: null,
  };

  /*
   * Append a capped strip along two or more distinct XY points, at constant
   * `z`. Width is across the path and depth is along Z, in metres. Consecutive
   * points have different XY coordinates and the path does not reverse
   * direction.
   */
  public strip(
    points: readonly IAutoMovieProfilePoint[],
    width: number,
    depth: number,
    z: number = 0,
  ): void {
    const { positions, indices } = this.mesh;
    const start: number = positions.length / 3;
    const last: number = points.length - 1;
    const back: number = z - depth / 2;
    const front: number = z + depth / 2;
    for (let i: number = 0; i <= last; ++i) {
      const point: IAutoMovieProfilePoint = points[i]!;
      const from: IAutoMovieProfilePoint = points[Math.max(0, i - 1)]!;
      const to: IAutoMovieProfilePoint = points[Math.min(last, i + 1)]!;
      const dx: number = to.x - from.x;
      const dy: number = to.y - from.y;
      const scale: number = width / (2 * Math.hypot(dx, dy));
      const x: number = -dy * scale;
      const y: number = dx * scale;
      positions.push(
        point.x - x,
        point.y - y,
        back,
        point.x + x,
        point.y + y,
        back,
        point.x + x,
        point.y + y,
        front,
        point.x - x,
        point.y - y,
        front,
      );
    }
    for (let section: number = 0; section < last; ++section) {
      const base: number = start + 4 * section;
      for (let side: number = 0; side < 4; ++side) {
        const a: number = base + side;
        const b: number = base + ((side + 1) % 4);
        indices.push(a, b, b + 4, a, b + 4, a + 4);
      }
    }
    const end: number = start + 4 * last;
    indices.push(start, start + 2, start + 1, start, start + 3, start + 2);
    indices.push(end, end + 1, end + 2, end, end + 2, end + 3);
  }
}
