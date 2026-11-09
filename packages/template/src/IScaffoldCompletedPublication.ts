import { type IScaffoldPublicationEntry } from "./IScaffoldPublicationEntry";

/**
 * One completed entry and the parent directory generation that received it.
 *
 * @evidence contracts/development/design.md#principled-representation Pairing the frozen entry with the parent's observed identity records which directory generation received the verified file; a pathname alone can name a successor after a rename, and the record does not promise that a later filesystem mutation leaves the file resident.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The pair keeps the planned entry by reference instead of duplicating its fields, so the receipt has one description of each file.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pair is built only from a `completed` outcome whose parent identity is non-empty, which `publishScaffoldCandidate` checks before recording it.
 * @evidence contracts/development/common.md#meaningful-documentation The comment and fields state that the entry passed final readback and that the identity is the captured parent generation.
 */
export interface IScaffoldCompletedPublication {
  /** Planned entry whose bytes passed final readback. */
  entry: IScaffoldPublicationEntry;

  /** Identity of the captured parent directory containing the file. */
  parentIdentity: string;
}
