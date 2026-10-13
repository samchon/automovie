import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * One source or dependency file sealed into an external motion receipt.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionReceiptResource {
  /** Production-relative path of the pinned source byte file. */
  path: string;

  /** Content digest of the exact resident bytes. */
  digest: AutoMovieContentDigest;
}
