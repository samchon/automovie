/**
 * One explicit purpose assigned to a fixed repaint reference.
 *
 * `character` means identity rather than costume or material. `structure` is
 * appearance guidance only: deterministic control passes remain authoritative
 * for geometry, motion, contact, camera, timing, and clearance.
 *
 * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes the complete non-collapsible repaint reference-role vocabulary.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types distinct structural-guidance, identity, costume, style, material, color, and environment references.
 */
export type AutoMovieRepaintReferenceRole =
  | "structure"
  | "character"
  | "costume"
  | "style"
  | "material"
  | "color"
  | "environment";
