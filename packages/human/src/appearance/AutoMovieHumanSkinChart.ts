import { AutoMovieHumanSkinChartAxis } from "./AutoMovieHumanSkinChartAxis";
import { AutoMovieHumanSkinChartFlatten } from "./AutoMovieHumanSkinChartFlatten";
import { AutoMovieHumanSkinChartPack } from "./AutoMovieHumanSkinChartPack";
import type { IAutoMovieHumanSkinChartAxis } from "./IAutoMovieHumanSkinChartAxis";
import type { IAutoMovieHumanSkinChartGrid } from "./IAutoMovieHumanSkinChartGrid";

type IAxis = IAutoMovieHumanSkinChartAxis;
type IGrid = IAutoMovieHumanSkinChartGrid;
const { chainAxis, chainOf, chartOf, verticalAxis }: typeof AutoMovieHumanSkinChartAxis = AutoMovieHumanSkinChartAxis;
const { flatten, unroll }: typeof AutoMovieHumanSkinChartFlatten = AutoMovieHumanSkinChartFlatten;
const { pack }: typeof AutoMovieHumanSkinChartPack = AutoMovieHumanSkinChartPack;

/**
 * Texture coordinates of the generated skin in rest-surface millimetres,
 * computed from the final skin pieces whatever vertices they contain.
 *
 * The coordinates serve tiled micro-detail images, so they need to be
 * locally close to an isometry (one millimetre of skin, one millimetre of
 * texture, in every direction) and continuous over large areas; they are
 * not an atlas and no two regions need distinct coordinates. Each chart is
 * a cylinder about a central axis:
 *
 * - The head family (`head`, `head.*`) and the neck and trunk (`upper`,
 *   `trunk`) are lofted from horizontal sections, so each forms one chart
 *   about a vertical axis through the centroids of 2 mm height bins. The
 *   face and the torso therefore carry no seam between their chains.
 * - Every other chain is its own chart about the polyline through its band
 *   centroids, `human.skin.<chain>/<k>` in order of `k`; a chain of one band
 *   or with nearly coincident centroids uses the direction its normals are
 *   most nearly perpendicular to.
 *
 * The chart's surface is sampled as a radius over a polar grid whose
 * stations are one mean edge length apart (1.5 to 6 mm) and whose sectors
 * span about as much arc (32 to 256 per turn), and the grid is flattened
 * by least squares: every grid edge asks for the differences its
 * 3D vector has in the local frame of the section direction and the
 * in-surface direction perpendicular to it, and successive over-relaxation
 * from the unrolled cylinder finds the coordinates that best meet all of
 * them. The flanks of the nose, the underside of the chin and the zipper
 * bands next to branch rings thus keep their true size instead of the
 * projected one, and shear does not accumulate around a section. A vertex
 * takes the bilinear grid coordinates at its angle and station plus its
 * radial offset from the sampled surface resolved in the same frame, so
 * vertices off the sampled sheet (eyelid tucks, rings perpendicular to the
 * axis) are spread rather than collapsed.
 *
 * The cut is at the back, opposite the reference (`+X` projected off the
 * axis, or `+Y` for an axis that runs forward): down the back of the head
 * and the spine, behind each limb, on top of each toe. The grid continues
 * a sixteenth of a turn past the cut, and triangles crossing it take
 * duplicated vertices evaluated there, so the coordinates stay continuous
 * inside every triangle. Chart boundaries at chain junctions (shoulder, hip, wrist,
 * ankle, finger and toe roots, ears) are discontinuities of the
 * coordinates only, not of position or normal.
 *
 * Remaining distortion: the least-squares solution spreads the surface's
 * intrinsic curvature as mild scale and shear, largest at poles (crown,
 * fingertips) where sections shrink to a point; a surface that folds back
 * over itself along a ray from the axis has one sampled radius and relies
 * on the radial offset alone.
 */
export namespace AutoMovieHumanSkinChart {
  /** One skin piece in millimetres, as split from the whole skin. */
  export interface IPiece {
    /** Part name without the `human.skin.` prefix: `<chain>/<k>`. */
    name: string;

    /** Flat vertex positions in mm. */
    positions: number[];

    /** Flat unit vertex normals. */
    normals: number[];

    /** Flat triangle indices. */
    indices: number[];
  }

  /** A piece with texture coordinates and its cut vertices duplicated. */
  export interface IOutput extends IPiece {
    /** Flat `[u, v, ...]` in rest-surface mm, one pair per vertex. */
    uvs: number[];
  }

  /**
   * Chart every piece.
   *
   * @param pieces Skin pieces of the whole body, in mm
   * @returns The pieces in the same order, with coordinates
   */
  export function generate(pieces: readonly IPiece[]): IOutput[] {
    const groups: Map<string, number[]> = new Map();
    pieces.forEach((piece: IPiece, index: number): void => {
      const key: string = chartOf(chainOf(piece.name));
      const list: number[] | undefined = groups.get(key);
      if (list === undefined) groups.set(key, [index]);
      else list.push(index);
    });

    const out: IOutput[] = new Array(pieces.length);
    for (const [key, members] of groups) {
      const chosen: IPiece[] = members.map((i: number): IPiece => pieces[i]!);
      const axis: IAxis =
        key === "head" || key === "trunk"
          ? verticalAxis(chosen)
          : chainAxis(chosen);
      const grid: IGrid = flatten(axis, chosen);
      members.forEach((i: number, m: number): void => {
        out[i] = unroll(axis, grid, chosen[m]!);
      });
    }
    pack(
      [...groups.values()].map((members: number[]): IOutput[] =>
        members.map((i: number): IOutput => out[i]!),
      ),
    );
    return out;
  }
}
