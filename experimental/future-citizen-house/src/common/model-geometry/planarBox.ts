import type { Bounds } from "./Bounds";
import { MeshWriter } from "./MeshWriter";

/**
 * Closed axis-aligned box faces, optionally omitting one opposing face pair.
 *
 * skipAxis 0, 1 or 2 omits the opposing X, Y or Z faces; the default -1 and other values emit all six. Finite increasing intervals are a caller premise. At most six fixed quads append to the caller's writer with metre projections and outward axis normals. The operation keeps no state or cached mesh after return.
 */
export function planarBox(w: MeshWriter, b: Bounds, skipAxis: number = -1): void {
  const [x0, x1]: [number, number] = b.x,
    [y0, y1]: [number, number] = b.y,
    [z0, z1]: [number, number] = b.z;
  if (skipAxis !== 0) {
    w.quad(
      [
        [x0, y0, z0],
        [x0, y1, z0],
        [x0, y1, z1],
        [x0, y0, z1],
      ],
      [-1, 0, 0],
    );
    w.quad(
      [
        [x1, y0, z0],
        [x1, y1, z0],
        [x1, y1, z1],
        [x1, y0, z1],
      ],
      [1, 0, 0],
    );
  }
  if (skipAxis !== 2) {
    w.quad(
      [
        [x0, y0, z0],
        [x1, y0, z0],
        [x1, y1, z0],
        [x0, y1, z0],
      ],
      [0, 0, -1],
    );
    w.quad(
      [
        [x0, y0, z1],
        [x1, y0, z1],
        [x1, y1, z1],
        [x0, y1, z1],
      ],
      [0, 0, 1],
    );
  }
  if (skipAxis !== 1) {
    w.quad(
      [
        [x0, y0, z0],
        [x1, y0, z0],
        [x1, y0, z1],
        [x0, y0, z1],
      ],
      [0, -1, 0],
    );
    w.quad(
      [
        [x0, y1, z0],
        [x1, y1, z0],
        [x1, y1, z1],
        [x0, y1, z1],
      ],
      [0, 1, 0],
    );
  }
}
