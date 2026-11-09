import type { AutoMovieSolidBody } from "./AutoMovieSolidBody";
import type { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * A continuation's shared ring on the body: its vertices on the host face's end section at uniform host phases, a winding cycle of the host face there, and the same vertices as a winding cycle of the part face at the matching part phases (the host's phase, or its negative when the part's stations run against the host's), so the two faces are drawn onto one ring vertex for vertex.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where the vertices lie, both cycles, the part's phase order and the sign's meaning.
 * @evidence contracts/development/design.md#principled-representation Represents A continuation's shared ring on the body: its vertices on the host face's end section at uniform host phases, a winding cycle of the host face there, and the same vertices as a winding cycle of the part face at the matching part phases (the host's phase, or its negative when the part's stations run against the host's), so the two faces are drawn onto one ring vertex for vertex: companion namespace of 2 members (`IRing`, `create`); units and frames named in its text: radian, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieConstructionRing` in packages/engine/src/geometry/construction/AutoMovieConstructionRing.ts; its surface is the 2 members listed and the text shows 3 other files naming it, mostly packages/engine (3), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export namespace AutoMovieConstructionRing {
  /**
   * Face/end identifiers and phase correspondence for a continuation's shared ring.
   *
   * @evidence contracts/development/design.md#principled-representation One host ring maps to both endpoint charts with sign 1/-1, expressing the boundary correspondence established by the continuation layer transform.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A small record carries the two faces, stations, kept cycle kinds, sample count and phase sign without embedding another ring geometry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Face validity, matching endpoint geometry and a positive integer count are caller premises; this record does not prove or repair them.
   * @evidence contracts/development/common.md#meaningful-documentation Gives millimetre stations, start/end kept-side meaning and reversed phase order.
   */
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

  /**
   * Add the host-sampled vertices and both faces' cycles to the mutable body.
   * Matching endpoint geometry has already been established by the continuation.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates host endpoint positions once and assigns their vertex indices to both charts, reversing the part's index correspondence when stations oppose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation owns shared vertex allocation and both neighbour/cycle records, so no post-tessellation welding stage is needed.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the caller's face/station/count/sign data without distance matching or an independent endpoint-equality check; invalid inputs can throw after mutation, so realization owns the admitted context.
   * @evidence contracts/development/common.md#meaningful-documentation States mutation, prior endpoint agreement, winding/phase mapping and the mm/radian chart convention through IRing.
   * @evidence contracts/development/implementation.md#efficient-algorithms For F mesh owners and C ring samples, owner lookup costs O(F), C surface jets supply positions and O(C) work builds cycles/adjacency arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both faces share exact vertex indices; the owner lookup reuses the existing unique-name surface owner in this admitted body.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body retains C vertices and two O(C) cycle/adjacency records, with a surface closure only if its owner is newly registered; the local order array has call lifetime.
   */
  export function create(body: AutoMovieSolidBody.IBody, r: IRing): void {
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
        (_: number, k: number): AutoMovieSolidCycle.INeighbour => ({
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
        (_: number, j: number): AutoMovieSolidCycle.INeighbour => ({
          face: r.host,
          from: [r.hostStation, r.sign * phase(j)],
          to: [r.hostStation, r.sign * phase(j + 1)],
        }),
      ),
    });
  }
}
