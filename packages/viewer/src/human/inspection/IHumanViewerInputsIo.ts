/**
 * Document and candidate-basis bytes supplied to the viewer's input reader.
 *
 * The host owns directory access; the reader only enumerates names and reads
 * their bytes, so document admission and cache authority can be tested with
 * in-memory inputs without filesystem or photograph access.
 *
 * @author Samchon
 */
export interface IHumanViewerInputsIo {
  /**
   * Names present in the input directory; the reader validates accepted names.
   */
  names(): string[];

  /** Bytes of one enumerated document or candidate-basis file. */
  read(name: string): Buffer;

  /**
   * The file's version stamp (modification time and size); without it no result is reused.
   */
  stamp?(name: string): string;
}
