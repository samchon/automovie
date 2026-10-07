import type { IHumanViewerFetchResponse } from "./IHumanViewerFetchResponse";

/**
 * What the client needs from the machine: HTTP and the viewer's inputs directory.
 *
 * @evidence contracts/common.md#clear-and-simple-design Machine effects stay behind one port so the client is pure over it.
 * @evidence contracts/common.md#meaningful-documentation Names every effect.
 * @author Samchon
 */
export interface IHumanViewerClientIo {
  /** Explicitly selected mutable storage, whose identity the server must confirm. */
  storage?: string;

  /** Requests a viewer URL. */
  fetch(url: string): Promise<IHumanViewerFetchResponse>;

  /** Write one file of the viewer's inputs directory. */
  writeInput(name: string, data: string): void;

  /** Copy a local file into the viewer's inputs directory under a name. */
  copyInput(name: string, source: string): void;

  /** Report what the client is waiting for, once per change. */
  report(message: string): void;
}
