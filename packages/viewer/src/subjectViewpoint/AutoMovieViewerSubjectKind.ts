/**
 * Authored subject categories used by the inspection identity parser; these categories carry no shot or delivery identity.
 *
 * @evidence contracts/common.md#principled-implementation The closed union distinguishes placed elements, reusable models and population members even when their authored ids coincide; parsing admits the same maintained category set.
 * @evidence contracts/common.md#clear-and-simple-design A category travels with the id rather than introducing another tree or screenshot identity representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type promises category membership only, not existence in a current scene or an authored production.
 * @evidence contracts/common.md#meaningful-documentation States authored inspection scope and its distinction from shot/delivery identity.
 * @evidence contracts/performance.md#efficient-algorithms The union chooses no traversal; parser membership and actual subject lookup retain their own costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Categories are shared static vocabulary; equal categories do not establish equal subject ids or revisions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This erased type owns no scene, renderer or task; consumers own any resolved object population.
 *
 * @author Samchon
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
