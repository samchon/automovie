/**
 * One document as the index page lists it.
 *
 * @evidence contracts/common.md#principled-implementation Retains the catalogue's document identity and domain while labels and sections describe navigation rather than numerical admission.
 * @evidence contracts/common.md#clear-and-simple-design One index record supplies both the gallery card and domain/text filtering without copying document contents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller's id and content-derived section remain data, so a new catalogue document needs no name-specific implementation branch.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the address id, visible label, closed numerical domain and section heading.
 * @author Samchon
 */
export interface IHumanViewerIndexEntry {
  /** Address `doc` value that opens it. */
  id: string;

  /** Text shown for it. */
  label: string;

  /** Numerical domain, which the face and body filters select. */
  domain: "face" | "body" | "person";

  /** Heading it is listed under. */
  section: string;
}
