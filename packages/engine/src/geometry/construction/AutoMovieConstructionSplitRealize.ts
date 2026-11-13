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
  if ((node.outer ?? []).length > 0) return fan(node, body, state, walk, report);
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
          ...(node.profile.heading === undefined ? {} : { heading: node.profile.heading }),
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
          ...(child.correspondence === undefined ? {} : { correspondence: child.correspondence }),
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

/**
 * Realize a split into more than two (`IAutoMovieConstructionSplit.outer`): the host's open end divided by its nested seams into the
 * children's loops, each spanned to its child's rail by a band (`AutoMovieConstructionSplitBand.fan`), every arc's ring points, every seam's
 * inner points and every rail shared vertex for vertex between the faces that bound them.
 *
 * Each band gives a quarter of its columns to each seam it takes and the rest to its arcs, so the two bands beside a seam read it at the
 * same shares. A broken premise restores the checkpoint and records one diagnostic under the split's name, as a two-way split does.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The two-way split's sharing generalized: every fork is one ring vertex, every seam point one vertex read by both its bands, every cycle names the face across each edge.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, seams, children, bands, then one mutation block of vertices and cycles.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No vertex is welded by distance and no child is kept without its siblings.
 * @evidence contracts/development/common.md#meaningful-documentation States the loops, the sharing and the failure effect.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in children times columns after the bands.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each shared vertex is created once and referenced by every cycle that bounds it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body retains the ring, seam and rail vertices, one face per band and its cycles; the checkpoint is released when the node settles.
 */
