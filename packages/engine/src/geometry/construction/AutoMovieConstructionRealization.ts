import type { IAutoMovieConstructionDiagnostic } from "@automovie/interface";

import type { AutoMovieSolidBlendChain } from "./AutoMovieSolidBlendChain";
import type { AutoMovieSolidBody } from "./AutoMovieSolidBody";
import type { AutoMovieSolidJoin } from "./AutoMovieSolidJoin";
import type { AutoMovieSolidTrim } from "./AutoMovieSolidTrim";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * What {@link realizeAutoMovieConstruction} reads besides the tree, and what it returns: every view part's chain, every join's traced curve and blend, every trim, the body of trimmed faces and its one tessellated skin, with the premises the tree could not keep.
 *
 * The tree is in metres; the kernel works in millimetres, so the owning view, seed, width and trim adapters convert physical lengths at their input boundaries. The chains, surfaces, joins, trims and body are the kernel's own records and stay in millimetres, as their declarations state; the skin's positions are returned in metres, the tree's unit. Any node may be the root: a subtree realizes alone, with its own diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation Publishes the realized operator records so a consumer reads the chain/curve/blend used by the skin; physical lengths change units at the relevant authoring-to-kernel adapters rather than through a second geometry representation.
 * @evidence contracts/common.md#clear-and-simple-design One option, the chord tolerance, and one result record grouped by node kind; the skin is three flat arrays and an owner list, the form every viewer and test reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no field for a specific part, fixture or caller; a node left out by a broken premise is absent from its list and named in `diagnostics`, never replaced by a fallback shape.
 * @evidence contracts/common.md#meaningful-documentation States each field's content, order and unit, the unit change at entry, the root rule and the effect of a broken premise.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type with no runtime body; the realization's cost is answered on `realizeAutoMovieConstruction`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The records are built once per realization call and cache nothing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The result owns the records one call built and transfers them to the caller.
 */
export namespace AutoMovieConstructionRealization {
  /**
   * Requested realization controls, with lengths in the tree's metres.
   *
   * @evidence contracts/common.md#principled-implementation The chord field expresses the requested physical tessellation tolerance independently of kernel millimetre coordinates.
   * @evidence contracts/common.md#clear-and-simple-design One length-valued option exposes the current realization requirement without unrelated rendering settings.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This type does not certify achieved geometric error; realization's positivity check and the emitter's finite midpoint/phase/depth criterion do not prove a continuous maximum bound.
   * @evidence contracts/common.md#meaningful-documentation States requested tolerance meaning, metres and positive range; the evidence distinguishes a requested bound from its verification.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The option record executes no tessellation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar option coordinates no requests or cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns one scalar field and no acquired handle or retained output population.
   */
  export interface IProps {
    /** The skin's chord tolerance: the largest distance between a triangle and the surface it stands for, metres, positive. */
    chord: number;
  }

  /**
   * A retained join, named as its node and two seed faces, sharing the realized operator records.
   *
   * @evidence contracts/common.md#principled-implementation Names the traced host/part contact and its blend using the actual records returned by the join/body operators.
   * @evidence contracts/common.md#clear-and-simple-design Identity fields and join/blend references keep inspection connected to the same geometry used by realization.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The record itself neither checks a trace nor repairs a rejected blend; realization publishes it only after its operator result is retained.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes seed host face from later crossed faces and gives kernel-mm units for the operator records.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result interface executes no tracing, rail solving or blending.
   * @evidence contracts/performance.md#reuse-equivalent-work Consumers read the retained trace/rails/blend rather than rebuilding geometry from names; those records retain their original dependency identities.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The owning realization retains the operator records and their transitive curve/surface closures until callers release them; storage scales with the trace and blend, not this field count.
   */
  export interface IJoin {
    /** The join node's name, which also names its blend's chain and face. */
    name: string;

    /** The host face the trace started on (`seed.hostFace`); the curve may cross onto neighbouring faces. */
    hostFace: string;

