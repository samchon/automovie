import type { IAutoMovieLoftChain } from "../../../construction/IAutoMovieLoftChain";
import type { IAutoMovieHumanLoftMesh } from "../../lofting/IAutoMovieHumanLoftMesh";

/**
 * What a web needs from the surface being built: the skin buffers, the
 * parent's ring and its children's shares of it.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation What a web needs from the surface being built: the skin buffers, the parent's ring and its children's shares of it.
 * @evidence contracts/development/design.md#principled-representation `mesh`: Skin buffers. `coordinates`: Loft coordinates of every vertex, grown with each new vertex. `chain`: Chain by name.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanWebColumns.of, AutoMovieHumanWebCrest.of, AutoMovieHumanWebMesh.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `mesh`, `coordinates`, `chain`, `index`, `parent`, `down`, `phase`, `shares`; callers supply the complete record.
 */
export interface IAutoMovieHumanWebInput {
  /** Skin buffers. */
  mesh: IAutoMovieHumanLoftMesh.IContext;

  /** Loft coordinates of every vertex, grown with each new vertex. */
  coordinates: number[];

  /**
   * Chain by name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Chain by name.
   */
  chain: (name: string) => IAutoMovieLoftChain;

  /**
   * Calibration index of a chain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Calibration index of a chain.
   */
  index: (name: string) => number;

  /** Parent chain. */
  parent: IAutoMovieLoftChain;

  /** Whether the children lie below the parent's bottom ring. */
  down: boolean;

  /** Parent phase of each vertex of its ring. */
  phase: Map<number, number>;

  /** Every child's share. */
  shares: IAutoMovieHumanWebInput.IShare[];
}

/** Type contracts exchanged by IAutoMovieHumanWebInput; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanWebInput {
  /** One child's share of the parent's ring.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One child's share of the parent's ring.
   * @evidence contracts/development/design.md#principled-representation `name`: Child chain name. `arcs`: Its arcs as parent ring vertices, inclusive, in ring order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanWebInput.IShare is the canonical exchange used by AutoMovieHumanWebColumns.children.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `arcs`; callers supply the complete record.
   */
  export interface IShare {
    /** Child chain name. */
    name: string;

    /** Its arcs as parent ring vertices, inclusive, in ring order. */
    arcs: number[][];
  }
}
