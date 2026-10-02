/** One document as the index page lists it. */
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
