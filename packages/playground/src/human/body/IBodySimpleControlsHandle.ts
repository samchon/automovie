import type { IBodySimpleBody } from "./IBodySimpleBody";

/**
 * What `renderBodySimpleControls` returns to the panel.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Lets the panel re-read the simple values when the body changes.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Projects the current body for the simple inputs.
 * @author Samchon
 */
export interface IBodySimpleControlsHandle {
  /** Re-read the simple values for this body, once per distinct body. */
  refresh: (body: IBodySimpleBody) => Promise<void>;
}
