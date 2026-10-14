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
 *
 * @evidence contracts/common.md#principled-implementation The auricle long axis and its perpendicular posterior direction project admitted lobule samples relative to the notch; the maximum nonnegative projection gives width. Sparse registration supplies a source-conditioned convention rather than a recovered clinical boundary.
 * @evidence contracts/common.md#clear-and-simple-design Shared region admission owns resident samples and this instrument owns the axis/projection convention and scalar maximum.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Population averages never replace the projection, and degenerate directions refuse instead of producing NaN or an expected lobular width.
 * @evidence contracts/common.md#meaningful-documentation The prose gives metre units, notch/axis roles, posterior convention, source-registration limits and degenerate-direction failures.
 * @evidence contracts/performance.md#efficient-algorithms For R lobule memberships, admission and one projection scan cost O(R) time/list space, with fixed-size frame arrays and one bound.
 * @evidence contracts/performance.md#reuse-equivalent-work Long-axis and posterior unit directions are computed once for all members, reusing the canonical region reader without cross-shape memoization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Frame arrays and gathered vertices are local; only a metre scalar transfers, and no input mesh, native handle or task is retained.
 */
export function readHumanLobuleWidth(
  head: IAutoMovieHumanHeadSkin,
  lobule: string,
  notch: IAutoMovieVector3,
  superaurale: IAutoMovieVector3,
  subaurale: IAutoMovieVector3,
): number {
  const line: number[] = [
    superaurale.x - subaurale.x,
    superaurale.y - subaurale.y,
    superaurale.z - subaurale.z,
  ];
  const l: number = Math.hypot(...line);
  if (!Number.isFinite(l) || l === 0)
    throw new Error(
      `The auricle long axis of ${head.id} has no finite direction.`,
    );
  const u: number[] = line.map((c: number): number => c / l);
  const d0: number[] = [u[2] * u[0], u[2] * u[1], u[2] * u[2] - 1];
  const m: number = Math.hypot(...d0);
  if (!Number.isFinite(m) || m === 0)
    throw new Error(
      `The auricle long axis of ${head.id} has no perpendicular posterior direction.`,
    );
  const d: number[] = d0.map((c: number): number => c / m);
  const p: number[] = head.positions;
  let width: number = 0;
  for (const v of humanHeadRegionVertices(head, [lobule]))
    width = Math.max(
      width,
      (p[v * 3] - notch.x) * d[0] +
        (p[v * 3 + 1] - notch.y) * d[1] +
        (p[v * 3 + 2] - notch.z) * d[2],
    );
  return width;
}
