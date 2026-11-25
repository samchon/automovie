/**
 * One explicit purpose assigned to a fixed repaint reference.
 *
 * Character supplies identity guidance; structure supplies appearance guidance
 * while deterministic controls retain geometry, motion, contact, camera, timing
 * and clearance authority.
 */
export type AutoMovieRepaintReferenceRole =
  | "structure"
  | "character"
  | "costume"
  | "style"
  | "material"
  | "color"
  | "environment";
