/** An explicit speaker-to-actor identity pair supplied to the viseme join. */
export interface IAutoMovieDialogueSpeakerBinding {
  /** Authored speaker identity carried by the dialogue line. */
  speaker: string;

  /** Resolved actor node that owns the mouth layer. */
  actor: string;
}
