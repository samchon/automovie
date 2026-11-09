import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieCurve64 } from "./IAutoMovieCurve64";

/**
 * Contracts for an open cubic course family interpolated across physical stations. Input positions use millimetres; generated mesh and construction positions use metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each record states units, correspondence and qualification limits.
 * @evidence contracts/development/design.md#principled-representation Represents Contracts for an open cubic course family interpolated across physical stations: companion namespace of 2 members (`Input`, `Result`); units and frames named in its text: metre, metres. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMovieCurveGrid64` in packages/engine/src/geometry/curve/IAutoMovieCurveGrid64.ts; its surface is the 2 members listed and the text shows 2 other files naming it, mostly packages/engine (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace IAutoMovieCurveGrid64 {
  /**
   * Corresponding open cubic courses with a common normalized parameter and increasing station coordinates. The caller supplies correspondence; interpolation cannot establish it.
   *
   * @evidence contracts/development/design.md#principled-representation Ordered complete cubic courses and an optional explicit station period define a tensor family without sampled through-point substitution.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Sampling policy, topology identity and curve data remain explicit input properties.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Equal contact coordinates do not declare a shared physical vertex; the caller assigns a unique instance domain.
   * @evidence contracts/development/common.md#meaningful-documentation States normalized course units, station units, metre output and the distinction between requested spacing and an error bound.
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
   * @evidence contracts/development/design.md#principled-representation Mesh buffers and construction are generated from the same tensor coefficient representation, with distinct numeric diagnostics.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One result carries the reusable mesh and the actual construction needed for inspection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Counts and degenerate-face diagnostics do not imply visual, topology or anatomical acceptance.
   * @evidence contracts/development/common.md#meaningful-documentation States metre positions, geometric normals and explicit mathematical limits.
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
