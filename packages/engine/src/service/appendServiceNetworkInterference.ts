import { IAutoMovieServiceNetwork, IAutoMovieServiceSegment, IAutoMovieServiceNode, IAutoMoviePropBox, IAutoMovieServicePort } from "@automovie/interface";
import { ViolationCollector } from "../validation/ViolationCollector";
import { propBoundsOverlap } from "../film/propBoundsOverlap";
import { serviceMaintenanceBounds } from "./serviceMaintenanceBounds";
import { serviceSegmentClashes } from "./serviceSegmentClashes";
import { serviceSegmentSpanBounds } from "./serviceSegmentSpanBounds";
/** Append conservative run clashes and unrelated-run access obstructions in their original diagnostic order.
 *
 * @evidence contracts/common.md#principled-implementation Conservative span clashes and unrelated-run overlap with maintenance AABBs append separate physics findings; shared-node pairs and own-terminal runs follow the existing explicit exemptions.
 * @evidence contracts/common.md#clear-and-simple-design The gate delegates span bounds, run clash selection and envelope translation to their owning queries, combining only diagnostic paths and ordering here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No discipline or equipment name suppresses interference; the whole-pair shared-node limitation remains inherited rather than presented as localized fitting contact.
 * @evidence contracts/common.md#meaningful-documentation Documents conservative geometry, both exemption rules and original clash-before-maintenance diagnostic order.
 * @evidence contracts/performance.md#efficient-algorithms Run clash cost follows cross-run leg products; each maintained node then scans unrelated runs and their spans, giving node-times-route-population worst-case work.
 * @evidence contracts/performance.md#reuse-equivalent-work A segment-id index serves every clash path, and each node's own-port set is reused over its unrelated-run scan.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The segment index, own-port sets and temporary boxes are call-local; only id-valued physics findings escape through the supplied collector.
 */
export function appendServiceNetworkInterference(network: IAutoMovieServiceNetwork, root: string, out: ViolationCollector): void {
  const segmentIndex: Map<string, number> = new Map(
    network.segments.map((segment: IAutoMovieServiceSegment, index: number): [string, number] => [segment.id, index]),
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
    const own: Set<string> = new Set(node.ports.map((port: IAutoMovieServicePort): string => port.id));
    for (const segment of network.segments) {
      if (own.has(segment.from) || own.has(segment.to)) continue;
      const spans: IAutoMoviePropBox[] = serviceSegmentSpanBounds(segment);
      if (!spans.some((span: IAutoMoviePropBox): boolean => propBoundsOverlap(envelope, span))) continue;
      out.push(
        "physics",
        `${root}.nodes[${index}].maintenance`,
        `run "${segment.id}" obstructs the maintenance envelope of service node "${node.id}"`,
        segment.id,
      );
    }
  });

}
