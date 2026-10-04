/**
 * Access to the inputs directory for the sidecar reader, and whom to tell
 * when a sidecar's facts become known.
 *
 * @evidence contracts/common.md#clear-and-simple-design The host owns disk access and catalogue publication; the reader owns only facts.
 * @evidence contracts/common.md#meaningful-documentation Names every input.
 * @author Samchon
 */
export interface ICreateHumanViewerSidecarFactsProps {
  /** A version stamp that changes whenever the file's bytes change. */
  stamp: (file: string) => string;

  /** Streams the file's bytes. */
  stream: (file: string) => AsyncIterable<Buffer>;

  /** Called after new facts were stored, so the host can republish its catalogue. */
  changed: () => void;
}
