/** Explicit authored-speaker to compiled-actor binding. */
export interface IAutoMovieDialogueSpeakerBinding {
  /** Authored speaker identity carried by the dialogue line. */
  speaker: string;
  /** Resolved actor node that owns the mouth layer. */
  actor: string;
}
