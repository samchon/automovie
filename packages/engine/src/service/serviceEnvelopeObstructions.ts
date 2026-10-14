import {
  IAutoMoviePropBox,
  IAutoMovieServiceNetwork,
  IAutoMovieServiceNode,
} from "@automovie/interface";

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
 * World metre boxes are expected to be admitted. This query currently has no
 * product caller and is exercised only by service geometry tests.
 *
 * @evidence contracts/common.md#principled-implementation Positive-volume AABB overlap against each translated maintenance envelope identifies obstructed access, leaving exact face contact outside the overlap predicate.
 * @evidence contracts/common.md#clear-and-simple-design Maintenance translation and overlap have shared owners; this convenience query combines them but has no current production obstruction consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nodes with absent envelopes remain absent rather than receiving equipment-name clearance defaults, and all supplied world boxes use the same predicate.
 * @evidence contracts/common.md#meaningful-documentation Describes world metres, strict interior overlap, missing envelopes, declaration order and the missing product caller.
 * @evidence contracts/performance.md#efficient-algorithms N nodes receive one constant-size envelope and overlap check, O(N) time and up to N output ids.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each obstruction box asks a different access query and no mutable node-placement cache is stored here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Filtered node aliases and temporary bounds are released on return; only a fresh id array belongs to the caller.
 *
 * @author Samchon
 */
export const serviceEnvelopeObstructions: (props: {
  network: IAutoMovieServiceNetwork;
  bounds: IAutoMoviePropBox;
}) => string[] = (props: {
  network: IAutoMovieServiceNetwork;
  bounds: IAutoMoviePropBox;
}): string[] =>
  props.network.nodes
    .filter((node: IAutoMovieServiceNode): boolean => {
      const envelope: IAutoMoviePropBox | null = serviceMaintenanceBounds(node);
      return envelope !== null && propBoundsOverlap(props.bounds, envelope);
    })
    .map((node: IAutoMovieServiceNode): string => node.id);
