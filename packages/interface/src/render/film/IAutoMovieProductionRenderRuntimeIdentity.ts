import type { IAutoMovieCaptureRuntimeIdentity } from "../../production/IAutoMovieCaptureRuntimeIdentity.js";
import type { IAutoMovieProductionEncoderIdentity } from "./IAutoMovieProductionEncoderIdentity.js";

/**
 * Capture and encoder identity shared by every chunk of one render job.
 *
 * Every chunk id digests the whole record, so a change to the viewer bytes, the
 * browser, the graphics backend, the dialogue runtime or the encoder gives
 * every chunk a new id. `planProductionRenderJob` refuses a `sourceDigest` or
 * non-null `dialogueRuntimeIdentity` that is not a SHA-256 content digest; the
 * caller supplies the rest.
 */
export interface IAutoMovieProductionRenderRuntimeIdentity {
  /** Schema of this record; changes when its meaning changes. */
  protocolVersion: "automovie.production-render-runtime.v3";

  /** SHA-256 digest of the declared viewer, capture, asset and package bytes. */
  sourceDigest: string;

  /**
   * SHA-256 digest of the dialogue and viseme runtime installed for every
   * capture, or null when the production synthesizes no dialogue.
   */
  dialogueRuntimeIdentity: string | null;

  /** Browser, graphics and installed-package identity of the capture host. */
  capture: IAutoMovieCaptureRuntimeIdentity;

  /** Encoder package, closure and byte-affecting settings. */
  encoder: IAutoMovieProductionEncoderIdentity;
}
