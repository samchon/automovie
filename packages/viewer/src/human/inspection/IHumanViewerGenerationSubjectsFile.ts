/**
 * The published subject people of a one-skin person generation, as the application's optional subject people file holds them. Only the members the viewer reads are named; each person is a whole person document.
 *
 * @evidence contracts/common.md#principled-implementation Projects the application's generation-subject JSON with unexamined whole-person documents for later basis identity and domain admission.
 * @evidence contracts/common.md#clear-and-simple-design Names only generation provenance and people array fields used by readHumanViewerGenerationSubjects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The current reader checks person ids and exact face/body basis ids; generation is diagnostic context and is not separately compared as an admission gate.
 * @evidence contracts/common.md#meaningful-documentation Documents unknown people JSON and reported generation id, preserving per-person refusal rather than asserting a fully typed Person document.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface performs no parse; the reader parses input bytes then checks/hashes each offered person once.
 * @evidence contracts/performance.md#reuse-equivalent-work Accepted candidates use both current view digests and numerical source keys; this file's generation label alone cannot establish reusable geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed people and accepted/refused arrays scale with file input, with no worker/frame or independent retention map owned by this shape.
 *
 * @author Samchon
 */
export interface IHumanViewerGenerationSubjectsFile {
  /** Reported generation id used in refusal context; the reader admits identity through each person's exact face/body basis names. */
  generation: string;

  /**
   * The person documents, each naming the generation's face and body view bases.
   */
  people: unknown[];
}
