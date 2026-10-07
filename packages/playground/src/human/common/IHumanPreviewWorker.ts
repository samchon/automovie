import type { HumanPreviewReply } from "./HumanPreviewReply";

/**
 * Disposable preview worker supplied by the browser adapter. The builder owns
 * request generation and terminates the connection on completion or cancellation.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Supplies interruption and completion of work before candidate publication.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Names transport effects independently of numerical decoding.
 * @author Samchon
 */
export interface IHumanPreviewWorker {
  /** Reports a transport failure. */
  onError: (message: string) => void;

  /** Delivers the numerical artifact or refusal. */
  onReply: (reply: HumanPreviewReply) => void;

  /** Evaluate a serialized document, optionally reading surface crossings. */
  send: (text: string, measure?: boolean) => void;

  /** Dispose this request's native connection. */
  terminate: () => void;
}
