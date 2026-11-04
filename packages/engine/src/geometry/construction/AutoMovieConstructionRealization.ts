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
 * The tree is in metres; the kernel works in millimetres, so the realization scales the tree by 1000 once on entry. The chains, surfaces, joins, trims and body are the kernel's own records and stay in millimetres, as their declarations state; the skin's positions are returned in metres, the tree's unit. Any node may be the root: a subtree realizes alone, with its own diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation Returns the kernel's own records instead of copies, so a consumer reads the very chain, curve and blend the skin was drawn from, and the one unit change happens at the boundary where the metre-valued tree enters the millimetre kernel.
 * @evidence contracts/common.md#clear-and-simple-design One option, the chord tolerance, and one result record grouped by node kind; the skin is three flat arrays and an owner list, the form every viewer and test reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no field for a specific part, fixture or caller; a node left out by a broken premise is absent from its list and named in `diagnostics`, never replaced by a fallback shape.
 * @evidence contracts/common.md#meaningful-documentation States each field's content, order and unit, the unit change at entry, the root rule and the effect of a broken premise.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type with no runtime body; the realization's cost is answered on `realizeAutoMovieConstruction`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The records are built once per realization call and cache nothing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The result owns the records one call built and transfers them to the caller.
 */
export namespace AutoMovieConstructionRealization {
  /** The realization's options. */
  export interface IProps {
    /** The skin's chord tolerance: the largest distance between a triangle and the surface it stands for, metres, positive. */
    chord: number;
  }

  /** A join that kept its premises, named as its node and its two seed faces. */
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

  /** The one tessellated skin. */
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

  /** The realized construction. */
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
