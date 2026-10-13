/**
 * A failed attempt that created or rewrote no file at the target. An existing competitor can remain there, and directories prepared before refusal can remain.
 *
 * @evidence contracts/common.md#principled-implementation The reasons identify refusal before an exclusive slot was created or an existing file was truncated; the guarantee concerns this attempt's file effect, not the absence of a competitor or previously prepared directories.
 * @evidence contracts/common.md#clear-and-simple-design One closed reason union covers failures before this attempt creates or truncates a file; it distinguishes changed parent authority and occupied names from other pre-mutation errors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `publishFiles` maps every exception it catches to `create-failed`, which holds because `writeScaffoldFile` throws only before any write and `publishNativeScaffoldFile` reports its failures instead of throwing.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes unchanged target files from existing competitors and directory preparation; reason members identify parent changes, occupied names and other pre-mutation failures.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The refusal variant only names a reason and its cause; it runs nothing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No refused outcome is shared; the receipt keeps the single one that stopped the candidate.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources It retains only the cause object, whose lifetime follows the receipt that holds it.
 * @author Samchon
 */
export interface IScaffoldRefusedFilePublicationOutcome {
  /** Original native or validation error, kept for the caller. */
  error: unknown;


  /**
   * Why this attempt changed no file: `parent-changed` when a missing or invalid requested parent could not be opened, or its held directory identity differed; `target-competitor` when the name was already occupied, and `create-failed` for any other failure before this attempt created a slot or truncated an existing resident.
   */
  reason: "create-failed" | "parent-changed" | "target-competitor";


  /** Discriminator: this attempt created or rewrote no target file. */
  status: "refused";
}
