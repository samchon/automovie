import type {
  IAutoMovieConstructionBridgeRealize,
  IAutoMovieConstructionNode,
  IAutoMovieConstructionSplitBand,
  IAutoMovieConstructionState,
  IAutoMovieLoftChain,
  IAutoMovieSolidBody,
  IAutoMovieSolidCycle,
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieConstructionSplitBand } from "../../AutoMovieConstructionSplitBand";
import { AutoMovieConstructionState } from "../../AutoMovieConstructionState";
import { AutoMovieConstructionViews } from "../../AutoMovieConstructionViews";
import { AutoMovieLoftAdmissionError } from "../../AutoMovieLoftAdmissionError";
import { AutoMovieSolidMesh } from "../../AutoMovieSolidMesh";

/**
 * Realize a continuation with a band
 * (`IAutoMovieConstructionContinuation.band`): the host's open end and the
 * part's ring at `rail` inside it joined by one band round the whole ring, so
 * two faces whose sections have different orders meet without either taking the
 * other's.
 *
 * The band is a split's band with one stretch, the host's whole end ring, and
 * no seam (`AutoMovieConstructionSplitBand.fan`): its start ribbon is the
 * host's own 2-jet along its station line out of its end, its end ribbon the
 * part's own 2-jet at the rail toward its kept side, both scaled by the strip's
 * one factor, so the band is G2 to both. The ring's vertices are the host's end
 * cycle and the band's start cycle, the rail's vertices the band's end cycle
 * and the part's rail cycle, each segment naming the face across it, as a
 * split's are.
 *
 * Steps: walk the host and admit its end (realized, no pole there, not already
 * cut); take the checkpoint; walk the part and admit its face and its rail
 * (realized after the checkpoint, the rail inside its domain, its side not
 * already cut); build the band; then add, in one step, the ring and rail
 * vertices, the band's face and its cycles, the host's end cycle and the part's
 * rail cycle. A broken premise restores the checkpoint and records one
 * diagnostic under the continuation's name; a foreign error restores it and
 * propagates.
 *
 * @param node The continuation, its band declared.
 * @param body The body the faces join.
 * @param state The walk's state.
 * @param walk Realizes a subtree.
 * @param report Records a diagnostic.
 */
