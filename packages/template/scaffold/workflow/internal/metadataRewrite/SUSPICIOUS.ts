/** Names replacement and mojibake signals checked against the immutable ancestor. */
export const SUSPICIOUS: readonly ["??", "Ã", "Â", "â€", "", ""] = [
  "??",
  "\u00c3",
  "\u00c2",
  "\u00e2\u20ac",
  "\u0080",
  "\u008d",
] as const;
