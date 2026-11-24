import type {
  AutoMovieVector3Tuple,
  IAutoMovieBlendCrossJet,
  IAutoMovieConstructionBandEdge,
  IAutoMovieConstructionBandProfile,
  IAutoMovieConstructionBandProfile64,
  IAutoMovieConstructionNode,
  IAutoMovieConstructionPort,
  IAutoMovieConstructionPortCurve,
  IAutoMovieConstructionPortField,
  IAutoMovieConstructionSplitBand,
  IAutoMovieConstructionState,
  IAutoMovieLoftChain,
  IAutoMovieSolidBody,
  IAutoMovieSolidCycle,
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieConstructionPortBand } from "./AutoMovieConstructionPortBand";
import { AutoMovieConstructionPortCurve } from "./AutoMovieConstructionPortCurve";
import { AutoMovieConstructionPortField as PortField } from "./AutoMovieConstructionPortField";
import { AutoMovieConstructionPortMeridian } from "./AutoMovieConstructionPortMeridian";
import { AutoMovieConstructionSplitBand } from "./AutoMovieConstructionSplitBand";
import { AutoMovieConstructionState } from "./AutoMovieConstructionState";
import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import { AutoMovieSolidRibbon } from "./AutoMovieSolidRibbon";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/** World vector, mm. */
type Vec3 = AutoMovieVector3Tuple;

/**
 * Realize a port (`IAutoMovieConstructionPort`): the host's port curve cut out of its face as a hole, a band from that curve to the part's rail (`AutoMovieConstructionSplitBand.strip`, the split's own strip with the monotone ribbon scale), all sharing their boundary vertices.
 *
 * Steps: walk the host and admit its face; take the checkpoint; walk the part and admit its face and rail (realized after the checkpoint, the rail inside its domain, the rail's side not already cut; a curved rail, `rails`, is the periodic cubic through its distances, every column's ring point, chart and ribbon taken at that column's own station on it); build the band, whose start ribbons are the host surface's 2-jet across the port curve (the ellipse, each column scaled from the centre by the loop's share when it declares a shape) toward the curve's centre; then add, in one step, the port curve's vertices on the host (its hole cycle), the rail's vertices on the part (its rail cycle) and the band face with its two station-end cycles, every segment naming the face across it. The band's chain and surface join the realization's chains and surfaces.
 *
 * A broken premise restores the checkpoint and records one diagnostic under the port's name; a foreign error restores it and propagates unchanged.
 *
 * One owner per seam, read between the columns as well as at them: the port curve (`AutoMovieConstructionPortCurve.curve`, the loop's ellipse with its shares joined by the periodic cubic) is the host's seam, and the rail field (one station, or the periodic cubic through `rails`) the part's. The host's hole keeps the outside of that curve and maps a point inside it to the band at its radial foot's clock; the band's face is the exact band (`AutoMovieConstructionPortBand`), whose start edge is the host on that curve and whose end edge is the part on its rail, each with the side's own cross 2-jet; the band's start and end cycles and the part's rail cycle map across by the same curve and correspondence (`IAutoMovieSolidCycle.IExact`). No second interpolation of either seam exists. The column strip still admits the columns, finds their ribbon factors and publishes its chain as the band's column record. A profiled band is the exact band carried in by its profiles' displacement (`AutoMovieConstructionSplitBand.profiled`, `AutoMovieConstructionPortBand.carried`), laid along the exact band's own normal, so it keeps the same seams and readers; its published chain is the profiled column strip.
 */
