/**
 * The scaffold's settings domains under `docs/body/settings`, in reading order.
 *
 * One list serves both the filesystem reader's order and validation and the
 * evidence selector's globs, so the two cannot disagree about which domain
 * folders hold canon.
 */
export const SETTINGS_DOMAINS: readonly string[] = [
  "world",
  "cast",
  "crowds",
  "props",
  "sets",
  "cinematography",
  "sound",
];