    /** The part face that meets the host (`seed.partFace`). */
    partFace: string;

    /** The join's traced curve, rails and columns, millimetres. */
    join: AutoMovieSolidJoin.IJoin;

    /** Its blend as a chain of two layers, millimetres. */
    blend: AutoMovieSolidBlendChain.IBlend;
  }

  /**
   * Tessellated skin arrays with metre positions and owner-local chart coordinates.
   *
   * @evidence contracts/common.md#principled-implementation Indexed triangles share position entries while owner/chart triples identify the surface reading associated with each vertex.
   * @evidence contracts/common.md#clear-and-simple-design Flat position/index/coordinate arrays and one owner-name array match the existing geometry consumers without another mesh wrapper.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The structural type does not certify outward winding, closedness, valid indices or surface fidelity; these remain emitter requirements and separate geometry checks.
   * @evidence contracts/common.md#meaningful-documentation Gives all array layouts, position/chart unit differences, owner indexing and the required outside-facing winding convention.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This interface owns no triangulation or copying algorithm; Skin.mesh owns the returned copies.
   * @evidence contracts/performance.md#reuse-equivalent-work Multiple consumers may share the same arrays without re-realization while preserving their contents; no immutability enforcement or cache key is provided by the type.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns O(V+T+F) array entries for vertices, triangles and owner faces; number arrays are variable-sized and persist while that caller retains the mesh.
   */
  export interface IMesh {
    /** Flat `[x, y, z, ...]` vertex positions, metres. */
    positions: number[];

    /** Flat triangle indices, three per triangle, counter-clockwise seen from outside the solid. */
    indices: number[];

    /** Flat `[owner, a, b]` per vertex: the index into `owners` of the face that evaluates it and its chart point there, millimetres of station and radians of phase on a lofted face. */
    coordinates: number[];

    /** The faces' surface names by owner index: a view part's name, or a join's for its blend. */
    owners: string[];
  }

  /**
   * A construction result, including retained operator records, body, mesh and every reported premise failure.
   *
   * @evidence contracts/common.md#principled-implementation Preserves node-kind records and diagnostics beside the final skin so a reader can trace emitted data to the construction that survived rollback.
   * @evidence contracts/common.md#clear-and-simple-design One result groups chains, surfaces, joins, trims, published body and mesh with their documented order/units.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A returned result can contain diagnostics and an incomplete shape; the type does not convert partial realization into a claim of complete valid geometry.
   * @evidence contracts/common.md#meaningful-documentation Names each collection's order, kernel-mm versus mesh-metre boundary and the empty-diagnostics meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The result interface executes no construction walk or skin generation.
   * @evidence contracts/performance.md#reuse-equivalent-work Callers retain the very operator records used by the skin, sharing their arrays/closures instead of reconstructing a second body for observation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Output size grows with admitted parts, retained trace/blend/trim data, diagnostics and tessellation; the caller controls this transitive lifetime and the type imposes no global count or byte cap.
   */
  export interface IRealization {
    /** The construction's name. */
    name: string;

    /** Every view part's chain, in the tree's depth-first order, each named after its part, millimetres. */
    chains: IAutoMovieLoftChain[];

    /** Every face's surface: each chain's lofted surface, then each blend's, named as their owners are, millimetres. */
    surfaces: IAutoMovieSolidSurface[];

    /** Every join that kept its premises, in the order the tree applies them (hosts before the joins on them). */
    joins: IJoin[];

    /** Every trim that kept its premises, in the order the tree applies them. */
    trims: AutoMovieSolidTrim.ITrim[];

    /** The body of trimmed faces sharing their boundaries, as data. */
    body: AutoMovieSolidBody.IPublished;

    /** The skin drawn from the body, every shared boundary vertex for vertex. */
    mesh: IMesh;

    /** Every premise the tree could not keep, in the order met; empty for a clean construction. */
    diagnostics: IAutoMovieConstructionDiagnostic[];
  }
}
