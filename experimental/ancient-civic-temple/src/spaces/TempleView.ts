/**
 * Inspection view enabled with an observation: exact server-cut solids in an
 * orthographic vertical section, or a roof-off overhead view hiding roof and ceiling.
 */

export interface TempleView {
  section: "roof-off" | "cut-x" | "cut-z";
  offset: number;
  ortho: boolean;
  span: number;
  flip: boolean;
}
