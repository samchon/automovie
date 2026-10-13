import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/** Final encoded audio identity retained by sound evidence. */
export interface IAutoMovieProductionSoundEvidenceAudio {
  /** Render-root-relative sibling audio path. */
  path: string;

  /** Closed final audio media type. */
  mediaType: "audio/mp4";

  /** Exact sibling audio byte length. */
  bytes: number;

  /** Digest of the exact sibling audio bytes. */
  digest: AutoMovieContentDigest;
}
