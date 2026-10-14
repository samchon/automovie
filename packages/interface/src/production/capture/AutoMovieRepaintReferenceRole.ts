/**
 * One explicit purpose assigned to a fixed repaint reference.
 *
 * Character supplies identity guidance; structure supplies appearance guidance while deterministic controls retain geometry, motion, contact, camera, timing and clearance authority.
 *
 * @evidence contracts/common.md#principled-implementation A closed string union preserves the declared purpose of each reference in retained input and receipt shapes; it does not resolve bytes or build adapter input.
 * @evidence contracts/common.md#clear-and-simple-design Closed semantic roles distinguish identity, costume, style, material, color and environment guidance without another untyped role string or merged appearance bucket.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The vocabulary describes appearance guidance, including structure guidance; the type alone cannot enforce reference handling or deterministic structural authority.
 * @evidence contracts/common.md#meaningful-documentation Defines fixed-reference purpose, character identity and the appearance-only authority of structure guidance.
 * @author Samchon
 */
export type AutoMovieRepaintReferenceRole =
  | "structure"
  | "character"
  | "costume"
  | "style"
  | "material"
  | "color"
  | "environment";
