/**
 * The conchal bowl's two extents read against the auricle's attachment line
 * (`readHumanConchaExtent`), metres.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanConchaExtent {
  /** Superior-to-inferior extent along the attachment line, metres. */
  length: number;

  /** Anterior-to-posterior extent perpendicular to the attachment line, metres. */
  breadth: number;
}
