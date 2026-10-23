/**
 * Names replacement and mojibake signals checked against the immutable ancestor.
 *
 * Principled implementation: Six fixed tokens signal possible replacement corruption or mojibake for ancestor comparison.
 * Clear and simple design: One readonly tuple owns the signal vocabulary.
 * Prohibited implementation shortcuts: Signals are explicit heuristics; absence does not establish that other text is valid.
 * Meaningful documentation: The comment states the ancestor-comparison role and exposes the exact tokens.
 * Efficient algorithms: Six literal entries require constant initialization; content scans belong to replacementSafety.
 * Reuse equivalent work: The same tuple serves every verification without rebuilding the vocabulary.
 * Bound retention and release resources: The module retains six fixed strings and no per-file observations.
 */
export const SUSPICIOUS: readonly ["??", "Ã", "Â", "â€", "", ""] = [
  "??",
  "\u00c3",
  "\u00c2",
  "\u00e2\u20ac",
  "\u0080",
  "\u008d",
] as const;
