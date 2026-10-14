import typia from "typia";

import { assertTextSize } from "../../common/document/assertTextSize";
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
 * @evidence contracts/common.md#principled-implementation Shared text admission, JSON/typia exact schema, recursive finite values and immutable-detail population checks admit replay data before nonempty identities. The basis can retain licensed geometry, but component/topology/contact admission is deferred to actual construction.
 * @evidence contracts/common.md#clear-and-simple-design The parser composes distinct schema, finite/cycle and editable-population owners; provenance fetching and numerical face construction remain outside loading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid/oversize text, unknown fields, nonfinite data, source-array overrides or empty identities refuse rather than guessing replacements. Parsing does not prove provenance, anatomy or GPU acceptance.
 * @evidence contracts/common.md#meaningful-documentation Prose explains newly parsed ownership, immutable source geometry versus editable arrays, no fetching, and separate model-dependent admission.
 * @evidence contracts/performance.md#efficient-algorithms JSON/schema/finite traversals follow complete text/data populations; editable admission can compare source hair guides and scan layer matches. Depth follows nested input, with recursion limits separate from text size.
 * @evidence contracts/performance.md#reuse-equivalent-work Saving reparses the actual serialized representation through this same boundary; no mutable document success or source asset is cached here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Newly parsed arrays/objects transfer only on success; temporary traversal sets are local and no source cache, worker or external handle is retained.
 */
export function parseHumanFaceDocument(
  text: string,
): IAutoMovieHumanFaceDocument {
  assertTextSize(text);
  const document: IAutoMovieHumanFaceDocument =
    typia.assertEquals<IAutoMovieHumanFaceDocument>(JSON.parse(text));
  assertFinite(document);
  assertHumanFaceEditableDetail(document);
  if (
    [document.id, document.name, document.basis.id].some(
      (value: string): boolean => value.trim().length === 0,
    )
  )
    throw new Error("Face and basis identities must be nonempty.");
  return document;
}
