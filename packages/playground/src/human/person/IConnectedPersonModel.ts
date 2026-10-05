/**
 * The part of a built person preview the person panel reads: how many
 * material regions the committed model has. The viewport owns the prepared
 * frame behind it.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Exposes the material region count the person editor reports for a committed model.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Leaves the prepared frame behind the model with the viewport until publication.
 * @author Samchon
 */
export interface IConnectedPersonModel {
  /** Material regions of the built person. */
  parts: number;
}
