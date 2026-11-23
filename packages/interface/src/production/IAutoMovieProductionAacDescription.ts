/**
 * The facts an MP4 `mp4a` audio sample entry stores in its `esds`
 * AudioSpecificConfig (ISO/IEC 14496-3 §1.6.2.1), as a delivery probe reads
 * them from the file; acceptance against the AAC delivery profile is checked
 * separately by `assertProductionAacProfile`.
 *
 * A sample entry of another codec is described by its four-character type in
 * `codec`, with the three AAC fields 0, so the profile names the codec it
 * refuses.
 */
export interface IAutoMovieProductionAacDescription {
  /** The sample entry's four-character type: `mp4a` for MPEG-4 audio. */
  codec: string;

  /** MPEG-4 audio object type; 2 is AAC-LC. */
  audioObjectType: number;

  /** Sampling frequency the configuration declares, in hertz. */
  sampleRate: number;

  /**
   * Channel configuration the configuration declares; 2 is stereo, front left
   * then front right.
   */
  channelCount: number;
}
