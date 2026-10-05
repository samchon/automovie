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

  /**
   * What a file is: a candidate basis (its opening id), a person candidate
   * packet (its id and face/body ids) or a published generation view (its id
   * and member ids).
   */
  kind: (file: string) => "basis" | "person" | "view";
}