export function AutoMovieConstructionBridgeRealize(
  node: IAutoMovieConstructionBridgeRealize.INode,
  body: IAutoMovieSolidBody.IBody,
  state: IAutoMovieConstructionState.IState,
  walk: (node: IAutoMovieConstructionNode) => void,
  report: (node: string, contract: string, detail: string) => void,
): void {
  walk(node.host);
  const hostIndex: number | undefined = state.faces.get(node.hostFace);
  const hostChain: IAutoMovieLoftChain | undefined = state.chains.get(
    node.hostFace,
  );
  if (hostIndex === undefined || hostChain === undefined)
    return report(
      node.name,
      "host face",
      `the host face ${node.hostFace} was not realized`,
    );
  const hostKind: "start" | "end" = node.hostEnd === "bottom" ? "start" : "end";
  if (closed(hostChain, node.hostEnd))
    return report(
      node.name,
      "shared end",
      `the host face's ${node.hostEnd} end closes in a pole`,
    );
  if (cut(body, hostIndex, hostKind))
    return report(
      node.name,
      "shared end",
      `the host face's ${node.hostEnd} end is already cut away or shared`,
    );
  const snapshot: IAutoMovieConstructionState.ISnapshot =
    AutoMovieConstructionState.snap(body, state);
  const fail = (detail: string): void => {
    report(node.name, "band", detail);
    AutoMovieConstructionState.restore(body, state, snapshot);
  };
  try {
    walk(node.part);
    const partIndex: number | undefined = state.faces.get(node.partFace);
    const partChain: IAutoMovieLoftChain | undefined = state.chains.get(
      node.partFace,
    );
    if (
      partIndex === undefined ||
      partIndex < snapshot.faces ||
      partChain === undefined
    )
      return fail(`the part face ${node.partFace} was not realized`);
    const partKind: "start" | "end" =
      node.partEnd === "bottom" ? "start" : "end";
    if (cut(body, partIndex, partKind))
      return fail(
        `the part face ${node.partFace}'s ${node.partEnd} side is already cut away`,
      );
    const n: number = node.band.count;
    const turn: number = 2 * Math.PI;
    const clock = (k: number): number => (turn * k) / n;
    const host: IAutoMovieSolidSurface = body.faces[hostIndex]!.surface;
    const hostStation: number = end(hostChain, node.hostEnd);
    const hostInto: 1 | -1 = node.hostEnd === "bottom" ? -1 : 1;
    const part: IAutoMovieSolidSurface = body.faces[partIndex]!.surface;
    const into: 1 | -1 = node.partEnd === "bottom" ? 1 : -1;
    const rail: number =
      end(partChain, node.partEnd) +
      into * node.band.rail * AutoMovieConstructionViews.SCALE;
    const [first, last]: [number, number] = part.domain ?? [
      partChain.layers[0]!.y,
      partChain.layers[partChain.layers.length - 1]!.y,
    ];
    if (!(rail > first && rail < last))
      return fail(
        `the part face ${node.partFace}'s rail at station ${rail} mm lies outside its domain [${first}, ${last}] mm`,
      );

    // One stretch round the whole ring, from the host's phase 0, and no seam: the split's band with its corner turn idle.
    const band:
      | (IAutoMovieConstructionSplitBand.IStrip & { phases: number[] })
      | string = AutoMovieConstructionSplitBand.fan(
      {
        name: node.name,
        host: { surface: host, station: hostStation, into: hostInto },
        child: { surface: part, station: rail, into },
        stretches: [{ kind: "arc", from: 0, to: turn, columns: n }],
        corner: 0,
        correspondence: node.band.correspondence ?? "length",
      },
      n,
    );
    if (typeof band === "string") return fail(band);

    // The shared vertices: the host's end ring at the band's columns and the part's rail at their matched phases.
    const mesh: IAutoMovieSolidMesh.IMesh = body.mesh;
    const hostOwner: number = AutoMovieSolidMesh.owner(mesh, host);
    const ring: number[] = band.phases.map((phi: number): number =>
      AutoMovieSolidMesh.vertex(
        mesh,
        host.jet(hostStation, phi).p,
        hostOwner,
        hostStation,
        phi,
      ),
    );
    const partOwner: number = AutoMovieSolidMesh.owner(mesh, part);
    const rails: number[] = band.childPhases.map((psi: number): number =>
      AutoMovieSolidMesh.vertex(
        mesh,
        part.jet(rail, psi).p,
        partOwner,
        rail,
        psi,
      ),
    );
    const next = (phases: readonly number[], k: number): number =>
      k + 1 < n
        ? phases[k + 1]!
        : phases[0]! + Math.sign(phases[n - 1]! - phases[0]!) * turn;

    // The band's face: rows evenly over its span, the last one its length exactly.
    const rows: number = node.band.rows;
    const face: number =
      body.faces.push({
        surface: band.surface,
        stations: Array.from(
          { length: rows + 1 },
          (_: unknown, k: number): number =>
            k === rows ? band.length : (band.length * k) / rows,
        ),
        phases: Array.from({ length: n }, (_: unknown, k: number): number =>
          clock(k),
        ),
        cycles: [],
      }) - 1;
    body.faces[hostIndex]!.cycles.push({
      kind: hostKind,
      vertices: ring.slice(),
      chart: band.phases.map((phi: number): [number, number] => [
        hostStation,
        phi,
      ]),
      neighbours: ring.map(
        (_: number, k: number): IAutoMovieSolidCycle.INeighbour => ({
          face,
          from: [0, clock(k)],
          to: [0, clock(k + 1)],
        }),
      ),
    });
    body.faces[face]!.cycles.push(
      {
        kind: "start",
        vertices: ring.slice(),
        chart: ring.map((_: number, k: number): [number, number] => [
          0,
          clock(k),
        ]),
        neighbours: ring.map(
          (_: number, k: number): IAutoMovieSolidCycle.INeighbour => ({
            face: hostIndex,
            from: [hostStation, band.phases[k]!],
            to: [hostStation, next(band.phases, k)],
          }),
        ),
      },
      {
        kind: "end",
        vertices: rails.slice(),
        chart: rails.map((_: number, k: number): [number, number] => [
          band.length,
          clock(k),
        ]),
        neighbours: rails.map(
          (_: number, k: number): IAutoMovieSolidCycle.INeighbour => ({
            face: partIndex,
            from: [rail, band.childPhases[k]!],
            to: [rail, next(band.childPhases, k)],
          }),
        ),
      },
    );

    // The part's rail cycle in increasing part phase.
    const rising: boolean = band.childPhases[n - 1]! > band.childPhases[0]!;
    const order: number[] = Array.from(
      { length: n },
      (_: unknown, j: number): number => (rising ? j : n - 1 - j),
    );
    body.faces[partIndex]!.cycles.push({
      kind: partKind,
      vertices: order.map((k: number): number => rails[k]!),
      chart: order.map((k: number): [number, number] => [
        rail,
        band.childPhases[k]!,
      ]),
      neighbours: order.map(
        (k: number, j: number): IAutoMovieSolidCycle.INeighbour => {
          const following: number = order[(j + 1) % n]!;
          const wraps: boolean = j + 1 === n;
          return {
            face,
            from: [band.length, clock(k)],
            to: [
              band.length,
              clock(following) + (wraps ? (rising ? turn : -turn) : 0),
            ],
          };
        },
      ),
    });
    state.faces.set(node.name, face);
    state.chains.set(node.name, band.chain);
    state.chainList.push(band.chain);
    state.chainSurfaces.push(band.surface);
  } catch (error: unknown) {
    AutoMovieConstructionState.restore(body, state, snapshot);
    if (!(error instanceof AutoMovieLoftAdmissionError)) throw error;
    report(node.name, "band", error.message);
  }
}

/** Whether a chain closes in a pole at that end. */
function closed(chain: IAutoMovieLoftChain, side: "bottom" | "top"): boolean {
  return chain.pole?.end === side || chain.opposite?.end === side;
}

/** Whether a face's end is already trimmed or shared. */
function cut(
  body: IAutoMovieSolidBody.IBody,
  index: number,
  kind: "start" | "end",
): boolean {
  return body.faces[index]!.cycles.some(
    (cycle: IAutoMovieSolidCycle.ICycle): boolean => cycle.kind === kind,
  );
}

/** The end station of a chain, mm. */
function end(chain: IAutoMovieLoftChain, side: "bottom" | "top"): number {
  return chain.layers[side === "bottom" ? 0 : chain.layers.length - 1]!.y;
}
