import type { HumanViewerNumericalMessage } from "./HumanViewerNumericalMessage";
import type { IHumanViewerNumericalRequest } from "./IHumanViewerNumericalRequest";
import type { IHumanViewerPersistenceCommand } from "./IHumanViewerPersistenceCommand";

/** Owned message endpoint behind the product numerical port; no foreign Worker is patched. @author Samchon */
export interface IHumanViewerNumericalEndpoint {
  onmessage: ((event: MessageEvent<HumanViewerNumericalMessage>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage: (message: IHumanViewerNumericalRequest | IHumanViewerPersistenceCommand) => void;
  terminate: () => void;
}
