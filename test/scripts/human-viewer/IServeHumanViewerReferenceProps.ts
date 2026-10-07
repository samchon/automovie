import type { ServerResponse } from "node:http";

/**
 * Local photograph routes read existing images and never move or write them.
 *
 * @author Samchon
 */
export interface IServeHumanViewerReferenceProps {
  /** Parsed reference request. */
  url: URL;

  /** Response receiving metadata or the original image bytes. */
  response: ServerResponse;

  /** Repository root for the committed pose acquisition records. */
  root: string;

  /** Read-only directory of existing reference photographs. */
  referenceDirectory: string;

  /** Catalogue document identities to look up. */
  documents: readonly string[];

  /** Sends a JSON response. */
  json: (value: unknown) => void;
}
