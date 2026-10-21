import type { IAutoMovieContourLoftEmission64 } from "@automovie/engine/geometry/curve";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieRecoveryArraySource } from "./IAutoMovieRecoveryArraySource";

/**
 * Complete contour channels backed by immutable JSON fragments.
 * Empty array identities are publication placeholders, never validation inputs.
 *
 * @evidence contracts/common.md#principled-implementation Original indexed emission and original face-order normal reduction bind every persisted channel to one kernel invocation.
 * @evidence contracts/common.md#clear-and-simple-design One result separates actual channel populations from their empty publication placeholders.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Placeholder validation cannot become canonical validation of the actual fragment values.
 * @evidence contracts/common.md#meaningful-documentation States channel, index, qualification and temporary-storage ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased declaration performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The runtime owner supplies immutable fragment bindings.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns returned metadata and persisted files; no live descriptor escapes.
 */
export interface IAutoMovieRecoveryContourFileMesh {
  /** Mesh with empty channel placeholders backed by arraySources. */
  mesh: IAutoMovieMesh;

  /** Generating-curve placeholder backed by actual construction fragments. */
  construction: object[];

  /** Hash-bound complete fragments keyed by their exact placeholder identity. */
  arraySources: ReadonlyMap<
    readonly unknown[],
    readonly IAutoMovieRecoveryArraySource[]
  >;

  /** Original kernel reports and actual complete vertex/triangle counts. */
  emission: IAutoMovieContourLoftEmission64;

  /** Source-free raw tables retained as generating lineage, not live handles. */
  tables: { positionsMm: string; accumulatedArea: string };

  /** Scalar channel checks do not certify whole topology, area or rasterization. */
  qualification: {
    finite64: true;
    finite32: true;
    indexRange: true;
    canonicalValidation: "deferred";
    rasterAreaQualified: false;
  };
}
