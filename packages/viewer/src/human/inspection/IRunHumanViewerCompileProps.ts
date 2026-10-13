/**
 * Where the human compile runs and writes.
 *
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
