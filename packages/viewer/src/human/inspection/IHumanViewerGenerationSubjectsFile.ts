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
 * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity An explicit generation identity accompanies application-owned whole-Person documents prepared for its typed views.
 * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation The people list is supplied by Playground content and never fabricated by Viewer geometry code.
 *
 * @author Samchon
 */
export interface IHumanViewerGenerationSubjectsFile {
  /**
   * The generation id the people were converted for.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Identifies the actual generation for which the application-owned people documents were prepared.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Identifies the actual generation for which the application-owned people documents were prepared.
   */
  generation: string;

  /**
   * The person documents, each naming the generation's face and body view bases.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Retains whole-Person JSON as input to the Person owner rather than assuming schema validity from the list's file location.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Retains whole-Person JSON as input to the Person owner rather than assuming schema validity from the list's file location.
   */
  people: unknown[];
}