export function AutoMovieConstructionPortRealize(
  node: IAutoMovieConstructionPort,
  body: IAutoMovieSolidBody.IBody,
  state: IAutoMovieConstructionState.IState,
  walk: (node: IAutoMovieConstructionNode) => void,
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
  const snapshot: IAutoMovieConstructionState.ISnapshot =
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
        (c: IAutoMovieSolidCycle.ICycle): boolean => c.kind === kind,
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

    // The rail's station at each part phase: one station, or the periodic cubic through the declared distances. The part's rail cycle,
    // the column strip and the exact band all read this one field.
    const railField: IAutoMovieConstructionPortField.IField =
      node.rails === undefined
        ? PortField.constant(rail)
        : PortField.periodic(
            node.rails.map((x: number): number => end + into * x * S),
          );
    const profile: ((psi: number) => number) | undefined =
      node.rails === undefined
        ? undefined
        : (psi: number): number => railField.at(psi)[0];
    const railAt: (psi: number) => number = (psi: number): number =>
      profile === undefined ? rail : profile(psi);
    const [first, last]: [number, number] = part.domain ?? [
      chain.layers[0]!.y,
      chain.layers[chain.layers.length - 1]!.y,
    ];
    const reach: number[] =
      node.rails === undefined
        ? [rail]
        : Array.from(
            { length: 8 * node.rails.length },
            (_: unknown, j: number): number =>
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
    // The port curve, the one owner of the host's seam: its columns are its samples, the host's hole reads it between them, and the
    // exact band's start edge is the host on it (`AutoMovieConstructionPortCurve.curve`).
    const portCurve: IAutoMovieConstructionPortCurve.ICurve | string =
      AutoMovieConstructionPortCurve.curve(node.loop, n, host.period);
    if (typeof portCurve === "string") return fail(portCurve);
    const { addresses: chart, inward }: IAutoMovieConstructionPortCurve.ICurve = portCurve;
    const jets: IAutoMovieSolidSurface.IJet[] = chart.map(
      (c: [number, number]): IAutoMovieSolidSurface.IJet =>
        host.jet(c[0], c[1]),
    );
    const loop: Vec3[] = jets.map(
      (j: IAutoMovieSolidSurface.IJet): Vec3 => [j.p[0], j.p[1], j.p[2]],
    );
    const near: (k: number, L: number) => IAutoMovieBlendCrossJet | string = (
      k: number,
      L: number,
    ): IAutoMovieBlendCrossJet | string => {
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
    const band: IAutoMovieConstructionSplitBand.IStrip | string =
      AutoMovieConstructionSplitBand.strip(
        node.band,
        loop,
        near,
        outward,
        {
          surface: part,
          station: rail,
          into,
          ...(profile === undefined ? {} : { along: profile }),
        },
        undefined,
        node.correspondence ?? "angle",
        node.ribbons ?? "common",
      );
    if (typeof band === "string") return fail(`band ${node.band}: ${band}`);

    // The band's face: the exact band on both seams (`AutoMovieConstructionPortBand`), the column strip's own values joined round the
    // loop.
    const exact: IAutoMovieConstructionBandEdge | string =
      AutoMovieConstructionPortBand.create({
        name: node.band,
        host,
        curve: portCurve,
        child: { surface: part, rail: railField, into },
        childPhases: band.childPhases,
        field: band.field,
        length: band.length,
        orientation: band.surface.orientation,
      });
    if (typeof exact === "string") return fail(`band ${node.band}: ${exact}`);

    // A profiled band: the exact band carried in by the profiles' displacement, the profiled column strip less the plain one, its
    // cross sections laid along the exact band's normal. The seams and their readers stay the exact band's.
    const shaped:
      | { chain: IAutoMovieLoftChain; surface: IAutoMovieSolidSurface }
      | string
      | null =
      (node.profiles ?? []).length === 0
        ? null
        : AutoMovieConstructionSplitBand.profiled(
            band,
            (node.profiles ?? []).map(
              (
                p: IAutoMovieConstructionBandProfile,
              ): IAutoMovieConstructionBandProfile64 => ({
                ...p,
                knots: p.knots.map(
                  ([t, depth]: [number, number]): [number, number] => [
                    t,
                    depth * S,
                  ],
                ),
              }),
            ),
            exact.surface,
          );
    if (typeof shaped === "string") return fail(`band ${node.band}: ${shaped}`);
    const unguided: IAutoMovieSolidSurface =
      shaped === null
        ? exact.surface
        : AutoMovieConstructionPortBand.carried(
            exact.surface,
            shaped.surface,
            band.surface,
          );
    // Resolve the guide's section within a micron in the original world chart.
    const surface: IAutoMovieSolidSurface | string =
      node.meridian === undefined
        ? unguided
        : AutoMovieConstructionPortMeridian(unguided, node.meridian, S, 0.001);
    if (typeof surface === "string")
      return fail(`band ${node.band}: ${surface}`);
    const published: IAutoMovieLoftChain =
      shaped === null ? band.chain : shaped.chain;

    // Shared vertices: the port curve on the host, the rail on the part.
    const mesh: IAutoMovieSolidMesh.IMesh = body.mesh;
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
        surface,
        stations: Array.from(
          { length: node.rows + 1 },
          (_: unknown, i: number): number =>
            i === node.rows ? band.length : (band.length * i) / node.rows,
        ),
        phases: Array.from({ length: n }, (_: unknown, k: number): number =>
          clock(k),
        ),
        cycles: [],
      }) - 1;

    // The host's hole along the port curve: it keeps the outside of the curve itself between its vertices, and maps a point inside to
    // the band's start edge at the clock of its radial foot, where the band stands on the host's same point.
    body.faces[hostIndex]!.cycles.push({
      kind: "hole",
      vertices: hole,
      chart: chart.map((c: [number, number]): [number, number] => [c[0], c[1]]),
      neighbours: hole.map(
        (_: number, k: number): IAutoMovieSolidCycle.INeighbour => ({
          face,
          from: [0, clock(k)],
          to: [0, clock(k + 1)],
        }),
      ),
      exact: {
        count: n,
        kept: (u: number, v: number): boolean => !portCurve.inside(u, v),
        across: (u: number, v: number): [number, number] => [
          0,
          portCurve.clock(u, v),
        ],
      },
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
          (_: number, k: number): IAutoMovieSolidCycle.INeighbour => ({
            face: hostIndex,
            from: chart[k]!,
            to: chart[(k + 1) % n]!,
          }),
        ),
        // Its station-0 line is already exact; a point before it maps to the host on the port curve at its own clock.
        exact: {
          count: n,
          across: (_: number, v: number): [number, number] =>
            portCurve.at(v).point,
        },
      },
      {
        kind: "end",
        vertices: ring.slice(),
        chart: ring.map((_: number, k: number): [number, number] => [
          band.length,
          clock(k),
        ]),
        neighbours: ring.map(
          (_: number, k: number): IAutoMovieSolidCycle.INeighbour => ({
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
        // Its station-L line is already exact; a point past it maps to the part's rail at the band's correspondence of its clock.
        exact: {
          count: n,
          across: (_: number, v: number): [number, number] => exact.rail(v),
        },
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
      // A curved rail is the exact curve the band ends on between its columns (each column ends on it, `AutoMovieConstructionSplitBand.strip`,
      // and the band's chain runs between them), so the part keeps the stations past that curve, not past the chords through the columns:
      // on f1's arm under its armpit band those chords stood up to 0.032 mm past the band's end mid-column, a strip of the arm that belonged
      // to neither face, and the slit cutter's host rail crossed the seam through it. A straight rail's chords are the rail itself.
      ...(profile === undefined ? {} : { along: railAt }),
      // A point past the rail maps to the band's end edge at the clock whose rail point stands at its phase.
      exact: {
        count: n,
        across: (_: number, v: number): [number, number] => [
          band.length,
          exact.clock(v),
        ],
      },
      neighbours: order.map(
        (k: number, j: number): IAutoMovieSolidCycle.INeighbour => {
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
    state.chains.set(node.band, published);
    state.chainList.push(published);
    state.chainSurfaces.push(surface);
  } catch (error: unknown) {
    AutoMovieConstructionState.restore(body, state, snapshot);
    if (!(error instanceof AutoMovieLoftAdmissionError)) throw error;
    report(node.name, "port", error.message);
  }
}
