/**
 * The two tracked files of the published one-skin person generation: the
 * head view and the body view, each opening with the generation id.
 *
 * @evidence contracts/common.md#meaningful-documentation Names both views.
 * @author Samchon
 */
export interface IHumanViewerGenerationFiles {
  /** Head view, `erased-data`. */
  head: string;

  /** Body view, `erased-data`. */
  body: string;
}
