/**
 * One named studio light's requested direction in the display frame.
 * The viewport owns validation and restores other lights before publication.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Retains the existing named inspection-light state or direction request without altering the body document.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view The viewport remains the owner of direction validation, studio reset and shadow invalidation.
 * @author Samchon
 */
export interface IConnectedBodyInspectionLightDirection {
  /** Existing named studio light. */
  name: string;
  /** Dimensionless direction from the origin, Y up and Z forward. */
  direction: readonly [number, number, number];
}
