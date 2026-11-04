import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import type { AutoMovieSolidBody } from "./AutoMovieSolidBody";
import type { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * A continuation's shared ring on the body: its vertices on the host face's end section at uniform host phases, a winding cycle of the host face there, and the same vertices as a winding cycle of the part face at the matching part phases (the host's phase, or its negative when the part's stations run against the host's), so the two faces are drawn onto one ring vertex for vertex.
 *
 * @evidence contracts/common.md#principled-implementation The ring's vertices are evaluated once on the host's end section and given to both faces as winding cycles, so the two tessellations meet vertex for vertex instead of being stitched after the fact.
 * @evidence contracts/common.md#clear-and-simple-design One record names both faces, their end stations, cycle kinds, the ring's count and the phase sign; one function adds the vertices and both cycles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex is welded by distance; the part's cycle lists the host's vertex indices at the phases that evaluate to them.
 * @evidence contracts/common.md#meaningful-documentation States where the vertices lie, both cycles, the part's phase order and the sign's meaning.
 * @evidence contracts/performance.md#efficient-algorithms One surface evaluation per ring vertex and linear cycle construction.
 * @evidence contracts/performance.md#reuse-equivalent-work The same vertex indices serve both faces' cycles.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Adds only the ring's vertices and two cycles to the body; no scratch outlives the call.
 */
export namespace AutoMovieConstructionRing {
  /** A continuation's shared ring. */
  export interface IRing {
    /** The host face's index in the body. */
    host: number;

    /** The host face's end station, mm. */
    hostStation: number;

    /** The host face's cycle kind: `start` keeps the stations above a bottom end, `end` those below a top end. */
    hostKind: "start" | "end";

    /** The part face's index in the body. */
    part: number;

    /** The part face's end station, mm. */
    partStation: number;

    /** The part face's cycle kind, as `hostKind`. */
    partKind: "start" | "end";

    /** Vertices of the ring: the host chain's ring samples. */
    count: number;

    /** 1 when the part's stations continue the host's, -1 when they run against them. */
    sign: 1 | -1;
  }

  /** Add the shared ring's vertices and both faces' cycles to the body. */
  export function create(body: AutoMovieSolidBody.IBody, r: IRing): void {
    const host: IAutoMovieSolidSurface = body.faces[r.host]!.surface;
    const owner: number = AutoMovieSolidMesh.owner(body.mesh, host);
    const phase = (k: number): number => (2 * Math.PI * k) / r.count;
    const vertices: number[] = Array.from({ length: r.count }, (_: unknown, k: number): number =>
      AutoMovieSolidMesh.vertex(body.mesh, host.jet(r.hostStation, phase(k)).p, owner, r.hostStation, phase(k)),
    );
    body.faces[r.host]!.cycles.push({
      kind: r.hostKind,
      vertices,
      chart: vertices.map((_: number, k: number): [number, number] => [r.hostStation, phase(k)]),
      neighbours: vertices.map((_: number, k: number): AutoMovieSolidCycle.INeighbour => ({
        face: r.part,
        from: [r.partStation, r.sign * phase(k)],
        to: [r.partStation, r.sign * phase(k + 1)],
      })),
    });
    // The part's cycle in increasing part phase: part phase j is host vertex j, or host vertex -j.
    const order: number[] = Array.from({ length: r.count }, (_: unknown, j: number): number => (r.sign === 1 ? j : (r.count - j) % r.count));
    body.faces[r.part]!.cycles.push({
      kind: r.partKind,
      vertices: order.map((k: number): number => vertices[k]!),
      chart: order.map((_: number, j: number): [number, number] => [r.partStation, phase(j)]),
      neighbours: order.map((_: number, j: number): AutoMovieSolidCycle.INeighbour => ({
        face: r.host,
        from: [r.hostStation, r.sign * phase(j)],
        to: [r.hostStation, r.sign * phase(j + 1)],
      })),
    });
  }
}
