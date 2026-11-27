/** Input for opening a draw session through the CLI capture host. */
export interface IAutoMovieCliCaptureSessionInput {
  /** Name of the subject, or null for the page's only subject. */
  subject: string | null;

  /** Data the subject module reads, as JSON, or null. */
  props: unknown;
}
