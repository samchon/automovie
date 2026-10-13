import type { IAutoMovieSemanticMaskReceipt } from "../render/IAutoMovieSemanticMaskReceipt";

/**
 * One byte-exact regular file recorded for a final production deliverable.
 *
 * @evidence contracts/common.md#principled-implementation Render publication records relative path, exact digest, nonzero size and media type; final validation reopens resident bytes and derives media facts instead of trusting those claims alone.
 * @evidence contracts/common.md#clear-and-simple-design File ownership and byte identity are common across media, with an optional semantic-mask receipt only for the sidecar that needs shot, frame, palette and coverage identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A path or declared media type cannot prove a deliverable; regular-file containment, byte identity and parser-derived facts are checked, and a semantic sidecar is reopened against its own receipt.
 * @evidence contracts/common.md#meaningful-documentation Defines render-root-relative regular paths, byte digest and size, media type and the semantic-mask-only receipt association.
 * @author Samchon
 */
export interface IAutoMovieProductionDeliverableFile {
  /** Render-root-relative regular file path. */
  path: string;

  /** Exact file-byte digest. */
  digest: string;

  /** Exact non-zero file size. */
  bytes: number;

  /** Explicit media type, such as video/mp4 or text/vtt. */
  mediaType: string;

  /**
   * Semantic identity carried by a mask sidecar.
   *
   * Omitted for every ordinary media file. When present, its sidecar path is this file's path and the final reader reopens the JSON bytes against the shot, frame, palette digest, and coverage recorded here.
   */
  semanticMask?: IAutoMovieSemanticMaskReceipt;
}
