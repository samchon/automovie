import { createHash } from "node:crypto";

import type { IHumanViewerPersonKeyProps } from "./IHumanViewerPersonKeyProps";

/**
 * Numerical identity of a person document, shared by published and file inputs.
 * The document is hashed as read; its schema is admitted by the Person owner
 * when it is built.
 * Both basis bytes and all three runtime authorities participate. An explicit
 * tuple preserves boundaries even when a diagnostic supplies short digests;
 * display size, camera and source frame are not numerical document inputs.
 *
 * @evidence contracts/common.md#principled-implementation Composition dependencies participate independently of the isolated face and body builders.
 * @evidence contracts/common.md#clear-and-simple-design Published and handwritten people call one identity formula.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Identity hashes the document as read and actual runtime digests without subject-specific invalidation.
 * @evidence contracts/common.md#meaningful-documentation Names numerical provenance and the display state that stays outside it.
 */
export function humanViewerPersonKey(props: IHumanViewerPersonKeyProps): string {
  return createHash("sha256").update(JSON.stringify([
    props.document,
    props.bases.face.digest,
    props.bases.body.digest,
    props.sources.face,
    props.sources.body,
    props.sources.person,
  ])).digest("hex");
}
