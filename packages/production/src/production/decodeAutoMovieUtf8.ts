import type { AutoMovieLeadingBomPolicy } from "./AutoMovieLeadingBomPolicy";
import { AutoMovieUtf8Error } from "./AutoMovieUtf8Error";
import { validateUtf8 } from "./validateUtf8";

/**
 * Validate UTF-8 scalar bytes, then apply the caller's initial-BOM policy and decode without replacement characters.
 *
 * @evidence contracts/common.md#principled-implementation The existing scalar walk rejects invalid sequences at their proving offsets before fatal TextDecoder decoding; ignoreBOM:true and explicit slicing preserve, strip or reject exactly one initial BOM.
 * @evidence contracts/common.md#clear-and-simple-design Record owners select BOM policy while validateUtf8 owns byte categories; this decoder returns only the actual decoded string.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Interior BOMs, whitespace and Unicode normalization forms remain unchanged; no malformed-byte substitution or guessed alternate encoding occurs.
 * @evidence contracts/common.md#meaningful-documentation Documents logical record identity, exact byte input, initial-only BOM policy and typed encoding refusal.
 * @evidence contracts/performance.md#efficient-algorithms Validation and decoding each traverse B bytes with fixed-size scalar checks; output text allocation is input-sized and no byte quota is imposed.
 * @evidence contracts/performance.md#reuse-equivalent-work Every invocation observes the current mutable byte view; no decoded-text or path-key cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input bytes are borrowed; temporary TextDecoder and returned string acquire no handle, and successful text transfers to the caller.
 *
 * @author Samchon
 */
export function decodeAutoMovieUtf8(props: {
  /** Logical record or asset named by any refusal. */
  record: string;

  /** Exact bytes to decode. */
  bytes: Uint8Array;

  /** Domain-specific treatment of one initial BOM. */
  leadingBom: AutoMovieLeadingBomPolicy;
}): string {
  validateUtf8(props.record, props.bytes);
  const hasBom: boolean =
    props.bytes.length >= 3 &&
    props.bytes[0] === 0xef &&
    props.bytes[1] === 0xbb &&
    props.bytes[2] === 0xbf;
  if (hasBom && props.leadingBom === "reject")
    throw new AutoMovieUtf8Error(props.record, 0, "unexpected-bom");
  const start: number = hasBom && props.leadingBom === "strip" ? 3 : 0;
  return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
    props.bytes.subarray(start),
  );
}
