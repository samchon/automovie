import type { IAutoMovieConstructionDiagnostic } from "./IAutoMovieConstructionDiagnostic";
import type { IAutoMovieConstructionProfileSource } from "./IAutoMovieConstructionProfileSource";
import type { IAutoMovieConstructionSharedLoop } from "./IAutoMovieConstructionSharedLoop";
import type { IAutoMovieConstructionSplitBand } from "./IAutoMovieConstructionSplitBand";
import type { IAutoMovieConstructionSplitCompose } from "./IAutoMovieConstructionSplitCompose";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMoviePreparedConstructionProfile } from "./IAutoMoviePreparedConstructionProfile";
import type { IAutoMovieSolidBlendChain } from "./IAutoMovieSolidBlendChain";
import type { IAutoMovieSolidBody } from "./IAutoMovieSolidBody";
import type { IAutoMovieSolidJoin } from "./IAutoMovieSolidJoin";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import type { IAutoMovieSolidTrim } from "./IAutoMovieSolidTrim";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/**
 * Data and callback contracts shared by the ConstructionRealization operations.
 */
export namespace IAutoMovieConstructionRealization {
  /**
   * Realization controls and this invocation's optional evaluated source context.
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

    /** Original shared chart loops named by explicit join keys. Entries borrow immutable sources from this same invocation. */
    loopSources?: ReadonlyMap<string, IAutoMovieConstructionSharedLoop.ISource>;

    /** Optional observed seam curve by composed split name. Each called source owns the full set of seams in that split. */
    splitValleys?: ReadonlyMap<string, IAutoMovieConstructionSplitCompose.Valley>;

    /** Optional nonplanar terminal chart curve by fan split name, scoped to its native parent. */
    splitParentCuts?: ReadonlyMap<string, IAutoMovieConstructionSplitCompose.ParentCut>;

    /** Optional pre-admission source cross lines by fan split name. */
    splitLineProbes?: ReadonlyMap<string, IAutoMovieConstructionSplitBand.LineProbe>;


    /** Independent native rail stations by split and child face, millimetres. */
    splitChildRails?: ReadonlyMap<string, ReadonlyMap<string, number>>;

    /** Curve-owned strips in each declared fan's child order for this realization. */
    splitPrepared?: ReadonlyMap<
      string,
      readonly IAutoMovieConstructionSplitBand.IPreparedStrip[]
    >;
  }

  /**
   * A retained join, named as its node and two seed faces, sharing the realized operator records.
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
   */
  export type IWithoutSkin = Omit<
    IAutoMovieConstructionRealization.IRealization,
    "mesh"
  > & {
    /** Final skin not requested; this is not an empty tessellated mesh. */
    mesh: null;
  };
}
