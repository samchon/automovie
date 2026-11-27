import type { IAutoMovieConstructionDiagnostic } from "./IAutoMovieConstructionDiagnostic";
import type { IAutoMovieConstructionProfileBody } from "./IAutoMovieConstructionProfileBody";
import type { IAutoMovieConstructionRealization } from "./IAutoMovieConstructionRealization";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMoviePreparedConstructionProfile } from "./IAutoMoviePreparedConstructionProfile";
import type { IAutoMovieSolidCycle } from "./IAutoMovieSolidCycle";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import type { IAutoMovieSolidTrim } from "./IAutoMovieSolidTrim";

/**
 * Mutable state and append-only checkpoints of one construction realization
 * walk.
 */
export namespace IAutoMovieConstructionState {
  /**
   * The realization walk's mutable indexes, output lists, diagnostics and
   * pending continuation work.
   */
  export interface IState {
    /**
     * Each realized face's index in the body, by its view part's or join's
     * name.
     */
    faces: Map<string, number>;

    /** Each realized view part's chain, by name. */
    chains: Map<string, IAutoMovieLoftChain>;

    /** The view parts' chains, in walk order. */
    chainList: IAutoMovieLoftChain[];

    /** The view parts' surfaces, in walk order. */
    chainSurfaces: IAutoMovieSolidSurface[];

    /** The blends' surfaces, in walk order. */
    blendSurfaces: IAutoMovieSolidSurface[];

    /**
     * Actual retained profile families, in walk order; absent in legacy
     * manually assembled states.
     */
    profiles?: IAutoMoviePreparedConstructionProfile.IPrepared[];

    /** Actual collapsed profile ends awaiting drawn-boundary admission. */
    profileEnds?: IAutoMovieConstructionProfileBody.IEnd[];

    /**
     * The regions the drawn skin is faired over (`fairSolidMesh`),
     * each about its sources, mesh vertices, or about every vertex a surface
     * owns once the skin is drawn (a merge's blend), each radius mm; absent,
     * none.
     */
    fairs?: {
      /**
       * Explicit body-mesh vertex IDs used when surface is absent; absent means
       * no seeds and that empty region is dropped before fairing.
       */
      vertices?: number[];

      /**
       * When present, overrides vertices with every drawn vertex whose
       * registered owner is this same surface object.
       */
      surface?: IAutoMovieSolidSurface;

      /**
       * Positive finite reach along mesh edges in millimetres, checked by
       * fairSolidMesh for retained nonempty regions.
       */
      radius: number;
    }[];

    /** The kept joins. */
    joins: IAutoMovieConstructionRealization.IJoin[];

    /** The kept trims. */
    trims: IAutoMovieSolidTrim.ITrim[];

    /** Every broken premise. */
    diagnostics: IAutoMovieConstructionDiagnostic[];

    /**
     * Pending continuation transformations by leaf name; a nested owner
     * composes the previous pending transformation before its own.
     */
    overrides: Map<string, IAutoMovieConstructionState.IOverride>;
  }

  /**
   * A scoped continuation replacement callback and the walk's
   * application/failure state.
   */
  export interface IOverride {
    /**
     * Return the chain with the pending endpoint replacement, or a premise
     * string.
     */
    apply(chain: IAutoMovieLoftChain): IAutoMovieLoftChain | string;

    /** Whether the part face took it. */
    applied: boolean;

    /** The premise it broke, or null. */
    error: string | null;
  }

  /**
   * A geometry/list checkpoint before building a part; diagnostics and pending
   * overrides are excluded.
   */
  export interface ISnapshot {
    /** The body's face count. */
    faces: number;

    /**
     * Copied cycle arrays with copied vertex/chart/neighbor data and borrowed
     * along callbacks; restore installs these arrays directly.
     */
    cycles: IAutoMovieSolidCycle.ICycle[][];

    /** Every face's cutter flag. */
    inverted: (boolean | undefined)[];

    /** The position array's scalar entry count, three per vertex. */
    positions: number;

    /** The owner/chart coordinate array's scalar entry count. */
    coordinates: number;

    /** The triangle-index array's entry count, three per triangle. */
    indices: number;

    /** The mesh's owner count. */
    owners: number;

    /** The body's blend count. */
    blends: number;

    /** The names of the faces realized so far. */
    names: Set<string>;

    /** The chain list's length. */
    chainList: number;

    /** The chain surface list's length. */
    chainSurfaces: number;

    /** The blend surface list's length. */
    blendSurfaces: number;

    /** Retained original profile count; zero in legacy states. */
    profiles: number;

    /** Actual collapsed-end record count. */
    profileEnds: number;

    /** The fairing disc list's length; zero when the state keeps none. */
    fairs: number;

    /** The kept join list's length. */
    joins: number;

    /** The kept trim list's length. */
    trims: number;
  }
}
