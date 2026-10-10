import type { IHumanPhysicalSampleRegistration } from "../../common/structures/IHumanPhysicalSampleRegistration";

/**
 * One evaluation's arrays for the projector `createHumanBodySurfaceRegionParts`
 * returns.
 *
 * Positions, normals, colours and relief weights are the shaped connected
 * surface's per-vertex arrays; the skin material selects which regions take
 * colours and relief. Supplied physical samples use the same corner table;
 * absent registration preserves legacy output.
 *
 * @author Samchon
 */
export interface IHumanBodySurfaceRegionInput {
  /** Shaped connected-surface positions, XYZ metres per vertex. */
  positions: number[];

  /** Connected-surface normals, XYZ per vertex. */
  normals: number[];

  /** Material ID of the skin regions that take colours and relief. */
  skinMaterial: string;

  /** Linear RGB per vertex for the skin regions, or null for none. */
  colors: number[] | null;

  /** Relief weight per vertex for the skin regions, or null for none. */
  reliefWeights: number[] | null;

  /** Optional instance-bound physical sample registration of the surface. */
  physical?: IHumanPhysicalSampleRegistration;
}
