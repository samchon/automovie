/**
 * File publication effects inside the owning package. Digests describe actual
 * complete file bytes; replacement publishes one staged file without moving
 * its watched parent directory. Names are relative to their inventory root.
 *
 * @author Samchon
 */
export interface IHumanBuildFileHost {
  /** Read the complete ordinary-file membership and digests of a root. */
  files(directory: string): readonly { file: string; digest: string }[];

  /** Copy a staged file to an exclusive sibling and rename it onto its target. */
  replace(source: string, output: string, file: string): void;

  /** Remove an obsolete output file while retaining watched directories. */
  remove(output: string, file: string): void;
}
