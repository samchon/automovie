/**
 * Kind of authored thing one subject inspection opens.
 *
 * The list is the viewable tree read as node kinds rather than as a path: a
 * space decomposes into elements, an element into parts, a model into meshes,
 * a population into its members. Naming the kind beside the id is what keeps
 * two identical strings apart when a placed element and the model it places
 * were authored under the same name, which is the prototype-placement
 * distinction the requirement refuses to collapse.
 *
 * No member of this union is a shot, a frame or a take. That absence is the
 * point: a subject is named by what it is, never by the delivered picture that
 * happens to contain it.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-identity `AutoMovieViewerSubjectKind` enumerates the authored kinds a subject identity may name, keeping prototype and placement apart.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-record `AutoMovieViewerSubjectKind` types the kind field of the subject record the inspection surface resolves.
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
