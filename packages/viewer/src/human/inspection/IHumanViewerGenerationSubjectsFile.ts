/**
 * The published subject people of a one-skin person generation, as the
 * application's optional subject people file holds them. Only the members the
 * viewer reads are named; each person is a whole person document.
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
