/**
 * The published subject people of a one-skin person generation, as the source
 * owner writes Playground's `human/examples/people.json`. Only the members the
 * viewer reads are named; each person is a whole person document.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the members the viewer depends on.
 *
 * @evidence contracts/common.md#principled-implementation An explicit generation identity accompanies application-owned whole-Person documents prepared for its typed views.
 * @evidence contracts/common.md#clear-and-simple-design Unknown document values remain at the owner-admission boundary instead of receiving a duplicate transport schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The people list is supplied by Playground content and never fabricated by Viewer geometry code.
 *
 * @author Samchon
 */
export interface IHumanViewerGenerationSubjectsFile {
  /** The generation id the people were converted for. */
  generation: string;

  /**
   * The person documents, each naming the generation's face and body view bases.
   */
  people: unknown[];
}
