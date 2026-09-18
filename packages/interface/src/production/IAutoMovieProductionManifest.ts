/**
 * The tracked manifest for a coding-agent production repository.
 *
 * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `IAutoMovieProductionManifest` as the portable data boundary for the agent declared omission requirement.
 * @evidence requirements/agent-authoring/project-ownership.md#agent-repository-project-boundary Draws the boundary in data: the manifest names the roots and files a project owns, and everything outside them belongs to the general capability AutoMovie ships.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-system-project-responsibility Types the project-declared inventory the system structures and validates rather than supplies.
 * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-target-input Types `IAutoMovieProductionManifest` for the spec authoring partial target input system contract.
 */
export interface IAutoMovieProductionManifest {
  /**
   * Production format version.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `formatVersion` as the portable data boundary for the agent declared omission requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-target-input Types `formatVersion` for the spec authoring partial target input system contract.
   */
  formatVersion: 2;
  /**
   * Repository-local project identity, excluded from content fingerprints.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `projectId` as the portable data boundary for the agent declared omission requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-target-input Types `projectId` for the spec authoring partial target input system contract.
   */
  projectId: string;
  /**
   * Project-relative coding-agent-owned source directories. Shot modules must
   * resolve as real TypeScript files inside one of these roots.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `sourceRoots` as the portable data boundary for the agent declared omission requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-target-input Types `sourceRoots` for the spec authoring partial target input system contract.
   */
  sourceRoots: string[];
  /**
   * Additional project-relative directories whose exact files affect compile
   * and render identity, such as viewer, scripts and public assets.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `contentRoots` as the portable data boundary for the agent declared omission requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-target-input Types `contentRoots` for the spec authoring partial target input system contract.
   */
  contentRoots?: string[];
  /**
   * Additional project-relative files whose bytes affect compile identity.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `contentFiles` as the portable data boundary for the agent declared omission requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-target-input Types `contentFiles` for the spec authoring partial target input system contract.
   */
  contentFiles?: string[];
  /**
   * Project-global asset provenance ledger.
   *
   * When declared, builder asset references are restricted to the byte-exact
   * paths in this manifest.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `assetManifest` as the portable data boundary for the agent declared omission requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-target-input Types `assetManifest` for the spec authoring partial target input system contract.
   */
  assetManifest?: "automovie/assets.json";
  /**
   * Project-owned deterministic precomputation ledger.
   *
   * When declared, every generator, input, and output byte is verified before
   * authored source executes, and only current artifacts enter source context.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-compile-refusal Makes the tracked derived-artifact ledger an explicit builder input.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-manifest Selects the one canonical project-relative ledger path.
   */
  derivedArtifactManifest?: "automovie/derived-artifacts.json";
  /**
   * Compiler-owned generated root.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `generatedRoot` as the portable data boundary for the agent declared omission requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-target-input Types `generatedRoot` for the spec authoring partial target input system contract.
   */
  generatedRoot: string;
  /**
   * Content-addressed render root.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `renderRoot` as the portable data boundary for the agent declared omission requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-target-input Types `renderRoot` for the spec authoring partial target input system contract.
   */
  renderRoot: string;
  /**
   * Optional non-destructive legacy import provenance.
   *
   * @evidence requirements/agent-authoring/partial-work.md#agent-declared-omission Exposes `importedLegacy` as the portable data boundary for the agent declared omission requirement.
   * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-target-input Types `importedLegacy` for the spec authoring partial target input system contract.
   */
  importedLegacy?: {
    /** Imported legacy project revision. */
    revision: number;
    /** Relative source directory containing the untouched legacy tree. */
    sourceRoot: string;
  };
}
