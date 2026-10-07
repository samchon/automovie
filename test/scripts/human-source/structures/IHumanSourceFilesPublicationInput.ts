/** One source stage's immutable outputs, qualification and input reobserver.
 * The authority filename distinguishes a standalone representation in a
 * shared directory from a full generation's conventional authority.
 * @author Samchon
 */
export interface IHumanSourceFilesPublicationInput {
  directory: string;
  authorityName?: string;
  generation: string;
  completeGeneration: boolean;
  inspectionOnly: boolean;
  files: ReadonlyMap<string, string | Uint8Array>;
  verifyInputs(): void;
}
