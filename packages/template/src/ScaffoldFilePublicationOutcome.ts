import { type IScaffoldCompletedFilePublicationOutcome } from "./IScaffoldCompletedFilePublicationOutcome";
import { type IScaffoldRefusedFilePublicationOutcome } from "./IScaffoldRefusedFilePublicationOutcome";
import { type IScaffoldPartialFilePublicationOutcome } from "./IScaffoldPartialFilePublicationOutcome";
/**
 * Outcome a one-file publisher reports for one candidate entry.
 *
 * The publisher returns rather than throws because a thrown I/O error cannot describe a write's effect. `refused` means this attempt created or rewrote no target file; a competitor or prepared directories can remain. `partial` names the parent and confirmed byte count after reservation or truncation, and `completed` means the file was verified.
 *
 * @evidence contracts/common.md#principled-implementation A status discriminator separates pre-mutation refusal, incomplete file effect and verified completion for both exclusive create and forced replacement, without deriving state from error-message text.
 * @evidence contracts/common.md#clear-and-simple-design The union is the one seam between the candidate loop and any adapter; validation of each variant against the contract stays with `publishScaffoldCandidate`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The union is the whole adapter contract and carries no fallback state; an adapter that returns something outside it is refused by `publishScaffoldCandidate` rather than coerced into a variant.
 * @evidence contracts/common.md#meaningful-documentation The comment states why adapters report instead of throwing and what each status says about the file slot.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This alias only names three record shapes for narrowing and executes nothing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The union describes one entry's effect; whether results repeat is not a question a status alias can answer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No variant of the union holds a handle; resource release is the adapter's duty before it returns.
 * @author Samchon
 */
export type ScaffoldFilePublicationOutcome =
  | IScaffoldCompletedFilePublicationOutcome
  | IScaffoldRefusedFilePublicationOutcome
  | IScaffoldPartialFilePublicationOutcome;
