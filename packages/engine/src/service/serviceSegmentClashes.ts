import {
  IAutoMoviePropBox,
  IAutoMovieServiceNetwork,
  IAutoMovieServiceNode,
  IAutoMovieServiceSegment,
} from "@automovie/interface";

import { propBoundsOverlap } from "../film/propBoundsOverlap";
import { IAutoMovieServiceClash } from "./IAutoMovieServiceClash";
import { portOwners } from "./portOwners";
import { serviceSegmentSpanBounds } from "./serviceSegmentSpanBounds";

/**
 * Every pair of runs whose occupied volumes overlap.
 *
 * Two runs that share any endpoint node are exempt as a whole pair: the query
 * does not restrict that exemption to a neighbourhood of the fitting, so a
 * second overlap farther along those same runs is currently unreported. Every
 * other pair is a clash
 * whether or not the two belong to the same discipline, because a duct and a
 * cable tray cannot share a cubic metre any more than two ducts can.
 *
 * @evidence contracts/common.md#principled-implementation Pairwise overlap of radius-padded leg AABBs is a conservative interference screen, with a declared whole-pair shared-endpoint exemption whose distant-overlap limitation remains visible.
 * @evidence contracts/common.md#clear-and-simple-design Network validation delegates span construction and box overlap here while portOwners resolves endpoint nodes for the exemption.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Short routes are left to shape validation and no discipline changes overlap arithmetic; shared-node exemption is explicit rather than claimed spatially local.
 * @evidence contracts/common.md#meaningful-documentation States declaration-order pairs, swept-box approximation and the whole-pair exemption that can omit a second shared-node collision.
 * @evidence contracts/performance.md#efficient-algorithms Span tables are built once for O(R) route storage; for S runs and their leg counts, worst-case pair comparisons sum all cross-run leg products, quadratic in total spans.
 * @evidence contracts/performance.md#reuse-equivalent-work Every run's span boxes and endpoint-node set are computed once and reused across its candidate pairs within this network query.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary port, endpoint and span tables are released after scanning; only the caller-owned clash-id rows escape.
 */
export const serviceSegmentClashes: (
  network: IAutoMovieServiceNetwork,
) => IAutoMovieServiceClash[] = (
  network: IAutoMovieServiceNetwork,
): IAutoMovieServiceClash[] => {
  const owner: Map<string, IAutoMovieServiceNode> = portOwners(network);
  const measurable: IAutoMovieServiceSegment[] = network.segments.filter(
    (segment: IAutoMovieServiceSegment): boolean => segment.route.length > 1,
  );
  const spans: IAutoMoviePropBox[][] = measurable.map(
    (segment: IAutoMovieServiceSegment): IAutoMoviePropBox[] =>
      serviceSegmentSpanBounds(segment),
  );
  const touched: Set<string>[] = measurable.map(
    (segment: IAutoMovieServiceSegment): Set<string> =>
      new Set(
        [owner.get(segment.from), owner.get(segment.to)]
          .filter(
            (
              node: IAutoMovieServiceNode | undefined,
            ): node is IAutoMovieServiceNode => node !== undefined,
          )
          .map((node: IAutoMovieServiceNode): string => node.id),
      ),
  );
  const clashes: IAutoMovieServiceClash[] = [];
  for (let left: number = 0; left < measurable.length; ++left)
    for (let right: number = left + 1; right < measurable.length; ++right) {
      if (
        [...touched[left]!].some((id: string): boolean =>
          touched[right]!.has(id),
        )
      )
        continue;
      const hit: boolean = spans[left]!.some(
        (one: IAutoMoviePropBox): boolean =>
          spans[right]!.some((other: IAutoMoviePropBox): boolean =>
            propBoundsOverlap(one, other),
          ),
      );
      if (hit)
        clashes.push({
          left: measurable[left]!.id,
          right: measurable[right]!.id,
        });
    }
  return clashes;
};
