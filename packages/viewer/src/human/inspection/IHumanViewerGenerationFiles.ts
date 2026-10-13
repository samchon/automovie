/**
 * The two tracked files of the published one-skin person generation: the
 * head view and the body view, each opening with the generation id.
 *
 * @evidence contracts/common.md#meaningful-documentation Names both views.
 *
 * @evidence contracts/common.md#principled-implementation Paired head and body file paths identify the two typed views of the same Person generation.
 * @evidence contracts/common.md#clear-and-simple-design The record carries only the two view files; generation semantics remain with Human.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An arbitrary master checkout or similar basis name cannot substitute for the selected generation's files.
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
