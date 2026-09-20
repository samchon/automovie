import { IAutoMoviePropBox, IAutoMovieServiceNetwork } from "@automovie/interface";
import { propBoundsOverlap } from "../film/propBoundsOverlap";
import { serviceMaintenanceBounds } from "./serviceMaintenanceBounds";

/**
 * Which nodes' maintenance envelopes a world volume intrudes on.
 *
 * This is the seam a prop, a piece of furniture or a second discipline is
 * compared through: hand it any axis-aligned world box — a staged prop's
 * occupancy bound, for instance — and it names the equipment that could no
 * longer be serviced. Contact alone is not intrusion, so a cabinet standing
 * exactly on the edge of an access zone is left alone.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `serviceEnvelopeObstructions` identifies equipment whose required maintenance access is intruded on by a prop or another routed object.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `serviceEnvelopeObstructions` intersects one world occupancy box with every non-null node maintenance envelope and returns the obstructed node ids.
 * @evidence requirements/interior/construction-maintenance-and-safety.md#interior-maintenance-access `serviceEnvelopeObstructions` returns the exact stable node identities whose declared maintenance access volume is blocked by the supplied occupancy box.
 * @evidence specifications/interior-space/construction-phases-and-alternatives.md#interior-space-installation-maintenance-safety The obstruction query measures whether the declared installation and maintenance envelope remains accessible.
 * @author Samchon
 */
export const serviceEnvelopeObstructions = (props: {
  network: IAutoMovieServiceNetwork;
  bounds: IAutoMoviePropBox;
}): string[] =>
  props.network.nodes
    .filter((node) => {
      const envelope = serviceMaintenanceBounds(node);
      return envelope !== null && propBoundsOverlap(props.bounds, envelope);
    })
    .map((node) => node.id);
