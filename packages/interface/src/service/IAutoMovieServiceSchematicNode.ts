import type { AutoMovieServiceNodeKind } from "./AutoMovieServiceNodeKind";

/** One serviceNetworkSchematic node projected into horizontal metre coordinates. */
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
