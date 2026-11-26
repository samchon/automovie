import { type IAutoMovieVector3, type IAutoMovieZone, type IAutoMovieResolveZone } from "@automovie/interface";
import { resolveAutoMovieZone as resolveAutoMovieZoneImplementation } from "./internal/resolveAutoMovieZone";

/** Public operations for Auto Movie Engine Composition Zone. */
export namespace AutoMovieEngineCompositionZone {
  /**
   * The point of a zone a move goes to: a named landmark, or the zone's centre
   * moved toward a bearing by a share of its radius, so a scene names where to go
   * and the set decides the coordinates.
   *
   * @param zones The set's zones.
   * @param id The zone id.
   * @param where A landmark name, or a bearing (radians from +Z toward +X) and a
   *   share in [0, 1] of the radius; the centre when absent.
   * @returns The world point.
   */
  export function resolve(zones: readonly IAutoMovieZone[], id: string, where?: IAutoMovieResolveZone.IWhere): IAutoMovieVector3 {
    return resolveAutoMovieZoneImplementation(zones, id, where);
  }
}
