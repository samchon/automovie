/**
 * Document and candidate-basis bytes supplied to the viewer's input reader.
 *
 * The host owns directory access; the reader only enumerates names and reads
 * their bytes, so document admission and cache authority can be tested with
 * in-memory inputs without filesystem or photograph access.
 *
 * @evidence contracts/common.md#principled-implementation Keeps disk effects with the host and supplies only the input bytes admission and hashing consume.
 * @evidence contracts/common.md#clear-and-simple-design Two operations express enumeration and byte access without a filesystem implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A caller supplies the real inputs rather than a reader-specific fixture or alternate admission path.
 * @evidence contracts/common.md#meaningful-documentation States the host/reader boundary and why the byte port is separate.
 * @author Samchon
 */
export interface IHumanViewerInputsIo {
  /** Names present in the input directory; the reader validates accepted names. */
  names(): string[];
  /** Bytes of one enumerated document or candidate-basis file. */
  read(name: string): Buffer;
}
