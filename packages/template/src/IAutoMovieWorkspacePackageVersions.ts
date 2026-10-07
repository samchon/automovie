/**
 * Acquired version ranges for the workspace libraries the generated harness installs.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Keeps every workspace dependency range in the scaffold's explicit input.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Distinguishes supplied library ranges from external catalog entries.
 * @author Samchon
 */
export interface IAutoMovieWorkspacePackageVersions {
  /**
   * Version range for the archetypes package.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Carries the archetypes input used to install the portable authoring dependencies.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Makes archetypes an explicit dependency-resolution input instead of host state.
   */
  archetypes: string;

  /**
   * Version range for the cli package.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Carries the cli input used to install the portable authoring dependencies.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Makes cli an explicit dependency-resolution input instead of host state.
   */
  cli: string;

  /**
   * Version range for the engine package.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Carries the engine input used to install the portable authoring dependencies.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Makes engine an explicit dependency-resolution input instead of host state.
   */
  engine: string;

  /**
   * Version range for the evidence package.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Carries the evidence input used to install the portable authoring dependencies.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Makes evidence an explicit dependency-resolution input instead of host state.
   */
  evidence: string;

  /**
   * Version range for the human package.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Carries the human input used to install the portable authoring dependencies.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Makes human an explicit dependency-resolution input instead of host state.
   */
  human: string;

  /**
   * Version range for the ingest package.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Carries the ingest input used to install the portable authoring dependencies.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Makes ingest an explicit dependency-resolution input instead of host state.
   */
  ingest: string;

  /**
   * Version range for the interface package.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Carries the interface input used to install the portable authoring dependencies.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Makes interface an explicit dependency-resolution input instead of host state.
   */
  interface: string;

  /**
   * Version range for the mcp package.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Carries the mcp input used to install the portable authoring dependencies.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Makes mcp an explicit dependency-resolution input instead of host state.
   */
  mcp: string;

  /**
   * Version range for the production package.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Carries the production input used to install the portable authoring dependencies.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Makes production an explicit dependency-resolution input instead of host state.
   */
  production: string;

  /**
   * Version range for the render package.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Carries the render input used to install the portable authoring dependencies.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Makes render an explicit dependency-resolution input instead of host state.
   */
  render: string;

  /**
   * Version range for the template package.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Carries the template input used to install the portable authoring dependencies.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Makes template an explicit dependency-resolution input instead of host state.
   */
  template: string;

  /**
   * Version range for the viewer package.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-portable-authoring Carries the viewer input used to install the portable authoring dependencies.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Makes viewer an explicit dependency-resolution input instead of host state.
   */
  viewer: string;
}
