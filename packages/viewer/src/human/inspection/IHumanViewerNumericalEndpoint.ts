import type { HumanViewerNumericalMessage } from "./HumanViewerNumericalMessage.js";
import type { IHumanViewerNumericalRequest } from "./IHumanViewerNumericalRequest.js";
import type { IHumanViewerPersistenceCommand } from "./IHumanViewerPersistenceCommand.js";

/**
 * Owned message endpoint behind the product numerical port; no foreign Worker is patched.
 *
 * @author Samchon
 */
export interface IHumanViewerNumericalEndpoint {
  /**
   * Current message subscriber, or null while none is installed; receives original numerical transport envelopes.
   */
  onmessage: ((event: MessageEvent<HumanViewerNumericalMessage>) => void) | null;

  /**
   * Current execution-failure subscriber, or null while none is installed; explicit disposal does not report a new failure.
   */
  onerror: ((event: ErrorEvent) => void) | null;

  /**
   * Post an original numerical request or persistence command to this owned session; a retired endpoint refuses later posts.
   */
  postMessage: (message: IHumanViewerNumericalRequest | IHumanViewerPersistenceCommand) => void;

  /**
   * Retire this endpoint and release its owned stream and numerical session; repeated calls have no additional effect.
   */
  terminate: () => void;
}
