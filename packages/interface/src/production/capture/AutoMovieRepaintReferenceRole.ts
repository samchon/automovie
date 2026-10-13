/**
 * One explicit purpose assigned to a fixed repaint reference.
 *
 * `character` means identity rather than costume or material. `structure` is
 * appearance guidance only: deterministic control passes remain authoritative
 * for geometry, motion, contact, camera, timing, and clearance.
 */
export type AutoMovieRepaintReferenceRole =
  | "structure"
  | "character"
  | "costume"
  | "style"
  | "material"
  | "color"
  | "environment";
