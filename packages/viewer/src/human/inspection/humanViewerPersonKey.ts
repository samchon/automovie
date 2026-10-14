import { createHash } from "node:crypto";

import type { IHumanViewerPersonKeyProps } from "./IHumanViewerPersonKeyProps.js";

/**
 * Numerical identity of a person document, shared by published and file inputs. The document is hashed as read; its schema is admitted by the Person owner when it is built. Both basis bytes and all three runtime authorities participate. An explicit tuple preserves boundaries even when a diagnostic supplies short digests; display size, camera and source frame are not numerical document inputs.
 *
 * @evidence contracts/common.md#principled-implementation A JSON tuple of original document, both basis digests and face/body/person runtime authorities forms the SHA-256 numerical identity.
 * @evidence contracts/common.md#clear-and-simple-design One tuple and digest separate numerical inputs from camera, frame and display size.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit tuple boundaries prevent short authority strings from colliding through concatenation, while schema admission stays with Person.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies original document text and all numerical source authorities and excludes display-only parameters.
 * @evidence contracts/performance.md#efficient-algorithms Tuple serialization and SHA-256 processing are linear in document and authority string bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Equal tuples produce equal keys; equivalence covers numerical inputs and intentionally excludes display settings rather than reusing another document's result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The stateless digest returns one string and retains neither document objects nor model arrays after the call.
 */
export function humanViewerPersonKey(
  props: IHumanViewerPersonKeyProps,
): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        props.document,
        props.bases.face.digest,
        props.bases.body.digest,
        props.sources.face,
        props.sources.body,
        props.sources.person,
      ]),
    )
    .digest("hex");
}
