import {
  IAutoMovieSemanticMask,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "./autoMovieRenderDigest";
import { canonicalAutoMovieSemanticMaskPayload } from "./canonicalAutoMovieSemanticMaskPayload";

/**
 * Return the digest of one mask's complete canonical payload.
 *
 * Every semantic field participates, while collection order does not. Entries,
 * their node joins, and bounded-palette gaps are sorted by their stable ids
 * before an explicit-field-order JSON document is hashed. The self-declared
 * digest is deliberately absent from that document.
 *
 * @evidence contracts/common.md#principled-implementation Hash JSON of canonicalAutoMovieSemanticMaskPayload, retaining every current semantic field while excluding self-declared digest and normalizing collection order; valid typed values are a producer premise.
 * @evidence contracts/common.md#clear-and-simple-design The shared payload projector owns field/order semantics and autoMovieRenderDigest owns bytes/SHA, so the digest owner only composes those two responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No entity, gap or metadata field is skipped because of a consumer or fixture; projection alone does not validate unknown keys, graph links or scalar types.
 * @evidence contracts/common.md#meaningful-documentation Docs state complete v2 payload, digest exclusion and sorted entries/nodes/gaps; callers needing runtime admission invoke verifyAutoMovieSemanticMask.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes entry/gap/node sorting, canonical output of B bytes and O(B) UTF-8/SHA work; storage includes projected records and encoded/padded bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Digest and sidecar share the projector; mutable mask fields mean received evidence is rehashed rather than reused by object identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the digest string escapes; payload records and bytes are call-local and no file/crypto handle or worker is retained.
 */
export const digestAutoMovieSemanticMask: (mask: Omit<IAutoMovieSemanticMask, "digest">) => string = (
  mask: Omit<IAutoMovieSemanticMask, "digest">,
): string =>
  autoMovieRenderDigest(JSON.stringify(canonicalAutoMovieSemanticMaskPayload(mask)));
