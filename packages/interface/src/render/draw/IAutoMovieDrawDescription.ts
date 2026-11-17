import type { IAutoMovieCaptureSubject } from "../capture/IAutoMovieCaptureSubject.js";

/**
 * What a draw page says about itself before anything is drawn: the subject a capture is planned against, and the WebGL renderer that will draw it.
 *
 * @evidence contracts/development/design.md#principled-representation The subject in the capture core's own record, and the renderer as the string WebGL reports, which a record names beside the backend so an observation repeats.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `AutoMovieDrawSession.open`: the subject goes to `planAutoMovieCapture`, the renderer into every drawn row's backend.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The renderer is reported, never assumed from the launch switches, because a backend the browser could not start falls back without saying so.
 * @evidence contracts/development/common.md#meaningful-documentation States who reads each member and why the renderer is reported.
 */
export interface IAutoMovieDrawDescription {
  /** The created subject as a capture plans against it. */
  subject: IAutoMovieCaptureSubject;

  /** The WebGL renderer string, unmasked where the browser allows it, such as one naming SwiftShader. */
  renderer: string;
}
