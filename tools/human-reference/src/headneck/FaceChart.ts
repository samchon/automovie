/**
 * Physical source-curve observations defining the front-head replacement chart.
 *
 * Rows run from subject-right to subject-left, in ascending world-Y millimetres.
 * The outer boundary reuses the row endpoints. These are observations; fitted
 * surfaces must publish their own approximation and continuity limits.
 *
 * @evidence contracts/common.md#principled-implementation The schema separates measured source arcs, conventional coverage, registration, byte identities and explicit chart folds.
 * @evidence contracts/common.md#clear-and-simple-design One row collection owns the endpoints from which the four shared outer boundaries are derived.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record contains private observations with no product identity table, anatomical certification or hidden fallback mesh.
 * @evidence contracts/common.md#meaningful-documentation Documents source versus fitted meaning, physical units, row order, boundary ownership and unresolved continuity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased data declaration executes no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration coordinates no requests or effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Runtime observation ownership and publication belong to the producer, not this erased declaration.
 * @author Samchon
 */
export interface FaceChart {
  /** Version of the private source-curve chart document. */
  schema: "human-reference-face-chart-v1";
  /** Caller-supplied source identity, without demographic certification. */
  gate: string;
  /** Physical unit shared by positions, distances and coverage levels. */
  units: "mm";
  /** Admitted native coordinate convention shared with the source observations. */
  frame: string;
  /** Source posture before any anatomical or diagnostic conversion. */
  pose: "native-A";
  /** Complete byte identities of reference and intermediate observation inputs. */
  sources: { file: string; sha256: string; pose: string }[];
  /** Explicit geometric chart conventions, separated from anatomical measurements. */
  coverage: {
    /** The coverage construction is a convention, not a population estimate. */
    grade: "conventional";
    /** Auxiliary-eye mean height plus the declared 50 mm coverage offset. */
    topTargetY: number;
    /** Geometric menton height plus the declared 10 mm coverage offset. */
    bottomTargetY: number;
    /** Actual saved horizontal section chosen nearest the requested top. */
    topY: number;
    /** Actual saved horizontal section chosen nearest the requested bottom. */
    bottomY: number;
    /** Paired outward side-ray angle from native anterior, in degrees. */
    sideAngleDeg: number;
    /** Per-section physical centre definition used by both side intersections. */
    centreRule: string;
  };
  /** Ordered front source arcs, with explicit topology limitations for consumers. */
  rows: {
    /** Stable observation identifier derived from the saved source slice. */
    id: string;
    /** Index in the hash-bound whole-section document, without mesh correspondence. */
    sourceSlice: number;
    /** Main closed loop index in the saved source slice. */
    sourceLoop: number;
    /** Native horizontal section height in world millimetres. */
    y: number;
    /** Exact source-edge observations from subject-right to subject-left. */
    points: [number, number, number][];
    /** Cumulative physical polyline arclength, beginning at zero. */
    arcMm: number[];
    /** Shared subject-left endpoint, identical to the last row point. */
    leftBoundary: [number, number, number];
    /** Shared subject-right endpoint, identical to the first row point. */
    rightBoundary: [number, number, number];
    /** Midpoint of this main loop's X/Z bounds at its saved height. */
    centre: [number, number, number];
    /** Whether the complete observed row is monotone in world-X to floating precision. */
    regularInX: boolean;
    /** Largest consecutive world-X reversal, exposing chart folds in millimetres. */
    maxBackstepMm: number;
  }[];
  /** Boundary observations derived once from the same row points for both consumers. */
  outerBoundary: {
    /** Complete highest row, ordered subject-right to subject-left. */
    top: [number, number, number][];
    /** Complete lowest row, ordered subject-right to subject-left. */
    bottom: [number, number, number][];
    /** Subject-left row endpoints in ascending world-Y order. */
    left: [number, number, number][];
    /** Subject-right row endpoints in ascending world-Y order. */
    right: [number, number, number][];
  };
  /** Unresolved anatomical, patch-topology and continuity claims. */
  limits: string[];
}
