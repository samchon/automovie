import { AutoMovieServiceNodeKind } from "@automovie/interface";
/**
 * One serviceNetworkSchematic node projected into horizontal metre coordinates.
 *
 * @evidence contracts/common.md#principled-implementation World X and Z become schematic x and y while identity and computational kind preserve source-node meaning.
 * @evidence contracts/common.md#clear-and-simple-design Four primitive fields carry the drawable node without duplicating ports, maintenance bounds or service state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Projection drops height only for the stated plan view, without replacing the original three-dimensional node in validation.
 * @evidence contracts/common.md#meaningful-documentation Names the schematic producer and defines each planar axis in metres alongside source identity and kind.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Node records have no runtime algorithm; enumeration is costed on serviceNetworkSchematic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This projected row owns no cross-network lookup, request coordination or cached source conversion.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Primitive identity, kind and coordinates retain no source node, array or external resource after projection.
 * @author Samchon
 */
export interface IAutoMovieServiceSchematicNode {
  /** Stable node identity. */
  id: string;
  /** Computational family the node was declared with. */
  kind: AutoMovieServiceNodeKind;
  /** World `x` in metres. */
  x: number;
  /** World `z` in metres, the schematic's vertical axis. */
  y: number;
}
