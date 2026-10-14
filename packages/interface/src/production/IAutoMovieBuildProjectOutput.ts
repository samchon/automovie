import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";
import { IAutoMovieMaterializedFile } from "./IAutoMovieMaterializedFile";

/**
 * Result of requested production gates and optional generated-output publication. The fingerprint and revision identify the attempt's observed inputs or returned publication state, without representing an atomic filesystem snapshot.
 *
 * @evidence contracts/common.md#principled-implementation Error findings or input-race refusals return success false with an empty materialized list; design/lint success also returns no materialized files. Writable admission delegates individual file operations and staged recovery to commitGenerated, whose successful revision is reported; unrelated publication or cleanup failures can throw and can leave resident effects.
 * @evidence contracts/common.md#clear-and-simple-design Status, snapshot identity, ordered diagnostics and materialized-file effects are separate output fields, allowing clients to distinguish a failed judgment from an unchanged successful publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fresh currentness guards reject changed selected inputs rather than reusing an earlier success. No partial materialized success is invented for a returned refusal, but an empty list is not a rollback certificate and success does not make whole-set file visibility atomic or prove authored-source determinism.
 * @evidence contracts/common.md#meaningful-documentation Defines scope-sensitive success, observed versus committed revision, compiler/input identity, ordered findings and empty design/lint/refusal effects. Exceptions and transaction recovery remain distinct from this returned result.
 * @author Samchon
 */
export interface IAutoMovieBuildProjectOutput {
  /**
   * Whether the requested path returned without error-level gate findings or an input-race refusal. False publishes no accepted materialized-file list; it does not independently certify absence of authored-source effects or successful transaction recovery.
   */
  success: boolean;

  /** Observed input revision, or the authority's returned publication revision. */
  revision: number;

  /** Compiler and input identity. */
  builder: {
    /** Compiler package version. */
    version: string;

    /** Current design and source fingerprint. */
    inputFingerprint: string;
  };

  /** Ordered diagnostics. */
  diagnostics: IAutoMovieDiagnostic[];

  /**
   * Prepared created/updated/unchanged statuses returned after successful writable publication. Empty for design, read-only lint and returned refusals; statuses are compared before publication rather than independently remeasured afterward.
   */
  materialized: IAutoMovieMaterializedFile[];
}
