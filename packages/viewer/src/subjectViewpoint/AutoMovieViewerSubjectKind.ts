/**
 * Authored subject categories used by the inspection identity parser; these categories carry no shot or delivery identity.
 *
 * @evidence contracts/development/design.md#principled-representation The closed union distinguishes placed elements, reusable models and population members even when their authored ids coincide; parsing admits the same maintained category set.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A category travels with the id rather than introducing another tree or screenshot identity representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The type promises category membership only, not existence in a current scene or an authored production.
 * @evidence contracts/development/common.md#meaningful-documentation States authored inspection scope and its distinction from shot/delivery identity.
 */
export type AutoMovieViewerSubjectKind =
  | "built-environment"
  | "building"
  | "storey"
  | "space"
  | "element"
  | "part"
  | "model"
  | "prototype"
  | "mesh"
  | "primitive"
  | "formation"
  | "slot"
  | "instance-set"
  | "instance";
