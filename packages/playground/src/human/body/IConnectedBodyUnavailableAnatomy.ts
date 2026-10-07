/**
 * A preview whose anatomy could not be read, with the named reason.
 *
 * `skin-crossing` means the shaped skin crosses itself, so inside and outside
 * are undefined; `ct-domain` means the requested body is outside the adult
 * CT prior's age and stature range, so no head radius is inferred.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Names why the anatomy reading is unavailable instead of showing a guess.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Carries the refusal reason the reading panel displays.
 * @author Samchon
 */
export interface IConnectedBodyUnavailableAnatomy {
  /** No anatomy reading was produced. */
  status: "unavailable";

  /** Why the reading is unavailable. */
  reason: "skin-crossing" | "ct-domain";
}
