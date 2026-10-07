/**
 * Content identity of an unchanged face basis projected from a person head view.
 *
 * @author Samchon
 */
export interface IHumanSourceFaceProjectionReceipt {
  /** Original person generation, retained by the face's source registrations. */
  generation: string;

  /** Exact face basis identity a numerical face document must name. */
  face: string;

  /** SHA-256 of the complete input head gzip. */
  headSha256: string;

  /** SHA-256 of the unchanged face JSON plus the producer's terminal newline. */
  faceJsonSha256: string;

  /** SHA-256 and size of the standalone face gzip. */
  faceGzipSha256: string;

  /** See `faceGzipSha256`. */
  faceGzipBytes: number;

  /** Quantities preserved and the isolated consumer's remaining boundary. */
  qualification: string;
}
