import { createHumanSourcePublication } from "./createHumanSourcePublication.ts";
import type { IHumanSourceFilesPublicationInput } from "./structures/IHumanSourceFilesPublicationInput.ts";

/** Publish one coherent stage's files under the common authority.
 * Inputs are reobserved before any output and at the atomic completion point.
 * Failure preserves raw output and records refusal; an incomplete write never
 * acquires normal-admission authority. Stage qualification stays explicit.
 * @author Samchon
 */
export function publishHumanSourceFiles(input: IHumanSourceFilesPublicationInput): void {
  input.verifyInputs();
  const publication = createHumanSourcePublication(input.directory, input.authorityName);
  try {
    for (const [name, bytes] of input.files) publication.write(name, bytes);
    publication.complete(input.generation, input.completeGeneration, input.inspectionOnly, input.verifyInputs);
  } catch (error) {
    publication.refuse(error);
    throw error;
  }
}
