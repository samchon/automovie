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
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Reports the committed person, a refused draft with all of its failures, or the refusal that changed nothing.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Derives the status from state so a superseded or refused request cannot leave an earlier line behind.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state States that the displayed person is unchanged after a refusal.
 * @author Samchon
 */
export function describeConnectedPersonStatus<
  Model extends IConnectedPersonModel,
>(
  state: IConnectedPersonSessionState<Model>,
  accepted: IConnectedPersonAccepted | null,
): IConnectedPersonStatus {
  if (state.pending !== null) return { text: state.pending, state: "building" };
  const draft = state.draft;
  const shown =
    draft !== null
      ? [
          draft.document.name,
          draft.model.parts +
            " material regions · construction draft, not accepted",
          draft.admission.failures.length + " admission failures:",
          ...draft.admission.failures.map(
            (failure) => "- " + failure.owner + ": " + failure.cause,
          ),
        ]
      : accepted !== null
        ? [
            accepted.name,
            accepted.parts + " material regions · committed person document",
          ]
        : ["No person has been built."];
  const lines =
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
