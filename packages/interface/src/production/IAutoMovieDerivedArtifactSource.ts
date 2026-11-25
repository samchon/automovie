import type { AutoMovieDerivedArtifactEncoding } from "./AutoMovieDerivedArtifactEncoding";

/** One current derived artifact projected into deterministic source context. */
export interface IAutoMovieDerivedArtifactSource {
  /** Current output digest verified before context publication. */
  digest: string;

  /** Whether content is direct UTF-8 text or base64 of raw bytes. */
  encoding: AutoMovieDerivedArtifactEncoding;

  /** Verified text or base64 payload. */
  content: string;
}
