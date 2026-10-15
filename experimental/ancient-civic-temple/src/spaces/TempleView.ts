/**
 * Inspection view enabled with an observation: exact server-cut solids in an
 * orthographic vertical section, or a roof-off overhead view hiding roof and ceiling.
 */

export interface TempleView {
  /** Roof-off overhead view, or a vertical section cut on an x or z plane. */
  section: "roof-off" | "cut-x" | "cut-z";
  /** World coordinate of the cut plane. */
  offset: number;
  /** Whether the view uses an orthographic camera. */
  ortho: boolean;
  /** Visible width of the orthographic view in metres. */
  span: number;
  /** Whether the retained side of the cut is the higher-coordinate side. */
  flip: boolean;
}
