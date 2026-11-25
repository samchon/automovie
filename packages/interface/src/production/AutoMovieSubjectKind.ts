/**
 * Kinds of stable subjects available from one compiled shot artifact.
 *
 * A building unit is a subject of its own rather than the union of its rooms.
 * The space tree is an index over a building and claims no envelope, so an
 * exterior wall, a foundation and a structural frame belong to no room; a
 * reviewer asking what one whole work is has to address the unit itself.
 */
export type AutoMovieSubjectKind =
  | "building"
  | "element"
  | "part"
  | "prototype"
  | "instance-set"
  | "instance"
  | "space";
