/**
 * Access to the inputs directory for the sidecar reader, and whom to tell
 * when a sidecar's facts become known.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerSidecarFactsProps {
  /** A version stamp that changes whenever the file's bytes change. */
  stamp: (file: string) => string;

  /** Streams the file's bytes. */
  stream: (file: string) => AsyncIterable<Buffer>;

  /**
   * Called after new facts were stored, so the host can republish its catalogue.
   */
  changed: () => void;

  /**
   * What a file is: a candidate basis (its opening id), a person candidate
   * packet (its id and face/body ids) or a typed generation view (its id
   * and member ids).
   */
  kind: (file: string) => "basis" | "person" | "view";
}
