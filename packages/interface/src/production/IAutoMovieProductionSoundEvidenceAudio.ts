/** Final encoded audio identity retained by the sibling sound evidence record. */
export interface IAutoMovieProductionSoundEvidenceAudio {
  /** Render-root-relative sibling audio path. */
  path: string;

  /** Closed final audio media type. */
  mediaType: "audio/mp4";

  /** Exact sibling audio byte length. */
  bytes: number;

  /** Digest of the exact sibling audio bytes. */
  digest: string;
}
