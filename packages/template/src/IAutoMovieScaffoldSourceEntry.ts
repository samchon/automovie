/**
 * One authored scaffold input before its path and bytes are rendered.
 *
 * Keeping the source-relative identity until the complete candidate is
 * validated lets the renderer name both owners of a colliding output instead
 * of silently retaining whichever one happened to be assigned last.
 *
 * @author Samchon
 */
export interface IAutoMovieScaffoldSourceEntry {
  /** Text bytes before line-ending normalization and template rendering. */
  content: string;
  /**
   * Scaffold-root-relative source path before stand-in renaming and rendering.
   */
  relative: string;
}
