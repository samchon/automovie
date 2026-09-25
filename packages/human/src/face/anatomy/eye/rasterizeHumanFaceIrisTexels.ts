import type { IHumanFaceIrisDisc } from "./structures/IHumanFaceIrisDisc";
import type { IHumanFaceIrisTexels } from "./structures/IHumanFaceIrisTexels";

/**
 * The texels of one eye texture that lie on an iris disc, with their polar
 * coordinates about the optical axis.
 *
 * `createHumanFaceIrisPigment` calls this once per textured globe when a
 * document first asks for iris pigment. Each globe triangle is rasterized in
 * texture space: a texel belongs to the triangle when its centre
 * `((x + 0.5) / width, (y + 0.5) / height)` has non-negative barycentric
 * coordinates in the triangle's corner UVs, image row `y` growing with `v`
 * (the glTF texture convention the viewer draws with). The texel's surface
 * point is the same barycentric mix of the triangle's neutral positions, so
 * its polar angle `theta` from the axis and its azimuth `phi` about it (from
 * the disc's reference direction, counter-clockwise looking down the axis
 * onto the eye) are exact on the painted surface, not guessed from pixels.
 * Only texels within `limbus + margin` are kept; the first triangle to claim
 * a texel keeps it, which only matters on a shared edge where both agree.
 *
 * Pure: the triangles and disc are read, a new list is returned.
 */

/**
 * Rasterize globe triangles into the iris texels of a disc.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Finds the painted iris of one eye on the texture through the globe's own surface geometry.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-iris Maps each texel centre through its triangle's UVs to the neutral surface and keeps those within the limbus and its blending margin.
 */
export function rasterizeHumanFaceIrisTexels(props: {
  width: number;
  height: number;
  /** Per triangle, three corner positions (metres) and three corner UVs. */
  triangles: readonly {
    positions: readonly (readonly [number, number, number])[];
    uvs: readonly (readonly [number, number])[];
  }[];
  disc: IHumanFaceIrisDisc;
  margin: number;
}): IHumanFaceIrisTexels {
  const { width, height, disc } = props;
  const side = cross(disc.axis, disc.reference);
  const claimed = new Set<number>();
  const result: IHumanFaceIrisTexels = { index: [], theta: [], phi: [] };
  for (const triangle of props.triangles) {
    const [a, b, c] = triangle.uvs.map(([u, v]) => [u * width, v * height]);
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    if (area === 0) continue;
    const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])));
    const x1 = Math.min(width - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
    const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])));
    const y1 = Math.min(height - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
    for (let y = y0; y <= y1; ++y)
      for (let x = x0; x <= x1; ++x) {
        const px = x + 0.5;
        const py = y + 0.5;
        const wa =
          ((b[0] - px) * (c[1] - py) - (c[0] - px) * (b[1] - py)) / area;
        const wb =
          ((c[0] - px) * (a[1] - py) - (a[0] - px) * (c[1] - py)) / area;
        const wc = 1 - wa - wb;
        if (wa < 0 || wb < 0 || wc < 0) continue;
        const index = y * width + x;
        if (claimed.has(index)) continue;
        const point = [0, 1, 2].map(
          (axis) =>
            wa * triangle.positions[0][axis] +
            wb * triangle.positions[1][axis] +
            wc * triangle.positions[2][axis] -
            disc.centre[axis],
        );
        const length = Math.hypot(point[0], point[1], point[2]);
        const along = dot(point, disc.axis) / length;
        const theta = Math.acos(Math.min(1, Math.max(-1, along)));
        if (theta > disc.limbus + props.margin) continue;
        claimed.add(index);
        result.index.push(index);
        result.theta.push(theta);
        result.phi.push(
          Math.atan2(dot(point, side), dot(point, disc.reference)),
        );
      }
  }
  return result;
}

function dot(a: readonly number[], b: readonly number[]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(
  a: readonly number[],
  b: readonly number[],
): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
