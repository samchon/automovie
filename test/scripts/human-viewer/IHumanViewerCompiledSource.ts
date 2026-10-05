/**
 * One human module as a compile generation transformed it, with the identity
 * of that generation.
 *
 * @evidence contracts/common.md#principled-implementation Every served module names the compile it came from, so a page can prove it loaded one compile only.
 * @evidence contracts/common.md#meaningful-documentation Names both members.
 * @author Samchon
 */
export interface IHumanViewerCompiledSource {
  /** The transformed TypeScript. */
  code: string;

  /** Identity of the compile generation that produced it. */
  compile: string;
}
