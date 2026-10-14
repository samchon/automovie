/**
 * Synthesized ownership and input-root layout returned by a production project.
 *
 * @evidence contracts/common.md#principled-implementation Project opening composes the fixed productionProjectProjectLayout with repository-local projectId and admitted legacy metadata; manifest() refreshes the physical/revision fence and returns a structured clone. Compilation fingerprints selected design, source, content and derivation fields, with TypeScript BOM/EOL normalization rather than universal byte-exact identity; projectId is excluded.
 * @evidence contracts/common.md#clear-and-simple-design One manifest names ownership boundaries and optional asset and precomputation ledgers without embedding design, source code or generated artifact inventory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The current project does not load arbitrary per-project layout fields from a resident manifest; returned arrays do not reconfigure its fixed layout. Physical ownership gates and ledgers restrict selected inputs, while importedLegacy records provenance without authorizing destructive migration or proving historical source immutability.
 * @evidence contracts/common.md#meaningful-documentation Defines format, local identity exclusion, project-relative roots and content inputs, ledger paths, generated/render ownership and non-destructive import provenance.
 * @author Samchon
 */
export interface IAutoMovieProductionManifest {
  /** Production format version. */
  formatVersion: 2;

  /** Repository-local project identity, excluded from content fingerprints. */
  projectId: string;

  /**
   * Project-relative coding-agent-owned source directories. Shot modules must resolve as real TypeScript files inside one of these roots.
   */
  sourceRoots: string[];

  /**
   * Additional project-relative input directories, including viewer, scripts, public and assets in the current fixed layout. Present binary content retains its bytes in identity; marked TypeScript content uses the source normalization policy, and missing optional roots are permitted.
   */
  contentRoots?: string[];

  /** Additional project-relative files included under the content identity policy. */
  contentFiles?: string[];

  /**
   * Project-global asset provenance ledger.
   *
   * When declared, builder asset references are restricted to the byte-exact paths in this manifest.
   */
  assetManifest?: "automovie/assets.json";

  /**
   * Project-owned deterministic precomputation ledger.
   *
   * Inspection checks declared generator/input/output identity and admitted encoding before source context receives current artifacts. Generator TypeScript uses BOM/EOL normalization; digest matching does not rerun the generator or prove the declared derivation occurred.
   */
  derivedArtifactManifest?: "automovie/derived-artifacts.json";

  /** Compiler-owned generated root. */
  generatedRoot: string;

  /** Content-addressed render root. */
  renderRoot: string;

  /** Optional non-destructive legacy import provenance. */
  importedLegacy?: {
    /** Imported legacy project revision. */
    revision: number;

    /** Relative source directory containing the untouched legacy tree. */
    sourceRoot: string;
  };
}
