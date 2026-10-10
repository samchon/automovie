import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import type { IAutoMovieHumanNostrilBasal } from "./IAutoMovieHumanNostrilBasal";
import { humanHeadRegionVertices } from "./humanHeadRegionVertices";

/**
 * Read one nostril's opening in a basal view: its area, long axis and short
 * axis. The nares are "two elliptical orifices" in the base of the nose whose
 * "margins" bound them (Gray's Anatomy 1918, p. 993); the parameters ask the
 * opening "area in mm2 from a calibrated nasal-base view" and each basal
 * nostril's "longer measured axis" and "shorter measured axis, projected
 * length" (Rosati et al. 2009, PubMed 19633635; Hwang and Kang 2003, PubMed
 * 12725444, read as abstracts only).
 *
 * The named margin area's vertices are projected onto the head frame's
 * horizontal plane (the basal view looks up along +Y, a stated convention
 * for the view the abstracts do not specify) and ordered by angle around
 * their centroid. The area is the enclosed polygon's, the long axis the
 * longest chord between margin points, the short axis the margin's extent
 * perpendicular to it. A missing or misplaced area refuses by name, and so
 * does a margin of fewer than three points or a projection without area.
 *
 * A skin region is an unordered vertex set, not a topological closed rim.
 * This instrument therefore reads its angularly ordered sample polygon,
 * assuming one star-shaped contour without interior samples. Sparse source
 * selections and missing angular sectors interpolate unobserved boundary;
 * the producer owns that qualification. The polygon is a reportable source
 * convention, not a clinically registered aperture area or an inverse target.
 */
export function readHumanNostrilBasal(
  head: IAutoMovieHumanHeadSkin,
  margin: string,
): IAutoMovieHumanNostrilBasal {
  const p = head.positions;
  const points = humanHeadRegionVertices(head, [margin]).map((v) => [
    p[v * 3],
    p[v * 3 + 2],
  ]);
  if (points.length < 3)
    throw new Error(
      `The nostril margin ${margin} of ${head.id} has fewer than three points.`,
    );
  const cx = points.reduce((s, q) => s + q[0], 0) / points.length;
  const cz = points.reduce((s, q) => s + q[1], 0) / points.length;
  points.sort(
    (a, b) =>
      Math.atan2(a[1] - cz, a[0] - cx) - Math.atan2(b[1] - cz, b[0] - cx),
  );
  let twice = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    twice += a[0] * b[1] - b[0] * a[1];
  }
  let longAxis = 0;
  let axis = [1, 0];
  for (const a of points)
    for (const b of points) {
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (d > longAxis) {
        longAxis = d;
        axis = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
      }
    }
  const across = points.map((q) => -q[0] * axis[1] + q[1] * axis[0]);
  const area = Math.abs(twice) / 2;
  const shortAxis = Math.max(...across) - Math.min(...across);
  if (area === 0 || longAxis === 0 || shortAxis === 0)
    throw new Error(
      `The nostril margin ${margin} of ${head.id} has no nondegenerate basal sample polygon.`,
    );
  return { area, longAxis, shortAxis };
}
