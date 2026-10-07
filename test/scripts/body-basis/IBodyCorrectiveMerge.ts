import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

/**
 * What a corrective merge did, for the receipt.
 *
 * @author Samchon
 */
export interface IBodyCorrectiveMerge {
  /** The basis after the merge. */
  basis: IAutoMovieHumanBodyBasis;

  /** Corrective IDs removed. */
  dropped: string[];

  /** Corrective IDs appended from the shard. */
  added: string[];

  /** Corrective IDs created as exact mirrors of sided correctives. */
  mirrored: string[];

  /** Corrective IDs whose rows were made bilaterally symmetric. */
  symmetrized: string[];
}
