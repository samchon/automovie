/**
 * Tracked ownership and input-root manifest for a coding-agent production repository.
 *
 * @evidence contracts/common.md#principled-implementation Versioned roots partition authored TypeScript, additional compile inputs, builder output and render output; production acquisition validates physical containment and fingerprints declared source, content and ledger bytes while excluding repository-local projectId.
 * @evidence contracts/common.md#clear-and-simple-design One manifest names ownership boundaries and optional asset and precomputation ledgers without embedding design, source code or generated artifact inventory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source modules must resolve inside admitted physical roots and declared ledgers restrict adopted inputs; importedLegacy records provenance without authorizing destructive migration of the untouched legacy tree.
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
   * Additional project-relative directories whose exact files affect compile and render identity, such as viewer, scripts and public assets.
   */
  contentRoots?: string[];

  /** Additional project-relative files whose bytes affect compile identity. */
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
   * When declared, every generator, input, and output byte is verified before authored source executes, and only current artifacts enter source context.
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
