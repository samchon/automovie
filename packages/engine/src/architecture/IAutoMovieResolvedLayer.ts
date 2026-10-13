/**
 * One layer placed on the host's own measuring line.
 *
 * Coordinates are signed metres along the assembly's axis. `start` is the face
 * the stacking reaches first, beginning at the assembly offset, so under a
 * negative sense `start` is greater than `end`; take the minimum and maximum
 * for an interval.
 *
 * @evidence contracts/common.md#principled-implementation Each layer's `start` is the resolution cursor before it and `end` is `start` plus or minus its thickness, with `center` their mean, so consecutive layers share a face coordinate.
 * @evidence contracts/common.md#clear-and-simple-design Copies the authored facts the junction and reveal queries read (role, finish, wrapping) beside the placed coordinates, so neither query needs the authored assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates are not reordered for a negative sense; `start` stays the face reached first, and consumers such as the junction matcher take min and max themselves.
 * @evidence contracts/common.md#meaningful-documentation States the frame and unit, which face `start` names, its order relative to `end` under a negative sense, and the null-material meaning.
 * @evidenceExclude contracts/performance.md#cost-and-resources Strings, booleans and numbers copied from the authored layer in constant time during resolution and recreated on every resolution.
 * @author Samchon
 */
export interface IAutoMovieResolvedLayer {
  /** The contributing {@link IAutoMovieMaterialLayer.id}. */
  id: string;

  /** The layer's construction role. */
  role: string;

  /** What occupies the layer. */
  substance: "solid" | "cavity" | "membrane";

  /** Substance id, or `null` for a cavity. */
  material: string | null;

  /** Authored layer thickness in metres. */
  thickness: number;

  /** Signed coordinate of the face the stacking reaches first. */
  start: number;

  /** Signed coordinate of the face the stacking reaches last. */
  end: number;

  /** Signed coordinate of the layer's midplane. */
  center: number;

  /** Whether the layer is a visible finish. */
  finish: boolean;

  /** Whether the layer continues around an opening's reveal. */
  wrapsOpening: boolean;
}
