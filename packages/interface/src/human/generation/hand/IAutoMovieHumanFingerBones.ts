import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanFingerBones; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFingerBones {
  /** The external argument of AutoMovieHumanFingerBones.of. Build a finger's bones and skin law.
  @param d The finger's law in the hand form's axes.
  @param index Finger, 1 for the index to 4 for the little finger.
  @param mcp Its knuckle, left frame, mm.
  @param frame The hand's frame on its knuckles.
  @param webs Its webs' crests, left frame, mm.
  @param external Its web-to-tip length, given its web's distance from its knuckle, mm.
  @param map The hand's map from the form's axes to the left frame.
  @param hand The hand's solved scales.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Build a finger's bones and skin law.
 * @evidence contracts/development/design.md#principled-representation Build a finger's bones and skin law. The callable takes web and returns number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFingerBones.OfExternal is the canonical exchange used by AutoMovieHumanFingerBones.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFingerBones.of for build a finger's bones and skin law.
 */
  export type OfExternal = (web: number) => number;

  /** The map argument of AutoMovieHumanFingerBones.of. Build a finger's bones and skin law.
  @param d The finger's law in the hand form's axes.
  @param index Finger, 1 for the index to 4 for the little finger.
  @param mcp Its knuckle, left frame, mm.
  @param frame The hand's frame on its knuckles.
  @param webs Its webs' crests, left frame, mm.
  @param external Its web-to-tip length, given its web's distance from its knuckle, mm.
  @param map The hand's map from the form's axes to the left frame.
  @param hand The hand's solved scales.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Build a finger's bones and skin law.
 * @evidence contracts/development/design.md#principled-representation Build a finger's bones and skin law. The callable takes q and returns AutoMovieVector3Tuple.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFingerBones.OfMap is the canonical exchange used by AutoMovieHumanFingerBones.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFingerBones.of for build a finger's bones and skin law.
 */
  export type OfMap = (
    q: readonly [number, number, number],
  ) => AutoMovieVector3Tuple;
}
