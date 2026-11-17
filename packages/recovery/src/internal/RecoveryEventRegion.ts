import type {
  IAutoMovieRecoveryEventRegion,
  IAutoMovieRecoveryEventRegionCells,
  IAutoMovieRecoveryEventRegionSource,
  IAutoMovieRecoveryEventRegionTopology,
} from "@automovie/interface";

import { RecoveryEventRegionCells } from "./RecoveryEventRegionCells";
import { RecoveryEventRegionPorts } from "./RecoveryEventRegionPorts";
import { RecoveryEventRegionSource } from "./RecoveryEventRegionSource";
import { RecoveryEventRegionTopology } from "./RecoveryEventRegionTopology";

/**
 * Prepare private scalar-clipped source-cell ownership and boundary incidence observations.
 * Every query supplies all faces with max(height)>=before and min(height)<=after, in
 * original face order. The implicit cell is that face's barycentric domain intersected
 * with the closed scalar interval; no source triangle array or generated mesh is returned.
 * Source and returned private addresses must be discarded before engine publication.
 * Original source edges share declared incidence; cut edges remain face occurrences,
 * so coincident or parallel cut edges are not welded. Raw and canonical incidence are
 * explicit alternatives, not assumed equivalent. Plane strata require one external owner
 * when adjacent slabs are combined. Connectivity/topology never establishes a regular or
 * event chart: every component remains unclassified, with all unsupported evidence retained.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Symbolic scalar clipping retains reference cells and dimensions, declared source-edge incidence, halfedge occurrences and multigraph links. Parity constraints distinguish orientability from consistency of supplied face directions; boundary walks close only through actual edge identities. Exact dyadic source determinants establish triangle rank without moving positions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One immutable preparation owns source admission and rank; query-local cells own components, boundary cycles, typed issues and port memberships. This private observer supplies no fitted geometry or chart-classification shortcut.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No positional weld, tolerance, source repair, artificial cap, largest-component selection, source normal or consumer triangle transfer is used. Coincident sheet occurrences, lower-dimensional contacts and flat faces survive with explicit plane-stratum ownership.
 * @evidence contracts/development/common.md#meaningful-documentation States inclusive candidate completeness, immutable lifetime, private address boundary, explicit alias policy, symbolic clipping, source rank, plane ownership and unclassified topology. Ports require actual segment support; broad endpoint stars cannot silently prove their ownership.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation uses O(V+T) fixed-width binary64 integer operations and storage. For A candidate faces, clipping emits at most five corners per triangle; components, parity, multigraph links and boundary walks cost expected O(A alpha(A)) plus deterministic sorting and port support traversal. BigInt operands have a fixed bound from binary64 encoding. Candidate completeness is not checked by an additional full-source scan.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Source addresses, exact alias equality, triangle rank and duplicate occurrence detection are prepared once. Query roots, edge occurrences and vertex links are reused for topology, contacts and port ownership without recomputing geometry.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Preparation retains immutable source references and per-face metadata until its caller releases the closure. Temporary integer coordinates are cleared after rank admission. Query maps expire on return; the caller owns private cell and incidence records and must not publish them as engine geometry.
 */
export function RecoveryEventRegion(
  source: Parameters<IAutoMovieRecoveryEventRegion.Operation>[0],
): ReturnType<IAutoMovieRecoveryEventRegion.Operation> {
  const prepared: ReturnType<IAutoMovieRecoveryEventRegionSource.Operation> =
    RecoveryEventRegionSource(source);
  return (
    query: IAutoMovieRecoveryEventRegion.Query,
  ): IAutoMovieRecoveryEventRegion.Result => {
    const work: ReturnType<IAutoMovieRecoveryEventRegionCells.Operation> =
      RecoveryEventRegionCells(source, prepared, query);
    const topology: ReturnType<IAutoMovieRecoveryEventRegionTopology.Operation> =
      RecoveryEventRegionTopology(source, prepared, work);
    return RecoveryEventRegionPorts(source, prepared, work, topology, query);
  };
}
