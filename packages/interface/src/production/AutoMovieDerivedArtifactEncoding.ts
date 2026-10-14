/**
 * Representation used to carry derived output through the JSON source context.
 *
 * @evidence contracts/common.md#principled-implementation The closed union labels decoded UTF-8 text or base64 transport of arbitrary bytes. The production decoder is retired; a host must choose and perform the conversion explicitly. UTF-8 text is not universally byte-reversible, including BOM handling, while faithful base64 preserves every byte.
 * @evidence contracts/common.md#clear-and-simple-design Two encoding literals describe the transport of already-derived bytes, separate from artifact media type, generator identity and output digest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The label performs no decoding or invalid-UTF8 refusal itself. Hosts must reject invalid text when promising faithful UTF-8 and use base64 for arbitrary bytes rather than treating lossy decoding as exact payload identity.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes fatal decoded text from reversible base64 byte transport and states the UTF-8 BOM boundary without changing original-byte digest ownership.
 * @author Samchon
 */
export type AutoMovieDerivedArtifactEncoding = "utf8" | "base64";
