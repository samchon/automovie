import {
  IAutoMoviePropBox,
  type IAutoMovieServiceClash,
  IAutoMovieServiceNetwork,
  IAutoMovieServiceNode,
  IAutoMovieServiceSegment,
} from "@automovie/interface";

import { propBoundsOverlap } from "../../film/internal/propBoundsOverlap";
import { portOwners } from "./portOwners";
import { serviceSegmentSpanBounds } from "./serviceSegmentSpanBounds";

/**
 * Every pair of runs whose occupied volumes overlap.
 *
 * Two runs that share any endpoint node are exempt as a whole pair: the query
 * does not restrict that exemption to a neighbourhood of the fitting, so a
 * second overlap farther along those same runs is currently unreported. Every
 * other pair is a clash whether or not the two belong to the same discipline,
 * because a duct and a cable tray cannot share a cubic metre any more than two
 * ducts can.
 */
export function serviceSegmentClashes(
  network: IAutoMovieServiceNetwork,
): IAutoMovieServiceClash[] {
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
          .flatMap(
            (
              node: IAutoMovieServiceNode | undefined,
            ): IAutoMovieServiceNode[] => (node === undefined ? [] : [node]),
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
}
