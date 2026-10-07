/**
 * The published subject people of a one-skin person generation, as the source
 * owner writes `test/studies/human-person/subjects.json`. Only the members the
 * viewer reads are named; each person is a whole person document.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the members the viewer depends on.
 * @author Samchon
 */
export interface IHumanViewerGenerationSubjectsFile {
  /** The generation id the people were converted for. */
  generation: string;

  /** The person documents, each naming the generation's face and body view bases. */
  people: unknown[];
}
