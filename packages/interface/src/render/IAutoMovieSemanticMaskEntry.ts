import { AutoMovieSemanticKind } from "./AutoMovieSemanticKind";
import { IAutoMovieSemanticMaskSlot } from "./IAutoMovieSemanticMaskSlot";

/**
 * One stable semantic entity and its exact mask color, drawable join and hierarchy owner.
 *
 * @evidence contracts/common.md#principled-implementation Kind-qualified id and deterministic RGB24 color map one palette entity to sorted drawable nodes or a compact slot, with owner links preserving logical building, space, boundary and opening hierarchy.
 * @evidence contracts/common.md#clear-and-simple-design Open domain label stays separate from computational kind while drawable nodes and optional slot connect the semantic graph to actual viewer objects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Logical parents need not paint pixels themselves; one drawable resolves to its most specific entry and ascends owner links rather than collapsing a whole building into one color.
 * @evidence contracts/common.md#meaningful-documentation Defines stable qualified id, kind and open label, exact uppercase color, nullable owner and node-versus-slot addressing.
 * @author Samchon
 */
export interface IAutoMovieSemanticMaskEntry {
  /**
   * Stable semantic id, of the form `<kind>:<path>`.
   *
   * Examples: `building:tower/unit-a`, `space:tower/level-2`, `opening:tower/door-12`, `node:hero-actor`, `instance-slot:windows#417`.
   */
  id: string;

  /** Computational classification. */
  kind: AutoMovieSemanticKind;

  /**
   * The open architectural word the design used (`storey`, `room`, `door`), or `null` for a kind that carries none.
   */
  label: string | null;

  /** Exact opaque `#RRGGBB` colour, uppercase hexadecimal. */
  color: string;

  /** Semantic id of the owning entity, or `null` for a root. */
  owner: string | null;

  /**
   * Scene node ids that draw this entity, ascending.
   *
   * This is the join between the semantic graph and the built scene: the viewer resolves a mesh to its top-level node and finds its colour here, so the mask pass needs no knowledge of architecture.
   */
  nodes: string[];

  /**
   * Owning instance set and zero-based slot, or `null` for every other kind.
   */
  slot: IAutoMovieSemanticMaskSlot | null;
}
