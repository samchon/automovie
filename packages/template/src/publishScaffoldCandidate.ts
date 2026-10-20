import { type IScaffoldCompletedPublication } from "./IScaffoldCompletedPublication";
import { type IScaffoldPublicationEntry } from "./IScaffoldPublicationEntry";
import { type IScaffoldPublicationReceipt } from "./IScaffoldPublicationReceipt";
import { type ScaffoldFilePublicationOutcome } from "./ScaffoldFilePublicationOutcome";

/**
 * Publish a candidate in order through a one-file publisher and report the exact effect.
 *
 * Stops at the first entry whose outcome is not `completed`. Throws instead of returning a receipt when the publisher reports an outcome that breaks its contract: a completed or partial result without a parent identity, an unknown refusal reason, a byte count outside the entry, or an unknown status. A frozen entry with a frozen byte array is used as is; any other entry is copied and frozen first, so the publisher and the receipt see the same immutable data.
 *
 * @param props.candidate Entries to publish, normally from {@link planScaffoldPublication}.
 * @param props.publish Publishes one entry and reports its outcome; must not throw.
 * @returns Frozen receipt describing the completed prefix and any failure.
 *
 * @evidence contracts/common.md#principled-implementation A sequential loop that stops at the first non-completed outcome makes the completed set a prefix of the candidate, so the receipt is exact without probing the file system afterwards; adapter outcomes are validated against the union's invariants before they enter the receipt.
 * @evidence contracts/common.md#clear-and-simple-design The function owns ordering, outcome validation, and status derivation, and takes the file system work as the `publish` callback so `publishFiles` owns directories and descriptors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An outcome outside the contract, including an unknown status that was previously recorded as a partial failure, now throws instead of being coerced; no entry or adapter is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment states the stop rule, every contract violation that throws, the freezing and reuse rule for entries, the parameters' duties, and the returned receipt.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the candidate calls the publisher once per entry; a frozen entry with frozen bytes is reused instead of copying its bytes, so the planner's output adds no per-byte work here.
 * @evidence contracts/performance.md#reuse-equivalent-work A frozen entry is shared with the receipt because neither its fields nor its frozen byte array can change; equivalence is that immutability, not a matching path, and every publish call still runs since each write is an effect.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function holds no descriptor; it retains the planned entries and one completed record per finished file in the returned receipt, bounded by the candidate length, and releases nothing because the caller owns the receipt.
 */
export const publishScaffoldCandidate: (props: {
  candidate: readonly IScaffoldPublicationEntry[];
  publish: (entry: IScaffoldPublicationEntry) => ScaffoldFilePublicationOutcome;
}) => IScaffoldPublicationReceipt = (props: {
  candidate: readonly IScaffoldPublicationEntry[];
  publish: (entry: IScaffoldPublicationEntry) => ScaffoldFilePublicationOutcome;
}): IScaffoldPublicationReceipt => {
  const planned: readonly IScaffoldPublicationEntry[] = Object.freeze(
    props.candidate.map(
      (entry: IScaffoldPublicationEntry): IScaffoldPublicationEntry =>
        Object.isFrozen(entry) && Object.isFrozen(entry.bytes)
          ? entry
          : Object.freeze({
              bytes: Object.freeze([...entry.bytes]),
              relative: entry.relative,
              target: entry.target,
            }),
    ),
  );
  const completed: IScaffoldCompletedPublication[] = [];
  for (const entry of planned) {
    const outcome: ScaffoldFilePublicationOutcome = props.publish(entry);
    if (outcome.status === "completed") {
      if (outcome.parentIdentity.length === 0)
        throw new Error(
          `completed scaffold publication omitted parent identity: ${entry.relative}`,
        );
      completed.push(
        Object.freeze({ entry, parentIdentity: outcome.parentIdentity }),
      );
      continue;
    }
    if (outcome.status === "refused") {
      if (
        outcome.reason !== "create-failed" &&
        outcome.reason !== "parent-changed" &&
        outcome.reason !== "target-competitor"
      )
        throw new Error(
          `refused scaffold publication has invalid reason: ${entry.relative}`,
        );
    } else if (outcome.status === "partial") {
      if (
        outcome.parentIdentity.length === 0 ||
        Number.isSafeInteger(outcome.bytesWritten) === false ||
        outcome.bytesWritten < 0 ||
        outcome.bytesWritten > entry.bytes.length
      )
        throw new Error(
          `partial scaffold publication has invalid bound state: ${entry.relative}`,
        );
    } else
      throw new Error(
        `scaffold publication returned an unknown outcome: ${entry.relative}`,
      );
    return Object.freeze({
      completed: Object.freeze(completed),
      failure: Object.freeze({ entry, outcome: Object.freeze({ ...outcome }) }),
      planned,
      status:
        outcome.status === "refused" && completed.length === 0
          ? "refused"
          : "partial",
    });
  }
  return Object.freeze({
    completed: Object.freeze(completed),
    failure: null,
    planned,
    status: "completed",
  });
};
