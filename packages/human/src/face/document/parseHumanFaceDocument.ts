import typia from "typia";

import type { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import { assertFinite } from "./assertFinite";
import { assertHumanFaceEditableDetail } from "./assertHumanFaceEditableDetail";

/**
 * Read a face document without fetching its provenance or guessing
 * unknown fields. Shape admission is distinct from constructing a valid model:
 * geometry-dependent topology and attachment admission run during build.
 * Editable overrides cannot introduce source-coordinate arrays; an immutable
 * basis recipe may still carry the licensed geometry it replays.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Loads the complete independent face document without a measurement runtime.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Refuses an unsupported landmark topology and unknown nested fields rather than silently dropping them.
 */
export function parseHumanFaceDocument(
  text: string,
): IAutoMovieHumanFaceDocument {
  if (text.length > 16 * 1024 * 1024)
    throw new Error(
      "Face documents must fit within 16,777,216 UTF-16 code units.",
    );
  const document = typia.assertEquals<IAutoMovieHumanFaceDocument>(
    JSON.parse(text),
  );
  assertFinite(document);
  assertHumanFaceEditableDetail(document);
  if (
    [document.id, document.name, document.basis.id].some(
      (value) => value.trim().length === 0,
    )
  )
    throw new Error("Face and basis identities must be nonempty.");
  return document;
}
