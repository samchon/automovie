/** One file of a face study: its bytes (for the receipt's digest) and its parsed JSON. */
export interface IFaceStudyFile<T> {
  bytes: Buffer;
  json: T;
}
