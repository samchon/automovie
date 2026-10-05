/**
 * The stated meaning of one head landmark as written to the manifest.
 *
 * @author Samchon
 */
export interface IHumanSourceHeadLandmarkText {
  /** Landmark name. */
  name: string;

  /** The ANSUR definition, or the meaning of a named approximation. */
  definition: string;

  /** Report, section and page, or why there is none. */
  citation: string;

  /** Whether the vertex realises the definition or stands in for it. */
  status: "definition" | "definition, read from renders" | "named approximation";

  /** The selection rule, naming any stand-in. */
  rule: string;
}
