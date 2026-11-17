/** Type contracts exchanged by AutoMovieHumanBodySurfaceLoft; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanBodySurfaceLoft {
  /** The loopPolygon argument of AutoMovieHumanBodySurfaceLoft.holeEdge. The hole a base left round a loop: the closed edge of its left-out
  cells nearest the loop, as vertices and their chart points; for a loop
  winding round the cap pole, the edge ring whose mean station is the
  loop's nearest.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The hole a base left round a loop: the closed edge of its left-out cells nearest the loop, as vertices and their chart points; for a loop winding round the cap pole, the edge ring whose mean station is the loop's nearest.
 * @evidence contracts/development/design.md#principled-representation The hole a base left round a loop: the closed edge of its left-out cells nearest the loop, as vertices and their chart points; for a loop winding round the cap pole, the edge ring whose mean station is the loop's nearest.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBodySurfaceLoft.HoleEdgeLoopPolygon is the canonical exchange used by AutoMovieHumanBodySurfaceLoft.holeEdge.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBodySurfaceLoft.holeEdge for the hole a base left round a loop: the closed edge of its left-out cells nearest the loop, as vertices and their chart points; for a loop winding round the cap pole, the edge ring whose mean station is the loop's nearest.
 */
  export type HoleEdgeLoopPolygon = [number, number][];

  /** Result of AutoMovieHumanBodySurfaceLoft.holeEdge. The hole a base left round a loop: the closed edge of its left-out
  cells nearest the loop, as vertices and their chart points; for a loop
  winding round the cap pole, the edge ring whose mean station is the
  loop's nearest.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The hole a base left round a loop: the closed edge of its left-out cells nearest the loop, as vertices and their chart points; for a loop winding round the cap pole, the edge ring whose mean station is the loop's nearest.
 * @evidence contracts/development/design.md#principled-representation The hole a base left round a loop: the closed edge of its left-out cells nearest the loop, as vertices and their chart points; for a loop winding round the cap pole, the edge ring whose mean station is the loop's nearest. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBodySurfaceLoft.HoleEdgeResult is the canonical exchange used by AutoMovieHumanBodySurfaceLoft.holeEdge.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBodySurfaceLoft.holeEdge for the hole a base left round a loop: the closed edge of its left-out cells nearest the loop, as vertices and their chart points; for a loop winding round the cap pole, the edge ring whose mean station is the loop's nearest.
 */
  export type HoleEdgeResult = [number[], [number, number][]];
}
