import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanFingerBones; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanFingerBones {
  /**
   * The external argument of AutoMovieHumanFingerBones.of. Build a finger's
   * bones and skin law.
   *
   * @param d The finger's law in the hand form's axes.
   * @param index Finger, 1 for the index to 4 for the little finger.
   * @param mcp Its knuckle, left frame, mm.
   * @param frame The hand's frame on its knuckles.
   * @param webs Its webs' crests, left frame, mm.
   * @param external Its web-to-tip length, given its web's distance from its
   *   knuckle, mm.
   * @param map The hand's map from the form's axes to the left frame.
   * @param hand The hand's solved scales.
   */
  export type OfExternal = (web: number) => number;

  /**
   * The map argument of AutoMovieHumanFingerBones.of. Build a finger's bones
   * and skin law.
   *
   * @param d The finger's law in the hand form's axes.
   * @param index Finger, 1 for the index to 4 for the little finger.
   * @param mcp Its knuckle, left frame, mm.
   * @param frame The hand's frame on its knuckles.
   * @param webs Its webs' crests, left frame, mm.
   * @param external Its web-to-tip length, given its web's distance from its
   *   knuckle, mm.
   * @param map The hand's map from the form's axes to the left frame.
   * @param hand The hand's solved scales.
   */
  export type OfMap = (
    q: readonly [number, number, number],
  ) => AutoMovieVector3Tuple;
}
