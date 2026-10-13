import type { IBodySimpleBody } from "./IBodySimpleBody";

/**
 * What `renderBodySimpleControls` returns to the panel.
 *
 * @author Samchon
 */
export interface IBodySimpleControlsHandle {
  /** Re-read the simple values for this body, once per distinct body. */
  refresh: (body: IBodySimpleBody) => Promise<void>;
}
