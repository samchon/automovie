import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";

/**
 * Canonical person document and borrowed face materials for shared skin colour. Derivation reads the admitted face override and basis skin albedo, then creates a body document without changing either input. The material owner retains optical qualification; this carrier establishes no tissue measurement.
 *
 * @evidence contracts/common.md#principled-implementation Person identity and the face's actual palette supply the single skin-colour authority consumed by body derivation.
 * @evidence contracts/common.md#clear-and-simple-design The carrier groups only document and borrowed palette; colour precedence and body document construction belong to its consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A palette reference establishes no measured tissue optics or independently authored body colour override.
 * @evidence contracts/common.md#meaningful-documentation Prose and members identify shared colour provenance, unchanged inputs and optical qualification ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input record executes no material search, colour conversion or document copy; body derivation owns those algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The carrier implements no palette/document result cache or repeated-request coordination.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring document and palette references allocates no material resources or running task; callers own actual values and retention.
 *
 * @author Samchon
 */
export interface IDeriveHumanPersonBodyProps {
  /** Person whose face supplies the single skin colour shared with its body. */
  document: IAutoMovieHumanPersonDocument;

  /** Borrowed face basis materials, providing skin albedo before overrides. */
  faceMaterials: readonly IAutoMovieMaterial[];
}
