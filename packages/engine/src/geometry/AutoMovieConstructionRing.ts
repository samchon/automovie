import type {
  IAutoMovieConstructionRing,
  IAutoMovieSolidBody,
  IAutoMovieSolidCycle,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";

/**
 * A continuation's shared ring on the body: its vertices on the host face's end
 * section at uniform host phases, a winding cycle of the host face there, and
 * the same vertices as a winding cycle of the part face at the matching part
 * phases (the host's phase, or its negative when the part's stations run
 * against the host's), so the two faces are drawn onto one ring vertex for
 * vertex.
 */
export namespace AutoMovieConstructionRing {
  /**
   * Add the host-sampled vertices and both faces' cycles to the mutable body.
   * Matching endpoint geometry has already been established by the
   * continuation.
   */
  export function create(
    body: IAutoMovieSolidBody.IBody,
    r: IAutoMovieConstructionRing.IRing,
  ): void {
    const host: IAutoMovieSolidSurface = body.faces[r.host]!.surface;
    const owner: number = AutoMovieSolidMesh.owner(body.mesh, host);
    const phase = (k: number): number => (2 * Math.PI * k) / r.count;
    const vertices: number[] = Array.from(
      { length: r.count },
      (_: unknown, k: number): number =>
        AutoMovieSolidMesh.vertex(
          body.mesh,
          host.jet(r.hostStation, phase(k)).p,
          owner,
          r.hostStation,
          phase(k),
        ),
    );
    body.faces[r.host]!.cycles.push({
      kind: r.hostKind,
      vertices,
      chart: vertices.map((_: number, k: number): [number, number] => [
        r.hostStation,
        phase(k),
      ]),
      neighbours: vertices.map(
        (_: number, k: number): IAutoMovieSolidCycle.INeighbour => ({
          face: r.part,
          from: [r.partStation, r.sign * phase(k)],
          to: [r.partStation, r.sign * phase(k + 1)],
        }),
      ),
    });
    // The part's cycle in increasing part phase: part phase j is host vertex j, or host vertex -j.
    const order: number[] = Array.from(
      { length: r.count },
      (_: unknown, j: number): number =>
        r.sign === 1 ? j : (r.count - j) % r.count,
    );
    body.faces[r.part]!.cycles.push({
      kind: r.partKind,
      vertices: order.map((k: number): number => vertices[k]!),
      chart: order.map((_: number, j: number): [number, number] => [
        r.partStation,
        phase(j),
      ]),
      neighbours: order.map(
        (_: number, j: number): IAutoMovieSolidCycle.INeighbour => ({
          face: r.host,
          from: [r.hostStation, r.sign * phase(j)],
          to: [r.hostStation, r.sign * phase(j + 1)],
        }),
      ),
    });
  }
}
