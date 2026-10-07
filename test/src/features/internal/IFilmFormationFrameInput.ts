/** Original node and formation subject selection for the framing action. */
export interface IFilmFormationFrameInput {
  /** Optional staged node identities. */
  nodes?: string[];

  /** Optional original formation identities. */
  formations?: string[];

  /** Original static or follow camera choice. */
  move?: "static" | "follow";
}
