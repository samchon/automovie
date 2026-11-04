import type { IAutoMovieConstructionDiagnostic } from "@automovie/interface";

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
 * @evidence contracts/common.md#clear-and-simple-design One state record for the walk, one snapshot record, and snap and restore as inverse functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cycles are deep-copied before a join so a clip that edits them in place is undone exactly; nothing is patched back by hand.
 * @evidence contracts/common.md#meaningful-documentation States what the walk keeps, what the snapshot records and what the rollback restores.
 * @evidence contracts/performance.md#efficient-algorithms A snapshot copies the cycles once and records array lengths; a restore truncates in place.
 * @evidence contracts/performance.md#reuse-equivalent-work The mesh's arrays are truncated rather than rebuilt, so vertices before the snapshot are kept as they are.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One cycle copy is held per open join and released when the join settles.
 */
export namespace AutoMovieConstructionState {
  /** What the walk builds besides the body. */
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

    /** The kept joins. */
    joins: AutoMovieConstructionRealization.IJoin[];

    /** The kept trims. */
    trims: AutoMovieSolidTrim.ITrim[];

    /** Every broken premise. */
    diagnostics: IAutoMovieConstructionDiagnostic[];

    /** Pending end-layer replacements of continuations, by the part face's name. */
    overrides: Map<string, IOverride>;
  }

  /** A continuation's pending end layer. */
  export interface IOverride {
    /** The part chain with its end layer replaced, or the premise the pair breaks. */
    apply(chain: IAutoMovieLoftChain): IAutoMovieLoftChain | string;

    /** Whether the part face took it. */
    applied: boolean;

    /** The premise it broke, or null. */
    error: string | null;
  }

  /** The body and the walk's lists before a part was built, to leave the part out again. */
  export interface ISnapshot {
    /** The body's face count. */
    faces: number;

    /** A copy of every face's trim cycles. */
    cycles: AutoMovieSolidCycle.ICycle[][];

    /** Every face's cutter flag. */
    inverted: (boolean | undefined)[];

    /** The mesh's position count. */
    positions: number;

    /** The mesh's coordinate count. */
    coordinates: number;

    /** The mesh's index count. */
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

    /** The kept join list's length. */
    joins: number;

    /** The kept trim list's length. */
    trims: number;
  }

  /** A copy of the body's state that a later rollback restores. */
  export function snap(body: AutoMovieSolidBody.IBody, state: IState): ISnapshot {
    return {
      faces: body.faces.length,
      cycles: body.faces.map((f: AutoMovieSolidBody.IFace): AutoMovieSolidCycle.ICycle[] => f.cycles.map(copy)),
      inverted: body.faces.map((f: AutoMovieSolidBody.IFace): boolean | undefined => f.inverted),
      positions: body.mesh.positions.length,
      coordinates: body.mesh.coordinates.length,
      indices: body.mesh.indices.length,
      owners: body.mesh.owners.length,
      blends: body.blends.length,
      names: new Set(state.faces.keys()),
      chainList: state.chainList.length,
      chainSurfaces: state.chainSurfaces.length,
      blendSurfaces: state.blendSurfaces.length,
      joins: state.joins.length,
      trims: state.trims.length,
    };
  }

  /** Restore the body and the lists to a snapshot. */
  export function restore(body: AutoMovieSolidBody.IBody, state: IState, s: ISnapshot): void {
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
    state.joins.length = s.joins;
    state.trims.length = s.trims;
  }

  /** A deep copy of a cycle. */
  function copy(c: AutoMovieSolidCycle.ICycle): AutoMovieSolidCycle.ICycle {
    return {
      kind: c.kind,
      vertices: c.vertices.slice(),
      chart: c.chart.map((p: [number, number]): [number, number] => [p[0], p[1]]),
      neighbours: c.neighbours.map((n: AutoMovieSolidCycle.INeighbour): AutoMovieSolidCycle.INeighbour => ({ face: n.face, from: [n.from[0], n.from[1]], to: [n.to[0], n.to[1]] })),
    };
  }
}
