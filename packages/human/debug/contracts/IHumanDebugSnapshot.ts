/**
 * What the page reports after drawing one frame; the image route returns it with the PNG.
 *
 * Every field is read back from the drawn state, never recomputed for the report.
 */
export interface IHumanDebugSnapshot {
  /** Canonical search text of the applied options. */
  query: string;

  /** Notices of the applied options and of the subject load; empty when everything was accepted. */
  notices: string[];

  /** The subject drawn: person alias and piece, or null when no subject loaded. */
  subject: { person: string; piece: string | null } | null;

  /** Producer facts of the subject. */
  provenance: Record<string, unknown> | null;

  /** Ids shown. */
  shown: { parts: string[]; curves: string[] };

  /** Every part and curve id of the subject, in document order. */
  inventory: { parts: string[]; curves: string[] };

  /** Camera placement as drawn, metres and radians, or null before the first framing. */
  camera: Record<string, unknown> | null;

  /** Section plane position in mm, or null. */
  section: number | null;

  /** Drawing-buffer size in pixels and the WebGL renderer string. */
  canvas: { width: number; height: number; gpu: string };

  /** Milliseconds the latest subject load took, or null when the subject was already loaded. */
  loadMilliseconds: number | null;

  /**
   * Source hash the server reported when the page's modules had all loaded, before anything was
   * generated; null when the page could not read it. Every static import has evaluated by then and
   * the page loads no module later, so this names the bytes every frame of the page was drawn from.
   */
  source: string | null;
}
