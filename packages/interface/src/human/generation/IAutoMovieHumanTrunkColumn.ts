import type { IAutoMovieHumanTrunkKey } from "./IAutoMovieHumanTrunkKey";
import type { IAutoMovieHumanTrunkSection } from "./IAutoMovieHumanTrunkSection";

/**
 * Ordered trunk keys and the millimetre-height section evaluator they define.
 * Runtime construction and admission remain with AutoMovieHumanTrunkColumn in
 * Human.
 */
export namespace IAutoMovieHumanTrunkColumn {
  /** The column. */
  export interface IColumn {
    /** The section's measures at a height. */
    at: (y: number) => IAutoMovieHumanTrunkSection;

    /** The keys, by rising height. */
    keys: IAutoMovieHumanTrunkKey[];
  }
}