function fan(
  node: IAutoMovieConstructionSplit,
  body: AutoMovieSolidBody.IBody,
  state: AutoMovieConstructionState.IState,
  walk: (node: AutoMovieConstructionNode) => void,
  report: (node: string, contract: string, detail: string) => void,
): void {
  walk(node.host);
  const hostIndex: number | undefined = state.faces.get(node.hostFace);
  const hostChain: IAutoMovieLoftChain | undefined = state.chains.get(node.hostFace);
  if (hostIndex === undefined || hostChain === undefined) return report(node.name, "host face", `the host face ${node.hostFace} was not realized`);
  const hostKind: "start" | "end" = node.hostEnd === "bottom" ? "start" : "end";
  if (closed(hostChain, node.hostEnd)) return report(node.name, "split end", `the host face's ${node.hostEnd} end closes in a pole`);
  if (cut(body, hostIndex, hostKind)) return report(node.name, "split end", `the host face's ${node.hostEnd} end is already cut away or shared`);
  const snapshot: AutoMovieConstructionState.ISnapshot = AutoMovieConstructionState.snap(body, state);
  const fail = (detail: string): void => {
    report(node.name, "split", detail);
    AutoMovieConstructionState.restore(body, state, snapshot);
  };
  try {
    const n: number = node.count;
    const q: number = n / 4;
    const turn: number = 2 * Math.PI;
    const step: number = turn / n;
    const clock = (k: number): number => k * step;
    const host: IAutoMovieSolidSurface = body.faces[hostIndex]!.surface;
    const hostStation: number = end(hostChain, node.hostEnd);
    const hostInto: 1 | -1 = node.hostEnd === "bottom" ? -1 : 1;
    const layer: IAutoMovieLoftChain.ILayer = hostChain.layers[node.hostEnd === "bottom" ? 0 : hostChain.layers.length - 1]!;
    const frame: AutoMovieLoftFrame.IFrame = layer.frame ?? AutoMovieLoftFrame.horizontal(layer.y);
    const normal: Vec3 | null = AutoMovieSolidVector.unit(AutoMovieSolidVector.scale(AutoMovieSolidVector.cross(frame.v, frame.u), hostInto));
    if (normal === null) return fail("the host's end section has no plane");

    // The seams, innermost first, each built once so both its bands read one curve.
    const seams: IAutoMovieConstructionSplit.ISeam[] = [{ seam: node.seam, ...(node.profile === undefined ? {} : { profile: node.profile }) }, ...(node.outer ?? [])];
    const S: number = seams.length;
    const curves: AutoMovieConstructionSplitSeam.ISeam[] = [];
    for (const [j, s] of seams.entries()) {
      const made: AutoMovieConstructionSplitSeam.ISeam | string =
        s.profile === undefined
          ? AutoMovieConstructionSplitSeam.straight({ host, station: hostStation, seam: s.seam, normal })
          : AutoMovieConstructionSplitSeam.create({ host, station: hostStation, into: hostInto, seam: s.seam, normal, knots: s.profile.knots.map(([along, depth]: [number, number]): [number, number] => [along * AutoMovieConstructionViews.SCALE, depth * AutoMovieConstructionViews.SCALE]), ...(s.profile.heading === undefined ? {} : { heading: s.profile.heading }) });
      if (typeof made === "string") return fail(`seam ${j}: ${made}`);
      curves.push(made);
    }
    const corner: number = seams.find((s: IAutoMovieConstructionSplit.ISeam): boolean => s.profile !== undefined)?.profile?.corner ?? 0;
    const reach: number | undefined = seams.find((s: IAutoMovieConstructionSplit.ISeam): boolean => s.profile !== undefined)?.profile?.reach;
    const square: boolean = seams.find((s: IAutoMovieConstructionSplit.ISeam): boolean => s.profile !== undefined)?.profile?.square === true;
    const a = (j: number): number => seams[j]!.seam[0];
    const b = (j: number): number => seams[j]!.seam[1];

    // Each child's loop: arcs in increasing host phase, seams between them (`IAutoMovieConstructionSplit.outer`). An arc names the fork it
    // starts at, `a` or `b` and its seam.
    type Arc = { kind: "arc"; from: number; to: number; columns: number; fork: string };
    type Seam = { kind: "seam"; index: number; forward: boolean; columns: number };
    const plan: (Arc | Seam)[][] = Array.from({ length: S + 1 }, (_: unknown, c: number): (Arc | Seam)[] =>
      c === 0
        ? [{ kind: "arc", from: a(0), to: b(0), columns: 3 * q, fork: "a0" }, { kind: "seam", index: 0, forward: false, columns: q }]
        : c === S
          ? [{ kind: "arc", from: b(S - 1), to: a(S - 1) + turn, columns: 3 * q, fork: "b" + (S - 1) }, { kind: "seam", index: S - 1, forward: true, columns: q }]
          : [
              { kind: "arc", from: a(c), to: a(c - 1), columns: q, fork: "a" + c },
              { kind: "seam", index: c - 1, forward: true, columns: q },
              { kind: "arc", from: b(c - 1), to: b(c), columns: q, fork: "b" + (c - 1) },
              { kind: "seam", index: c, forward: false, columns: q },
            ],
    );

    // The children, once the host's end and seams are admitted.
    for (const child of node.children) walk(child.part);
    const children: { index: number; surface: IAutoMovieSolidSurface; rail: number; kind: "start" | "end"; band: AutoMovieConstructionSplitBand.IStrip & { phases: number[] } }[] = [];
    for (const [c, child] of node.children.entries()) {
      const index: number | undefined = state.faces.get(child.partFace);
      const chain: IAutoMovieLoftChain | undefined = state.chains.get(child.partFace);
      if (index === undefined || index < snapshot.faces || chain === undefined) return fail(`the child face ${child.partFace} was not realized`);
      const kind: "start" | "end" = child.partEnd === "bottom" ? "start" : "end";
      if (cut(body, index, kind)) return fail(`the child face ${child.partFace}'s ${child.partEnd} side is already cut away`);
      const surface: IAutoMovieSolidSurface = body.faces[index]!.surface;
      const into: 1 | -1 = child.partEnd === "bottom" ? 1 : -1;
      const rail: number = end(chain, child.partEnd) + into * child.rail * AutoMovieConstructionViews.SCALE;
      const [first, last]: [number, number] = surface.domain ?? [chain.layers[0]!.y, chain.layers[chain.layers.length - 1]!.y];
      if (!(rail > first && rail < last)) return fail(`the child face ${child.partFace}'s rail at station ${rail} mm lies outside its domain [${first}, ${last}] mm`);
      const band: (AutoMovieConstructionSplitBand.IStrip & { phases: number[] }) | string = AutoMovieConstructionSplitBand.fan(
        {
          name: child.band,
          host: { surface: host, station: hostStation, into: hostInto },
          child: { surface, station: rail, into },
          stretches: plan[c]!.map((s: Arc | Seam): AutoMovieConstructionSplitBand.IStretch => (s.kind === "arc" ? { kind: "arc", from: s.from, to: s.to, columns: s.columns } : { kind: "seam", curve: curves[s.index]!, forward: s.forward, columns: s.columns })),
          corner,
          ...(reach === undefined ? {} : { reach }),
          ...(square ? { square } : {}),
          ...(child.crease === undefined ? {} : { crease: child.crease }),
          ...(child.correspondence === undefined ? {} : { correspondence: child.correspondence }),
        },
        n,
      );
      if (typeof band === "string") return fail(`band ${child.band}: ${band}`);
      children.push({ index, surface, rail, kind, band });
    }

    // Each band's column: its stretch and the index in it.
    const columns: { stretch: Arc | Seam; j: number; previous: Arc | Seam }[][] = plan.map((stretches: (Arc | Seam)[]): { stretch: Arc | Seam; j: number; previous: Arc | Seam }[] =>
      stretches.flatMap((stretch: Arc | Seam, i: number): { stretch: Arc | Seam; j: number; previous: Arc | Seam }[] => Array.from({ length: stretch.columns }, (_: unknown, j: number): { stretch: Arc | Seam; j: number; previous: Arc | Seam } => ({ stretch, j, previous: stretches[(i - 1 + stretches.length) % stretches.length]! }))),
    );
    // Where a seam's share index `i` (from its fork `a`, 0..q) stands in a band: its column, or past its last column the next stretch's first.
    const shareColumn = (c: number, seam: number, i: number): number | null => {
      let k: number = 0;
      for (const stretch of plan[c]!) {
        if (stretch.kind === "seam" && stretch.index === seam) {
          const j: number = stretch.forward ? i : q - i;
          return k + j;
        }
        k += stretch.columns;
      }
      return null;
    };
    const beside = (seam: number): [number, number] => [seam, seam + 1];

    // Shared vertices: ring points by arc and column (a fork is its arc's first), seam points by seam and share, rails per child.
    const mesh: AutoMovieSolidMesh.IMesh = body.mesh;
    const hostOwner: number = AutoMovieSolidMesh.owner(mesh, host);
    const ring: Map<string, number> = new Map();
    const ringVertex = (fork: string, j: number, phi: number): number => {
      const key: string = fork + ":" + j;
      let v: number | undefined = ring.get(key);
      if (v === undefined) ring.set(key, (v = AutoMovieSolidMesh.vertex(mesh, host.jet(hostStation, phi).p, hostOwner, hostStation, phi)));
      return v;
    };
    // The fork an arc ends at is the first column of the arc that starts there.
    const arcs: Arc[] = plan.flatMap((stretches: (Arc | Seam)[]): Arc[] => stretches.filter((s: Arc | Seam): s is Arc => s.kind === "arc"));
    const forkOf = (phi: number): string => {
      const at: Arc | undefined = arcs.find((x: Arc): boolean => Math.abs(((x.from - phi) % turn + turn + Math.PI) % turn - Math.PI) < 1e-12);
      if (at === undefined) throw new Error("a fork that starts no arc");
      return at.fork;
    };
    const seamPoints: Map<string, number> = new Map();
    const loops: number[][] = children.map((child: (typeof children)[number], c: number): number[] =>
      columns[c]!.map(({ stretch, j, previous }: { stretch: Arc | Seam; j: number; previous: Arc | Seam }, k: number): number => {
        if (stretch.kind === "arc") return ringVertex(stretch.fork, j, child.band.phases[k]!);
        if (j === 0 && previous.kind === "arc") return ringVertex(forkOf(previous.to), 0, previous.to);
        const i: number = stretch.forward ? j : q - j;
        const key: string = stretch.index + ":" + i;
        let v: number | undefined = seamPoints.get(key);
        if (v === undefined) seamPoints.set(key, (v = AutoMovieSolidMesh.vertex(mesh, child.band.surface.jet(0, clock(k)).p, AutoMovieSolidMesh.owner(mesh, child.band.surface), 0, clock(k))));
        return v;
      }),
    );
    const rails: number[][] = children.map((child: (typeof children)[number]): number[] => {
      const owner: number = AutoMovieSolidMesh.owner(mesh, child.surface);
      return child.band.childPhases.map((psi: number): number => AutoMovieSolidMesh.vertex(mesh, child.surface.jet(child.rail, psi).p, owner, child.rail, psi));
    });

    // The band faces.
    const faces: number[] = children.map(
      (child: (typeof children)[number]): number =>
        body.faces.push({
          surface: child.band.surface,
          stations: graded(child.band.length, node.rows, child.band.loop),
          phases: Array.from({ length: n }, (_: unknown, k: number): number => clock(k)),
          cycles: [],
        }) - 1,
    );

    // The host's end cycle: every arc's columns in increasing host phase.
    const ordered: { c: number; k: number }[] = children
      .flatMap((_: (typeof children)[number], c: number): { c: number; k: number }[] => columns[c]!.flatMap((col: { stretch: Arc | Seam }, k: number): { c: number; k: number }[] => (col.stretch.kind === "arc" ? [{ c, k }] : [])))
      .sort((x: { c: number; k: number }, y: { c: number; k: number }): number => children[x.c]!.band.phases[x.k]! - children[y.c]!.band.phases[y.k]!);
    body.faces[hostIndex]!.cycles.push({
      kind: hostKind,
      vertices: ordered.map(({ c, k }: { c: number; k: number }): number => loops[c]![k]!),
      chart: ordered.map(({ c, k }: { c: number; k: number }): [number, number] => [hostStation, children[c]!.band.phases[k]!]),
      neighbours: ordered.map(({ c, k }: { c: number; k: number }): AutoMovieSolidCycle.INeighbour => ({ face: faces[c]!, from: [0, clock(k)], to: [0, clock(k + 1)] })),
    });

    children.forEach((child: (typeof children)[number], c: number): void => {
      const loop: number[] = loops[c]!;
      body.faces[faces[c]!]!.cycles.push(
        {
          kind: "start",
          vertices: loop,
          chart: loop.map((_: number, k: number): [number, number] => [0, clock(k)]),
          neighbours: loop.map((_: number, k: number): AutoMovieSolidCycle.INeighbour => {
            const { stretch } = columns[c]![k]!;
            if (stretch.kind === "arc") return { face: hostIndex, from: [hostStation, child.band.phases[k]!], to: [hostStation, child.band.phases[k + 1]!] };
            // On a seam: the same two points in the other band beside it.
            const j: number = columns[c]![k]!.j;
            const i1: number = stretch.forward ? j : q - j;
            const i2: number = stretch.forward ? j + 1 : q - j - 1;
            const [left, right]: [number, number] = beside(stretch.index);
            const other: number = c === left ? right : left;
            const otherStretch: Seam = plan[other]!.find((s: Arc | Seam): s is Seam => s.kind === "seam" && s.index === stretch.index)!;
            const from: number = clock(shareColumn(other, stretch.index, i1)!);
            return { face: faces[other]!, from: [0, from], to: [0, from + (otherStretch.forward ? i2 - i1 : i1 - i2) * step] };
          }),
        },
        {
          kind: "end",
          vertices: rails[c]!.slice(),
          chart: rails[c]!.map((_: number, k: number): [number, number] => [child.band.length, clock(k)]),
          neighbours: rails[c]!.map((_: number, k: number): AutoMovieSolidCycle.INeighbour => ({
            face: child.index,
            from: [child.rail, child.band.childPhases[k]!],
            to: [child.rail, k + 1 < n ? child.band.childPhases[k + 1]! : child.band.childPhases[0]! + Math.sign(child.band.childPhases[n - 1]! - child.band.childPhases[0]!) * turn],
          })),
        },
      );

      // The child's rail cycle in increasing child phase.
      const rising: boolean = child.band.childPhases[n - 1]! > child.band.childPhases[0]!;
      const order: number[] = Array.from({ length: n }, (_: unknown, j: number): number => (rising ? j : n - 1 - j));
      body.faces[child.index]!.cycles.push({
        kind: child.kind,
        vertices: order.map((k: number): number => rails[c]![k]!),
        chart: order.map((k: number): [number, number] => [child.rail, child.band.childPhases[k]!]),
        neighbours: order.map((k: number, j: number): AutoMovieSolidCycle.INeighbour => {
          const next: number = order[(j + 1) % n]!;
          const wraps: boolean = j + 1 === n;
          return { face: faces[c]!, from: [child.band.length, clock(k)], to: [child.band.length, clock(next) + (wraps ? (rising ? turn : -turn) : 0)] };
        }),
      });
      state.faces.set(node.children[c]!.band, faces[c]!);
      state.chains.set(node.children[c]!.band, child.band.chain);
      state.chainList.push(child.band.chain);
      state.chainSurfaces.push(child.band.surface);
    });

    // Each seam's forks, the ring vertices its two arcs start at, are faired once the skin is drawn over a disc the declared share of the
    // seam's chord across (`IAutoMovieConstructionSplit.IProfile.fair`).
    seams.forEach((s: IAutoMovieConstructionSplit.ISeam, j: number): void => {
      const share: number | undefined = s.profile?.fair;
      if (share === undefined) return;
      const radius: number = share * AutoMovieSolidVector.norm(AutoMovieSolidVector.sub(curves[j]!.ends[1], curves[j]!.ends[0]));
      for (const fork of ["a" + j, "b" + j]) (state.fairs ??= []).push({ vertices: [ring.get(fork + ":0")!], radius });
    });  } catch (error: unknown) {
    AutoMovieConstructionState.restore(body, state, snapshot);
    if (!(error instanceof AutoMovieLoftAdmissionError)) throw error;
    report(node.name, "split", error.message);
  }
}

