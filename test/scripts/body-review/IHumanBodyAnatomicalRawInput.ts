/** Exact original acquired/authored input bytes admitted by the source compiler. @author Samchon */
export interface IHumanBodyAnatomicalRawInput {
  /** Original source file, resolved against the compilation plan. */
  file: string;
  /** Actual original bytes SHA-256, independently of registered mesh serialization. */
  sha256: string;
}
