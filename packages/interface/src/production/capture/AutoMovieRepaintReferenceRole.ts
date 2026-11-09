/**
 * One explicit purpose assigned to a fixed repaint reference.
 *
 * Character supplies identity guidance; structure supplies appearance guidance while deterministic controls retain geometry, motion, contact, camera, timing and clearance authority.
 *
 * @evidence contracts/development/design.md#principled-representation A closed string union preserves the declared purpose of each reference in retained input and receipt shapes; it does not resolve bytes or build adapter input.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Closed semantic roles distinguish identity, costume, style, material, color and environment guidance without another untyped role string or merged appearance bucket.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The vocabulary describes appearance guidance, including structure guidance; the type alone cannot enforce reference handling or deterministic structural authority.
 * @evidence contracts/development/common.md#meaningful-documentation Defines fixed-reference purpose, character identity and the appearance-only authority of structure guidance.
 */
export type AutoMovieRepaintReferenceRole =
  | "structure"
  | "character"
  | "costume"
  | "style"
  | "material"
  | "color"
  | "environment";
