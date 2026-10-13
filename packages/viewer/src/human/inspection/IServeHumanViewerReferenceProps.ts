import type { ServerResponse } from "node:http";

/**
 * Local photograph routes read existing images and never move or write them.
 *
 * @evidence contracts/common.md#principled-implementation Reference routes consume existing photographs separately from repository pose records and catalogue identities.
 * @evidence contracts/common.md#clear-and-simple-design The input record separates readonly reference storage from HTTP JSON and byte responses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Photograph access supplies comparison inputs and cannot move, rewrite or derive a numerical model from them.
 * @evidence contracts/common.md#meaningful-documentation Documents the parsed reference request, original image response, read-only directory and document lookup population.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-provenance Reference routes consume existing photographs separately from repository pose records and catalogue identities.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-provenance The input record separates readonly reference storage from HTTP JSON and byte responses.
 * @author Samchon
 */
export interface IServeHumanViewerReferenceProps {
  /**
   * Parsed reference request.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-provenance Parsed reference request. Reference routes consume existing photographs separately from repository pose records and catalogue identities.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-provenance Parsed reference request. The input record separates readonly reference storage from HTTP JSON and byte responses.
   */
  url: URL;

  /**
   * Response receiving metadata or the original image bytes.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-provenance Response receiving metadata or the original image bytes. Reference routes consume existing photographs separately from repository pose records and catalogue identities.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-provenance Response receiving metadata or the original image bytes. The input record separates readonly reference storage from HTTP JSON and byte responses.
   */
  response: ServerResponse;

  /**
   * Application-owned pose acquisition record file, read only as display metadata.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Application-owned pose acquisition record file, read only as display metadata. Reference routes consume existing photographs separately from repository pose records and catalogue identities.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review Application-owned pose acquisition record file, read only as display metadata. The input record separates readonly reference storage from HTTP JSON and byte responses.
   */
  cameraPosesFile: string;

  /**
   * Read-only directory of existing reference photographs.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-provenance Read-only directory of existing reference photographs. Reference routes consume existing photographs separately from repository pose records and catalogue identities.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-provenance Read-only directory of existing reference photographs. The input record separates readonly reference storage from HTTP JSON and byte responses.
   */
  referenceDirectory: string;

  /**
   * Catalogue document identities to look up.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Catalogue document identities to look up. Reference routes consume existing photographs separately from repository pose records and catalogue identities.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Catalogue document identities to look up. The input record separates readonly reference storage from HTTP JSON and byte responses.
   */
  documents: readonly string[];

  /**
   * Sends a JSON response.
   *
   * @evidence contracts/common.md#principled-implementation Reference JSON output returns photograph metadata or lookup results from this route.
   * @evidence contracts/common.md#clear-and-simple-design The route borrows HTTP serialization without changing reference image ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Sending reference metadata does not create or admit an anatomical reconstruction.
   * @evidence contracts/common.md#meaningful-documentation Defines the reference route's JSON response operation.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-provenance Reference JSON output returns photograph metadata or lookup results from this route.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-provenance The route borrows HTTP serialization without changing reference image ownership.
   */
  json: (value: unknown) => void;
}
