import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieCurve64 } from "./IAutoMovieCurve64";

/**
 * Contracts for an open cubic course family interpolated across physical stations. Input positions use millimetres; generated mesh and construction positions use metres.
 *
 * @evidence contracts/common.md#principled-implementation Complete cubic controls, station coordinates and explicit periodicity preserve coefficient authority and topology ownership.
 * @evidence contracts/common.md#clear-and-simple-design One erased namespace groups the operator's input and result contracts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, anatomy defaults or inferred aperture closure enters the contract.
 * @evidence contracts/common.md#meaningful-documentation Each record states units, correspondence and qualification limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This namespace contains types only.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Types own no computation or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Types retain no runtime arrays.
 */
export namespace IAutoMovieCurveGrid64 {
  /**
   * Corresponding open cubic courses with a common normalized parameter and increasing station coordinates. The caller supplies correspondence; interpolation cannot establish it.
   *
   * @evidence contracts/common.md#principled-implementation Ordered complete cubic courses and an optional explicit station period define a tensor family without sampled through-point substitution.
   * @evidence contracts/common.md#clear-and-simple-design Sampling policy, topology identity and curve data remain explicit input properties.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal contact coordinates do not declare a shared physical vertex; the caller assigns a unique instance domain.
   * @evidence contracts/common.md#meaningful-documentation States normalized course units, station units, metre output and the distinction between requested spacing and an error bound.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This input interface performs no interpolation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reuse belongs to the operator.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased interface owns no runtime arrays.
   * @author Samchon
   */
  export interface Input {
    /** Stable construction identifier. */
    name: string;

    /** Unique physical-instance namespace, distinct for independent coincident sheets. */
    topologyDomain: string;

    /** Increasing coordinates in one consistent physical or angular chart. */
    stations: readonly number[];

    /** Open cubic courses in mm, phaseUnit normalized, each covering exactly [0,1]. */
    courses: readonly IAutoMovieCurve64.Cubic[];

    /** Complete station period; omission leaves the station dimension open. */
    period?: number;

    /** Positive requested display spacing in mm; this is not a full-surface error certificate. */
    resolutionMm: number;

    /** Exact normalized course parameters included in sampling and published as actual isocurves. */
    guides: readonly number[];

    /** Optional additional station sample coordinates in the supported domain; these do not supply curve values or constrain the interpolant. */
    stationSamples?: readonly number[];

    /** Positive safe integer bounding generated vertices; excess rejects before allocating output buffers. */
    maxVertices: number;
  }

  /**
   * Newly generated mesh, actual generating construction and complexity diagnostics. Coefficientwise station PCHIP is bounded in each control coordinate; this does not certify injectivity, correspondence or surface approximation error.
   *
   * @evidence contracts/common.md#principled-implementation Mesh buffers and construction are generated from the same tensor coefficient representation, with distinct numeric diagnostics.
   * @evidence contracts/common.md#clear-and-simple-design One result carries the reusable mesh and the actual construction needed for inspection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts and degenerate-face diagnostics do not imply visual, topology or anatomical acceptance.
   * @evidence contracts/common.md#meaningful-documentation States metre positions, geometric normals and explicit mathematical limits.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result interface performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The operator owns representation reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased interface owns no resources.
   * @author Samchon
   */
  export interface Result {
    /** Engine-generated metre mesh with triangle-derived unit normals where accumulation is resolved, zero normals otherwise, and explicit physical identities. */
    mesh: IAutoMovieMesh;

    /** Actual surface courses and isocurves, in metres. */
    construction: {
      units: "m";
      lines: {
        id: string;
        closed: boolean;
        points: [number, number, number][];
      }[];
    };

    /** Ordered actual mesh course and station sample parameters. */
    parameters: { course: number[]; station: number[] };

    /** Boundary positions in metres and analytic partials per normalized course or declared station unit. Periodic stationLast repeats the exact stationFirst owner. */
    boundaries: Record<
      "courseStart" | "courseEnd" | "stationFirst" | "stationLast",
      {
        positions: [number, number, number][];
        coursePartials: [number, number, number][];
        stationPartials: [number, number, number][];
      }
    >;

    /** Complexity and degeneracy observations, not acceptance criteria. */
    counts: {
      courses: number;
      inputSpans: number;
      commonSpans: number;
      evaluatedSpans: number;
      vertices: number;
      triangles: number;
      omittedZeroAreaTriangles: number;
      /** Generated vertices with zero or nonfinite accumulated normals, retained with zero normal. */
      unresolvedVertexNormals: number;
      /** Subset of unresolved normals with no incident emitted triangle. */
      isolatedVertices: number;
      /** Subset of unresolved normals whose accumulated length is nonfinite. */
      nonfiniteNormalSums: number;
      minimumTriangleAreaMm2: number;
    };
  }
}
