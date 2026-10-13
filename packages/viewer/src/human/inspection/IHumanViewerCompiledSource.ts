/**
 * One human module as a compile generation transformed it, with the identity
 * of that generation.
 *
 * @evidence contracts/common.md#principled-implementation Every served module names the compile it came from, so a page can prove it loaded one compile only.
 * @evidence contracts/common.md#meaningful-documentation Names both members.
 *
 * @evidence contracts/common.md#clear-and-simple-design Module code and compile identity travel together as the smallest served-source receipt.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A requested source path alone cannot replace the generation identity of its transformed code.
 *
 * @author Samchon
 */
export interface IHumanViewerCompiledSource {
  /** The transformed TypeScript. */
  code: string;

  /** Identity of the compile generation that produced it. */
  compile: string;
}
