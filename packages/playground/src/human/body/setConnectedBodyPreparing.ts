/**
 * Name, or stop naming, one part of the body editor that is still preparing.
 *
 * Until the head view and the whole-person reader answer, the head seat and the simple inputs are empty. The `#body-preparing` line names each part still preparing, so an empty slot reads as loading rather than as a fault, and empties itself when nothing is left. A page without the line ignores the call.
 *
 * @evidence contracts/common.md#principled-implementation A newline-separated DOM dataset represents the set of preparing labels; adding or removing one label preserves other owners and hides the line only when the set is empty.
 * @evidence contracts/common.md#clear-and-simple-design The existing status element holds the shared labels, avoiding a separate global registry while allowing independent head and simple-reading callers to update their own part.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preparing labels are presentation state rather than numerical admission, and a page without this optional status element is left untouched.
 * @evidence contracts/common.md#meaningful-documentation The comment states label ownership, empty-set hiding and the missing-element behavior without promising a measured load duration.
 * @evidence contracts/performance.md#efficient-algorithms Each update reads and rewrites p labels and their total l characters in O(p+l) time and temporary storage; the dataset is the only retained collection.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Set insertion keeps a preparing label unique, but the operation shares no numerical task or completed result across callers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Labels remain only while callers mark their parts active; removal deletes that label, empty state stores an empty dataset, and the parent owns eventual DOM removal.
 */
export function setConnectedBodyPreparing(
  dom: Document,
  part: string,
  active: boolean,
): void {
  const line: HTMLElement | null =
    dom.querySelector<HTMLElement>("#body-preparing");
  if (line === null) return;
  const parts: Set<string> = new Set(
    (line.dataset.parts ?? "")
      .split("\n")
      .filter((one: string): boolean => one !== ""),
  );
  if (active) parts.add(part);
  else parts.delete(part);
  line.dataset.parts = [...parts].join("\n");
  line.textContent =
    parts.size === 0 ? "" : "Preparing: " + [...parts].join("; ") + "…";
  line.hidden = parts.size === 0;
}
