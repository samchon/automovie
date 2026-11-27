import type {
  IAutoMovieConstructionState,
  IAutoMovieSolidBody,
  IAutoMovieSolidCycle,
} from "@automovie/interface";

import { AutoMovieEngineSolidCycle } from "./AutoMovieEngineSolidCycle";

/**
 * What a construction's walk builds besides the body
 * (`realizeAutoMovieConstruction`), and its rollback: a snapshot of the body's
 * faces, cycles, mesh and the walk's lists taken before a part is built,
 * restored when the node attaching that part breaks a premise, so the part's
 * whole subtree is left out and its host stands as it was.
 */
export namespace AutoMovieEngineConstructionState {
  /**
   * Capture the geometry/list checkpoint consumed by a failed subtree's
   * rollback.
   */
  export function snap(
    body: IAutoMovieSolidBody.IBody,
    state: IAutoMovieConstructionState.IState,
  ): IAutoMovieConstructionState.ISnapshot {
    return {
      faces: body.faces.length,
      cycles: body.faces.map(
        (f: IAutoMovieSolidBody.IFace): IAutoMovieSolidCycle.ICycle[] =>
          f.cycles.map(copy),
      ),
      inverted: body.faces.map(
        (f: IAutoMovieSolidBody.IFace): boolean | undefined => f.inverted,
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
      fairs: state.fairs?.length ?? 0,
      joins: state.joins.length,
      trims: state.trims.length,
    };
  }

  /**
   * Restore checkpointed geometry and lists; keep diagnostics and scoped
   * override state. Saved cycle arrays are transferred back to faces rather
   * than copied again.
   */
  export function restore(
    body: IAutoMovieSolidBody.IBody,
    state: IAutoMovieConstructionState.IState,
    s: IAutoMovieConstructionState.ISnapshot,
  ): void {
    body.faces.length = s.faces;
    body.faces.forEach((f: IAutoMovieSolidBody.IFace, i: number): void => {
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
    if (state.fairs !== undefined) state.fairs.length = s.fairs;
    state.joins.length = s.joins;
    state.trims.length = s.trims;
  }

  /*
   * A deep copy of a cycle, by the cycle's own copy, so a snapshot keeps its
   * exact curve and boundary readers (`AutoMovieEngineSolidCycle.copy`).
   */
  function copy(c: IAutoMovieSolidCycle.ICycle): IAutoMovieSolidCycle.ICycle {
    return AutoMovieEngineSolidCycle.copy(c);
  }
}
