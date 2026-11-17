import type { IAutoMovieConstructionDiagnostic } from "./IAutoMovieConstructionDiagnostic";
import type { IAutoMovieConstructionProfileSource } from "./IAutoMovieConstructionProfileSource";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMoviePreparedConstructionProfile } from "./IAutoMoviePreparedConstructionProfile";
import type { IAutoMovieSolidBlendChain } from "./IAutoMovieSolidBlendChain";
import type { IAutoMovieSolidBody } from "./IAutoMovieSolidBody";
import type { IAutoMovieSolidJoin } from "./IAutoMovieSolidJoin";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import type { IAutoMovieSolidTrim } from "./IAutoMovieSolidTrim";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/** Data and callback contracts shared by the ConstructionRealization operations. */
export namespace IAutoMovieConstructionRealization {
  /**
     * Realization controls and this invocation's optional evaluated source context.
     *
     * @evidence contracts/development/design.md#principled-representation Chord uses tree metres; explicit source keys resolve actual already evaluated millimetre parts, preserving their frame/scalar functions through normal engine lofting.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Tolerance, optional final-skin request and an optional invocation-local source map keep runtime owners outside the pure authoring AST.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts This type does not certify achieved geometric error; realization's positivity check and the emitter's finite midpoint/phase/depth criterion do not prove a continuous maximum bound.
     * @evidence contracts/development/common.md#meaningful-documentation States metre tolerance, default-on skin, millimetre evaluated sources and their immutable caller lifetime; source absence is diagnosed without a sampled fallback.
     */
    export interface IProps {
      /** The skin's chord tolerance: the largest distance between a triangle and the surface it stands for, metres, positive. */
      chord: number;
  
      /** Draw and return the final skin unless false; operator records, boundary publication, diagnostics and chord-derived work remain requested in either mode. */
      skin?: boolean;
  
      /** Evaluated millimetre parts selected only by explicit leaf keys. The map serves this call; retained generating owners stay immutable while outputs are read. Missing keys are diagnostics, never declaration sampling. */
      sources?: ReadonlyMap<string, IAutoMovieViewPart>;
  
      /** Actual original piecewise families by pure profile node name. Complete matching declarations and immutable source dependencies are required through output-reader lifetime. */
      profiles?: ReadonlyMap<string, IAutoMovieConstructionProfileSource>;
    }

  /**
     * A retained join, named as its node and two seed faces, sharing the realized operator records.
     *
     * @evidence contracts/development/design.md#principled-representation Names the traced host/part contact and its blend using the actual records returned by the join/body operators.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Identity fields and join/blend references keep inspection connected to the same geometry used by realization.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts The record itself neither checks a trace nor repairs a rejected blend; realization publishes it only after its operator result is retained.
     * @evidence contracts/development/common.md#meaningful-documentation Distinguishes seed host face from later crossed faces and gives kernel-mm units for the operator records.
     */
    export interface IJoin {
      /** The join node's name, which also names its blend's chain and face. */
      name: string;
  
      /** The host face the trace started on (`seed.hostFace`); the curve may cross onto neighbouring faces. */
      hostFace: string;
  
      /** The part face that meets the host (`seed.partFace`). */
      partFace: string;
  
      /** The join's traced curve, rails and columns, millimetres. */
      join: IAutoMovieSolidJoin.IJoin;
  
      /** Its blend as a chain of two layers, millimetres. */
      blend: IAutoMovieSolidBlendChain.IBlend;
    }

  /**
     * Tessellated skin arrays with metre positions and owner-local chart coordinates.
     *
     * @evidence contracts/development/design.md#principled-representation Indexed triangles share position entries while owner/chart triples identify the surface reading associated with each vertex.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Flat position/index/coordinate arrays and one owner-name array match the existing geometry consumers without another mesh wrapper.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts The structural type does not certify outward winding, closedness, valid indices or surface fidelity; these remain emitter requirements and separate geometry checks.
     * @evidence contracts/development/common.md#meaningful-documentation Gives all array layouts, position/chart unit differences, owner indexing and the required outside-facing winding convention.
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
     * @evidence contracts/development/design.md#principled-representation Preserves node-kind records and diagnostics beside the final skin so a reader can trace emitted data to the construction that survived rollback.
     * @evidence contracts/development/design.md#minimal-and-owned-surface One result groups chains, surfaces, joins, trims, published body and mesh with their documented order/units.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts A returned result can contain diagnostics and an incomplete shape; the type does not convert partial realization into a claim of complete valid geometry.
     * @evidence contracts/development/common.md#meaningful-documentation Names each collection's order, kernel-mm versus mesh-metre boundary and the empty-diagnostics meaning.
     */
    export interface IRealization {
      /** The construction's name. */
      name: string;
  
      /** Every view part's chain, in the tree's depth-first order, each named after its part, millimetres. */
      chains: IAutoMovieLoftChain[];
  
      /** Every face's surface: each chain's lofted surface, then each blend's, named as their owners are, millimetres. */
      surfaces: IAutoMovieSolidSurface[];
  
      /** Retained original piecewise families and actual source/neighborhood/atlas readers; absent in older manually assembled results. Metadata names alone certify no evaluated binding weights. */
      profiles?: IAutoMoviePreparedConstructionProfile.IPrepared[];
  
      /** Every join that kept its premises, in the order the tree applies them (hosts before the joins on them). */
      joins: IAutoMovieConstructionRealization.IJoin[];
  
      /** Every trim that kept its premises, in the order the tree applies them. */
      trims: IAutoMovieSolidTrim.ITrim[];
  
      /** The body of trimmed faces sharing their boundaries, as data. */
      body: IAutoMovieSolidBody.IPublished;
  
      /** The skin drawn from the body, every shared boundary vertex for vertex. */
      mesh: IAutoMovieConstructionRealization.IMesh;
  
      /** Every premise the tree could not keep, in the order met; empty for a clean construction. */
      diagnostics: IAutoMovieConstructionDiagnostic[];
    }

  /**
     * Explicitly unskinned operator realization, with the same units and records as IRealization.
     * Null means final tessellation was not requested, not that an empty mesh passed its checks.
     *
     * @evidence contracts/development/design.md#principled-representation Reuses the normal chain, surface, join, trim, boundary-body and diagnostic fields while representing the omitted final skin explicitly.
     * @evidence contracts/development/design.md#minimal-and-owned-surface One result variant changes only mesh to null; the existing default IRealization keeps its required IMesh field.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts This result does not certify tessellation, closedness or a complete valid shape, and it retains every reported operator failure rather than returning a placeholder skin.
     * @evidence contracts/development/common.md#meaningful-documentation States null's request meaning and preserves the normal record units, order and diagnostic semantics.
     */
    export type IWithoutSkin = Omit<IAutoMovieConstructionRealization.IRealization, "mesh"> & {
      /** Final skin not requested; this is not an empty tessellated mesh. */
      mesh: null;
    };
}
