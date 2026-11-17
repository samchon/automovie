import type { IAutoMovieConstructionDiagnostic } from "./IAutoMovieConstructionDiagnostic";
import type { IAutoMovieConstructionProfileBody } from "./IAutoMovieConstructionProfileBody";
import type { IAutoMovieConstructionRealization } from "./IAutoMovieConstructionRealization";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMoviePreparedConstructionProfile } from "./IAutoMoviePreparedConstructionProfile";
import type { IAutoMovieSolidCycle } from "./IAutoMovieSolidCycle";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import type { IAutoMovieSolidTrim } from "./IAutoMovieSolidTrim";

/**
 * Mutable state and append-only checkpoints of one construction realization walk.
 *
 * @evidence contracts/development/design.md#principled-representation Face/name indexes, output lists and pending transformations have explicit per-walk ownership; checkpoints retain geometry lengths and cycle copies.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Realize and its leaf/operator handlers share this state and the same snap/restore protocol.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Rollback excludes diagnostics, overrides and arbitrary edits to old records; it is valid for the walk's append/cycle mutation model.
 * @evidence contracts/development/common.md#meaningful-documentation Defines mutation ownership and the checkpoint's scope.
 */
export namespace IAutoMovieConstructionState {
  /**
     * The realization walk's mutable indexes, output lists, diagnostics and pending continuation work.
     *
     * @evidence contracts/development/design.md#principled-representation Name indexes connect admitted tree references to body faces/chains, while ordered lists retain the records that survive rollback.
     * @evidence contracts/development/design.md#minimal-and-owned-surface One call-local state groups discovery indexes and published-output preparation without a second geometry owner.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Diagnostics intentionally survive geometry rollback; overrides have their own scoped registration/consumption and are not part of the checkpoint.
     * @evidence contracts/development/common.md#meaningful-documentation Names index keys, list order, pending replacement meaning and every reported-premise collection.
     */
    export interface IState {
      /** Each realized face's index in the body, by its view part's or join's name. */
      faces: Map<string, number>;
  
      /** Each realized view part's chain, by name. */
      chains: Map<string, IAutoMovieLoftChain>;
  
      /** The view parts' chains, in walk order. */
      chainList: IAutoMovieLoftChain[];
  
      /** The view parts' surfaces, in walk order. */
      chainSurfaces: IAutoMovieSolidSurface[];
  
      /** The blends' surfaces, in walk order. */
      blendSurfaces: IAutoMovieSolidSurface[];
  
      /** Actual retained profile families, in walk order; absent in legacy manually assembled states. */
      profiles?: IAutoMoviePreparedConstructionProfile.IPrepared[];
  
      /** Actual collapsed profile ends awaiting drawn-boundary admission. */
      profileEnds?: IAutoMovieConstructionProfileBody.IEnd[];
  
      /**
       * The regions the drawn skin is faired over (`fairAutoMovieSolidMesh`), each about its sources, mesh vertices, or about every vertex a
       * surface owns once the skin is drawn (a merge's blend), each radius mm; absent, none.
       */
      fairs?: {
        /** Explicit body-mesh vertex IDs used when surface is absent; absent means no seeds and that empty region is dropped before fairing. */
        vertices?: number[];

        /** When present, overrides vertices with every drawn vertex whose registered owner is this same surface object. */
        surface?: IAutoMovieSolidSurface;

        /** Positive finite reach along mesh edges in millimetres, checked by fairAutoMovieSolidMesh for retained nonempty regions. */
        radius: number;
      }[];
  
      /** The kept joins. */
      joins: IAutoMovieConstructionRealization.IJoin[];
  
      /** The kept trims. */
      trims: IAutoMovieSolidTrim.ITrim[];
  
      /** Every broken premise. */
      diagnostics: IAutoMovieConstructionDiagnostic[];
  
      /** Pending continuation transformations by leaf name; a nested owner composes the previous pending transformation before its own. */
      overrides: Map<string, IAutoMovieConstructionState.IOverride>;
    }

  /**
     * A scoped continuation replacement callback and the walk's application/failure state.
     *
     * @evidence contracts/development/design.md#principled-representation The callback receives the just-lofted part chain; applied/error record the walk's actual use of its chain-or-premise result.
     * @evidence contracts/development/design.md#minimal-and-owned-surface One current record connects a named future view to its host boundary; a nested record retains and composes its enclosing record without a second loft pass.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Pending existence is not success: realization checks applied and the part face before retaining the continuation.
     * @evidence contracts/development/common.md#meaningful-documentation Gives the replacement result and distinguishes unapplied, applied and failed state.
     */
    export interface IOverride {
      /**
       * Return the chain with the pending endpoint replacement, or a premise string.
       *
       * @evidence contracts/development/implementation.md#principled-implementation A chain-or-string result lets the realizing view preserve a failed replacement as a named continuation premise rather than substituting geometry.
       * @evidence contracts/development/implementation.md#clear-and-simple-structure The callback consumes the already lofted chain and leaves applied/error bookkeeping to its walk owner.
       * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The signature promises no validation or retry; its producer applies enclosing pending transformations before its own ConstructionContinuation.apply call, preserving each owner's actual result and first refusal.
       * @evidence contracts/development/common.md#meaningful-documentation States successful replacement versus premise-string return and the pending endpoint role.
       * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This callable interface member has no implementation; the concrete continuation transform owns its algorithm.
       * @evidence contracts/development/implementation.md#reuse-equivalent-work The current producer reuses its closed-over host boundary and the supplied part chain instead of lofting either again.
       * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Invocation acquires no handle by contract; the pending record's map entry owns the callback lifetime and the returned chain's owner retains its shared data.
       */
      apply(chain: IAutoMovieLoftChain): IAutoMovieLoftChain | string;
  
      /** Whether the part face took it. */
      applied: boolean;
  
      /** The premise it broke, or null. */
      error: string | null;
    }

  /**
     * A geometry/list checkpoint before building a part; diagnostics and pending overrides are excluded.
     *
     * @evidence contracts/development/design.md#principled-representation Saves existing cycles/inverted flags and append-only array lengths/name membership so a failed subtree can be removed under the realization's mutation model.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Deep cycle data and scalar lengths distinguish state that can be edited in place from state restored by truncation.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts This is not an arbitrary object-graph transaction: old mesh numbers, station grids, surface records, diagnostics and overrides are not copied or restored.
     * @evidence contracts/development/common.md#meaningful-documentation Names every saved population and the excluded state, with array lengths expressed as entry counts rather than byte or triangle counts.
     */
    export interface ISnapshot {
      /** The body's face count. */
      faces: number;
  
      /** Copied cycle arrays with copied vertex/chart/neighbor data and borrowed along callbacks; restore installs these arrays directly. */
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
