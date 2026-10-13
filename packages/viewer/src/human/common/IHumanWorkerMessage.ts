/**
 * The data member delivered by a native worker message callback.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Carries the request owner's correlated reply without publishing a preview itself.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Keeps native message wrapping separate from the numerical payload.
 * @author Samchon
 */
export interface IHumanWorkerMessage<Data> {
  /** Numerical payload delivered by this message. */
  data: Data;
}
