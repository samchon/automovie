import type { IBodyPoseCensusIdentity } from "./IBodyPoseCensusIdentity";

/**
 * Refuse a census sample whose inputs changed during the run.
 * The command supplies its captured initial identity and a fresh current one
 * before each state and before writing results. Comparing revision, complete
 * basis payload, repository head and source bytes keeps a table from assigning
 * mixed inputs to a single revision. Historical tables without these fields
 * remain observations whose input identity cannot be recovered from a label.
 * Inputs are read-only; a refusal names the changed owner before publication.
 *
 * @evidence contracts/common.md#principled-implementation Equality of all captured input identities is necessary to attribute a table to one input. Each distinct mismatch refuses before publication; equality establishes content identity rather than geometric correctness.
 * @evidence contracts/common.md#clear-and-simple-design Three checks separate basis payload, repository head and numerical source changes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No same-named basis or historical label bypasses the payload/source checks.
 * @evidence contracts/common.md#meaningful-documentation Identifies the initial/current snapshots, publication effect, read-only ownership and limitation of historical records.
 */
export function assertBodyPoseCensusIdentity(
  initial: IBodyPoseCensusIdentity,
  current: IBodyPoseCensusIdentity,
): void {
  if (
    current.basis.id !== initial.basis.id ||
    current.basis.sha256 !== initial.basis.sha256
  )
    throw new Error("The census input basis changed during measurement.");
  if (current.head !== initial.head)
    throw new Error("The census repository head changed during measurement.");
  if (current.sourceSha256 !== initial.sourceSha256)
    throw new Error("The census numerical source changed during measurement.");
}
