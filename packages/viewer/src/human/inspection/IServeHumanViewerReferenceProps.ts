import type { ServerResponse } from "node:http";

/**
 * Local photograph routes read existing images and never move or write them.
 *
 * @evidence contracts/common.md#principled-implementation Reference routes consume existing photographs separately from repository pose records and catalogue identities.
 * @evidence contracts/common.md#clear-and-simple-design The input record separates readonly reference storage from HTTP JSON and byte responses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Photograph access supplies comparison inputs and cannot move, rewrite or derive a numerical model from them.
 * @evidence contracts/common.md#meaningful-documentation Documents the parsed reference request, original image response, read-only directory and document lookup population.
 * @author Samchon
 */
export interface IServeHumanViewerReferenceProps {
  /** Parsed reference request. */
  url: URL;

  /** Response receiving metadata or the original image bytes. */
  response: ServerResponse;

  /**
   * Application-owned pose acquisition record file, read only as display metadata.
   */
  cameraPosesFile: string;

  /** Read-only directory of existing reference photographs. */
  referenceDirectory: string;

  /** Catalogue document identities to look up. */
  documents: readonly string[];

  /**
   * Sends a JSON response.
   *
   * @evidence contracts/common.md#principled-implementation Reference JSON output returns photograph metadata or lookup results from this route.
   * @evidence contracts/common.md#clear-and-simple-design The route borrows HTTP serialization without changing reference image ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Sending reference metadata does not create or admit an anatomical reconstruction.
   * @evidence contracts/common.md#meaningful-documentation Defines the reference route's JSON response operation.
   */
  json: (value: unknown) => void;
}
