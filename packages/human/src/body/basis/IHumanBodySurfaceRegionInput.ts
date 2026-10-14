import type { IHumanPhysicalSampleRegistration } from "../../common/structures/IHumanPhysicalSampleRegistration";

/**
 * One evaluation's arrays for the projector `createHumanBodySurfaceRegionParts` returns.
 *
 * Positions, normals, colours and relief weights are the shaped connected surface's per-vertex arrays; the skin material selects which regions take colours and relief. Supplied physical samples use the same corner table; absent registration preserves legacy output.
 *
 * @evidence contracts/common.md#principled-implementation Positions, normals, optional colors/relief and physical registration describe one shaped connected surface's shared vertex/corner population.
 * @evidence contracts/common.md#clear-and-simple-design One projector input keeps per-vertex fields together and restricts colors/relief to the declared skin material.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional physical samples must share the corner table; absent registration preserves legacy output rather than inventing physical provenance.
 * @evidence contracts/common.md#meaningful-documentation Members give meter XYZ, linear RGB, per-vertex relief and null/omitted field meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Region input typing performs no corner duplication, normal calculation or material partitioning.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared field correspondence carries one evaluation without caching projected parts across sources.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Per-vertex input arrays acquire no projector-owned output buffer or material resource.
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
