/**
 * One local filesystem fact read while pinning the compiler's producer graph.
 * Physical paths remain run-local; the generation records only portable names
 * and byte digests. Rechecking these facts catches an edit or a newly resolved
 * candidate during compilation before any candidate artifacts are written.
 *
 * @author Samchon
 */
export interface IHumanSourceProducerObservation {
  /** Actual path read in this checkout or its installed dependency tree. */
  physicalPath: string;

  /** Repository-relative or package-name/version-relative content locator. */
  publicPath: string;

  /** Whether the observed path was a file, directory or absent candidate. */
  kind: "file" | "directory" | "absent";

  /** Physical target of an existing path, kept only to detect retargeting. */
  realpath: string | null;

  /** Bytes of a file, sorted directory membership, or the absence marker. */
  bytes: number;

  /** SHA-256 of the observed bytes under its declared kind. */
  sha256: string;
}
