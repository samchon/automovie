/**
 * Access to the inputs directory for the sidecar reader, and whom to tell
 * when a sidecar's facts become known.
 *
 * @evidence contracts/common.md#clear-and-simple-design The host owns disk access and catalogue publication; the reader owns only facts.
 * @evidence contracts/common.md#meaningful-documentation Names every input.
 *
 * @evidence contracts/common.md#principled-implementation A byte stream and changing file stamp bind sidecar identities and digests to the provider's current input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The basis, person and view alternatives identify existing packet formats rather than named sample datasets.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerSidecarFactsProps {
  /**
   * A version stamp that changes whenever the file's bytes change.
   *
   * @evidence contracts/common.md#principled-implementation The provider returns the file version used to decide whether known sidecar facts remain reusable.
   * @evidence contracts/common.md#clear-and-simple-design The reader borrows change detection while owning the derived facts.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A file name alone cannot authorize reuse after its bytes changed.
   * @evidence contracts/common.md#meaningful-documentation The stamp must change whenever the provider's actual file bytes change.
   */
  stamp: (file: string) => string;

  /**
   * Streams the file's bytes.
   *
   * @evidence contracts/common.md#principled-implementation Actual sidecar bytes arrive asynchronously for incremental digesting and structural reading.
   * @evidence contracts/common.md#clear-and-simple-design The host owns disk access and the reader consumes byte chunks.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The stream supplies real source content rather than a sample packet substitute.
   * @evidence contracts/common.md#meaningful-documentation Chunks are Buffers from the selected file; read failures propagate to sidecar failure state.
   */
  stream: (file: string) => AsyncIterable<Buffer>;

  /**
   * Called after new facts were stored, so the host can republish its catalogue.
   *
   * @evidence contracts/common.md#principled-implementation The host republishes catalogue state after new sidecar facts are stored.
   * @evidence contracts/common.md#clear-and-simple-design The reader owns the facts and the host owns publication.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Pending sidecar work cannot be represented as completed facts before storage.
   * @evidence contracts/common.md#meaningful-documentation The notification follows a stored digest, identity or preserved failure.
   */
  changed: () => void;

  /**
   * What a file is: a candidate basis (its opening id), a person candidate
   * packet (its id and face/body ids) or a typed generation view (its id
   * and member ids).
   *
   * @evidence contracts/common.md#principled-implementation The provider identifies whether the selected sidecar is a basis, Person packet or generation view.
   * @evidence contracts/common.md#clear-and-simple-design Format routing remains one host decision rather than repeated packet-type guesses.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The supported discriminants choose existing readers rather than a subject-specific parser.
   * @evidence contracts/common.md#meaningful-documentation The result names the format whose identities the sidecar reader must inspect.
   */
  kind: (file: string) => "basis" | "person" | "view";
}
