import type { IAutoMovieSemanticMaskReceipt } from "../render/IAutoMovieSemanticMaskReceipt";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/** One byte-exact file proving a final production deliverable. */
export interface IAutoMovieProductionDeliverableFile {
  /** Render-root-relative regular file path. */
  path: string;

  /** Exact file-byte digest. */
  digest: AutoMovieContentDigest;

  /** Exact non-zero file size. */
  bytes: number;

  /** Explicit media type, such as video/mp4 or text/vtt. */
  mediaType: string;

  /**
   * Semantic identity carried by a mask sidecar.
   *
   * Omitted for every ordinary media file. When present, its sidecar path is
   * this file's path and the final reader reopens the JSON bytes against the
   * shot, frame, palette digest, and coverage recorded here.
   */
  semanticMask?: IAutoMovieSemanticMaskReceipt;
}
