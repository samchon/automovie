import type { IAutoMovieBicubicAtlas64 } from "./IAutoMovieBicubicAtlas64";
import type { IAutoMovieBicubicAtlasTessellation64 } from "./IAutoMovieBicubicAtlasTessellation64";
import type { IAutoMovieCanonicalBoundaryPhase64 } from "./IAutoMovieCanonicalBoundaryPhase64";

/**
 * Shared corner/edge incidence and mutable totals for one atlas emission.
 *
 * @evidence contracts/development/design.md#principled-representation Exact phases and declared identities index registry objects independently of rounded Cartesian positions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IResult is the shared state exchanged between the atlas registry and emitter.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Open-atom incidence avoids equating three coarse/fine uses with three overlapping surface incidents.
 * @evidence contracts/development/common.md#meaningful-documentation The result defines shared mutation, phase comparison premises and omitted-patch accounting.
 */
export namespace IAutoMovieBicubicAtlasRegistry64 {
  /**
   * Per-invocation registries created before atlas emission. Maps, sets, summary
   * and nested receipts remain shared with the emitter; external mutation while
   * emission is running invalidates its identity and count assumptions.
   *
   * @evidence contracts/development/design.md#principled-representation Exact canonical phase keys retain identity despite rounded collisions; patch ordinals govern deterministic ownership and last-use release.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieBicubicAtlasRegistry64 supplies incidence, phase transport and mutable terminal totals to the emitter and vertex owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Excessive incidence is measured per canonical open atom, so coarse/fine subdivisions are not rejected merely for having three global uses.
   * @evidence contracts/development/common.md#meaningful-documentation States shared mutation, index domains, comparator admission premises and omitted-work accounting.
   */
  export type IResult = {
    /** Mutable per-tessellation edge registry keyed by declared authority or canonical ordered control-ID sequence. Incidents share exact phase requests and render vertex caches; coordinate equality alone never merges entries. */
    edges: Map<string, IAutoMovieBicubicAtlas64.Edge>;
    /** Mutable corner registry keyed by the boundary equivalence root of a control identity. Positions remain in millimetres before emission, and last-use patch indices govern cache release. */
    corners: Map<string, IAutoMovieBicubicAtlas64.Corner>;
    /** Patch-indexed arrays in bottom/right/top/left side order. A missing entry means no retained cell touches that patch side; present entries reference the shared edges map objects. */
    patchEdges: (IAutoMovieBicubicAtlas64.Edge | undefined)[][];
    /** Patch-indexed side occurrences aligned with patchEdges. Missing means no retained side use; present records retain local-to-canonical requests and optional declared interval binding. */
    occurrences: (IAutoMovieBicubicAtlas64.Occurrence | undefined)[][];
    /** Compare admitted normalized phase records by exact value, returning -1, 0 or 1. Distinct dyadic keys break equal rounded numeric values. Call only with canonical keys produced by the boundary owner; this optimized comparator does not repeat key admission. */
    comparePhase: (
      a: IAutoMovieCanonicalBoundaryPhase64,
      b: IAutoMovieCanonicalBoundaryPhase64,
    ) => number;
    /** Edge keys having at least one canonical open atom covered by more than two declared uses. Counts are per atom, so one coarse use against two disjoint fine uses is not automatically overfull. */
    excessiveIncidence: Set<string>;
    /** Mutable run totals initialized from planning omissions and coarse retained cells, with zero output vertices/triangles. Emission updates the same record before final publication. */
    summary: IAutoMovieBicubicAtlasTessellation64.Summary;
    /** Mutable zero-based patch indices with at least one omitted region. Initially populated from plan diagnostics other than approximation-unqualified; emission adds later omissions. */
    unprocessed: Set<number>;
  };
}
