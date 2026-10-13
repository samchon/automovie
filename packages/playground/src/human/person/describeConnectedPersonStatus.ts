import type { IConnectedPersonAccepted } from "./IConnectedPersonAccepted";
import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonSessionState } from "./IConnectedPersonSessionState";
import type { IConnectedPersonStatus } from "./IConnectedPersonStatus";

/**
 * Derive the person editor's status line from its session state and the
 * accepted person, if one exists.
 *
 * A pending intent is stated alone. Otherwise the line names what is on
 * screen: a draft with every failure of its admission report, in the report's
 * own words and order, or the committed person, or nothing. A refusal is
 * stated first and followed by what stayed on screen, so a refused edit never
 * reads as a change. A draft is never described as committed.
 * Notes come from the session without additional filtering; the caller's current-intent discipline and next begin determine their provenance and retirement.
 *
 * @evidence contracts/common.md#principled-implementation Pending work wins, then current refusal, draft/accepted/empty display and notes are formatted from session plus separate accepted history, preserving all admission failures in owner order.
 * @evidence contracts/common.md#clear-and-simple-design One pure formatter owns presentation precedence while the session owns state, the panel authorizes intent and DOM/numerical owners remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refused edits state what remained on screen, visible construction drafts never become committed people and notes are not independently revalidated by this formatter.
 * @evidence contracts/common.md#meaningful-documentation The comment explains pending/display/refusal precedence, preserved owner failure text and caller-authorized notes.
 * @evidence contracts/performance.md#efficient-algorithms Pending status returns fixed metadata; settled formatting visits f draft failures and n notes, copying their line references and joining O(b) output characters with O(f+n+b) temporary/output storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current status is cheap effect-state formatting with no numerical cache; the function retains no previous result or stale state key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned text is ordinary caller data and no history is retained here; session note/draft lifetime and physical viewport resources belong to their actual owners.
 *
 * @author Samchon
 */
export function describeConnectedPersonStatus<
  Model extends IConnectedPersonModel,
>(
  state: IConnectedPersonSessionState<Model>,
  accepted: IConnectedPersonAccepted | null,
): IConnectedPersonStatus {
  if (state.pending !== null) return { text: state.pending, state: "building" };
  const draft: IConnectedPersonSessionState<Model>["draft"] = state.draft;
  const shown: string[] =
    draft !== null
      ? [
          draft.document.name,
          draft.model.parts +
            " material regions · construction draft, not accepted",
          draft.admission.failures.length + " admission failures:",
          ...draft.admission.failures.map(
            (failure: NonNullable<typeof draft>["admission"]["failures"][number]): string => "- " + failure.owner + ": " + failure.cause,
          ),
        ]
      : accepted !== null
        ? [
            accepted.name,
            accepted.parts + " material regions · committed person document",
          ]
        : ["No person has been built."];
  const lines: string[] =
    state.refusal === null
      ? shown
      : [state.refusal, "Unchanged on screen:", ...shown];
  return {
    text: [...lines, ...state.notes].join(String.fromCharCode(10)),
    state:
      state.refusal !== null
        ? "error"
        : draft !== null
          ? "draft"
          : accepted !== null
            ? "ready"
            : "empty",
  };
}
