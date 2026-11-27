import type { IAutoMovieCaptureSubject } from "./IAutoMovieCaptureSubject.js";

/**
 * What a draw page says about itself before anything is drawn: the subject a
 * capture is planned against, and the WebGL renderer that will draw it.
 */
export interface IAutoMovieDrawDescription {
  /** The created subject as a capture plans against it. */
  subject: IAutoMovieCaptureSubject;

  /**
   * The WebGL renderer string, unmasked where the browser allows it, such as
   * one naming SwiftShader.
   */
  renderer: string;
}
