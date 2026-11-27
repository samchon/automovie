/**
 * Finite ordered world-space subject box in metres, supplied by its numerical
 * owner. Zero extent is permitted; framing uses a conventional minimum
 * neighbourhood radius.
 */
export interface IAutoMovieRenderViewerSubjectBounds {
  /** Lower world corner, in metres. */
  min: { x: number; y: number; z: number };

  /** Upper world corner, in metres. */
  max: { x: number; y: number; z: number };
}
