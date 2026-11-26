import {
  IAutoMoviePropBox,
  IAutoMovieServiceNetwork,
  IAutoMovieServiceNode,
  IAutoMovieServicePort,
  IAutoMovieServiceSegment,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { propBoundsOverlap } from "../../film/propBoundsOverlap";
import { serviceMaintenanceBounds } from "./serviceMaintenanceBounds";
import { serviceSegmentClashes } from "./serviceSegmentClashes";
import { serviceSegmentSpanBounds } from "./serviceSegmentSpanBounds";

/**
 * Append conservative run clashes and unrelated-run access obstructions in
 * their original diagnostic order.
 */
export function appendServiceNetworkInterference(
  network: IAutoMovieServiceNetwork,
  root: string,
  out: IAutoMovieViolationCollector,
): void {
  const segmentIndex: Map<string, number> = new Map(
    network.segments.map(
      (segment: IAutoMovieServiceSegment, index: number): [string, number] => [
        segment.id,
        index,
      ],
    ),
  );
  for (const clash of serviceSegmentClashes(network))
    out.push(
      "physics",
      `${root}.segments[${segmentIndex.get(clash.left)!}].route`,
      `run "${clash.left}" occupies the same volume as run "${clash.right}"`,
      clash.right,
    );

  network.nodes.forEach((node: IAutoMovieServiceNode, index: number): void => {
    const envelope: IAutoMoviePropBox | null = serviceMaintenanceBounds(node);
    if (envelope === null) return;
    const own: Set<string> = new Set(
      node.ports.map((port: IAutoMovieServicePort): string => port.id),
    );
    for (const segment of network.segments) {
      if (own.has(segment.from) || own.has(segment.to)) continue;
      const spans: IAutoMoviePropBox[] = serviceSegmentSpanBounds(segment);
      if (
        !spans.some((span: IAutoMoviePropBox): boolean =>
          propBoundsOverlap(envelope, span),
        )
      )
        continue;
      out.push(
        "physics",
        `${root}.nodes[${index}].maintenance`,
        `run "${segment.id}" obstructs the maintenance envelope of service node "${node.id}"`,
        segment.id,
      );
    }
  });
}
