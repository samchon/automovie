/**
 * Anatomical left and right in the person's own frame.
 *
 * Model and camera coordinates may be mirrored during viewing; a part's side
 * follows the person and must never be inferred from screen X. Both sides
 * remain separately measurable, while a midline sacrum has neither side.
 * @author Samchon
 */
export type AutoMovieHumanBodySide = "left" | "right";
