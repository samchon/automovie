/**
 * One human module as a compile generation transformed it, with the identity
 * of that generation.
 *
 * @author Samchon
 */
export interface IHumanViewerCompiledSource {
  /** The transformed TypeScript. */
  code: string;

  /** Identity of the compile generation that produced it. */
  compile: string;
}
