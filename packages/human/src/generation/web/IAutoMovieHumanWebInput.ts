import type { AutoMovieHumanLoftMesh } from "../../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";

/**
 * What a web needs from the surface being built: the skin buffers, the
 * parent's ring and its children's shares of it.
 */
export interface IAutoMovieHumanWebInput {
  /** Skin buffers. */
  mesh: AutoMovieHumanLoftMesh.IContext;

  /** Loft coordinates of every vertex, grown with each new vertex. */
  coordinates: number[];

  /** Chain by name. */
  chain: (name: string) => IAutoMovieHumanLoftChain;

  /** Calibration index of a chain. */
  index: (name: string) => number;

  /** Parent chain. */
  parent: IAutoMovieHumanLoftChain;

  /** Whether the children lie below the parent's bottom ring. */
  down: boolean;

  /** Parent phase of each vertex of its ring. */
  phase: Map<number, number>;

  /** Every child's share. */
  shares: IAutoMovieHumanWebInput.IShare[];
}

export namespace IAutoMovieHumanWebInput {
  /** One child's share of the parent's ring. */
  export interface IShare {
    /** Child chain name. */
    name: string;

    /** Its arcs as parent ring vertices, inclusive, in ring order. */
    arcs: number[][];
  }
}