/**
 * The grid stations of a band of a split into more than two: from the loop, rows as tall as the loop's columns are apart on average, each
 * half again as tall as the one before until it reaches the declared `length / rows`, then that, scaled to end at the child's rail. At a
 * fork the loop turns a quarter turn between the host's ring and the seam, and the band's columns fan through that turn within a distance
 * of the loop the size of their own spacing; rows `length / rows` apart, up to 2 mm against columns 0.2 to 1 mm apart, drew the band's
 * first triangles across the fan, folded back between the host and the seam (a quarter of a hand's finger forks stood as spikes).
 */
function graded(length: number, rows: number, loop: readonly Vec3[]): number[] {
  let perimeter: number = 0;
  loop.forEach((p: Vec3, k: number): void => {
    perimeter += AutoMovieSolidVector.norm(AutoMovieSolidVector.sub(loop[(k + 1) % loop.length]!, p));
  });
  const coarse: number = length / rows;
  const stations: number[] = [0];
  for (let h: number = Math.min(coarse, perimeter / loop.length); stations.at(-1)! < length - 1e-9; h = Math.min(coarse, 1.5 * h)) stations.push(stations.at(-1)! + h);
  const scale: number = length / stations.at(-1)!;
  return stations.map((s: number): number => s * scale);
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
