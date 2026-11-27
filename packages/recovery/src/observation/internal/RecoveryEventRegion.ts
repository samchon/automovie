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

/*
 * Prepare private scalar-clipped source-cell ownership and boundary incidence
 * observations. Every query supplies all faces with max(height)>=before and
 * min(height)<=after, in original face order. The implicit cell is that face's
 * barycentric domain intersected with the closed scalar interval; no source
 * triangle array or generated mesh is returned. Source and returned private
 * addresses must be discarded before engine publication. Original source edges
 * share declared incidence; cut edges remain face occurrences, so coincident or
 * parallel cut edges are not welded. Raw and canonical incidence are explicit
 * alternatives, not assumed equivalent. Plane strata require one external owner
 * when adjacent slabs are combined. Connectivity/topology never establishes a
 * regular or event chart: every component remains unclassified, with all
 * unsupported evidence retained.
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
