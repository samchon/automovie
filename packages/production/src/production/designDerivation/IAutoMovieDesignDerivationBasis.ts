import { AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL } from "./AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL";
import type { IAutoMovieDesignDerivationDependency } from "./IAutoMovieDesignDerivationDependency";

/**
 * Declared producer metadata connecting a target/path with source, emitter, dependencies and tool labels.
 *
 * @evidence contracts/common.md#principled-implementation The protocol, target/path, emitter, selected export, dependencies and tool labels are checked by canonicalBasis; capture records normalized source digests.
 * @evidence contracts/common.md#clear-and-simple-design All declared inputs of one target stay with its basis while record output bytes have a separate record digest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Metadata cannot prove actual selected-export execution, target-local import reach, observed tool versions or sandboxed evaluation.
 * @evidence contracts/common.md#meaningful-documentation Documents protocol and production/target address, POSIX publication/source paths, normalized emitter/dependency digests, optional selector and declared tool labels.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record erases; per-basis validation, dependency sorting and canonical hashing remain its owners' costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical basis equality includes all declared metadata, while live-basis reacquisition is required after evaluation and does not freeze callback environment.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Capture returns copied nested scalar records/dependencies retained by caller-owned candidates/manifests, with input-sized metadata and no source/file handle.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignDerivationBasis {
  /** Derivation protocol that gives this identity its meaning. */
  protocol: typeof AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL;

  /** Production that owns the derived target. */
  production: string;

  /** Stable logical target identity. */
  target: string;

  /** Canonical path where the derived record is published. */
  recordPath: string;

  /** Command emitter participating in the producer closure. */
  emitter: IAutoMovieDesignDerivationDependency;

  /** Declared source module export and optional selector; capture does not execute them. */
  source: {
    /** Canonical project-relative POSIX module path. */
    path: string;

    /** Named top-level module export. */
    export: string;

    /** Optional member inside the named export. */
    selector: string | null;
  };

  /** Declared dependency inventory; capture does not resolve transitive imports. */
  dependencies: readonly IAutoMovieDesignDerivationDependency[];

  /** Caller-declared tool versions; these labels are not observed by capture. */
  tool: {
    /** Production package version. */
    production: string;

    /** TypeScript compiler version. */
    typescript: string;

    /** Node.js runtime version. */
    node: string;
  };
}
