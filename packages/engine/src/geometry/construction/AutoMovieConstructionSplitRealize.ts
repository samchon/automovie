import type {
  AutoMovieConstructionNode,
  IAutoMovieConstructionSplit,
} from "@automovie/interface";

import { AutoMovieConstructionSplitBand } from "./AutoMovieConstructionSplitBand";
import { AutoMovieConstructionSplitSeam } from "./AutoMovieConstructionSplitSeam";
import { AutoMovieConstructionState } from "./AutoMovieConstructionState";
import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import type { AutoMovieSolidBody } from "./AutoMovieSolidBody";
import type { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** World vector, mm. */
type Vec3 = AutoMovieSolidVector.Vec3;

/**
 * Realize a split (`IAutoMovieConstructionSplit`): the host's open end divided by the seam chord into both children's loops, each spanned to its child's rail by a band (`AutoMovieConstructionSplitBand`), all sharing their boundary vertices.
 *
 * Steps: walk the host and admit its end (realized, no pole there, not already cut); take the checkpoint; build the curved seam once when a profile is declared (`AutoMovieConstructionSplitSeam`, refused with the split's diagnostic before either child is lofted); walk both children and admit each face and rail (realized after the checkpoint, the rail inside its domain, the rail's side not already cut); build both bands; then add to the body, in one step, the ring vertices on the host's end (both arcs, the seam's two corners shared), the chord's inner vertices (evaluated on band 0, shared by band 1), each child's rail vertices, both band faces with their two station-end cycles, the host's end cycle and each child's rail cycle, every segment naming the face across it. The bands' chains and surfaces join the realization's chains and surfaces, so every consumer of a chain (the skin, a later join or trim naming a band) reads them as any face.
 *
 * A broken premise restores the checkpoint and records one diagnostic under the split's name: both children, both bands and the host's end stand as they were, since one child alone would leave the shared chord open. A foreign error restores the checkpoint and propagates unchanged.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The host's ring, the chord and the rails are evaluated once and handed to every face that bounds them, as a continuation's ring and a join's rails are (`AutoMovieConstructionRing`, `AutoMovieSolidBodyMerge`), so the faces meet vertex for vertex; rollback is the realization's checkpoint.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, band construction, then one mutation block of vertices and cycles.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No vertex is welded by distance and no child is kept without its sibling; a rail outside the child's domain is refused, not clamped.
 * @evidence contracts/development/common.md#meaningful-documentation States the steps, the shared vertices, the published chains and the failure effects.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in columns for vertices and cycles after both bands; the checkpoint costs O(F+C) as for a join.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each shared vertex is created once and referenced by every cycle that bounds it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body retains 2n ring and chord vertices, 2n rail vertices, two band faces and six cycles; the checkpoint is released when the node settles.
 */
export function AutoMovieConstructionSplitRealize(
  node: IAutoMovieConstructionSplit,
  body: AutoMovieSolidBody.IBody,
  state: AutoMovieConstructionState.IState,
  walk: (node: AutoMovieConstructionNode) => void,
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
      "split end",
      `the host face's ${node.hostEnd} end closes in a pole`,
    );
  if (cut(body, hostIndex, hostKind))
    return report(
      node.name,
      "split end",
      `the host face's ${node.hostEnd} end is already cut away or shared`,
    );
  const snapshot: AutoMovieConstructionState.ISnapshot =
    AutoMovieConstructionState.snap(body, state);

  /** Keep the diagnostic while discarding every post-checkpoint effect. */
  const fail: (detail: string) => void = (detail: string): void => {
    report(node.name, "split", detail);
    AutoMovieConstructionState.restore(body, state, snapshot);
  };
  try {
    const n: number = node.count;
    const m: number = n / 2;
    const turn: number = 2 * Math.PI;
    const clock: (k: number) => number = (k: number): number => (turn * k) / n;
    const host: IAutoMovieSolidSurface = body.faces[hostIndex]!.surface;
    const hostStation: number = end(hostChain, node.hostEnd);
    const hostInto: 1 | -1 = node.hostEnd === "bottom" ? -1 : 1;

    // The end section's normal out of the host: the stations advance along
    // `v x u` of a section's frame (`AutoMovieLoftFrame`), so the outward
    // normal at the last station is `v x u` and at the first its negative.
    const layer: IAutoMovieLoftChain.ILayer =
      hostChain.layers[
        node.hostEnd === "bottom" ? 0 : hostChain.layers.length - 1
      ]!;
    const frame: AutoMovieLoftFrame.IFrame =
      layer.frame ?? AutoMovieLoftFrame.horizontal(layer.y);
    const normal: Vec3 | null = AutoMovieSolidVector.unit(
      AutoMovieSolidVector.scale(
        AutoMovieSolidVector.cross(frame.v, frame.u),
        hostInto,
      ),
    );
    if (normal === null) return fail("the host's end section has no plane");

    // The curved seam, built once from the host so both bands read one curve.
    const [a, b]: [number, number] = node.seam;
    let seam:
      | { curve: AutoMovieConstructionSplitSeam.ISeam; corner: number }
      | undefined;
    if (node.profile !== undefined) {
      const S: number = AutoMovieConstructionViews.SCALE;
      const curve: AutoMovieConstructionSplitSeam.ISeam | string =
        AutoMovieConstructionSplitSeam.create({
          host,
          station: hostStation,
          into: hostInto,
          seam: [a, b],
          normal,
          knots: node.profile.knots.map(
            ([along, depth]: [number, number]): [number, number] => [
              along * S,
              depth * S,
            ],
          ),
        });
      if (typeof curve === "string") return fail(`seam: ${curve}`);
      seam = { curve, corner: node.profile.corner };
    }

    // The children, once the host's end and seam are admitted (a refused
    // seam lofts neither child).
    walk(node.children[0].part);
    walk(node.children[1].part);

    // Each child's face and rail, then its band.
    const children: {
      index: number;
      surface: IAutoMovieSolidSurface;
      rail: number;
      kind: "start" | "end";
      band: AutoMovieConstructionSplitBand.IBand;
    }[] = [];
    for (let i: number = 0; i < 2; ++i) {
      const child: IAutoMovieConstructionSplit.IChild = node.children[i]!;
      const index: number | undefined = state.faces.get(child.partFace);
      const chain: IAutoMovieLoftChain | undefined = state.chains.get(
        child.partFace,
      );
      if (index === undefined || index < snapshot.faces || chain === undefined)
        return fail(`the child face ${child.partFace} was not realized`);
      const kind: "start" | "end" =
        child.partEnd === "bottom" ? "start" : "end";
      if (cut(body, index, kind))
        return fail(
          `the child face ${child.partFace}'s ${child.partEnd} side is already cut away`,
        );
      const surface: IAutoMovieSolidSurface = body.faces[index]!.surface;
      const into: 1 | -1 = child.partEnd === "bottom" ? 1 : -1;
      const rail: number =
        end(chain, child.partEnd) +
        into * child.rail * AutoMovieConstructionViews.SCALE;
      const [first, last]: [number, number] = surface.domain ?? [
        chain.layers[0]!.y,
        chain.layers[chain.layers.length - 1]!.y,
      ];
      if (!(rail > first && rail < last))
        return fail(
          `the child face ${child.partFace}'s rail at station ${rail} mm lies outside its domain [${first}, ${last}] mm`,
        );
      const band: AutoMovieConstructionSplitBand.IBand | string =
        AutoMovieConstructionSplitBand.create({
          name: child.band,
          host: { surface: host, station: hostStation, into: hostInto },
          arc: i === 0 ? [a, b] : [b, a + turn],
          normal,
          child: { surface, station: rail, into },
          count: n,
          crease: child.crease,
          ...(seam === undefined ? {} : { seam }),
        });
      if (typeof band === "string") return fail(`band ${child.band}: ${band}`);
      children.push({ index, surface, rail, kind, band });
    }

    // Shared vertices: each arc's ring points before its end corner, the
    // chord's inner points on band 0, each child's rail points.
    const mesh: AutoMovieSolidMesh.IMesh = body.mesh;
    const hostOwner: number = AutoMovieSolidMesh.owner(mesh, host);
    const ring: number[][] = children.map(
      (c: (typeof children)[number]): number[] =>
        c.band.hostPhases
          .slice(0, m)
          .map((phi: number): number =>
            AutoMovieSolidMesh.vertex(
              mesh,
              host.jet(hostStation, phi).p,
              hostOwner,
              hostStation,
              phi,
            ),
          ),
    );
    const zero: (typeof children)[number] = children[0]!;
    const zeroOwner: number = AutoMovieSolidMesh.owner(mesh, zero.band.surface);
    const chord: Map<number, number> = new Map();
    for (let k: number = m + 1; k < n; ++k)
      chord.set(
        k,
        AutoMovieSolidMesh.vertex(
          mesh,
          zero.band.surface.jet(0, clock(k)).p,
          zeroOwner,
          0,
          clock(k),
        ),
      );

    // Each band's loop: its arc (its end corner is the other arc's start),
    // then the chord (band 1 reads band 0's chord point `3 n/2 - k`).
    const loops: number[][] = children.map(
      (_: (typeof children)[number], i: number): number[] =>
        Array.from({ length: n }, (__: unknown, k: number): number =>
          k < m
            ? ring[i]![k]!
            : k === m
              ? ring[1 - i]![0]!
              : chord.get(i === 0 ? k : 3 * m - k)!,
        ),
    );
    const rails: number[][] = children.map(
      (c: (typeof children)[number]): number[] => {
        const owner: number = AutoMovieSolidMesh.owner(mesh, c.surface);
        return c.band.childPhases.map((psi: number): number =>
          AutoMovieSolidMesh.vertex(
            mesh,
            c.surface.jet(c.rail, psi).p,
            owner,
            c.rail,
            psi,
          ),
        );
      },
    );

    // The band faces.
    const faces: number[] = children.map(
      (c: (typeof children)[number]): number =>
        body.faces.push({
          surface: c.band.surface,
          stations: Array.from(
            { length: node.rows + 1 },
            (_: unknown, i: number): number => (c.band.length * i) / node.rows,
          ),
          phases: Array.from({ length: n }, (_: unknown, k: number): number =>
            clock(k),
          ),
          cycles: [],
        }) - 1,
    );

    // The host's end cycle: arc 0 then arc 1, increasing host phase.
    const hostPhase: number[] = [
      ...children[0]!.band.hostPhases.slice(0, m),
      ...children[1]!.band.hostPhases.slice(0, m),
    ];
    const hostVertices: number[] = [...ring[0]!, ...ring[1]!];
    body.faces[hostIndex]!.cycles.push({
      kind: hostKind,
      vertices: hostVertices,
      chart: hostPhase.map((phi: number): [number, number] => [
        hostStation,
        phi,
      ]),
      neighbours: hostVertices.map(
        (_: number, h: number): AutoMovieSolidCycle.INeighbour => {
          const i: number = h < m ? 0 : 1;
          const k: number = h - i * m;
          return {
            face: faces[i]!,
            from: [0, clock(k)],
            to: [0, clock(k + 1)],
          };
        },
      ),
    });

    children.forEach((c: (typeof children)[number], i: number): void => {
      const other: number = 1 - i;
      const loop: number[] = loops[i]!;
      body.faces[faces[i]!]!.cycles.push(
        {
          kind: "start",
          vertices: loop,
          chart: loop.map((_: number, k: number): [number, number] => [
            0,
            clock(k),
          ]),
          neighbours: loop.map(
            (_: number, k: number): AutoMovieSolidCycle.INeighbour => {
              if (k < m)
                return {
                  face: hostIndex,
                  from: [hostStation, c.band.hostPhases[k]!],
                  to: [hostStation, c.band.hostPhases[k + 1]!],
                };
              // On the chord: the other band's same point, `3 n/2 - k`, and its next one back.
              const across: number = clock(3 * m - k);
              return {
                face: faces[other]!,
                from: [0, across],
                to: [0, across - turn / n],
              };
            },
          ),
        },
        {
          kind: "end",
          vertices: rails[i]!.slice(),
          chart: rails[i]!.map((_: number, k: number): [number, number] => [
            c.band.length,
            clock(k),
          ]),
          neighbours: rails[i]!.map(
            (_: number, k: number): AutoMovieSolidCycle.INeighbour => ({
              face: c.index,
              from: [c.rail, c.band.childPhases[k]!],
              to: [
                c.rail,
                k + 1 < n
                  ? c.band.childPhases[k + 1]!
                  : c.band.childPhases[0]! +
                    Math.sign(
                      c.band.childPhases[n - 1]! - c.band.childPhases[0]!,
                    ) *
                      turn,
              ],
            }),
          ),
        },
      );

      // The child's rail cycle in increasing child phase.
      const rising: boolean =
        c.band.childPhases[n - 1]! > c.band.childPhases[0]!;
      const order: number[] = Array.from(
        { length: n },
        (_: unknown, j: number): number => (rising ? j : n - 1 - j),
      );
      body.faces[c.index]!.cycles.push({
        kind: c.kind,
        vertices: order.map((k: number): number => rails[i]![k]!),
        chart: order.map((k: number): [number, number] => [
          c.rail,
          c.band.childPhases[k]!,
        ]),
        neighbours: order.map(
          (k: number, j: number): AutoMovieSolidCycle.INeighbour => {
            const next: number = order[(j + 1) % n]!;
            const wraps: boolean = j + 1 === n;
            return {
              face: faces[i]!,
              from: [c.band.length, clock(k)],
              to: [
                c.band.length,
                clock(next) + (wraps ? (rising ? turn : -turn) : 0),
              ],
            };
          },
        ),
      });
      state.faces.set(node.children[i]!.band, faces[i]!);
      state.chains.set(node.children[i]!.band, c.band.chain);
      state.chainList.push(c.band.chain);
      state.chainSurfaces.push(c.band.surface);
    });
  } catch (error: unknown) {
    AutoMovieConstructionState.restore(body, state, snapshot);
    if (!(error instanceof AutoMovieLoftAdmissionError)) throw error;
    report(node.name, "split", error.message);
  }
}

/** A real pole cannot be split. */
function closed(chain: IAutoMovieLoftChain, side: "bottom" | "top"): boolean {
  return chain.pole?.end === side || chain.opposite?.end === side;
}

/** A trimmed or shared end has consumed that boundary. */
function cut(
  body: AutoMovieSolidBody.IBody,
  index: number,
  kind: "start" | "end",
): boolean {
  return body.faces[index]!.cycles.some(
    (cycle: AutoMovieSolidCycle.ICycle): boolean => cycle.kind === kind,
  );
}

/** The principal end station, mm. */
function end(chain: IAutoMovieLoftChain, side: "bottom" | "top"): number {
  return chain.layers[side === "bottom" ? 0 : chain.layers.length - 1]!.y;
}
