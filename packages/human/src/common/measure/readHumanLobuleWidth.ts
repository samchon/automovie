import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { humanHeadRegionVertices } from "./humanHeadRegionVertices";

/**
 * Read a lobule's width, in metres: "Lobular width (h-i)", with h the
 * intertragic notch and i the "most posterior point from point h, measured
 * vertically to the e-f line", e-f being superaurale to subaurale (Cho et al.,
 * J Korean Med Sci 2025, PMC12148551, Fig. 1). Their six-hospital study read
 * facial 3D-CT reconstructions of 631 Korean adults aged 20–92; population
 * averages are not substituted here. The reading is the largest distance of
 * a vertex of the named lobule area from `notch` along the posterior
 * direction made perpendicular to the superaurale-subaurale line (a stated
 * convention for which perpendicular). A missing or misplaced area refuses by
 * name. Degenerate long-axis or posterior directions also refuse. The source
 * owns the lobule's segmentation and the notch convention, so a sparse
 * sample region supplies a source-conditioned projection, not a recovered
 * individual clinical landmark.
 */
export function readHumanLobuleWidth(
  head: IAutoMovieHumanHeadSkin,
  lobule: string,
  notch: IAutoMovieVector3,
  superaurale: IAutoMovieVector3,
  subaurale: IAutoMovieVector3,
): number {
  const line = [
    superaurale.x - subaurale.x,
    superaurale.y - subaurale.y,
    superaurale.z - subaurale.z,
  ];
  const l = Math.hypot(...line);
  if (!Number.isFinite(l) || l === 0)
    throw new Error(
      `The auricle long axis of ${head.id} has no finite direction.`,
    );
  const u = line.map((c) => c / l);
  const d0 = [u[2] * u[0], u[2] * u[1], u[2] * u[2] - 1];
  const m = Math.hypot(...d0);
  if (!Number.isFinite(m) || m === 0)
    throw new Error(
      `The auricle long axis of ${head.id} has no perpendicular posterior direction.`,
    );
  const d = d0.map((c) => c / m);
  const p = head.positions;
  let width = 0;
  for (const v of humanHeadRegionVertices(head, [lobule]))
    width = Math.max(
      width,
      (p[v * 3] - notch.x) * d[0] +
        (p[v * 3 + 1] - notch.y) * d[1] +
        (p[v * 3 + 2] - notch.z) * d[2],
    );
  return width;
}
