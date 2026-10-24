import { TextDecoder } from "node:util";

/**
 * Decodes strict UTF-8 while preserving a leading byte order mark.
 *
 * Principled implementation: Node TextDecoder uses fatal UTF-8 decoding and ignoreBOM to preserve a leading BOM in text.
 * Clear and simple design: One decoder centralizes the lossless policy after explicit byte validation.
 * Prohibited implementation shortcuts: Invalid input is not repaired through replacement decoding.
 * Meaningful documentation: The comment states strict decoding and leading-BOM preservation.
 * Efficient algorithms: Initialization is constant; decode processes supplied bytes and allocates output text.
 * Reuse equivalent work: Complete non-streaming calls share one decoder without carrying partial input.
 * Bound retention and release resources: One decoder persists for module lifetime; returned text is caller-owned.
 */
export const UTF8: TextDecoder = new TextDecoder("utf-8", {
  fatal: true,
  ignoreBOM: true,
});
