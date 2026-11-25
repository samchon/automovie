import type { IAutoMovieByteDigest } from "../index";

/**
 * Location and exact-byte identity of one completed file publication. Paths
 * retain the publishing host's spelling and resolution base; this contract
 * neither resolves them nor promises they are absolute. The publisher owns
 * atomic creation and handle closure. A reader verifies bytes before accepting
 * a later acquisition; a receipt alone cannot prevent replacement at the same
 * path.
 */

export interface IAutoMovieFileReceipt extends IAutoMovieByteDigest {
  /**
   * Published path in the caller's host namespace; readers use that host's
   * resolution base.
   */
  path: string;
}
