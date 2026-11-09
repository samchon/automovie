import type { IAutoMovieConstructionDiagnostic } from "@automovie/interface";

import type { AutoMovieConstructionProfile } from "./AutoMovieConstructionProfile";
import type { AutoMovieConstructionProfileBody } from "./AutoMovieConstructionProfileBody";
import type { AutoMovieConstructionRealization } from "./AutoMovieConstructionRealization";
import type { AutoMovieSolidBody } from "./AutoMovieSolidBody";
import type { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import type { AutoMovieSolidTrim } from "./AutoMovieSolidTrim";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * What a construction's walk builds besides the body (`realizeAutoMovieConstruction`), and its rollback: a snapshot of the body's faces, cycles, mesh and the walk's lists taken before a part is built, restored when the node attaching that part breaks a premise, so the part's whole subtree is left out and its host stands as it was.
 *
 * @evidence contracts/common.md#principled-implementation Leaving a broken join out means restoring the body to its state before the part was built: the faces, cycles, cutter flags, mesh lengths and the walk's lists are truncated or restored from one snapshot.
 * @evidence contracts/common.md#clear-and-simple-design One walk record and one geometry/list checkpoint support rollback under the realization's append-and-cycle-edit mutation model; diagnostics and pending overrides remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cycles are deep-copied before a join so a clip that edits them in place is undone exactly; nothing is patched back by hand.
 * @evidence contracts/common.md#meaningful-documentation States what the walk keeps, what the snapshot records and what the rollback restores.
 * @evidence contracts/performance.md#efficient-algorithms A snapshot copies the cycles once and records array lengths; a restore truncates in place.
 * @evidence contracts/performance.md#reuse-equivalent-work The mesh's arrays are truncated rather than rebuilt, so vertices before the snapshot are kept as they are.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One cycle copy is held per open join and released when the join settles.
 */
export namespace AutoMovieConstructionState {
  /**
   * The realization walk's mutable indexes, output lists, diagnostics and pending continuation work.
   *
   * @evidence contracts/common.md#principled-implementation Name indexes connect admitted tree references to body faces/chains, while ordered lists retain the records that survive rollback.
   * @evidence contracts/common.md#clear-and-simple-design One call-local state groups discovery indexes and published-output preparation without a second geometry owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Diagnostics intentionally survive geometry rollback; overrides have their own scoped registration/consumption and are not part of the checkpoint.
   * @evidence contracts/common.md#meaningful-documentation Names index keys, list order, pending replacement meaning and every reported-premise collection.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The interface contains no walk or rollback algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work Maps and output lists share the same realized chain/surface/join identities so later operators and result construction do not rebuild them.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One realize call owns these maps/lists; population follows admitted nodes and produced diagnostics, pending overrides live through their part walks, and returned lists transfer retained records to the caller.
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
    profiles?: AutoMovieConstructionProfile.IPrepared[];

    /** Actual collapsed profile ends awaiting drawn-boundary admission. */
    profileEnds?: AutoMovieConstructionProfileBody.IEnd[];

    /** The kept joins. */
    joins: AutoMovieConstructionRealization.IJoin[];

    /** The kept trims. */
    trims: AutoMovieSolidTrim.ITrim[];

    /** Every broken premise. */
    diagnostics: IAutoMovieConstructionDiagnostic[];

    /** Pending continuation transformations by leaf name; a nested owner composes the previous pending transformation before its own. */
    overrides: Map<string, IOverride>;
  }

  /**
   * A scoped continuation replacement callback and the walk's application/failure state.
   *
   * @evidence contracts/common.md#principled-implementation The callback receives the just-lofted part chain; applied/error record the walk's actual use of its chain-or-premise result.
   * @evidence contracts/common.md#clear-and-simple-design One current record connects a named future view to its host boundary; a nested record retains and composes its enclosing record without a second loft pass.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Pending existence is not success: realization checks applied and the part face before retaining the continuation.
   * @evidence contracts/common.md#meaningful-documentation Gives the replacement result and distinguishes unapplied, applied and failed state.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record declares an operation; ConstructionContinuation.apply owns the concrete transformation cost.
   * @evidence contracts/performance.md#reuse-equivalent-work The callback closes over the already realized host chain and is consumed at the named part's normal construction point, avoiding repeated host generation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The overrides map retains callback/host dependencies during the corresponding part walk; its enclosing entry is then restored, or the key is deleted when none existed. Nested callback links have that walk's scope and acquire no background work.
   */
  export interface IOverride {
    /**
     * Return the chain with the pending endpoint replacement, or a premise string.
     *
     * @evidence contracts/common.md#principled-implementation A chain-or-string result lets the realizing view preserve a failed replacement as a named continuation premise rather than substituting geometry.
     * @evidence contracts/common.md#clear-and-simple-design The callback consumes the already lofted chain and leaves applied/error bookkeeping to its walk owner.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts The signature promises no validation or retry; its producer applies enclosing pending transformations before its own ConstructionContinuation.apply call, preserving each owner's actual result and first refusal.
     * @evidence contracts/common.md#meaningful-documentation States successful replacement versus premise-string return and the pending endpoint role.
     * @evidenceExclude contracts/performance.md#efficient-algorithms This callable interface member has no implementation; the concrete continuation transform owns its algorithm.
     * @evidence contracts/performance.md#reuse-equivalent-work The current producer reuses its closed-over host boundary and the supplied part chain instead of lofting either again.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Invocation acquires no handle by contract; the pending record's map entry owns the callback lifetime and the returned chain's owner retains its shared data.
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
   * @evidence contracts/common.md#principled-implementation Saves existing cycles/inverted flags and append-only array lengths/name membership so a failed subtree can be removed under the realization's mutation model.
   * @evidence contracts/common.md#clear-and-simple-design Deep cycle data and scalar lengths distinguish state that can be edited in place from state restored by truncation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This is not an arbitrary object-graph transaction: old mesh numbers, station grids, surface records, diagnostics and overrides are not copied or restored.
   * @evidence contracts/common.md#meaningful-documentation Names every saved population and the excluded state, with array lengths expressed as entry counts rather than byte or triangle counts.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The checkpoint interface performs no cloning or restoration.
   * @evidence contracts/performance.md#reuse-equivalent-work Preexisting mesh payload is preserved by length checkpoints rather than duplicated per join; mutable cycles require their own saved copies.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One open attaching node retains O(F+C) face/name/cycle data for F existing faces and C cycle entries; nested nodes can retain several such checkpoints until each settles.
   */
  export interface ISnapshot {
    /** The body's face count. */
    faces: number;

    /** A copy of every face's trim cycles. */
    cycles: AutoMovieSolidCycle.ICycle[][];

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

    /** The kept join list's length. */
    joins: number;

    /** The kept trim list's length. */
    trims: number;
  }

  /**
   * Capture the geometry/list checkpoint consumed by a failed subtree's rollback.
   *
   * @evidence contracts/common.md#principled-implementation Copies mutable cycles and inverted flags while recording append-only population lengths and current face names, matching the realization's actual mutation responsibilities.
   * @evidence contracts/common.md#clear-and-simple-design One explicit checkpoint constructor keeps all restored fields visible beside restore.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not claim a full state clone: diagnostics, overrides, existing mesh values and immutable surface/station data remain outside this checkpoint.
   * @evidence contracts/common.md#meaningful-documentation ISnapshot states saved fields, array-entry units, excluded state and the append/edit premise.
   * @evidence contracts/performance.md#efficient-algorithms O(F+C) face/name/cycle copying stores only data that may be edited plus scalar array lengths, avoiding an O(V+T) mesh copy at every attaching node.
   * @evidence contracts/performance.md#reuse-equivalent-work Existing mesh arrays and realized operator records remain shared; each mutable cycle is copied once for this particular checkpoint.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the new face/cycle/name snapshot until the node succeeds or rolls back; nested checkpoints scale with their captured populations and no process cache is used.
   */
  export function snap(
    body: AutoMovieSolidBody.IBody,
    state: IState,
  ): ISnapshot {
    return {
      faces: body.faces.length,
      cycles: body.faces.map(
        (f: AutoMovieSolidBody.IFace): AutoMovieSolidCycle.ICycle[] =>
          f.cycles.map(copy),
      ),
      inverted: body.faces.map(
        (f: AutoMovieSolidBody.IFace): boolean | undefined => f.inverted,
      ),
      positions: body.mesh.positions.length,
      coordinates: body.mesh.coordinates.length,
      indices: body.mesh.indices.length,
      owners: body.mesh.owners.length,
      blends: body.blends.length,
      names: new Set(state.faces.keys()),
      chainList: state.chainList.length,
      chainSurfaces: state.chainSurfaces.length,
      blendSurfaces: state.blendSurfaces.length,
      profiles: state.profiles?.length ?? 0,
      profileEnds: state.profileEnds?.length ?? 0,
      joins: state.joins.length,
      trims: state.trims.length,
    };
  }

  /**
   * Restore checkpointed geometry and lists; keep diagnostics and scoped override state.
   * Saved cycle arrays are transferred back to faces rather than copied again.
   *
   * @evidence contracts/common.md#principled-implementation Truncates appended faces/mesh/owners/blends/output lists, restores saved cycles/inverted flags and deletes post-checkpoint face/chain names under global name uniqueness.
   * @evidence contracts/common.md#clear-and-simple-design In-place restoration preserves the host's object identity and existing mesh numbers without reconstructing its geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not rewind diagnostics/overrides or arbitrary changes to preexisting mesh/surface fields; the caller must use the documented append-and-cycle-edit transaction model.
   * @evidence contracts/common.md#meaningful-documentation States which state survives, cycle-array transfer and the checkpoint's limited mutation coverage.
   * @evidence contracts/performance.md#efficient-algorithms Visits saved faces/current names and truncates appended populations; no surface solve or tessellation is repeated, and array truncation may release a number of entries proportional to discarded output.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the saved cycle arrays and untouched prefix mesh values; saved arrays subsequently become the live mutable face cycles rather than an immutable reusable snapshot.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Discarded array/map entries lose their owning references and saved cycles transfer to the body; the caller then releases the checkpoint when its node settles.
   */
  export function restore(
    body: AutoMovieSolidBody.IBody,
    state: IState,
    s: ISnapshot,
  ): void {
    body.faces.length = s.faces;
    body.faces.forEach((f: AutoMovieSolidBody.IFace, i: number): void => {
      f.cycles = s.cycles[i]!;
      if (s.inverted[i] === undefined) delete f.inverted;
      else f.inverted = s.inverted[i];
    });
    body.mesh.positions.length = s.positions;
    body.mesh.coordinates.length = s.coordinates;
    body.mesh.indices.length = s.indices;
    body.mesh.owners.length = s.owners;
    body.blends.length = s.blends;
    for (const name of [...state.faces.keys()])
      if (!s.names.has(name)) {
        state.faces.delete(name);
        state.chains.delete(name);
      }
    state.chainList.length = s.chainList;
    state.chainSurfaces.length = s.chainSurfaces;
    state.blendSurfaces.length = s.blendSurfaces;
    if (state.profiles !== undefined) state.profiles.length = s.profiles;
    if (state.profileEnds !== undefined)
      state.profileEnds.length = s.profileEnds;
    state.joins.length = s.joins;
    state.trims.length = s.trims;
  }

  /** A deep copy of a cycle. */
  function copy(c: AutoMovieSolidCycle.ICycle): AutoMovieSolidCycle.ICycle {
    return {
      kind: c.kind,
      vertices: c.vertices.slice(),
      chart: c.chart.map((p: [number, number]): [number, number] => [
        p[0],
        p[1],
      ]),
      neighbours: c.neighbours.map(
        (
          n: AutoMovieSolidCycle.INeighbour,
        ): AutoMovieSolidCycle.INeighbour => ({
          face: n.face,
          from: [n.from[0], n.from[1]],
          to: [n.to[0], n.to[1]],
        }),
      ),
    };
  }
}
