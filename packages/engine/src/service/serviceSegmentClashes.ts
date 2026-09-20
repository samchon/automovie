import { IAutoMovieServiceNetwork, IAutoMovieServiceNode } from "@automovie/interface";
import { propBoundsOverlap } from "../film/propBoundsOverlap";
import { IAutoMovieServiceClash } from "./IAutoMovieServiceClash";
import { portOwners } from "./portOwners";
import { serviceSegmentSpanBounds } from "./serviceSegmentSpanBounds";

/**
 * Every pair of runs whose occupied volumes overlap.
 *
 * Two runs that meet at a node are exempt, and only there: a tee and its branch
 * share a fitting by construction, so reporting them would bury the pair that
 * matters under the pairs that always happen. Everything else is a clash
 * whether or not the two belong to the same discipline, because a duct and a
 * cable tray cannot share a cubic metre any more than two ducts can.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `serviceSegmentClashes` names every pair of routed runs whose occupied volumes interfere outside a shared fitting.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `serviceSegmentClashes` compares radius-expanded span boxes, exempts segments sharing an endpoint node, and preserves pair declaration order.
 * @author Samchon
 */
export const serviceSegmentClashes = (
  network: IAutoMovieServiceNetwork,
): IAutoMovieServiceClash[] => {
  const owner = portOwners(network);
  const measurable = network.segments.filter(
    (segment) => segment.route.length > 1,
  );
  const spans = measurable.map((segment) => serviceSegmentSpanBounds(segment));
  const touched = measurable.map(
    (segment) =>
      new Set(
        [owner.get(segment.from), owner.get(segment.to)]
          .filter((node): node is IAutoMovieServiceNode => node !== undefined)
          .map((node) => node.id),
      ),
  );
  const clashes: IAutoMovieServiceClash[] = [];
  for (let left = 0; left < measurable.length; ++left)
    for (let right = left + 1; right < measurable.length; ++right) {
      if ([...touched[left]!].some((id) => touched[right]!.has(id))) continue;
      const hit = spans[left]!.some((one) =>
        spans[right]!.some((other) => propBoundsOverlap(one, other)),
      );
      if (hit)
        clashes.push({
          left: measurable[left]!.id,
          right: measurable[right]!.id,
        });
    }
  return clashes;
};
