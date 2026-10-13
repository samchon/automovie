import { AutoMovieSemanticKind } from "./AutoMovieSemanticKind";
import { IAutoMovieSemanticMaskSlot } from "./IAutoMovieSemanticMaskSlot";

/** One addressable entity and the flat colour the mask pass paints it. */
export interface IAutoMovieSemanticMaskEntry {
  /**
   * Stable semantic id, of the form `<kind>:<path>`.
   *
   * Examples: `building:tower/unit-a`, `space:tower/level-2`,
   * `opening:tower/door-12`, `node:hero-actor`, `instance-slot:windows#417`.
   */
  id: string;

  /** Computational classification. */
  kind: AutoMovieSemanticKind;

  /**
   * The open architectural word the design used (`storey`, `room`, `door`), or
   * `null` for a kind that carries none.
   */
  label: string | null;

  /** Exact opaque `#RRGGBB` colour, uppercase hexadecimal. */
  color: string;

  /** Semantic id of the owning entity, or `null` for a root. */
  owner: string | null;

  /**
   * Scene node ids that draw this entity, ascending.
   *
   * This is the join between the semantic graph and the built scene: the viewer
   * resolves a mesh to its top-level node and finds its colour here, so the
   * mask pass needs no knowledge of architecture.
   */
  nodes: string[];

  /**
   * Owning instance set and zero-based slot, or `null` for every other kind.
   */
  slot: IAutoMovieSemanticMaskSlot | null;
}
