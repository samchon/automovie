import { AutoMovieServiceNodeKind } from "@automovie/interface";

/**
 * One serviceNetworkSchematic node projected into horizontal metre coordinates.
 *
 * @evidence contracts/development/design.md#principled-representation World X and Z become schematic x and y while identity and computational kind preserve source-node meaning.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four primitive fields carry the drawable node without duplicating ports, maintenance bounds or service state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Projection drops height only for the stated plan view, without replacing the original three-dimensional node in validation.
 * @evidence contracts/development/common.md#meaningful-documentation Names the schematic producer and defines each planar axis in metres alongside source identity and kind.
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
