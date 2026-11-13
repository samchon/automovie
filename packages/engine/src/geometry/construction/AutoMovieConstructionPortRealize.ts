import type {
  AutoMovieConstructionNode,
  IAutoMovieConstructionPort,
} from "@automovie/interface";

import { AutoMovieConstructionSplitBand } from "./AutoMovieConstructionSplitBand";
import { AutoMovieConstructionState } from "./AutoMovieConstructionState";
import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieNaturalSpline } from "./AutoMovieNaturalSpline";
import type { AutoMovieSolidBody } from "./AutoMovieSolidBody";
import type { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import { AutoMovieSolidRibbon } from "./AutoMovieSolidRibbon";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** World vector, mm. */
type Vec3 = AutoMovieSolidVector.Vec3;

/**
 * Realize a port (`IAutoMovieConstructionPort`): the host's port curve cut out of its face as a hole, a band from that curve to the part's rail (`AutoMovieConstructionSplitBand.strip`, the split's own strip with the monotone ribbon scale), all sharing their boundary vertices.
 *
 * Steps: walk the host and admit its face; take the checkpoint; walk the part and admit its face and rail (realized after the checkpoint, the rail inside its domain, the rail's side not already cut; a curved rail, `rails`, is the periodic cubic through its distances, every column's ring point, chart and ribbon taken at that column's own station on it); build the band, whose start ribbons are the host surface's 2-jet across the port curve (the ellipse, each column scaled from the centre by the loop's share when it declares a shape) toward the curve's centre; then add, in one step, the port curve's vertices on the host (its hole cycle), the rail's vertices on the part (its rail cycle) and the band face with its two station-end cycles, every segment naming the face across it. The band's chain and surface join the realization's chains and surfaces.
 *
 * A broken premise restores the checkpoint and records one diagnostic under the port's name; a foreign error restores it and propagates unchanged.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The port curve is the parent's published loop on its own chart, and its vertices are evaluated once on the host and handed to both the host's hole and the band, as a trim's and a join's rails are, so the faces meet vertex for vertex; rollback is the realization's checkpoint.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, one shared strip builder, then one mutation block, as the split's realization.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No intersection is traced and no vertex is welded by distance; a rail outside the part's domain is refused, not clamped.
 * @evidence contracts/development/common.md#meaningful-documentation States the steps, the shared vertices, the published chain and the failure effects.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in columns for vertices and cycles after the strip; the checkpoint costs O(F+C) as for a join.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each shared vertex is created once and referenced by every cycle that bounds it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body retains 2n vertices, one band face and three cycles; the checkpoint is released when the node settles.
 */
export function AutoMovieConstructionPortRealize(
  node: IAutoMovieConstructionPort,
  body: AutoMovieSolidBody.IBody,
  state: AutoMovieConstructionState.IState,
  walk: (node: AutoMovieConstructionNode) => void,
  report: (node: string, contract: string, detail: string) => void,
): void {
  walk(node.host);
  const hostIndex: number | undefined = state.faces.get(node.hostFace);
  if (hostIndex === undefined || !state.chains.has(node.hostFace))
    return report(
      node.name,
      "host face",
      `the host face ${node.hostFace} was not realized`,
    );
  const snapshot: AutoMovieConstructionState.ISnapshot =
    AutoMovieConstructionState.snap(body, state);

  /** Keep the diagnostic while discarding every post-checkpoint effect. */
  const fail: (detail: string) => void = (detail: string): void => {
    report(node.name, "port", detail);
    AutoMovieConstructionState.restore(body, state, snapshot);
  };
  try {
    walk(node.part);
    const index: number | undefined = state.faces.get(node.partFace);
    const chain: IAutoMovieLoftChain | undefined = state.chains.get(
      node.partFace,
    );
    if (index === undefined || index < snapshot.faces || chain === undefined)
      return fail(`the part face ${node.partFace} was not realized`);
    const kind: "start" | "end" = node.partEnd === "bottom" ? "start" : "end";
    if (
      body.faces[index]!.cycles.some(
        (c: AutoMovieSolidCycle.ICycle): boolean => c.kind === kind,
      )
    )
      return fail(
        `the part face ${node.partFace}'s ${node.partEnd} side is already cut away`,
      );
    const part: IAutoMovieSolidSurface = body.faces[index]!.surface;
    const into: 1 | -1 = node.partEnd === "bottom" ? 1 : -1;
    const S: number = AutoMovieConstructionViews.SCALE;
    const end: number =
      chain.layers[node.partEnd === "bottom" ? 0 : chain.layers.length - 1]!.y;
    const rail: number = end + into * node.rail * S;

    // A curved rail: its station at each part phase, the periodic cubic
    // through the declared distances.
    const profile: ((psi: number) => number) | undefined =
      node.rails === undefined
        ? undefined
        : AutoMovieNaturalSpline.periodic(node.rails.map((x: number): number => end + into * x * S));
    const railAt: (psi: number) => number = (psi: number): number =>
      profile === undefined ? rail : profile(psi);
    const [first, last]: [number, number] = part.domain ?? [
      chain.layers[0]!.y,
      chain.layers[chain.layers.length - 1]!.y,
    ];
    const reach: number[] =
      node.rails === undefined
        ? [rail]
        : Array.from({ length: 8 * node.rails.length }, (_: unknown, j: number): number =>
            railAt((2 * Math.PI * j) / (8 * node.rails!.length)),
          );
    if (!reach.every((s: number): boolean => s > first && s < last))
      return fail(
        `the part face ${node.partFace}'s rail at stations ${Math.min(...reach)} to ${Math.max(...reach)} mm leaves its domain [${first}, ${last}] mm`,
      );

    // The port curve on the host's chart (station mm, phase rad) and its
    // chart direction toward the curve's centre, per unit of transverse.
    const host: IAutoMovieSolidSurface = body.faces[hostIndex]!.surface;
    const n: number = node.count;
    const turn: number = 2 * Math.PI;
    const clock: (k: number) => number = (k: number): number => (turn * k) / n;
    const [y0, p0]: [number, number] = [
      node.loop.centre[0] * S,
      node.loop.centre[1],
    ];
    const [a, b]: [number, number] = [node.loop.semi[0] * S, node.loop.semi[1]];
    const chart: [number, number][] = Array.from(
      { length: n },
      (_: unknown, k: number): [number, number] => {
        // A shaped loop keeps each column on its ray from the centre, so the
        // chart direction into the port below is the ellipse's own.
        const share: number = node.loop.shape?.[k] ?? 1;
        return [
          y0 + share * a * Math.cos(clock(k)),
          p0 + share * node.loop.sense * b * Math.sin(clock(k)),
        ];
      },
    );
    const inward: [number, number][] = Array.from(
      { length: n },
      (_: unknown, k: number): [number, number] => [
        -a * Math.cos(clock(k)),
        -node.loop.sense * b * Math.sin(clock(k)),
      ],
    );
    const jets: IAutoMovieSolidSurface.IJet[] = chart.map(
      (c: [number, number]): IAutoMovieSolidSurface.IJet =>
        host.jet(c[0], c[1]),
    );
    const loop: Vec3[] = jets.map(
      (j: IAutoMovieSolidSurface.IJet): Vec3 => [j.p[0], j.p[1], j.p[2]],
    );
    const near: (
      k: number,
      L: number,
    ) => AutoMovieSolidRibbon.IRibbon | string = (
      k: number,
      L: number,
    ): AutoMovieSolidRibbon.IRibbon | string => {
      const j: IAutoMovieSolidSurface.IJet = jets[k]!;
      const [du, dv]: [number, number] = inward[k]!;
      const speed: number = AutoMovieSolidVector.norm(
        AutoMovieSolidVector.combine([
          [du, j.u],
          [dv, j.v],
        ]),
      );
      if (!(speed > 0))
        return `column ${k}: the host's chart direction into the port has no speed`;
      return AutoMovieSolidRibbon.of(
        host,
        chart[k]![0],
        chart[k]![1],
        du,
        dv,
        L / speed,
      );
    };
    const outward: Vec3 | null = AutoMovieSolidVector.unit(
      AutoMovieSolidVector.scale(
        AutoMovieSolidVector.cross(jets[0]!.u, jets[0]!.v),
        host.orientation,
      ),
    );
    if (outward === null)
      return fail(
        "the host's tangent plane at the port's clock origin is degenerate",
      );
    const band: AutoMovieConstructionSplitBand.IStrip | string =
      AutoMovieConstructionSplitBand.strip(node.band, loop, near, outward, {
        surface: part,
        station: rail,
        into,
        ...(profile === undefined ? {} : { along: profile }),
      }, undefined, node.correspondence ?? "angle", node.ribbons ?? "common", (node.profiles ?? []).map(
        (p: IAutoMovieConstructionPort.IProfile): IAutoMovieConstructionPort.IProfile => ({
          ...p,
          knots: p.knots.map(([t, depth]: [number, number]): [number, number] => [t, depth * S]),
        }),
      ));
    if (typeof band === "string") return fail(`band ${node.band}: ${band}`);

    // Shared vertices: the port curve on the host, the rail on the part.
    const mesh: AutoMovieSolidMesh.IMesh = body.mesh;
    const hostOwner: number = AutoMovieSolidMesh.owner(mesh, host);
    const hole: number[] = chart.map((c: [number, number], k: number): number =>
      AutoMovieSolidMesh.vertex(mesh, loop[k]!, hostOwner, c[0], c[1]),
    );
    const partOwner: number = AutoMovieSolidMesh.owner(mesh, part);
    const ring: number[] = band.childPhases.map((psi: number): number =>
      AutoMovieSolidMesh.vertex(
        mesh,
        part.jet(railAt(psi), psi).p,
        partOwner,
        railAt(psi),
        psi,
      ),
    );
    const face: number =
      body.faces.push({
        surface: band.surface,
        stations: Array.from(
          { length: node.rows + 1 },
          (_: unknown, i: number): number => (band.length * i) / node.rows,
        ),
        phases: Array.from({ length: n }, (_: unknown, k: number): number =>
          clock(k),
        ),
        cycles: [],
      }) - 1;

    // The host's hole along the port curve.
    body.faces[hostIndex]!.cycles.push({
      kind: "hole",
      vertices: hole,
      chart: chart.map((c: [number, number]): [number, number] => [c[0], c[1]]),
      neighbours: hole.map(
        (_: number, k: number): AutoMovieSolidCycle.INeighbour => ({
          face,
          from: [0, clock(k)],
          to: [0, clock(k + 1)],
        }),
      ),
    });

    // The band's two station-end cycles.
    const sign: number = Math.sign(
      band.childPhases[n - 1]! - band.childPhases[0]!,
    );
    body.faces[face]!.cycles.push(
      {
        kind: "start",
        vertices: hole.slice(),
        chart: hole.map((_: number, k: number): [number, number] => [
          0,
          clock(k),
        ]),
        neighbours: hole.map(
          (_: number, k: number): AutoMovieSolidCycle.INeighbour => ({
            face: hostIndex,
            from: chart[k]!,
            to: chart[(k + 1) % n]!,
          }),
        ),
      },
      {
        kind: "end",
        vertices: ring.slice(),
        chart: ring.map((_: number, k: number): [number, number] => [
          band.length,
          clock(k),
        ]),
        neighbours: ring.map(
          (_: number, k: number): AutoMovieSolidCycle.INeighbour => ({
            face: index,
            from: [railAt(band.childPhases[k]!), band.childPhases[k]!],
            to: [
              railAt(band.childPhases[(k + 1) % n]!),
              k + 1 < n
                ? band.childPhases[k + 1]!
                : band.childPhases[0]! + sign * turn,
            ],
          }),
        ),
      },
    );

    // The part's rail cycle in increasing part phase.
    const rising: boolean = sign > 0;
    const order: number[] = Array.from(
      { length: n },
      (_: unknown, j: number): number => (rising ? j : n - 1 - j),
    );
    body.faces[index]!.cycles.push({
      kind,
      vertices: order.map((k: number): number => ring[k]!),
      chart: order.map((k: number): [number, number] => [
        railAt(band.childPhases[k]!),
        band.childPhases[k]!,
      ]),
      neighbours: order.map(
        (k: number, j: number): AutoMovieSolidCycle.INeighbour => {
          const next: number = order[(j + 1) % n]!;
          return {
            face,
            from: [band.length, clock(k)],
            to: [
              band.length,
              clock(next) + (j + 1 === n ? (rising ? turn : -turn) : 0),
            ],
          };
        },
      ),
    });
    state.faces.set(node.band, face);
    state.chains.set(node.band, band.chain);
    state.chainList.push(band.chain);
    state.chainSurfaces.push(band.surface);
  } catch (error: unknown) {
    AutoMovieConstructionState.restore(body, state, snapshot);
    if (!(error instanceof AutoMovieLoftAdmissionError)) throw error;
    report(node.name, "port", error.message);
  }
}
