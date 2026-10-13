/**
 * The import graph and compiler inputs the human compile reports, all paths
 * relative to the human package. Every file named here is watched, so an
 * edit to a type-only dependency or a config still invalidates the build.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every reported input group.
 *
 * @evidence contracts/common.md#principled-implementation Import edges, globals, configurations and resolution reads enumerate real compiler input authority.
 * @evidence contracts/common.md#clear-and-simple-design Resolution candidates remain optional because not every compiler report supplies them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type-only dependencies and configuration bytes remain watched inputs rather than being dismissed as non-runtime text.
 *
 * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Import edges, globals, configurations and resolution reads enumerate real compiler input authority.
 * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Type-only dependencies and configuration bytes remain watched inputs rather than being dismissed as non-runtime text.
 *
 * @author Samchon
 */
export interface IHumanViewerCompileGraph {
  /**
   * Import edges, from a file to the files it imports.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Preserves actual import relationships used to enumerate transitive compiler input authority.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Preserves actual import relationships used to enumerate transitive compiler input authority.
   */
  edges: Record<string, string[]>;

  /**
   * Global declaration files.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Includes ambient declaration inputs that can affect compilation without ordinary import edges.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Includes ambient declaration inputs that can affect compilation without ordinary import edges.
   */
  globals: string[];

  /**
   * Configuration files the compile read.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Includes the actual configuration files that influenced the successful or failed compile.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Includes the actual configuration files that influenced the successful or failed compile.
   */
  configs: string[];

  /**
   * Candidate resolution paths probed per import, when reported.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Preserves optional resolution candidates so a missing dependency's later repair can invalidate the failed generation.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Preserves optional resolution candidates so a missing dependency's later repair can invalidate the failed generation.
   */
  candidates?: Record<string, string[]>;

  /**
   * Other files module resolution read, when reported.
   *
   * @evidence requirements/evidence-and-provenance/canonical-digests-and-content-identity.md#integrity-binary-dependency-closure Preserves optional additional files read by module resolution rather than excluding them from source freshness.
   * @evidence specifications/evidence-and-provenance/canonical-digests-and-content-identity.md#evp-binary-closure-digest Preserves optional additional files read by module resolution rather than excluding them from source freshness.
   */
  resolutionInputs?: string[];
}
