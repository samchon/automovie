import type { AutoMovieSemanticKind } from "./AutoMovieSemanticKind";
import type { IAutoMovieSemanticMaskSlot } from "./IAutoMovieSemanticMaskSlot";

/**
 * One stable semantic entity and its exact mask color, drawable join and
 * hierarchy owner.
 */
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
   * This joins the semantic graph to the built scene: staged roots match
   * initial design-node order and other roots match names, then each mesh
   * inherits its nearest claimed ancestor's colour. The mask pass needs no
   * architectural geometry rules.
   */
  nodes: string[];

  /** Owning instance set and zero-based slot, or `null` for every other kind. */
  slot: IAutoMovieSemanticMaskSlot | null;
}
