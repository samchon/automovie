/**
 * Representation used to carry derived output through the JSON source context.
 *
 * @evidence contracts/common.md#principled-implementation derivedArtifactSourceArtifact uses fatal UTF-8 TextDecoder for text and Buffer base64 for arbitrary bytes. Default text decoding consumes a leading UTF-8 BOM, so utf8 content is decoded text rather than a universally byte-reversible representation; the separate digest still names the original verified output bytes.
 * @evidence contracts/common.md#clear-and-simple-design Two encoding literals describe the transport of already-derived bytes, separate from artifact media type, generator identity and output digest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Binary artifacts are not coerced through lossy text decoding; invalid UTF-8 is a refusal when text encoding was declared, while base64 preserves the byte sequence.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes fatal decoded text from reversible base64 byte transport and states the UTF-8 BOM boundary without changing original-byte digest ownership.
 * @author Samchon
 */
export type AutoMovieDerivedArtifactEncoding = "utf8" | "base64";
