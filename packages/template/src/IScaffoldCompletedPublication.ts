import { type IScaffoldPublicationEntry } from "./IScaffoldPublicationEntry";
/**
 * One completed entry and the parent directory generation that received it.
 *
 * @evidence contracts/common.md#principled-implementation Pairing the frozen entry with the parent's observed identity records which directory generation received the verified file; a pathname alone can name a successor after a rename, and the record does not promise that a later filesystem mutation leaves the file resident.
 * @evidence contracts/common.md#clear-and-simple-design The pair keeps the planned entry by reference instead of duplicating its fields, so the receipt has one description of each file.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The pair is built only from a `completed` outcome whose parent identity is non-empty, which `publishScaffoldCandidate` checks before recording it.
 * @evidence contracts/common.md#meaningful-documentation The comment and fields state that the entry passed final readback and that the identity is the captured parent generation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A completed pair is two references and performs no traversal or allocation of its own.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pair shares the planned entry object with `planned` instead of copying it, which is a reference, not reused work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller can retain this pair directly or through a receipt, keeping the shared entry and its bytes and the parent identity alive; no descriptor or task belongs to the pair.
 * @author Samchon
 */
export interface IScaffoldCompletedPublication {
  /** Planned entry whose bytes passed final readback. */
  entry: IScaffoldPublicationEntry;


  /** Identity of the captured parent directory containing the file. */
  parentIdentity: string;
}
