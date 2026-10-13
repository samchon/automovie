/**
 * Encoding used to carry exact derived bytes through the JSON source context.
 *
 * @evidence contracts/common.md#principled-implementation UTF-8 carries decodable text and base64 transports arbitrary bytes through JSON; derived-artifact serialization validates UTF-8 with fatal decoding before producing the corresponding string.
 * @evidence contracts/common.md#clear-and-simple-design Two encoding literals describe the transport of already-derived bytes, separate from artifact media type, generator identity and output digest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Binary artifacts are not coerced through lossy text decoding; invalid UTF-8 is a refusal when text encoding was declared, while base64 preserves the byte sequence.
 * @evidence contracts/common.md#meaningful-documentation States that the discriminator chooses exact-byte JSON transport, with UTF-8 for text and base64 for arbitrary derived payloads.
 * @author Samchon
 */
export type AutoMovieDerivedArtifactEncoding = "utf8" | "base64";
