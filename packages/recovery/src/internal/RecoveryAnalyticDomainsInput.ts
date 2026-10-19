import type { IAutoMovieBicubicAtlasGeometry } from "@automovie/interface";
import type { AutoMovieRecoveryMeshSections as R } from "./AutoMovieRecoveryMeshSections";

/**
 * Source-free analytic domains and their exact saved-operator ownership.
 * One complex may contain several typed components and ordinary chains. Ports
 * identify named saved curves; observation topology and source fit remain
 * producer qualifications rather than inferred consumer facts.
 *
 * @evidence contracts/common.md#principled-implementation Named coefficient bindings and saved graph addresses declare analytic ownership without source topology.
 * @evidence contracts/common.md#clear-and-simple-design An optional extension preserves the existing curve-only bundle and its default operators.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source vertices, indices, normals, positional welding or fallback mesh is admitted.
 * @evidence contracts/common.md#meaningful-documentation States metre recipes, millimetre saved curves, ownership references and independent geometric qualifications.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration performs no traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Runtime admission owns reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns these immutable records.
 */
export type RecoveryAnalyticDomainsInput = R.Bundle & {
  /** Retained fit reports describe original observation publication; overrides have their own numerical data estimates and never claim source-interior fidelity. */
  coefficientPublication?: {
    sourceCommit: string;
    originalReportsRetained: true;
    overrides: readonly { curveName: string; dataUpperEstimateMm: number }[];
  };
  /** Absence preserves the previous contour and open operators. */
  analyticDomains?: readonly {
    /** Unique generated complex identity, also used by its atlas topology domain. */
    id: string;

    /** Complete analytic coefficients in model metres, including native interval bindings. */
    geometry: IAutoMovieBicubicAtlasGeometry;

    /** Closed graph groups owned by this complex instead of the contour operator. */
    closedGroups: readonly { interval: number; group: number }[];

    /** Ordinary open pair occurrences owned instead of LocalHermite. */
    openPairs: readonly { interval: number; pair: number }[];

    /** Entire unresolved open projection groups covered by the supplied typed domains. */
    openUnresolved: readonly { interval: number; group: number }[];

    /** Named lower/upper ports covering every endpoint of a delegated group. */
    ports: readonly { curveName: string; side: "lower" | "upper" }[];

    /** Exact native saved-curve spans supplying canonical atlas authorities. */
    curveBindings: readonly {
      curveName: string;
      span: number;
      authority: string;
    }[];

    /** Producer observation completion is independent of finite engine output. */
    observationComplete: boolean;

    /** Missing or unsupported observed domains remain explicit even with finite charts. */
    unrepresentedDomains: readonly string[];
  }[];
};
