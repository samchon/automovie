/**
 * One displayed mesh in the viewer's `/parts` answer.
 *
 * @evidence contracts/common.md#meaningful-documentation States that a part is a displayed mesh, not an anatomical partition.
 * @author Samchon
 */
export interface IHumanViewerPartEntry {
  /** Mesh name, a material region rather than an anatomical part. */
  name: string;

  /** The server's statement of that limitation. */
  limitation: string;
}
