/**
 * Kinds of stable subjects available from one compiled shot artifact.
 *
 * A building unit is a subject of its own rather than the union of its rooms. The space tree is an index over a building and claims no envelope, so an exterior wall, a foundation and a structural frame belong to no room; a reviewer asking what one whole work is has to address the unit itself.
 *
 * @evidence contracts/common.md#principled-implementation Stable inspection subjects distinguish a complete building, its elements and parts, instancing prototypes and populations, and logical spaces; whole-building geometry includes envelope and structure that no room subtree owns.
 * @evidence contracts/common.md#clear-and-simple-design A single kind discriminator identifies the ownership scope of a subject description without making a space falsely own its building's external envelope.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Building inspection cannot be replaced by a union of rooms, which would omit unassigned envelope and foundation; compact populations retain instance-set and prototype identities rather than fabricating member nodes.
 * @evidence contracts/common.md#meaningful-documentation Identifies compiled stable-subject scope and explains why building is independent of the logical-space index and its room membership.
 */
export type AutoMovieSubjectKind =
  | "building"
  | "element"
  | "part"
  | "prototype"
  | "instance-set"
  | "instance"
  | "space";
