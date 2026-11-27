/**
 * The one AAC-in-MP4 audio profile a delivered film's soundtrack must carry:
 * the facts the `mp4a` sample entry stores and the delivery encoder sets,
 * AAC-LC at 48 kHz in two channels. `AutoMovieRenderProductionAacProfile` supplies
 * these literals to `assertProductionAacProfile`.
 *
 * The encoder's 192 kb/s rate is a setting the file does not store as a fact a
 * check can read, so the profile does not hold it.
 */
export interface IAutoMovieProductionAacProfile {
  /** Required sample-entry type. */
  codec: "mp4a";

  /** Required MPEG-4 audio object type, AAC-LC. */
  audioObjectType: 2;

  /** Required sample rate in hertz, which is also the track's media timescale. */
  sampleRate: 48000;

  /** Required channel count, stereo. */
  channelCount: 2;
}
