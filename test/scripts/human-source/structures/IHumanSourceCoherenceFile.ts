/**
 * Byte comparison of one source stage file that carries no coordinate.
 *
 * @author Samchon
 */
export interface IHumanSourceCoherenceFile {
  /** File name inside both source stage directories. */
  file: string;

  /** SHA-256 in the reference stage, or null when the file is absent there. */
  referenceSha256: string | null;

  /** SHA-256 in the candidate stage, or null when the file is absent there. */
  candidateSha256: string | null;

  /** True when both exist with the same bytes. */
  equal: boolean;
}
