import typia from "typia";

import type { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import { assertTextSize } from "../../common/document/assertTextSize";
import { assertFinite } from "./assertFinite";
import { assertHumanFaceEditableDetail } from "./assertHumanFaceEditableDetail";

/**
 * Read a face document without fetching its provenance or guessing
 * unknown fields. Shape admission is distinct from constructing a valid model:
 * geometry-dependent topology and attachment admission run during build.
 * Editable overrides cannot introduce source-coordinate arrays; an immutable
 * basis recipe may still carry the licensed geometry it replays.
 */
export function parseHumanFaceDocument(
  text: string,
): IAutoMovieHumanFaceDocument {
  assertTextSize(text);
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
