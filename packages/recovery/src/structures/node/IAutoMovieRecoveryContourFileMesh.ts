import type { IAutoMovieContourLoftEmission64 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieRecoveryArraySource } from "./IAutoMovieRecoveryArraySource";

/**
 * Complete contour channels backed by immutable JSON fragments.
 * Empty array identities are publication placeholders, never validation inputs.
 *
 * @evidence contracts/development/design.md#principled-representation Original indexed emission and original face-order normal reduction bind every persisted channel to one kernel invocation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One result separates actual channel populations from their empty publication placeholders.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Placeholder validation cannot become canonical validation of the actual fragment values.
 * @evidence contracts/development/common.md#meaningful-documentation States channel, index, qualification and temporary-storage ownership.
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
