import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { IAutoMovieCurve64 } from "./IAutoMovieCurve64";
import type { IAutoMovieLocalHermiteStream64Counts } from "./IAutoMovieLocalHermiteStream64Counts";
import type { IAutoMovieLocalHermiteStream64FaceRange } from "./IAutoMovieLocalHermiteStream64FaceRange";

/**
 * Physical-station Hermite streaming input, published chunks and terminal counts.
 *
 * @evidence contracts/development/design.md#principled-representation Open normalized courses and physical millimetre stations define the field; chunks use model metres and global vertex indices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Input, Chunk and Summary describe the local Hermite generator's accepted run, yielded suffixes and terminal return.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Omitted intervals remain explicit and finite output does not certify continuity, embedding or source fidelity.
 * @evidence contracts/development/common.md#meaningful-documentation Contracts state admission owners, immutable input lifetime, transferred arrays and cancellation semantics.
 */
export namespace IAutoMovieLocalHermiteStream64 {
  /**
     * Immutable normalized millimetre courses at increasing physical stations.
     * planAutoMovieLocalHermite64 admits names, tolerance and safe budgets, then
     * AutoMovieLocalHermiteField64.prepare admits matching stations and open
     * continuous courses. Keep the input unchanged until completion or cancellation
     * because field and planning closures retain these arrays and policy values.
     *
     * @evidence contracts/development/design.md#principled-representation Increasing finite station millimetres pair with open normalized course curves; runtime preparation enforces cardinality, continuity and representable station widths.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Planning and tessellation consume the same immutable run, interpolation choice and explicit per-interval resource budget.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported intervals are omitted explicitly; no source triangle, coordinate weld or replacement field enters this contract.
     * @evidence contracts/development/common.md#meaningful-documentation Defines physical versus normalized coordinates, admission owners, policy defaults and borrowed lifetime.
     */
    export type Input = {
      /** Nonblank run name used to form generated interval/root-cell patch IDs. */
      name: string;
      /** Nonblank physical identity scope for generated station and interval vertices; separate independent sheets use distinct domains. */
      topologyDomain: string;
      /** At least two finite strictly increasing physical station coordinates in millimetres, one per course; adjacent widths must remain finite. */
      stations: readonly number[];
      /** Open cubicBezier millimetre courses with normalized phase, one per station. Span endpoints must match exactly; complete common-partition restriction preserves different authored knot layouts. */
      courses: readonly IAutoMovieCurve64.Cubic[];
      /** Positive finite field-to-piecewise-linear Taylor estimate request in millimetres; binary64 evaluation is not an outward-rounded or source-fidelity certificate. */
      toleranceMm: number;
      /** Positive safe integer bound on pending plus retained adaptive leaves per interval. Exceeding it discards that interval's entire plan with a reason. */
      maxCellsPerInterval: number;
      /** Safe integer maximum new vertices in one chunk, at least three; references to earlier published indices do not consume new-vertex capacity. */
      maxVerticesPerChunk: number;
      /** Quadratic station derivative stencils by default, or explicit ruled secants. Ruled station normals use the right incident interval except at the final station, which uses the left; neither choice certifies global C1. */
      stationInterpolation?: "quadratic" | "ruled";
      /** Nonnegative safe integer first global output index; omitted selects zero. Emission records index exhaustion as unprocessed work. */
      vertexOffset?: number;
    };

  /**
     * Newly published metre vertices and global indices; previous chunk vertices may be referenced.
     * Each yielded record owns its arrays and is no longer appended by the generator.
     * A failed interval may publish an empty diagnostic chunk or retain an already
     * emitted finite prefix; construction lines are only added after normal emission.
     *
     * @evidence contracts/development/design.md#principled-representation Each index names an already published or current vertex; face ranges use chunk-relative triangle ordinals.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Geometry, source-free identity and diagnostic attribution travel together.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Independent sheets are separated by topologyDomain rather than coordinate welding.
     * @evidence contracts/development/common.md#meaningful-documentation States indexing, metre units and consumer ownership.
     */
    export type Chunk = {
      /** Zero-based physical interval index j between stations[j] and stations[j+1]. */
      interval: number;
      /** First global index of this newly published vertex suffix. */
      vertexStart: number;
      /** Flat xyz triples of newly published model-metre positions, without a world transform. */
      positions: number[];
      /** Flat xyz unit coursePartial cross stationPartial normals aligned with positions; zero for unnormalizable analytic normals. Shared station vertices retain the owner's normal. */
      normals: number[];
      /** Source-free logical generated position identities. */
      physicalVertexIds: string[];
      /** Global indices into this and previously published chunks. */
      indices: number[];
      /** Actual saved-course construction in model metres. */
      construction: {
        /** Original saved course name for this station line. */
        id: string;

        /** Courses are admitted as open; construction preserves that topology. */
        closed: false;

        /** Fresh copied model-metre samples in increasing normalized course coordinate, taken from the actual emitted station boundary. */
        points: AutoMovieVector3Tuple[];
      }[];
      /** Local failures and independent qualification messages. */
      diagnostics: string[];
      /** Actual retained work, output and arithmetic counts. */
      counts: IAutoMovieLocalHermiteStream64Counts;
      /** Local analytic patch attribution with chunk-relative triangle offsets. */
      faceRanges: IAutoMovieLocalHermiteStream64FaceRange[];
    };

  /**
     * Complete-run counts and explicit interval limitations, returned after generator
     * exhaustion. Cancellation after a finite prefix does not deliver this record.
     *
     * @evidence contracts/development/design.md#principled-representation Summary counts describe published output, not source fidelity.
     * @evidence contracts/development/design.md#minimal-and-owned-surface A final record separates completion from per-chunk data.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Omitted intervals keep explicit reasons.
     * @evidence contracts/development/common.md#meaningful-documentation States count scope and final-return semantics.
     */
    export type Summary = {
      /** Admitted station interval count. */
      intervals: number;
      /** Intervals containing unresolved or unprocessed regions. */
      omittedIntervals: number;
      /** Actual published render vertex count. */
      vertices: number;
      /** Actual retained triangle count. */
      triangles: number;
      /** Interval planning/emission failure reasons. Per-chunk normal, zero-area and continuity qualification messages are not all copied into this array. */
      diagnostics: string[];
    };
}
