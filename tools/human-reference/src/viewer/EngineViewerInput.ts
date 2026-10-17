import type { IAutoMovieModel } from "../../../../packages/interface/src/model/IAutoMovieModel.ts";

/**
 * An engine-generated interface model, its actual metre-valued construction and its producer provenance.
 *
 * @evidence contracts/common.md#principled-implementation The document couples an IAutoMovieModel to actual evaluated construction and separately recorded engine operators.
 * @evidence contracts/common.md#clear-and-simple-design Geometry, generating curves, execution provenance and reported counts have separate fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A schema or copied mesh wrapper does not prove generation; the committed producer and actual run remain required.
 * @evidence contracts/common.md#meaningful-documentation Members state metre construction, source-commit ownership and the limits of reported counts.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This data shape selects no traversal or numerical algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This data shape coordinates no cache or repeated operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no native handle or running task; its producer owns retained values.
 *
 * @author Samchon
 */
export interface EngineViewerInput {
  /** The schema identifies a producer document; source snapshots and actual operator execution establish generation separately. */
  schema: "human-reference-engine-model-v1";

  /** Interface model whose generated geometry is realized by the ordinary viewer producers. */
  model: IAutoMovieModel;

  /** Evaluated generating curves, not independent observations or copied source shading. */
  construction: {
    units: "m";
    lines: {
      id: string;
      closed: boolean;
      points: [number, number, number][];
    }[];
  };

  /** Actual operators and frozen generating source are independent from the viewer's own source snapshot. */
  provenance: {
    inputKeys: string[];
    inputHashes: Record<string, string>;
    engineOperators: string[];
    sourceCommit: string;
  };

  /** Producer counts are retained for comparison with the model actually loaded. */
  counts: { vertices: number; triangles: number };
}
