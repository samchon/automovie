/**
 * One authored scaffold input before its path and bytes are rendered.
 *
 * Keeping the source-relative identity until the complete candidate is
 * validated lets the renderer name both owners of a colliding output instead
 * of silently retaining whichever one happened to be assigned last.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Keeps every authored scaffold source distinct until its portable output identity is proved.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Carries source identity beside the bytes and path derived from that source.
 * @author Samchon
 */
export interface IAutoMovieScaffoldSourceEntry {
  /**
   * Text bytes before line-ending normalization and template rendering.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Makes the authored scaffold text an explicit portable input.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Supplies the exact source text to deterministic derivation.
   */
  content: string;
  /**
   * Scaffold-root-relative source path before stand-in renaming and rendering.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Preserves the project-relative owner of every rendered file.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Retains source identity until output injectivity is validated.
   */
  relative: string;
}
