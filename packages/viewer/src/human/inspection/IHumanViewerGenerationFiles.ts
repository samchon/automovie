/**
 * The two tracked files of the published one-skin person generation: the
 * head view and the body view, each opening with the generation id.
 *
 * @author Samchon
 */
export interface IHumanViewerGenerationFiles {
  /**
   * Head view from the selected `erased-data` generation.
   */
  head: string;

  /** Body view from the same `erased-data` generation. */
  body: string;
}
