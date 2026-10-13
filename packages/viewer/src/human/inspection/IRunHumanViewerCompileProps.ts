/**
 * Where the human compile runs and writes.
 *
 * @evidence contracts/common.md#principled-implementation The compile request names the actual viewer entry directory, Human package and output directory.
 * @evidence contracts/common.md#clear-and-simple-design Explicit paths leave process execution and compiler lifetime with the compile owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The path record introduces no source rewriting, alternative compiler or runtime patch.
 * @evidence contracts/common.md#meaningful-documentation Documents where the existing compile entry runs and where its output is written.
 * @author Samchon
 */
export interface IRunHumanViewerCompileProps {
  /** The viewer script directory holding `compile-human.mts`. */
  directory: string;

  /** The human package directory to compile. */
  human: string;

  /** Directory for the compile output file. */
  outputDirectory: string;
}
