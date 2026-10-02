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
 * Pure: the triangles and disc are read, a new list is returned. Positions are
 * metres in the basis frame, angles are radians, and texel coordinates are
 * pixels with image row `y` growing with `v`. A triangle with zero UV area is
 * skipped, so a degenerate triangle claims no texel.
 *
 * @evidence contracts/common.md#principled-implementation A texel centre lies inside a triangle exactly when its barycentric coordinates in the corner UVs are all non-negative, and the same barycentric weights applied to the triangle's positions give the surface point that texel shows, so the polar angle and azimuth are exact on the polyhedral surface and not read back from pixels. Testing centres, not corners, makes each texel belong to the surface it samples, and first-claim-wins is sound because a texel shared by two triangles lies on their common edge where both give the same point.
 * @evidence contracts/common.md#clear-and-simple-design One pure function walks each triangle's texel bounding box once and records the kept texels in three parallel arrays, with no option and no state beyond the claimed set.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is named after an asset or a subject; the texels follow from the triangles, the disc and the margin alone.
 * @evidence contracts/common.md#meaningful-documentation The comment states the containment rule, the meaning of theta and phi, the row convention, what is kept and the claim rule, the units and the degenerate triangle behaviour.
 * @evidence contracts/modeling.md#spatial-conventions The function names three frames and one conversion: metre positions in the basis frame, UV in the unit square scaled to pixels with rows growing with v, and polar angles in radians about the disc axis with azimuth from its reference direction; the mapping between them is the barycentric step it owns.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function rasterizes texels and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits texel indices and no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; the edge blend at the limbus belongs to the texel colour rule.
 * @evidence contracts/modeling.md#rendered-observation The texels it selects were seen painted on the connected globe through the resident viewer on a real GPU (ANGLE AMD Radeon 780M): 2048 px beauty front eye-band crops of one subject shape in blue, pale-grey, near-black and brown pigment, and its left three-quarter. The iris is a closed circle with no gap, wedge or texture seam at the limbus and the pupil is concentric in every case, and the oblique view foreshortens it as an ellipse in the globe's own plane. Not taken: profile at iris scale and a document whose identity morph deforms the globe, where the painted size follows the globe as the pigment rule's JSDoc states.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value; the disc and margin are its caller's.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines and converts no input a caller shapes a face through.
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
