/**
 * What the simple tier reads on the whole person a body shape belongs to.
 *
 * A body basis has no head, so it cannot answer stature (floor to the top of
 * the head) or the volume of the closed person whose mass the simple tier
 * states. The caller that owns the person (a face subtree on a one-skin
 * generation) supplies both readings as functions of the body shape; the
 * simple tier never estimates the missing head.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleWhole {
  /**
   * The whole person's standing floor-to-vertex stature for a body shape, metres.
   */
  stature: (shape: Readonly<Record<string, number>>) => number;

  /**
   * The volume the whole person's closed skin encloses for a body shape, cubic metres.
   */
  volume: (shape: Readonly<Record<string, number>>) => number;
}
