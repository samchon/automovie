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
