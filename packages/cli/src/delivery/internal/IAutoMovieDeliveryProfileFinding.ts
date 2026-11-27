/*
 * One way an encoded delivery file differs from the profile it must carry, as
 * `auditDeliveryProfile` records it in the render report.
 *
 * `field` is the profile field the asserter names after
 * `unsupported-video-profile.` or `unsupported-audio-profile.`, such as
 * `color.resolved.kind` or `sampleRate`; `track` when a film without a
 * soundtrack holds an audio track; or `probe` when the file's boxes could not
 * be read. `expected` and `observed` are the values as the asserter spells
 * them.
 */
export interface IAutoMovieDeliveryProfileFinding {
  /*
   * The track the finding concerns.
   */
  media: "video" | "audio";

  /*
   * The profile field that differs.
   */
  field: string;

  /*
   * The value the profile requires.
   */
  expected: string;

  /*
   * The value the file holds.
   */
  observed: string;
}
