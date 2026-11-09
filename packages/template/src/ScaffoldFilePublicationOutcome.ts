import { type IScaffoldCompletedFilePublicationOutcome } from "./IScaffoldCompletedFilePublicationOutcome";
import { type IScaffoldPartialFilePublicationOutcome } from "./IScaffoldPartialFilePublicationOutcome";
import { type IScaffoldRefusedFilePublicationOutcome } from "./IScaffoldRefusedFilePublicationOutcome";

/**
 * Outcome a one-file publisher reports for one candidate entry.
 *
 * The publisher returns rather than throws because a thrown I/O error cannot describe a write's effect. `refused` means this attempt created or rewrote no target file; a competitor or prepared directories can remain. `partial` names the parent and confirmed byte count after reservation or truncation, and `completed` means the file was verified.
 *
 * @evidence contracts/development/design.md#principled-representation A status discriminator separates pre-mutation refusal, incomplete file effect and verified completion for both exclusive create and forced replacement, without deriving state from error-message text.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The union is the one seam between the candidate loop and any adapter; validation of each variant against the contract stays with `publishScaffoldCandidate`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The union is the whole adapter contract and carries no fallback state; an adapter that returns something outside it is refused by `publishScaffoldCandidate` rather than coerced into a variant.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states why adapters report instead of throwing and what each status says about the file slot.
 */
export type ScaffoldFilePublicationOutcome =
  | IScaffoldCompletedFilePublicationOutcome
  | IScaffoldRefusedFilePublicationOutcome
  | IScaffoldPartialFilePublicationOutcome;
