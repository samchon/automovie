/** One actual exterior triangle corner and its generating patch coordinates.
 *
 *
 * @evidence contracts/common.md#principled-implementation Actual represented corner placement remains paired with its generating cap/sphere parameters.
 * @evidence contracts/common.md#clear-and-simple-design The optical geometry producer supplies corners to the exact cell metric in each inspected state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parameter branch and unwrapped sector are explicit rather than guessed from the posed point.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish radial metres, polar/azimuth radians and head-frame metre coordinates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceOcularCellCorner is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceOcularCellCorner declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceOcularCellCorner itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
 */
export interface IHumanFaceOcularCellCorner {
  /** Cap radial metres or sphere polar radians, according to the patch. */
  meridianParameter: number;

  /** Unwrapped azimuth radians over this triangle's actual local sector. */
  azimuthParameter: number;

  /** Actual represented head-frame position, metres, in the inspected state. */
  position: readonly number[];
}
