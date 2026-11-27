/**
 * Settings of the envelope jaw, `autoMovieDialogueEnvelopeJaw`, which opens a
 * speaker's jaw from a line's frame level when the line has no phoneme chunks.
 *
 * `floorDbfs` is −50 dBFS, the level of the quietest room-tone bed #4056
 * describes, so breath and room noise inside a line leave the jaw closed.
 * `fullDbfs` is −20 dBFS, about the RMS level of a voiced frame in a line
 * levelled near the −23 LUFS dialogue target, so ordinary speech reaches the
 * full opening. `maximumOpeningMm` is 12 mm: jaw opening in conversational
 * speech is of the order of ten millimetres, well inside the 0 to 52.9 mm range
 * of `IAutoMovieHumanJawPose.opening`, which is the anatomical limit. The
 * opening rises linearly in dB between the two levels. These are the envelope
 * jaw's chosen defaults, not values fitted to recorded speech.
 */
export const AUTOMOVIE_DIALOGUE_ENVELOPE_JAW: Readonly<{
  /** Frame level at or below which the jaw stays closed, in dBFS. */
  floorDbfs: number;

  /** Frame level at or above which the jaw opens fully, in dBFS. */
  fullDbfs: number;

  /** The full speech opening, in millimetres at the incisors. */
  maximumOpeningMm: number;
}> = {
  floorDbfs: -50,
  fullDbfs: -20,
  maximumOpeningMm: 12,
};
