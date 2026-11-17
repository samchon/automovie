import type { IAutoMovieLoftChain } from "../../../construction/IAutoMovieLoftChain";
import type { IAutoMovieHumanWebColumn } from "./IAutoMovieHumanWebColumn";

/** A child (a digit or toe) and its columns down from the parent's ring.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A child (a digit or toe) and its columns down from the parent's ring.
 * @evidence contracts/development/design.md#principled-representation `name`: Chain name. `chain`: The child's chain. `station`: The station of the child's end section on its chain.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanWebColumns.children.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `chain`, `station`, `columns`; callers supply the complete record.
 */
export interface IAutoMovieHumanWebBranch {
  /** Chain name. */
  name: string;

  /** The child's chain. */
  chain: IAutoMovieLoftChain;

  /** The station of the child's end section on its chain. */
  station: number;

  /** Its columns in ring order. */
  columns: IAutoMovieHumanWebColumn[];
}
