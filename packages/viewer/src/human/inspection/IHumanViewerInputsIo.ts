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
 *
 * @author Samchon
 */
export interface IHumanViewerInputsIo {
  /**
   * Names present in the input directory; the reader validates accepted names.
   *
   * @evidence contracts/common.md#principled-implementation The host supplies actual input-directory names before reader validation.
   * @evidence contracts/common.md#clear-and-simple-design Enumeration is one borrowed operation rather than a filesystem owned by catalogue reading.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The reader receives actual input names and applies the same name rules to all documents.
   * @evidence contracts/common.md#meaningful-documentation The result lists present names; acceptance remains the reader's separate decision.
   */
  names(): string[];

  /**
   * Bytes of one enumerated document or candidate-basis file.
   *
   * @evidence contracts/common.md#principled-implementation The host supplies bytes of the enumerated document or candidate-basis resource.
   * @evidence contracts/common.md#clear-and-simple-design The reader consumes a Buffer without owning disk access.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The real bytes reach admission and hashing without a fixture-only alternate path.
   * @evidence contracts/common.md#meaningful-documentation The argument names an enumerated file and failure propagates instead of returning invented content.
   */
  read(name: string): Buffer;

  /**
   * The file's version stamp (modification time and size); without it no result is reused.
   *
   * @evidence contracts/common.md#principled-implementation An optional version witness lets the reader reuse a file result only while its input stays unchanged.
   * @evidence contracts/common.md#clear-and-simple-design Change detection remains with the input provider.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Without a stamp, a cached read cannot claim unchanged bytes from filename equality alone.
   * @evidence contracts/common.md#meaningful-documentation The stamp describes modification time and size; omission disables result reuse.
   */
  stamp?(name: string): string;
}
