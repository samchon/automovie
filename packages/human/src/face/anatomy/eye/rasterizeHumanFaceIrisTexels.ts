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
 * onto the eye) are computed from that affine surface point in binary64,
 * rather than inferred from painted pixel colours.
 * Only texels within `limbus + margin` are kept; the first triangle to claim
 * a texel keeps it. The source is assumed to give consistent shared-edge
 * geometry; overlapping distinct UV islands otherwise keep the first owner.
 *
 * Pure: the triangles and disc are read, a new list is returned. Positions are
 * metres in the basis frame, angles are radians, and texel coordinates are
 * pixels with image row `y` growing with `v`. A triangle with zero UV area is
 * skipped, so a degenerate triangle claims no texel.
 *
 * @evidence contracts/common.md#principled-implementation Texel-centre UV barycentrics interpolate the actual neutral triangle before binary64 polar angles select the iris margin.
 * @evidence contracts/common.md#clear-and-simple-design One claimed-texel set and result retain first-owner correspondence, separate from pigment painting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero UV area skips that triangle; consistent shared edges/nonoverlapping UV islands are source premises and distinct overlaps otherwise keep the first owner.
 * @evidence contracts/common.md#meaningful-documentation The prose states metres/radians/pixel coordinates, binary64 evaluation and first-owner/degenerate rules.
 * @evidence contracts/performance.md#efficient-algorithms Work is the sum of clipped triangle pixel-box areas; claimed/result storage is bounded by actual image texel count.
 * @evidence contracts/performance.md#reuse-equivalent-work Each admitted texel is published once and reused by pigment/preparation rather than re-locating geometry per paint.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned texel arrays own correspondence; the claimed set expires and no image or source triangle is retained.
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
  const {
    width,
    height,
    disc,
  }: Parameters<typeof rasterizeHumanFaceIrisTexels>[0] = props;
  const side: [number, number, number] = cross(disc.axis, disc.reference);
  const claimed: Set<number> = new Set<number>();
  const result: IHumanFaceIrisTexels = { index: [], theta: [], phi: [] };
  for (const triangle of props.triangles) {
    const [a, b, c]: number[][] = triangle.uvs.map(
      ([u, v]: readonly [number, number]): number[] => [u * width, v * height],
    );
    const area: number =
      (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    if (area === 0) continue;
    const x0: number = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])));
    const x1: number = Math.min(
      width - 1,
      Math.ceil(Math.max(a[0], b[0], c[0])),
    );
    const y0: number = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])));
    const y1: number = Math.min(
      height - 1,
      Math.ceil(Math.max(a[1], b[1], c[1])),
    );
    for (let y: number = y0; y <= y1; ++y)
      for (let x: number = x0; x <= x1; ++x) {
        const px: number = x + 0.5;
        const py: number = y + 0.5;
        const wa: number =
          ((b[0] - px) * (c[1] - py) - (c[0] - px) * (b[1] - py)) / area;
        const wb: number =
          ((c[0] - px) * (a[1] - py) - (a[0] - px) * (c[1] - py)) / area;
        const wc: number = 1 - wa - wb;
        if (wa < 0 || wb < 0 || wc < 0) continue;
        const index: number = y * width + x;
        if (claimed.has(index)) continue;
        const point: number[] = [0, 1, 2].map(
          (axis: number): number =>
            wa * triangle.positions[0][axis] +
            wb * triangle.positions[1][axis] +
            wc * triangle.positions[2][axis] -
            disc.centre[axis],
        );
        const length: number = Math.hypot(point[0], point[1], point[2]);
        const along: number = dot(point, disc.axis) / length;
        const theta: number = Math.acos(Math.min(1, Math.max(-1, along)));
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
