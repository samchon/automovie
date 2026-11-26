import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionBandEdge,
  IAutoMovieConstructionNode,
  IAutoMovieConstructionSkinCut,
  IAutoMovieConstructionSplit,
  IAutoMovieConstructionSplitBand,
  IAutoMovieConstructionSplitCompose,
  IAutoMovieConstructionSplitSeam,
  IAutoMovieConstructionState,
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionFrame,
  IAutoMovieSolidBody,
  IAutoMovieSolidCycle,
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieConstructionSplitBand } from "./AutoMovieConstructionSplitBand";
import { AutoMovieConstructionSplitCompose as Compose } from "./AutoMovieConstructionSplitCompose";
import { AutoMovieConstructionSplitConormal as Conormal } from "./AutoMovieConstructionSplitConormal";
import { AutoMovieConstructionSplitContinuation as Continuation } from "./AutoMovieConstructionSplitContinuation";
import { AutoMovieConstructionSplitEdge as Edge } from "./AutoMovieConstructionSplitEdge";
import { AutoMovieConstructionSplitRailClock as RailClock } from "./AutoMovieConstructionSplitRailClock";
import { AutoMovieConstructionSplitSeam } from "./AutoMovieConstructionSplitSeam";
import { AutoMovieConstructionState } from "./AutoMovieConstructionState";
import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/** World vector, mm. */
type Vec3 = AutoMovieVector3Tuple;

/**
 * Realize a split (`IAutoMovieConstructionSplit`): the host's open end divided
 * by the seam chord into both children's loops, each spanned to its child's
 * rail by a band (`AutoMovieConstructionSplitBand`), all sharing their boundary
 * vertices.
 *
 * Steps: walk the host and admit its end (realized, no pole there, not already
 * cut); take the checkpoint; build the curved seam once when a profile is
 * declared (`AutoMovieConstructionSplitSeam`, refused with the split's
 * diagnostic before either child is lofted); walk both children and admit each
 * face and rail (realized after the checkpoint, the rail inside its domain, the
 * rail's side not already cut); build both bands; then add to the body, in one
 * step, the ring vertices on the host's end (both arcs, the seam's two corners
 * shared), the chord's inner vertices (evaluated on band 0, shared by band 1),
 * each child's rail vertices, both band faces with their two station-end
 * cycles, the host's end cycle and each child's rail cycle, every segment
 * naming the face across it. The bands' chains and surfaces join the
 * realization's chains and surfaces, so every consumer of a chain (the skin, a
 * later join or trim naming a band) reads them as any face.
 *
 * A broken premise restores the checkpoint and records one diagnostic under the
 * split's name: both children, both bands and the host's end stand as they
 * were, since one child alone would leave the shared chord open. A foreign
 * error restores the checkpoint and propagates unchanged.
 */
export function AutoMovieConstructionSplitRealize(
  node: IAutoMovieConstructionSplit,
  body: IAutoMovieSolidBody.IBody,
  state: IAutoMovieConstructionState.IState,
  walk: (node: IAutoMovieConstructionNode) => void,
  report: (node: string, contract: string, detail: string) => void,
  valley?: IAutoMovieConstructionSplitCompose.Valley,
  parentCut?: IAutoMovieConstructionSplitCompose.ParentCut,
  lineProbe?: IAutoMovieConstructionSplitBand.LineProbe,
  nativeRails?: ReadonlyMap<string, number>,
  prepared?: readonly IAutoMovieConstructionSplitBand.IPreparedStrip[],
): void {
  if (prepared !== undefined || (node.outer ?? []).length > 0)
    return fan(
      node,
      body,
      state,
      walk,
      report,
      valley,
      parentCut,
      lineProbe,
      nativeRails,
      prepared,
    );
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
  const snapshot: IAutoMovieConstructionState.ISnapshot =
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
    const frame: IAutoMovieLoftSectionFrame =
      layer.frame ?? AutoMovieLoftFrame.horizontal(layer.y);
    const normal: Vec3 | null = AutoMovieSolidVector.unit(
      AutoMovieSolidVector.scale(
        AutoMovieSolidVector.cross(frame.v, frame.u),
        hostInto,
      ),
    );
    if (normal === null) return fail("the host's end section has no plane");

    // A composed end: the children are lofted first, and the forks, the seam plane's bisector and both rails follow from their skins.
    const hostBasis: IAutoMovieConstructionSplitCompose.IBasis | null =
      Compose.basis(frame, hostInto);
    let admitted: IFace[] | undefined;
    let derived: IAutoMovieConstructionSplitCompose.IDerived | undefined;
    if (node.compose !== undefined) {
      const made: IFace[] | string = admit(node, body, state, snapshot, walk);
      if (typeof made === "string") return fail(made);
      admitted = made;
      const composed: IAutoMovieConstructionSplitCompose.IDerived | string =
        compose(node, node.compose, host, hostStation, hostBasis, made, valley);
      if (typeof composed === "string") return fail(`compose: ${composed}`);
      derived = composed;
    }

    // The curved seam, built once from the host so both bands read one curve.
    const [a, b]: [number, number] = derived?.seams[0] ?? node.seam;
    const heading: Vec3 | undefined =
      node.profile?.heading ?? derived?.headings[0];
    let seam:
      | { curve: IAutoMovieConstructionSplitSeam.ISeam; corner: number }
      | undefined;
    if (node.profile !== undefined || derived !== undefined) {
      const S: number = AutoMovieConstructionViews.SCALE;
      const curve: IAutoMovieConstructionSplitSeam.ISeam | string =
        AutoMovieConstructionSplitSeam.create({
          host,
          station: hostStation,
          into: hostInto,
          seam: [a, b],
          normal,
          // A composed end's seam is its children's valley (`IAutoMovieConstructionSplitCompose.IDerived.valleys`), already in mm.
          knots:
            derived !== undefined
              ? derived.valleys[0]!
              : (node.profile?.knots ?? []).map(
                  ([along, depth]: [number, number]): [number, number] => [
                    along * S,
                    depth * S,
                  ],
                ),
          ...(heading === undefined ? {} : { heading }),
        });
      if (typeof curve === "string") return fail(`seam: ${curve}`);
      seam = { curve, corner: node.profile?.corner ?? 0 };
    }

    // The children, once the host's end and seam are admitted (a refused
    // seam lofts neither child).
    if (admitted === undefined) {
      const made: IFace[] | string = admit(node, body, state, snapshot, walk);
      if (typeof made === "string") return fail(made);
      admitted = made;
    }

    // Each child's face and rail, then its band.
    const children: {
      index: number;
      surface: IAutoMovieSolidSurface;
      rail: IRail;
      kind: "start" | "end";
      band: IAutoMovieConstructionSplitBand.IBand;
      face: IAutoMovieSolidSurface;
      edge: IAutoMovieConstructionBandEdge | undefined;
    }[] = [];
    for (let i: number = 0; i < 2; ++i) {
      const child: IAutoMovieConstructionSplit.IChild = node.children[i]!;
      const { index, surface, into, kind }: IFace = admitted[i]!;
      const rail: IRail | string = railOf(
        child,
        admitted[i]!,
        derived?.cuts[i],
        hostBasis,
        n,
        nativeRails?.get(child.partFace),
      );
      if (typeof rail === "string") return fail(rail);
      const band: IAutoMovieConstructionSplitBand.IBand | string =
        AutoMovieConstructionSplitBand.create({
          name: child.band,
          host: { surface: host, station: hostStation, into: hostInto },
          arc: i === 0 ? [a, b] : [b, a + turn],
          normal,
          child: {
            surface,
            station: rail.station,
            into,
            ...(rail.cut === undefined ? {} : { along: rail.at }),
          },
          count: n,
          crease: child.crease,
          ...(child.correspondence === undefined
            ? {}
            : { correspondence: child.correspondence }),
          ...(seam === undefined ? {} : { seam }),
        });
      if (typeof band === "string") return fail(`band ${child.band}: ${band}`);
      // A composed end's band reads its loop from its owners between columns too: the host's ring on the arc, the shared seam on the chord.
      const edge: IAutoMovieConstructionBandEdge | string | undefined =
        rail.cut === undefined
          ? undefined
          : Edge.carried(
              band.surface,
              band.length,
              surface,
              rail.cut.at,
              band.childPhases,
              seam === undefined
                ? undefined
                : chordLoop(
                    host,
                    hostStation,
                    i === 0 ? [a, b] : [b, a + turn],
                    seam.curve,
                  ),
            );
      if (typeof edge === "string") return fail(`band ${child.band}: ${edge}`);
      children.push({
        index,
        surface,
        rail,
        kind,
        band,
        face: edge?.surface ?? band.surface,
        edge,
      });
    }

    // Shared vertices: each arc's ring points before its end corner, the
    // chord's inner points on band 0, each child's rail points.
    const mesh: IAutoMovieSolidMesh.IMesh = body.mesh;
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
            c.surface.jet(c.rail.at(psi), psi).p,
            owner,
            c.rail.at(psi),
            psi,
          ),
        );
      },
    );

    // The band faces.
    const faces: number[] = children.map(
      (c: (typeof children)[number]): number =>
        body.faces.push({
          surface: c.face,
          stations: Array.from(
            { length: node.rows + 1 },
            (_: unknown, i: number): number =>
              i === node.rows ? c.band.length : (c.band.length * i) / node.rows,
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
        (_: number, h: number): IAutoMovieSolidCycle.INeighbour => {
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
            (_: number, k: number): IAutoMovieSolidCycle.INeighbour => {
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
            (_: number, k: number): IAutoMovieSolidCycle.INeighbour => {
              const next: number =
                k + 1 < n
                  ? c.band.childPhases[k + 1]!
                  : c.band.childPhases[0]! +
                    Math.sign(
                      c.band.childPhases[n - 1]! - c.band.childPhases[0]!,
                    ) *
                      turn;
              return {
                face: c.index,
                from: [
                  c.rail.at(c.band.childPhases[k]!),
                  c.band.childPhases[k]!,
                ],
                to: [c.rail.at(next), next],
              };
            },
          ),
          ...ends(c.edge, n, c.band.length).band,
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
          c.rail.at(c.band.childPhases[k]!),
          c.band.childPhases[k]!,
        ]),
        ...(c.rail.cut === undefined ? {} : { along: c.rail.at }),
        ...ends(c.edge, n, c.band.length).child,
        neighbours: order.map(
          (k: number, j: number): IAutoMovieSolidCycle.INeighbour => {
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
      state.chainSurfaces.push(c.face);
    });
  } catch (error: unknown) {
    AutoMovieConstructionState.restore(body, state, snapshot);
    if (!(error instanceof AutoMovieLoftAdmissionError)) throw error;
    report(node.name, "split", error.message);
  }
}

/**
 * Realize a split into more than two (`IAutoMovieConstructionSplit.outer`): the
 * host's open end divided by its nested seams into the children's loops, each
 * spanned to its child's rail by a band (`AutoMovieConstructionSplitBand.fan`),
 * every arc's ring points, every seam's inner points and every rail shared
 * vertex for vertex between the faces that bound them.
 *
 * Each band gives a quarter of its columns to each seam it takes and the rest
 * to its arcs, so the two bands beside a seam read it at the same shares. A
 * broken premise restores the checkpoint and records one diagnostic under the
 * split's name, as a two-way split does.
 *
 * Every fork is one ring vertex, every seam point one vertex read by both its
 * bands, and every cycle names the face across each edge, so no vertex is
 * welded by distance and no child is kept without its siblings. Admission,
 * seams, children and bands come first, then one mutation block of vertices and
 * cycles, linear in children times columns. The body retains the ring, seam and
 * rail vertices, one face per band and its cycles; the checkpoint is released
 * when the node settles.
 */
function fan(
  node: IAutoMovieConstructionSplit,
  body: IAutoMovieSolidBody.IBody,
  state: IAutoMovieConstructionState.IState,
  walk: (node: IAutoMovieConstructionNode) => void,
  report: (node: string, contract: string, detail: string) => void,
  valley?: IAutoMovieConstructionSplitCompose.Valley,
  parentCut?: IAutoMovieConstructionSplitCompose.ParentCut,
  lineProbe?: IAutoMovieConstructionSplitBand.LineProbe,
  nativeRails?: ReadonlyMap<string, number>,
  prepared?: readonly IAutoMovieConstructionSplitBand.IPreparedStrip[],
  hostReady: boolean = false,
  childCuts?: ReadonlyMap<string, IRelocatedRail>,
): void {
  if (!hostReady) walk(node.host);
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
  if (closed(hostChain, node.hostEnd) && parentCut === undefined)
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
  const snapshot: IAutoMovieConstructionState.ISnapshot =
    AutoMovieConstructionState.snap(body, state);
  const fail = (detail: string): void => {
    report(node.name, "split", detail);
    AutoMovieConstructionState.restore(body, state, snapshot);
  };
  try {
    const n: number = node.count;
    if (
      prepared !== undefined &&
      (prepared.length !== node.children.length ||
        parentCut === undefined ||
        node.compose !== undefined ||
        nativeRails === undefined)
    )
      return fail(
        "curve-owned bands require a shared parent cut and each original child rail",
      );
    const q: number = n / 4;
    const turn: number = 2 * Math.PI;
    const step: number = turn / n;
    const clock = (k: number): number => k * step;
    const nativeHost: IAutoMovieSolidSurface = body.faces[hostIndex]!.surface;
    const hostStation: number = end(hostChain, node.hostEnd);
    const hostAt = (phase: number): number =>
      parentCut === undefined ? hostStation : parentCut(phase)[0];
    const host: IAutoMovieSolidSurface =
      parentCut === undefined
        ? nativeHost
        : cutChart(nativeHost, hostStation, parentCut);
    const hostInto: 1 | -1 = node.hostEnd === "bottom" ? -1 : 1;
    const retainedEnd: number =
      hostInto > 0 ? hostChain.layers[0]!.y : hostChain.layers.at(-1)!.y;
    const room: number =
      valley === undefined
        ? 0
        : Math.min(
            ...Array.from(
              { length: 8 * n },
              (_, k): number =>
                hostInto * (hostAt((turn * k) / (8 * n)) - retainedEnd),
            ),
          );
    const cornerReach: number = Math.min(
      ...node.children.map(
        ({ rail }): number => rail * AutoMovieConstructionViews.SCALE,
      ),
    );
    const layer: IAutoMovieLoftChain.ILayer =
      hostChain.layers[
        node.hostEnd === "bottom" ? 0 : hostChain.layers.length - 1
      ]!;
    const frame: IAutoMovieLoftSectionFrame =
      layer.frame ?? AutoMovieLoftFrame.horizontal(layer.y);
    const normal: Vec3 | null = AutoMovieSolidVector.unit(
      AutoMovieSolidVector.scale(
        AutoMovieSolidVector.cross(frame.v, frame.u),
        hostInto,
      ),
    );
    if (normal === null) return fail("the host's end section has no plane");

    // A composed end: the children are lofted first, and every seam's forks and plane and every rail follow from their skins.
    const hostBasis: IAutoMovieConstructionSplitCompose.IBasis | null =
      Compose.basis(frame, hostInto);
    let admitted: IFace[] | undefined;
    let derived: IAutoMovieConstructionSplitCompose.IDerived | undefined;
    if (node.compose !== undefined) {
      const made: IFace[] | string = admit(node, body, state, snapshot, walk);
      if (typeof made === "string") return fail(made);
      admitted = made;
      const composed: IAutoMovieConstructionSplitCompose.IDerived | string =
        compose(node, node.compose, host, hostStation, hostBasis, made, valley);
      if (typeof composed === "string") return fail(`compose: ${composed}`);
      derived = composed;
    }

    // The seams, innermost first, each built once so both its bands read one curve.
    const seams: IAutoMovieConstructionSplit.ISeam[] = [
      {
        seam: node.seam,
        ...(node.profile === undefined ? {} : { profile: node.profile }),
      },
      ...(node.outer ?? []),
    ].map(
      (
        s: IAutoMovieConstructionSplit.ISeam,
        j: number,
      ): IAutoMovieConstructionSplit.ISeam =>
        derived === undefined ? s : { ...s, seam: derived.seams[j]! },
    );
    const S: number = seams.length;
    const curves: IAutoMovieConstructionSplitSeam.ISeam[] = [];
    for (const [j, s] of (prepared === undefined ? seams : []).entries()) {
      const heading: Vec3 | undefined =
        s.profile?.heading ?? derived?.headings[j];
      // A composed end's seam is its children's valley (`IAutoMovieConstructionSplitCompose.IDerived.valleys`), already in mm.
      const made: IAutoMovieConstructionSplitSeam.ISeam | string =
        derived !== undefined
          ? AutoMovieConstructionSplitSeam.create({
              host,
              station: hostStation,
              into: hostInto,
              seam: s.seam,
              normal,
              knots: derived.valleys[j]!,
              ...(valley === undefined ? {} : { observed: true }),
              ...(heading === undefined ? {} : { heading }),
            })
          : s.profile === undefined
            ? AutoMovieConstructionSplitSeam.straight({
                host,
                station: hostStation,
                seam: s.seam,
                normal,
                ...(heading === undefined ? {} : { heading }),
              })
            : AutoMovieConstructionSplitSeam.create({
                host,
                station: hostStation,
                into: hostInto,
                seam: s.seam,
                normal,
                knots: s.profile.knots.map(
                  ([along, depth]: [number, number]): [number, number] => [
                    along * AutoMovieConstructionViews.SCALE,
                    depth * AutoMovieConstructionViews.SCALE,
                  ],
                ),
                ...(heading === undefined ? {} : { heading }),
              });
      if (typeof made === "string") return fail(`seam ${j}: ${made}`);
      curves.push(made);
    }
    const corner: number =
      seams.find(
        (s: IAutoMovieConstructionSplit.ISeam): boolean =>
          s.profile !== undefined,
      )?.profile?.corner ?? 0;
    const reach: number | undefined = seams.find(
      (s: IAutoMovieConstructionSplit.ISeam): boolean =>
        s.profile !== undefined,
    )?.profile?.reach;
    const square: boolean =
      seams.find(
        (s: IAutoMovieConstructionSplit.ISeam): boolean =>
          s.profile !== undefined,
      )?.profile?.square === true;
    const forkPlanes = seams.map((seam, j) =>
      prepared !== undefined || seam.profile === undefined
        ? undefined
        : Conormal.forks(host, hostStation, seam.seam, curves[j]!),
    );
    const badFork = forkPlanes.find((fork) => typeof fork === "string");
    if (typeof badFork === "string") return fail(badFork);
    const a = (j: number): number => seams[j]!.seam[0];
    const b = (j: number): number => seams[j]!.seam[1];

    // Each child's loop: arcs in increasing host phase, seams between them (`IAutoMovieConstructionSplit.outer`). An arc names the fork it
    // starts at, `a` or `b` and its seam.
    type Arc = {
      kind: "arc";
      from: number;
      to: number;
      columns: number;
      fork: string;
    };
    type Seam = {
      kind: "seam";
      index: number;
      forward: boolean;
      columns: number;
    };
    const plan: (Arc | Seam)[][] = Array.from(
      { length: S + 1 },
      (_: unknown, c: number): (Arc | Seam)[] =>
        c === 0
          ? [
              { kind: "arc", from: a(0), to: b(0), columns: 3 * q, fork: "a0" },
              { kind: "seam", index: 0, forward: false, columns: q },
            ]
          : c === S
            ? [
                {
                  kind: "arc",
                  from: b(S - 1),
                  to: a(S - 1) + turn,
                  columns: 3 * q,
                  fork: "b" + (S - 1),
                },
                { kind: "seam", index: S - 1, forward: true, columns: q },
              ]
            : [
                {
                  kind: "arc",
                  from: a(c),
                  to: a(c - 1),
                  columns: q,
                  fork: "a" + c,
                },
                { kind: "seam", index: c - 1, forward: true, columns: q },
                {
                  kind: "arc",
                  from: b(c - 1),
                  to: b(c),
                  columns: q,
                  fork: "b" + (c - 1),
                },
                { kind: "seam", index: c, forward: false, columns: q },
              ],
    );

    // The children, once the host's end and seams are admitted.
    if (admitted === undefined) {
      const made: IFace[] | string = admit(node, body, state, snapshot, walk);
      if (typeof made === "string") return fail(made);
      admitted = made;
    }
    const children: {
      index: number;
      surface: IAutoMovieSolidSurface;
      rail: IRail;
      kind: "start" | "end";
      band: IAutoMovieConstructionSplitBand.IPreparedStrip;
      face: IAutoMovieSolidSurface;
      edge: IAutoMovieConstructionBandEdge | undefined;
    }[] = [];
    const refusals: string[] = [];
    const demand: IParentDemand[] = [];
    const additions: {
      name: string;
      rail: IAutoMovieConstructionSkinCut.ICut;
      guide: IAutoMovieConstructionSplitBand.IGuidedRail;
      planes: IAutoMovieConstructionSplitCompose.IDerived["railPlanes"][number];
      face: IFace;
      lines: IAutoMovieConstructionSplitBand.ILineDemand[];
      reach: number;
    }[] = [];
    for (const [c, child] of node.children.entries()) {
      const { index, surface, into, kind }: IFace = admitted[c]!;
      const revised: IRelocatedRail | undefined = childCuts?.get(
        child.partFace,
      );
      const station: number | undefined =
        revised === undefined ? nativeRails?.get(child.partFace) : undefined;
      const rail: IRail | string = railOf(
        child,
        admitted[c]!,
        revised?.cut ?? derived?.cuts[c],
        hostBasis,
        n,
        station,
      );
      if (typeof rail === "string") {
        if (valley === undefined) return fail(rail);
        refusals.push(rail);
        continue;
      }
      if (prepared !== undefined) {
        const owned = prepared[c]!;
        const orientation = (owned.surface.orientation *
          nativeHost.orientation *
          hostInto) as 1 | -1;
        const band = { ...owned, surface: { ...owned.surface, orientation } };
        if (
          station === undefined ||
          child.cut !== undefined ||
          band.chain.name !== child.band ||
          band.surface.name !== child.band ||
          band.surface.period !== turn ||
          band.surface.domain?.[0] !== 0 ||
          band.surface.domain[1] !== band.length ||
          !(band.length > 0) ||
          band.loop.length !== n ||
          band.phases.length !== n ||
          band.childPhases.length !== n ||
          (band.terminal !== undefined &&
            band.terminal.receiving.length !== n) ||
          [...band.phases, ...band.childPhases].some(
            (t): boolean => !Number.isFinite(t),
          )
        )
          return fail(
            `band ${child.band}: prepared shape does not carry the declared cut, rail and chart`,
          );
        children.push({
          index,
          surface,
          rail,
          kind,
          band,
          face: band.surface,
          edge: undefined,
        });
        continue;
      }
      const guidedRail =
        valley === undefined || derived === undefined || child.cut !== undefined
          ? undefined
          : RailClock.marks(
              derived.railPlanes[c]!,
              (phase: number): Vec3 =>
                rail.cut?.point?.(phase) ??
                surface.jet(rail.at(phase), phase).p,
              plan[c]!.map((s) => ({
                label: s.kind === "arc" ? 0 : s.index + 1,
                columns: s.columns,
                point:
                  s.kind === "arc"
                    ? (host.point?.(hostStation, s.from) ??
                      host.jet(hostStation, s.from).p)
                    : curves[s.index]!.ends[s.forward ? 0 : 1],
              })),
              n,
              host.orientation * hostInto * surface.orientation * into > 0
                ? 1
                : -1,
              (phase: number): Vec3 => {
                const [s, first]: [number, number, number] =
                  rail.cut!.at(phase);
                const j: IAutoMovieSolidSurface.IJet = surface.jet(s, phase);
                return AutoMovieSolidVector.add(
                  j.v,
                  AutoMovieSolidVector.scale(j.u, first),
                );
              },
              revised?.crossings,
            );
      if (typeof guidedRail === "string") {
        refusals.push(`band ${child.band}: ${guidedRail}`);
        continue;
      }
      const lines: IAutoMovieConstructionSplitBand.ILineDemand[] = [];
      if (
        !hostReady &&
        guidedRail !== undefined &&
        rail.cut !== undefined &&
        derived !== undefined
      )
        additions.push({
          name: child.partFace,
          rail: rail.cut,
          guide: guidedRail,
          planes: derived.railPlanes[c]!,
          face: admitted[c]!,
          lines,
          reach: child.rail * AutoMovieConstructionViews.SCALE,
        });
      const stretches: IAutoMovieConstructionSplitBand.IStretch[] = plan[
        c
      ]!.map(
        (s: Arc | Seam): IAutoMovieConstructionSplitBand.IStretch =>
          s.kind === "arc"
            ? { kind: "arc", from: s.from, to: s.to, columns: s.columns }
            : {
                kind: "seam",
                curve: curves[s.index]!,
                forward: s.forward,
                columns: s.columns,
                ...(rail.cut === undefined ||
                typeof forkPlanes[s.index] === "string" ||
                forkPlanes[s.index] === undefined
                  ? {}
                  : { forks: forkPlanes[s.index] as Conormal.Forks }),
              },
      );
      const band:
        | (IAutoMovieConstructionSplitBand.IStrip & { phases: number[] })
        | string = AutoMovieConstructionSplitBand.fan(
        {
          name: child.band,
          ...(guidedRail === undefined ? {} : { guidedRail, cornerReach }),
          ...(lineProbe === undefined ? {} : { lineProbe }),
          ...(hostReady || guidedRail === undefined
            ? {}
            : {
                lineDemand: (
                  line: IAutoMovieConstructionSplitBand.ILineDemand,
                ): void => {
                  if (line.parentPhase !== undefined)
                    demand.push({
                      phase: line.parentPhase,
                      point: line.end.point,
                      forward: line.end.first,
                      from: line.start.first,
                    });
                  lines.push(line);
                },
              }),
          host: { surface: host, station: hostStation, into: hostInto },
          child: {
            surface,
            station: rail.station,
            into,
            ...(rail.cut === undefined ? {} : { along: rail.at }),
          },
          stretches,
          corner,
          ...(reach === undefined ? {} : { reach }),
          ...(square ? { square } : {}),
          ...(child.crease === undefined ? {} : { crease: child.crease }),
          ...(child.correspondence === undefined
            ? {}
            : { correspondence: child.correspondence }),
        },
        n,
      );
      if (typeof band === "string") {
        const detail: string = `band ${child.band}: ${band}`;
        if (valley === undefined) return fail(detail);
        refusals.push(detail);
        continue;
      }
      // A band with a cut reads both boundary curves from their owners, including an authored seam.
      const loop =
        rail.cut === undefined && parentCut === undefined
          ? undefined
          : fanLoop(
              host,
              hostStation,
              stretches,
              n,
              band,
              corner,
              guidedRail === undefined
                ? undefined
                : { into: hostInto, room, reach: cornerReach },
            );
      if (typeof loop === "string") {
        const detail: string = `band ${child.band}: ${loop}`;
        if (valley === undefined) return fail(detail);
        refusals.push(detail);
        continue;
      }
      const edge: IAutoMovieConstructionBandEdge | string | undefined =
        loop === undefined
          ? undefined
          : Edge.carried(
              band.surface,
              band.length,
              surface,
              rail.cut?.at ?? (() => [rail.station, 0, 0]),
              band.childPhases,
              loop.at,
              guidedRail === undefined || rail.cut === undefined
                ? undefined
                : {
                    into,
                    reach: rail.cut.reach,
                    directions: band.columns.map(({ end }): Vec3 => end.first),
                  },
              loop.forks,
            );
      if (typeof edge === "string") {
        const detail: string = `band ${child.band}: ${edge}`;
        if (valley === undefined) return fail(detail);
        refusals.push(detail);
        continue;
      }
      children.push({
        index,
        surface,
        rail,
        kind,
        band,
        face: edge?.surface ?? band.surface,
        edge,
      });
    }
    if (refusals.length !== 0) {
      const moved: IAutoMovieConstructionSplitCompose.ParentCut | undefined =
        !hostReady &&
        parentCut === undefined &&
        derived !== undefined &&
        demand.length !== 0
          ? locateParent(
              nativeHost,
              hostStation,
              hostChain.layers.map(({ y }): number => y),
              hostInto,
              demand,
              Math.min(
                ...node.children.map(
                  ({ rail }): number => rail * AutoMovieConstructionViews.SCALE,
                ),
              ),
              derived,
              n,
            )
          : undefined;
      const displaced = new Map<string, IRelocatedRail>();
      for (const {
        name,
        rail,
        guide,
        planes,
        face,
        lines,
        reach,
      } of additions) {
        const found = locateChild(face, rail, guide, planes, lines, reach, n);
        if (found !== undefined)
          displaced.set(name, { cut: found, crossings: guide.crossings });
      }
      if (moved !== undefined || displaced.size !== 0) {
        AutoMovieConstructionState.restore(body, state, snapshot);
        return fan(
          node,
          body,
          state,
          walk,
          report,
          valley,
          moved ?? parentCut,
          lineProbe,
          nativeRails,
          prepared,
          true,
          displaced,
        );
      }
      return fail(refusals.join("\n"));
    }

    // Each band's column: its stretch and the index in it.
    const columns: {
      stretch: Arc | Seam;
      j: number;
      previous: Arc | Seam;
    }[][] = plan.map(
      (
        stretches: (Arc | Seam)[],
      ): { stretch: Arc | Seam; j: number; previous: Arc | Seam }[] =>
        stretches.flatMap(
          (
            stretch: Arc | Seam,
            i: number,
          ): { stretch: Arc | Seam; j: number; previous: Arc | Seam }[] =>
            Array.from(
              { length: stretch.columns },
              (
                _: unknown,
                j: number,
              ): { stretch: Arc | Seam; j: number; previous: Arc | Seam } => ({
                stretch,
                j,
                previous:
                  stretches[(i - 1 + stretches.length) % stretches.length]!,
              }),
            ),
        ),
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

    if (prepared !== undefined) {
      const faults: string[] = [];
      const exact = (a: Vec3, b: Vec3): boolean =>
        AutoMovieSolidVector.norm(AutoMovieSolidVector.sub(a, b)) <=
        16 *
          Number.EPSILON *
          Math.max(
            1,
            AutoMovieSolidVector.norm(a),
            AutoMovieSolidVector.norm(b),
          );
      for (const [c, child] of children.entries()) {
        const band = child.band;
        const start =
          band.surface.pointAt?.(0) ??
          ((v: number): Vec3 => band.surface.jet(0, v).p);
        const finish =
          band.surface.pointAt?.(band.length) ??
          ((v: number): Vec3 => band.surface.jet(band.length, v).p);
        const receiving =
          child.surface.pointAt?.(child.rail.station) ??
          ((v: number): Vec3 => child.surface.jet(child.rail.station, v).p);
        const first = band.childPhases[0]!;
        const sign = Math.sign(band.childPhases[1]! - first);
        if (
          sign === 0 ||
          band.childPhases.some(
            (p, k): boolean =>
              k > 0 &&
              !(
                sign * (p - band.childPhases[k - 1]!) > 0 &&
                sign * (p - first) < turn
              ),
          )
        )
          faults.push(
            `${band.chain.name}: its native receiving cycle is out of order`,
          );
        for (const [k, { stretch, j }] of columns[c]!.entries()) {
          const at = clock(k);
          if (
            !exact(start(at), band.loop[k]!) ||
            !exact(
              band.terminal?.receiving[k] ?? finish(at),
              receiving(band.childPhases[k]!),
            )
          )
            faults.push(
              `${band.chain.name}: held boundary differs at column ${k}`,
            );
          if (
            stretch.kind === "arc" &&
            !exact(start(at), host.jet(hostStation, band.phases[k]!).p)
          )
            faults.push(
              `${band.chain.name}: original parent differs at column ${k}`,
            );
          if (stretch.kind === "seam" && stretch.forward) {
            const other = children[stretch.index]!.band;
            const k2 = shareColumn(stretch.index, stretch.index, j)!;
            if (!exact(start(at), other.loop[k2 % n]!))
              faults.push(
                `${band.chain.name}: shared seam ${stretch.index} differs at column ${j}`,
              );
          }
        }
      }
      if (faults.length !== 0) return fail(faults.join("\n"));
    }

    // Shared vertices: ring points by arc and column (a fork is its arc's first), seam points by seam and share, rails per child.
    const mesh: IAutoMovieSolidMesh.IMesh = body.mesh;
    const hostOwner: number = AutoMovieSolidMesh.owner(mesh, nativeHost);
    const ring: Map<string, number> = new Map();
    const ringVertex = (fork: string, j: number, phi: number): number => {
      const key: string = fork + ":" + j;
      let v: number | undefined = ring.get(key);
      if (v === undefined)
        ring.set(
          key,
          (v = AutoMovieSolidMesh.vertex(
            mesh,
            host.jet(hostStation, phi).p,
            hostOwner,
            hostAt(phi),
            phi,
          )),
        );
      return v;
    };
    // The fork an arc ends at is the first column of the arc that starts there.
    const arcs: Arc[] = plan.flatMap((stretches: (Arc | Seam)[]): Arc[] =>
      stretches.filter((s: Arc | Seam): s is Arc => s.kind === "arc"),
    );
    const forkOf = (phi: number): string => {
      const at: Arc | undefined = arcs.find(
        (x: Arc): boolean =>
          Math.abs(
            ((((x.from - phi) % turn) + turn + Math.PI) % turn) - Math.PI,
          ) < 1e-12,
      );
      if (at === undefined) throw new Error("a fork that starts no arc");
      return at.fork;
    };
    const seamPoints: Map<string, number> = new Map();
    const loops: number[][] = children.map(
      (child: (typeof children)[number], c: number): number[] =>
        columns[c]!.map(
          (
            {
              stretch,
              j,
              previous,
            }: { stretch: Arc | Seam; j: number; previous: Arc | Seam },
            k: number,
          ): number => {
            if (stretch.kind === "arc")
              return ringVertex(stretch.fork, j, child.band.phases[k]!);
            if (j === 0 && previous.kind === "arc")
              return ringVertex(forkOf(previous.to), 0, previous.to);
            const i: number = stretch.forward ? j : q - j;
            const key: string = stretch.index + ":" + i;
            let v: number | undefined = seamPoints.get(key);
            if (v === undefined)
              seamPoints.set(
                key,
                (v = AutoMovieSolidMesh.vertex(
                  mesh,
                  child.band.surface.jet(0, clock(k)).p,
                  AutoMovieSolidMesh.owner(mesh, child.band.surface),
                  0,
                  clock(k),
                )),
              );
            return v;
          },
        ),
    );
    const rails: number[][] = children.map(
      (child: (typeof children)[number]): number[] => {
        const owner: number = AutoMovieSolidMesh.owner(mesh, child.surface);
        return child.band.childPhases.map((psi: number): number =>
          AutoMovieSolidMesh.vertex(
            mesh,
            child.surface.jet(child.rail.at(psi), psi).p,
            owner,
            child.rail.at(psi),
            psi,
          ),
        );
      },
    );

    // The band faces.
    const faces: number[] = children.map(
      (child: (typeof children)[number]): number =>
        body.faces.push({
          surface: child.face,
          ...(prepared === undefined ? {} : { retainSurface: true as const }),
          ...(child.band.terminal === undefined
            ? {}
            : { terminal: child.band.terminal.prepare }),
          stations:
            child.band.stations ??
            graded(child.band.length, node.rows, child.band.loop),
          phases: Array.from({ length: n }, (_: unknown, k: number): number =>
            clock(k),
          ),
          cycles: [],
        }) - 1,
    );

    // The host's end cycle: every arc's columns in increasing host phase.
    const ordered: { c: number; k: number }[] = children
      .flatMap(
        (_: (typeof children)[number], c: number): { c: number; k: number }[] =>
          columns[c]!.flatMap(
            (
              col: { stretch: Arc | Seam },
              k: number,
            ): { c: number; k: number }[] =>
              col.stretch.kind === "arc" ? [{ c, k }] : [],
          ),
      )
      .sort(
        (x: { c: number; k: number }, y: { c: number; k: number }): number =>
          children[x.c]!.band.phases[x.k]! - children[y.c]!.band.phases[y.k]!,
      );
    body.faces[hostIndex]!.cycles.push({
      kind: hostKind,
      vertices: ordered.map(
        ({ c, k }: { c: number; k: number }): number => loops[c]![k]!,
      ),
      chart: ordered.map(
        ({ c, k }: { c: number; k: number }): [number, number] => [
          hostAt(children[c]!.band.phases[k]!),
          children[c]!.band.phases[k]!,
        ],
      ),
      ...((prepared !== undefined && children.length === 2) ||
      (valley !== undefined &&
        nativeRails !== undefined &&
        parentCut === undefined)
        ? { partition: true as const }
        : {}),
      ...(parentCut === undefined ? {} : { along: hostAt }),
      neighbours: ordered.map(
        ({
          c,
          k,
        }: {
          c: number;
          k: number;
        }): IAutoMovieSolidCycle.INeighbour => ({
          face: faces[c]!,
          from: [0, clock(k)],
          to: [0, clock(k + 1)],
        }),
      ),
    });

    children.forEach((child: (typeof children)[number], c: number): void => {
      const loop: number[] = loops[c]!;
      body.faces[faces[c]!]!.cycles.push(
        {
          kind: "start",
          vertices: loop,
          chart: loop.map((_: number, k: number): [number, number] => [
            0,
            clock(k),
          ]),
          neighbours: loop.map(
            (_: number, k: number): IAutoMovieSolidCycle.INeighbour => {
              const { stretch } = columns[c]![k]!;
              if (stretch.kind === "arc")
                return {
                  face: hostIndex,
                  from: [hostAt(child.band.phases[k]!), child.band.phases[k]!],
                  to: [
                    hostAt(child.band.phases[k + 1]!),
                    child.band.phases[k + 1]!,
                  ],
                };
              // On a seam: the same two points in the other band beside it.
              const j: number = columns[c]![k]!.j;
              const i1: number = stretch.forward ? j : q - j;
              const i2: number = stretch.forward ? j + 1 : q - j - 1;
              const [left, right]: [number, number] = beside(stretch.index);
              const other: number = c === left ? right : left;
              const otherStretch: Seam = plan[other]!.find(
                (s: Arc | Seam): s is Seam =>
                  s.kind === "seam" && s.index === stretch.index,
              )!;
              const from: number = clock(
                shareColumn(other, stretch.index, i1)!,
              );
              return {
                face: faces[other]!,
                from: [0, from],
                to: [
                  0,
                  from + (otherStretch.forward ? i2 - i1 : i1 - i2) * step,
                ],
              };
            },
          ),
        },
        {
          kind: "end",
          vertices: rails[c]!.slice(),
          chart: rails[c]!.map((_: number, k: number): [number, number] => [
            child.band.length,
            clock(k),
          ]),
          neighbours: rails[c]!.map(
            (_: number, k: number): IAutoMovieSolidCycle.INeighbour => {
              const next: number =
                k + 1 < n
                  ? child.band.childPhases[k + 1]!
                  : child.band.childPhases[0]! +
                    Math.sign(
                      child.band.childPhases[n - 1]! -
                        child.band.childPhases[0]!,
                    ) *
                      turn;
              return {
                face: child.index,
                from: [
                  child.rail.at(child.band.childPhases[k]!),
                  child.band.childPhases[k]!,
                ],
                to: [child.rail.at(next), next],
              };
            },
          ),
          ...ends(child.edge, n, child.band.length).band,
        },
      );

      // The child's rail cycle in increasing child phase.
      const rising: boolean =
        child.band.childPhases[n - 1]! > child.band.childPhases[0]!;
      const order: number[] = Array.from(
        { length: n },
        (_: unknown, j: number): number => (rising ? j : n - 1 - j),
      );
      body.faces[child.index]!.cycles.push({
        kind: child.kind,
        vertices: order.map((k: number): number => rails[c]![k]!),
        chart: order.map((k: number): [number, number] => [
          child.rail.at(child.band.childPhases[k]!),
          child.band.childPhases[k]!,
        ]),
        ...(child.rail.cut === undefined ? {} : { along: child.rail.at }),
        ...ends(child.edge, n, child.band.length).child,
        neighbours: order.map(
          (k: number, j: number): IAutoMovieSolidCycle.INeighbour => {
            const next: number = order[(j + 1) % n]!;
            const wraps: boolean = j + 1 === n;
            return {
              face: faces[c]!,
              from: [child.band.length, clock(k)],
              to: [
                child.band.length,
                clock(next) + (wraps ? (rising ? turn : -turn) : 0),
              ],
            };
          },
        ),
      });
      state.faces.set(node.children[c]!.band, faces[c]!);
      state.chains.set(node.children[c]!.band, child.band.chain);
      state.chainList.push(child.band.chain);
      state.chainSurfaces.push(child.face);
    });

    // Each seam's forks, the ring vertices its two arcs start at, are faired once the skin is drawn over a disc the declared share of the
    // seam's chord across (`IAutoMovieConstructionSplit.IProfile.fair`).
    (prepared === undefined ? seams : []).forEach(
      (s: IAutoMovieConstructionSplit.ISeam, j: number): void => {
        const fair: number | [number, number] | undefined = s.profile?.fair;
        if (fair === undefined) return;
        const chord: number = AutoMovieSolidVector.norm(
          AutoMovieSolidVector.sub(curves[j]!.ends[1], curves[j]!.ends[0]),
        );
        const shares: [number, number] =
          typeof fair === "number" ? [fair, fair] : fair;
        (state.fairs ??= []).push(
          { vertices: [ring.get("a" + j + ":0")!], radius: shares[0] * chord },
          { vertices: [ring.get("b" + j + ":0")!], radius: shares[1] * chord },
        );
      },
    );
  } catch (error: unknown) {
    AutoMovieConstructionState.restore(body, state, snapshot);
    if (!(error instanceof AutoMovieLoftAdmissionError)) throw error;
    report(node.name, "split", error.message);
  }
}

/**
 * The grid stations of a band of a split into more than two: from the loop,
 * rows as tall as the loop's columns are apart on average, each half again as
 * tall as the one before until it reaches the declared `length / rows`, then
 * that, scaled to end at the child's rail. At a fork the loop turns a quarter
 * turn between the host's ring and the seam, and the band's columns fan through
 * that turn within a distance of the loop the size of their own spacing; rows
 * `length / rows` apart, up to 2 mm against columns 0.2 to 1 mm apart, drew the
 * band's first triangles across the fan, folded back between the host and the
 * seam (a quarter of a hand's finger forks stood as spikes).
 */
function graded(length: number, rows: number, loop: readonly Vec3[]): number[] {
  let perimeter: number = 0;
  loop.forEach((p: Vec3, k: number): void => {
    perimeter += AutoMovieSolidVector.norm(
      AutoMovieSolidVector.sub(loop[(k + 1) % loop.length]!, p),
    );
  });
  const coarse: number = length / rows;
  const stations: number[] = [0];
  for (
    let h: number = Math.min(coarse, perimeter / loop.length);
    stations.at(-1)! < length - 1e-9;
    h = Math.min(coarse, 1.5 * h)
  )
    stations.push(stations.at(-1)! + h);
  // The last station is the band's length itself, never its scaled image: `s * (length / s)` may round past the length, outside the
  // band's own domain, and its face's grid was then refused ("unavailable source physical2"), as f1's -Z little finger's band was.
  const scale: number = length / stations.at(-1)!;
  return stations.map((s: number, k: number): number =>
    k === stations.length - 1 ? length : s * scale,
  );
}
/**
 * One child's face as the split admits it: realized after the checkpoint, its
 * facing side uncut.
 */
interface IFace {
  /** The face's index in the body. */
  index: number;

  /** The face's chain. */
  chain: IAutoMovieLoftChain;

  /** The face's surface. */
  surface: IAutoMovieSolidSurface;

  /** The station's sign into the child's kept side. */
  into: 1 | -1;

  /** The cycle kind its rail takes. */
  kind: "start" | "end";

  /** The surface's station domain, mm. */
  domain: [number, number];

  /**
   * The child as a cut reads it, or null when its facing end section has no
   * frame.
   */
  read: IAutoMovieConstructionSplitCompose.IChild | null;
}

/**
 * A child's rail: its one station, or the curve of its declared or derived cut
 * (`IAutoMovieConstructionSplit.ICut`, `ICompose`).
 */
interface IRail {
  /** The one station, or with a cut the middle of the stations it spans, mm. */
  station: number;

  /** The rail's station at a child phase, mm. */
  at: (psi: number) => number;

  /** The cut, when the rail is a curve. */
  cut?: IAutoMovieConstructionSkinCut.ICut;
}

/**
 * The moved cut and the original physical territory order it still has to
 * satisfy.
 */
interface IRelocatedRail {
  cut: IAutoMovieConstructionSkinCut.ICut;
  crossings: readonly IAutoMovieConstructionSplitBand.IRailCrossing[];
}

/**
 * Walk every child and admit its face: realized after the checkpoint and not
 * already cut on the side that faces the host. Returns the faces in the
 * children's order, or the refusal.
 */
function admit(
  node: IAutoMovieConstructionSplit,
  body: IAutoMovieSolidBody.IBody,
  state: IAutoMovieConstructionState.IState,
  snapshot: IAutoMovieConstructionState.ISnapshot,
  walk: (node: IAutoMovieConstructionNode) => void,
): IFace[] | string {
  for (const child of node.children) walk(child.part);
  const out: IFace[] = [];
  for (const child of node.children) {
    const index: number | undefined = state.faces.get(child.partFace);
    const chain: IAutoMovieLoftChain | undefined = state.chains.get(
      child.partFace,
    );
    if (index === undefined || index < snapshot.faces || chain === undefined)
      return `the child face ${child.partFace} was not realized`;
    const kind: "start" | "end" = child.partEnd === "bottom" ? "start" : "end";
    if (cut(body, index, kind))
      return `the child face ${child.partFace}'s ${child.partEnd} side is already cut away`;
    const surface: IAutoMovieSolidSurface = body.faces[index]!.surface;
    const into: 1 | -1 = child.partEnd === "bottom" ? 1 : -1;
    const domain: [number, number] = surface.domain ?? [
      chain.layers[0]!.y,
      chain.layers[chain.layers.length - 1]!.y,
    ];
    const layer: IAutoMovieLoftChain.ILayer =
      chain.layers[child.partEnd === "bottom" ? 0 : chain.layers.length - 1]!;
    const basis: IAutoMovieConstructionSplitCompose.IBasis | null =
      Compose.basis(
        layer.frame ?? AutoMovieLoftFrame.horizontal(layer.y),
        into,
      );
    out.push({
      index,
      chain,
      surface,
      into,
      kind,
      domain,
      read:
        basis === null
          ? null
          : {
              name: child.partFace,
              surface,
              into,
              stations: chain.layers
                .map((l: IAutoMovieLoftChain.ILayer): number => l.y)
                .filter(
                  (y: number): boolean => y >= domain[0] && y <= domain[1],
                ),
              rail: child.rail * AutoMovieConstructionViews.SCALE,
              basis,
            },
    });
  }
  return out;
}

/**
 * A rail from the explicit cut, named native station, composed cut or scalar
 * distance.
 */
function railOf(
  child: IAutoMovieConstructionSplit.IChild,
  face: IFace,
  derived: IAutoMovieConstructionSkinCut.ICut | undefined,
  hostBasis: IAutoMovieConstructionSplitCompose.IBasis | null,
  count: number,
  fixed?: number,
): IRail | string {
  const [first, last]: [number, number] = face.domain;
  if (
    child.cut === undefined &&
    (fixed !== undefined || derived === undefined)
  ) {
    const station: number =
      fixed ??
      end(face.chain, child.partEnd) +
        face.into * child.rail * AutoMovieConstructionViews.SCALE;
    if (!(station > first && station < last))
      return `the child face ${child.partFace}'s rail at station ${station} mm lies outside its domain [${first}, ${last}] mm`;
    const rail: IRail = { station, at: (): number => station };
    if (fixed !== undefined) {
      const surface: IAutoMovieSolidSurface = face.surface;
      rail.cut = {
        at: (): [number, number, number] => [station, 0, 0],
        point:
          surface.pointAt?.(station) ??
          ((phase: number): Vec3 =>
            surface.point?.(station, phase) ?? surface.jet(station, phase).p),
        reach: [station, station],
      };
    }
    return rail;
  }
  let made: IAutoMovieConstructionSkinCut.ICut | undefined = derived;
  if (child.cut !== undefined) {
    if (hostBasis === null || face.read === null)
      return `the child face ${child.partFace}'s cut has no frame to stand in`;
    const own: IAutoMovieConstructionSkinCut.ICut | string = Compose.cut(
      child.cut,
      hostBasis,
      face.read,
      count,
    );
    if (typeof own === "string") return own;
    made = own;
  }
  const rail: IAutoMovieConstructionSkinCut.ICut = made!;
  if (!(rail.reach[0] > first && rail.reach[1] < last))
    return `the child face ${child.partFace}'s rail at stations ${rail.reach[0]} to ${rail.reach[1]} mm leaves its domain [${first}, ${last}] mm`;
  return {
    station: (rail.reach[0] + rail.reach[1]) / 2,
    at: (psi: number): number => rail.at(psi)[0],
    cut: rail,
  };
}

/**
 * A composed end's derived members (`AutoMovieConstructionSplitCompose.derive`)
 * from the admitted faces, or the refusal.
 */
function compose(
  node: IAutoMovieConstructionSplit,
  declared: IAutoMovieConstructionSplit.ICompose,
  host: IAutoMovieSolidSurface,
  hostStation: number,
  hostBasis: IAutoMovieConstructionSplitCompose.IBasis | null,
  faces: readonly IFace[],
  valley?: IAutoMovieConstructionSplitCompose.Valley,
): IAutoMovieConstructionSplitCompose.IDerived | string {
  if (hostBasis === null) return "the host's end section has no frame";
  const children: IAutoMovieConstructionSplitCompose.IChild[] = [];
  for (const [i, face] of faces.entries()) {
    if (face.read === null)
      return `the child face ${node.children[i]!.partFace}'s facing end section has no frame`;
    children.push(face.read);
  }
  return Compose.derive(
    {
      compose: declared,
      host: { surface: host, station: hostStation, basis: hostBasis },
      children,
      count: node.count,
    },
    undefined,
    valley,
  );
}

/** A refused cross line rooted on the actual parent and addressed on the child. */
interface IParentDemand {
  phase: number;
  point: Vec3;
  forward: Vec3;
  from: Vec3;
}

/** A measured, bounded station displacement with compact phase support. */
interface ITrimPatch {
  phase: number;
  amount: number;
  width: number;
}

/**
 * Retain the complement of each quintic support and its exact phase
 * derivatives.
 */
function remaining(
  patches: readonly ITrimPatch[],
  phase: number,
  share: number,
): [number, number, number] {
  const turn: number = 2 * Math.PI;
  let [p, d1, d2]: [number, number, number] = [1, 0, 0];
  for (const patch of patches) {
    const delta: number = phase - patch.phase;
    const d: number = delta - turn * Math.round(delta / turn);
    const x: number = Math.abs(d) / patch.width;
    if (!(x < 1)) continue;
    const q: number = share * patch.amount;
    const v: number = 1 - q + q * x ** 3 * (10 - 15 * x + 6 * x * x);
    const v1: number =
      (30 * q * x ** 2 * (1 - x) ** 2 * Math.sign(d)) / patch.width;
    const v2: number = (60 * q * x * (1 - x) * (1 - 2 * x)) / patch.width ** 2;
    [p, d1, d2] = [p * v, d1 * v + p * v1, d2 * v + 2 * d1 * v1 + p * v2];
  }
  return [p, d1, d2];
}

/** Move a failed child cut only inside its own regular retained surface. */
function locateChild(
  face: IFace,
  base: IAutoMovieConstructionSkinCut.ICut,
  guide: IAutoMovieConstructionSplitBand.IGuidedRail,
  planes: IAutoMovieConstructionSplitCompose.IDerived["railPlanes"][number],
  lines: readonly IAutoMovieConstructionSplitBand.ILineDemand[],
  reach: number,
  count: number,
): IAutoMovieConstructionSkinCut.ICut | undefined {
  if (lines.length === 0 || !(reach > 0)) return undefined;
  const { add, dot, norm, scale, sub } = AutoMovieSolidVector;
  const {
    surface,
    into,
    domain: [bottom, top],
  } = face;
  const stations: number[] = (face.read?.stations ?? [])
    .filter((s): boolean => s > bottom && s < top)
    .sort((a, b): number => into * (a - b));
  const limit: number | undefined = stations.at(-1);
  if (
    limit === undefined ||
    !(into * (limit - base.reach[into > 0 ? 1 : 0]) > 0)
  )
    return undefined;
  const groups: {
    childPhase: number;
    roads: IAutoMovieConstructionSplitBand.ILineDemand[];
  }[] = [];
  const turn: number = 2 * Math.PI;
  const near = (delta: number): number =>
    delta - turn * Math.round(delta / turn);
  for (const line of lines) {
    const group = groups.find(
      ({ childPhase }): boolean =>
        Math.abs(near(line.childPhase - childPhase)) < 1e-12,
    );
    if (group === undefined)
      groups.push({ childPhase: line.childPhase, roads: [line] });
    else group.roads.push(line);
  }
  const patches: ITrimPatch[] = groups.flatMap(({ childPhase, roads }) => {
    const mark = guide.marks.find(
      ({ phase }): boolean => Math.abs(near(phase - childPhase)) < 1e-12,
    );
    const original: number = base.at(childPhase)[0];
    const neighbours: number[] = guide.marks
      .filter((a): boolean => a !== mark)
      .map(({ phase }): number => near(phase - childPhase));
    const before: number =
      childPhase + Math.max(-turn, ...neighbours.filter((d): boolean => d < 0));
    const after: number =
      childPhase + Math.min(turn, ...neighbours.filter((d): boolean => d > 0));
    for (const station of stations) {
      if (!(into * (station - original) > 0)) continue;
      const transported =
        mark?.crossing === undefined
          ? undefined
          : transportFork(
              surface,
              station,
              mark.crossing.plane,
              (before + childPhase) / 2,
              (after + childPhase) / 2,
              1,
            );
      if (transported === null) continue;
      const phase: number = transported?.phase ?? childPhase;
      const [r, first]: [number, number, number] = base.at(phase);
      const room: number = into * (limit - r);
      const step: number = into * (station - r);
      if (!(room > 0 && step > 0)) continue;
      const amount: number = step / room;
      const j: IAutoMovieSolidSurface.IJet =
        transported?.jet ?? surface.jet(station, phase);
      // The patch is flat at this physical line. Its remaining share scales the old rail slope.
      const tangent: Vec3 = add(j.v, scale(j.u, (1 - amount) * first));
      const span: number = dot(tangent, tangent);
      if (!(span > 0)) continue;
      const outgoing: Vec3 = scale(j.u, into);
      if (
        roads.every(({ start }): boolean => {
          const chord: Vec3 = sub(j.p, start.point);
          return dot(chord, start.first) > 0 && dot(chord, outgoing) > 0;
        })
      ) {
        const width: number = Math.min(
          Math.PI,
          reach / norm(tangent),
          (phase - before) / 2,
          (after - phase) / 2,
        );
        if (width > 0) return [{ phase, amount, width }];
      }
    }
    return [];
  });
  if (patches.length === 0) return undefined;
  const atShare = (
    share: number,
    phase: number,
    original: [number, number, number],
  ): [number, number, number] => {
    const [p, d1, d2]: [number, number, number] = remaining(
      patches,
      phase,
      share,
    );
    const room: number = limit - original[0];
    return [
      limit - room * p,
      original[1] * p - room * d1,
      original[2] * p + 2 * original[1] * d1 - room * d2,
    ];
  };
  const samples: number = 8 * count;
  const phases: number[] = Array.from(
    { length: samples },
    (_, k): number => (turn / samples) * k,
  );
  const original: [number, number, number][] = phases.map(
    (phase): [number, number, number] => base.at(phase),
  );
  const point = (s: number, phase: number): Vec3 =>
    surface.point?.(s, phase) ?? surface.jet(s, phase).p;
  const admitted = (share: number): boolean => {
    const at = (phase: number): [number, number, number] =>
      atShare(share, phase, base.at(phase));
    const reading = RailClock.switches(
      planes,
      (phase): Vec3 => point(at(phase)[0], phase),
      count,
      (phase): Vec3 => {
        const [s, first]: [number, number, number] = at(phase);
        const jet: IAutoMovieSolidSurface.IJet = surface.jet(s, phase);
        return add(jet.v, scale(jet.u, first));
      },
      (k, phase): Vec3 => point(atShare(share, phase, original[k]!)[0], phase),
    );
    return (
      typeof reading !== "string" &&
      RailClock.sameOrder(guide.crossings, reading.crossings)
    );
  };
  let share: number = 1;
  if (!admitted(share)) {
    // Resolve remaining movement at the same physical station per phase cell
    // as the parent. Each static original section is prepared only once.
    const stationSpacing: number = Math.min(
      ...stations.slice(1).map((s, i): number => Math.abs(s - stations[i]!)),
    );
    const tolerance: number =
      stationSpacing /
      (samples * Math.abs(limit - base.reach[into > 0 ? 0 : 1]));
    let [lo, hi]: [number, number] = [0, 1];
    while (hi - lo > tolerance) {
      const middle: number = (lo + hi) / 2;
      if (!(middle > lo && middle < hi)) break;
      if (admitted(middle)) lo = middle;
      else hi = middle;
    }
    share = lo;
    if (!(share > 0)) return undefined;
  }
  const at = (phase: number): [number, number, number] =>
    atShare(share, phase, base.at(phase));
  const stationsOnCut: number[] = phases.map(
    (phase, k): number => atShare(share, phase, original[k]!)[0],
  );
  return {
    at,
    point: (phase: number): Vec3 => point(at(phase)[0], phase),
    reach: [Math.min(...stationsOnCut), Math.max(...stationsOnCut)],
  };
}

/**
 * Read the closest retained parent section supporting each refused directed
 * line.
 */
function locateParent(
  source: IAutoMovieSolidSurface,
  terminal: number,
  stations: readonly number[],
  into: 1 | -1,
  demand: readonly IParentDemand[],
  reach: number,
  derived: IAutoMovieConstructionSplitCompose.IDerived,
  count: number,
): IAutoMovieConstructionSplitCompose.ParentCut | undefined {
  const { cross, dot, norm, scale, sub, unit } = AutoMovieSolidVector;
  const turn: number = 2 * Math.PI;
  const near = (phase: number): number =>
    phase - turn * Math.round(phase / turn);
  const material: number[] = stations
    .filter((s): boolean => into * (terminal - s) > 0)
    .sort((a, b): number => into * (b - a));
  if (material.length === 0 || !(reach > 0)) return undefined;
  const room: number = into * (terminal - material.at(-1)!);
  const planes: IAutoMovieConstructionSkinCut.IPlane[] =
    derived.composition.seams.map(
      ({ normal, forks }): IAutoMovieConstructionSkinCut.IPlane => ({
        normal,
        point: forks[0].point,
      }),
    );
  const anchors = derived.seams.flatMap(([a, b], j) => [
    { phase: a, plane: j, direction: -1 },
    { phase: b, plane: j, direction: 1 },
  ]);
  const groups: { phase: number; roads: IParentDemand[] }[] = [];
  for (const road of demand) {
    const group = groups.find(
      ({ phase }): boolean => Math.abs(near(road.phase - phase)) < 1e-12,
    );
    if (group === undefined) groups.push({ phase: road.phase, roads: [road] });
    else group.roads.push(road);
  }
  const patches = groups.flatMap(({ phase, roads }) => {
    const fork = anchors.find(
      (a): boolean => Math.abs(near(a.phase - phase)) < 1e-12,
    );
    const oldPoint: Vec3 =
      source.point?.(terminal, phase) ?? source.jet(terminal, phase).p;
    const distances: number[] = planes.map(({ point, normal }): number =>
      dot(normal, sub(oldPoint, point)),
    );
    const peers: number[] = anchors
      .filter((a): boolean => a !== fork)
      .map((a): number => near(a.phase - phase));
    const before: number = Math.max(
      -turn,
      ...peers.filter((d): boolean => d < 0),
    );
    const after: number = Math.min(
      turn,
      ...peers.filter((d): boolean => d > 0),
    );
    const read = (s: number) => {
      const section =
        fork === undefined
          ? undefined
          : transportFork(
              source,
              s,
              planes[fork.plane]!,
              phase + before / 2,
              phase + after / 2,
              fork.direction,
            );
      if (section === null) return null;
      const clock: number = section?.phase ?? phase;
      const j: IAutoMovieSolidSurface.IJet =
        section?.jet ?? source.jet(s, clock);
      const n: Vec3 | null = unit(cross(j.u, j.v));
      if (n === null) return null;
      if (
        fork === undefined &&
        planes.some(
          ({ point, normal }, i): boolean =>
            Math.sign(dot(normal, sub(j.p, point))) !==
            Math.sign(distances[i]!),
        )
      )
        return null;
      if (
        roads.some(({ point, forward, from }): boolean => {
          const crossLine: Vec3 = sub(from, scale(n, dot(n, from)));
          const chord: Vec3 = sub(point, j.p);
          return !(dot(chord, crossLine) > 0 && dot(chord, forward) > 0);
        })
      )
        return null;
      const speed: number = norm(j.v);
      const width: number = Math.min(
        Math.PI,
        reach / speed,
        (clock - (phase + before)) / 2,
        (phase + after - clock) / 2,
      );
      return width > 0
        ? { phase: clock, amount: (into * (terminal - s)) / room, width }
        : null;
    };
    for (const s of material) {
      const patch = read(s);
      if (patch !== null) return [patch];
    }
    return [];
  });
  if (patches.length === 0) return undefined;
  // Join phase support over one physical rail reach. The quintic has zero
  // first and second derivatives at both ends. Multiplying the remaining
  // shares combines overlapping demands within the original parent range.
  const curve =
    (share: number): IAutoMovieConstructionSplitCompose.ParentCut =>
    (phase: number): [number, number, number] => {
      const [p, d1, d2]: [number, number, number] = remaining(
        patches,
        phase,
        share,
      );
      return [
        terminal - into * room * (1 - p),
        into * room * d1,
        into * room * d2,
      ];
    };
  const samples: number = 8 * count;
  const admitted = (
    cut: IAutoMovieConstructionSplitCompose.ParentCut,
  ): boolean => {
    const moved: IAutoMovieSolidSurface = cutChart(source, terminal, cut);
    const ring = (phase: number): Vec3 => moved.point!(terminal, phase);
    const forks = Compose.forks(
      ring,
      planes,
      Array.from(
        { length: samples },
        (_, k): Vec3 => ring((turn * k) / samples),
      ),
    );
    return (
      typeof forks !== "string" &&
      forks.every(
        ([a, b], i): boolean =>
          dot(planes[i]!.normal, moved.jet(terminal, a).v) < 0 &&
          dot(planes[i]!.normal, moved.jet(terminal, b).v) > 0,
      )
    );
  };
  if (!admitted(curve(0))) return undefined;
  const complete: IAutoMovieConstructionSplitCompose.ParentCut = curve(1);
  if (admitted(complete)) return complete;
  // Restrict the measured relocation to the connected parent graph's original
  // incidence, at the station resolution of the physical ring sampling.
  const nodes: number[] = [terminal, ...material];
  const minimum: number = Math.min(
    ...material.map((s, i): number => Math.abs(s - nodes[i]!)),
  );
  const tolerance: number = minimum / (samples * room);
  let [lo, hi]: [number, number] = [0, 1];
  while (hi - lo > tolerance) {
    const mid: number = (lo + hi) / 2;
    if (admitted(curve(mid))) lo = mid;
    else hi = mid;
  }
  return lo > 0 ? curve(lo) : undefined;
}

/**
 * Transport the existing fork inside its declared seam plane on a held parent
 * section.
 */
function transportFork(
  source: IAutoMovieSolidSurface,
  station: number,
  plane: IAutoMovieConstructionSkinCut.IPlane,
  lo: number,
  hi: number,
  direction: number,
): { phase: number; jet: IAutoMovieSolidSurface.IJet } | null {
  const { dot, sub } = AutoMovieSolidVector;
  const point =
    source.pointAt?.(station) ??
    ((phase: number): Vec3 =>
      source.point?.(station, phase) ?? source.jet(station, phase).p);
  const value = (phase: number): number =>
    direction * dot(plane.normal, sub(point(phase), plane.point));
  if (!(value(lo) < 0 && value(hi) > 0)) return null;
  for (;;) {
    const mid: number = (lo + hi) / 2;
    if (!(mid > lo && mid < hi)) break;
    if (value(mid) < 0) lo = mid;
    else hi = mid;
  }
  const j: IAutoMovieSolidSurface.IJet = source.jet(station, hi);
  const v: number = dot(plane.normal, j.v);
  if (!(direction * v > 0)) return null;
  const first: number = -dot(plane.normal, j.u) / v;
  const second: number =
    -(
      dot(plane.normal, j.uu) +
      2 * first * dot(plane.normal, j.uv) +
      first * first * dot(plane.normal, j.vv)
    ) / v;
  // The same physical root must carry a finite second-order station trace.
  return Number.isFinite(first) && Number.isFinite(second)
    ? { phase: hi, jet: j }
    : null;
}

/**
 * Align the temporary split chart with the owner's terminal curve while
 * retaining the world 2-jet.
 */
function cutChart(
  source: IAutoMovieSolidSurface,
  terminal: number,
  cut: IAutoMovieConstructionSplitCompose.ParentCut,
): IAutoMovieSolidSurface {
  const { combine } = AutoMovieSolidVector;
  return {
    name: source.name,
    orientation: source.orientation,
    ...(source.period === undefined ? {} : { period: source.period }),
    point: (station: number, phase: number): Vec3 => {
      const actual: number = station - terminal + cut(phase)[0];
      return source.point?.(actual, phase) ?? source.jet(actual, phase).p;
    },
    jet: (station: number, phase: number): IAutoMovieSolidSurface.IJet => {
      const [root, first, second]: [number, number, number] = cut(phase);
      const j: IAutoMovieSolidSurface.IJet = source.jet(
        station - terminal + root,
        phase,
      );
      return {
        p: j.p,
        u: j.u,
        v: combine([
          [1, j.v],
          [first, j.u],
        ]),
        uu: j.uu,
        uv: combine([
          [1, j.uv],
          [first, j.uu],
        ]),
        vv: combine([
          [1, j.vv],
          [2 * first, j.uv],
          [first * first, j.uu],
          [second, j.u],
        ]),
      };
    },
  };
}

/**
 * The exact readers of a carried band's child seam
 * (`IAutoMovieSolidCycle.IExact`): the band's end cycle maps a point past its
 * end to the child's rail at its clock's correspondence, and the child's rail
 * cycle maps a point past the rail to the band's end at the clock whose rail
 * point stands at its phase. Without a carried edge both cycles read their
 * chords, as before.
 */
function ends(
  edge: IAutoMovieConstructionBandEdge | undefined,
  count: number,
  length: number,
): {
  band: { exact?: IAutoMovieSolidCycle.IExact };
  child: { exact?: IAutoMovieSolidCycle.IExact };
} {
  if (edge === undefined) return { band: {}, child: {} };
  return {
    band: {
      exact: {
        count,
        across: (_: number, v: number): [number, number] => edge.rail(v),
      },
    },
    child: {
      exact: {
        count,
        across: (_: number, v: number): [number, number] => [
          length,
          edge.clock(v),
        ],
      },
    },
  };
}

/**
 * A point of a band's loop with its first and second derivatives in the band's
 * clock.
 */
type CurveJet = { p: Vec3; d1: Vec3; d2: Vec3 };
type Loop = (
  clock: number,
) => CurveJet & {
  across?: CurveJet;
  retained?: (t: number) => IAutoMovieSolidSurface.IJet;
};

/**
 * The host's end ring at a phase that runs at `rate` radians per radian of
 * clock, as a loop point.
 */
function onRing(
  host: IAutoMovieSolidSurface,
  station: number,
  phase: number,
  rate: number,
): { p: Vec3; d1: Vec3; d2: Vec3 } {
  const j: IAutoMovieSolidSurface.IJet = host.jet(station, phase);
  return {
    p: [j.p[0], j.p[1], j.p[2]],
    d1: AutoMovieSolidVector.scale(j.v, rate),
    d2: AutoMovieSolidVector.scale(j.vv, rate * rate),
  };
}

/**
 * A seam at an arclength share that runs at `rate` shares per radian of clock,
 * as a loop point.
 */
function onSeam(
  curve: IAutoMovieConstructionSplitSeam.ISeam,
  share: number,
  rate: number,
): { p: Vec3; d1: Vec3; d2: Vec3 } {
  const r: IAutoMovieConstructionSplitSeam.IPoint = curve.at(share);
  const speed: number = rate * curve.length;
  return {
    p: r.point,
    d1: AutoMovieSolidVector.scale(r.tangent, speed),
    d2: AutoMovieSolidVector.scale(r.bend, speed * speed),
  };
}

/**
 * The loop of a band of a split into more than two as one curve of its clock,
 * by the law its columns are placed with
 * (`AutoMovieConstructionSplitBand.fan`): on an arc the host's ring at a phase
 * linear in the clock, on a seam the seam at an arclength share linear in the
 * clock from the fork it is read from. Two bands that read one seam from its
 * two ends read the same points.
 */
function fanLoop(
  host: IAutoMovieSolidSurface,
  station: number,
  stretches: readonly IAutoMovieConstructionSplitBand.IStretch[],
  count: number,
  band: IAutoMovieConstructionSplitBand.IStrip,
  corner: number,
  material?: { into: 1 | -1; room: number; reach: number },
): { at: Loop; forks: Edge.IFork[] } | string {
  const turn: number = 2 * Math.PI;
  const step: number = turn / count;
  const { add, dot, scale, sub } = AutoMovieSolidVector;
  const center = scale(band.loop.reduce(add, [0, 0, 0]), 1 / count);
  const current = Conormal.baseline(band);
  const across: (
    | ((
        share: number,
        line: IAutoMovieConstructionSplitSeam.IPoint,
      ) => CurveJet)
    | undefined
  )[] = [];
  const retained: (
    | ((t: number, clock: number) => IAutoMovieSolidSurface.IJet)
    | undefined
  )[] = [];
  const windows: { clock: number; radius: number }[] = [];
  let first = 0;
  let column: number = 0;
  for (const s of stretches) {
    const last = first + s.columns * step;
    let radius: number = 0;
    const ends = s.kind === "seam" && corner > 0 ? s.forks : undefined;
    if (ends === undefined || s.kind !== "seam") across.push(undefined);
    else {
      const bias = dot(s.curve.normal, sub(center, s.curve.ends[0]));
      const range: number =
        material === undefined
          ? corner
          : AutoMovieConstructionSplitBand.cornerOf(
              material.reach,
              s.curve.length,
              last - first,
            );
      const read = Conormal.prepare({
        curve: s.curve,
        forks: ends,
        start: s.forward ? first : last,
        end: s.forward ? last : first,
        corner: range,
        sign: bias > 0 ? 1 : -1,
        current,
        ...(material === undefined ? {} : { columns: s.columns }),
      });
      if (typeof read === "string") return read;
      across.push(read);
      radius = range;
    }
    if (s.kind !== "arc" || material === undefined) retained.push(undefined);
    else {
      const base: number = first;
      const rate: number = (s.to - s.from) / (last - first);
      const addresses: number[] = Array.from(
        { length: s.columns + 1 },
        (_, k): number => base + k * step,
      );
      const phases: number[] = addresses.map(
        (c): number => s.from + (c - base) * rate,
      );
      const directions: Vec3[] = addresses.map(
        (_, k): Vec3 =>
          scale(band.columns[(column + k) % count]!.start.first, -1),
      );
      const length: number = addresses
        .slice(1)
        .reduce(
          (sum, _, k): number =>
            sum +
            AutoMovieSolidVector.norm(
              sub(
                band.loop[(column + k + 1) % count]!,
                band.loop[(column + k) % count]!,
              ),
            ),
          0,
        );
      const angle: number = AutoMovieConstructionSplitBand.cornerOf(
        material.reach,
        length,
        Math.abs(s.to - s.from),
      );
      radius = angle / Math.abs(rate);
      const read = Continuation.prepare(
        host,
        () => [station, 0, 0],
        (c): [number, number, number] => [s.from + (c - base) * rate, rate, 0],
        phases,
        {
          addresses,
          directions,
          into: material.into > 0 ? -1 : 1,
          reach: [station, station],
          room: material.room,
          angle,
        },
      );
      if (typeof read === "string") return read;
      retained.push(read);
    }
    windows.push({ clock: first, radius });
    first = last;
    column += s.columns;
  }
  const forks: Edge.IFork[] = windows.flatMap(
    ({ clock, radius }, i): Edge.IFork[] => {
      const j: number = (i - 1 + windows.length) % windows.length;
      const other: number = windows[j]!.radius;
      const arc = retained[i] ?? retained[j];
      if (
        arc === undefined ||
        retained[i] === retained[j] ||
        !(radius > 0 && other > 0)
      )
        return [];
      const phase: number = i === 0 && retained[i] === undefined ? turn : clock;
      return [
        {
          clock,
          radius: Math.min(radius, other),
          retained: (t) => arc(t, phase),
        },
      ];
    },
  );
  const at: Loop = (clock: number): ReturnType<Loop> => {
    const x: number = (((clock % turn) + turn) % turn) / step;
    let k: number = 0;
    for (const [i, s] of stretches.entries()) {
      if (x < k + s.columns || i === stretches.length - 1) {
        const f: number = (x - k) / s.columns;
        const rate: number = 1 / (s.columns * step);
        if (s.kind === "arc") {
          const own: CurveJet = onRing(
            host,
            station,
            s.from + (s.to - s.from) * f,
            (s.to - s.from) * rate,
          );
          const read = retained[i];
          return read === undefined
            ? own
            : {
                ...own,
                retained: (t: number): IAutoMovieSolidSurface.IJet =>
                  read(t, x * step),
              };
        }
        const share = s.forward ? f : 1 - f;
        const speed = (s.forward ? rate : -rate) * s.curve.length;
        const cross = across[i];
        const line = s.curve.at(share, cross !== undefined);
        return {
          p: line.point,
          d1: scale(line.tangent, speed),
          d2: scale(line.bend, speed * speed),
          ...(cross === undefined ? {} : { across: cross(share, line) }),
        };
      }
      k += s.columns;
    }
    throw new Error("a band's loop has no stretch");
  };
  return { at, forks };
}

/**
 * The loop of a band of a split in two as one curve of its clock, by the law
 * its columns are placed with (`AutoMovieConstructionSplitBand.create`): over
 * the first half turn the host's arc at a phase linear in the clock, over the
 * second the seam at an arclength share linear in the clock from the arc's end
 * back to its start.
 */
function chordLoop(
  host: IAutoMovieSolidSurface,
  station: number,
  arc: [number, number],
  curve: IAutoMovieConstructionSplitSeam.ISeam,
): Loop {
  const turn: number = 2 * Math.PI;
  const [alpha, beta]: [number, number] = arc;
  const far = (phase: number): number =>
    AutoMovieSolidVector.norm(
      AutoMovieSolidVector.sub(curve.ends[0], host.jet(station, phase).p),
    );
  const reversed: boolean = far(beta) > far(alpha);
  return (clock: number): { p: Vec3; d1: Vec3; d2: Vec3 } => {
    const x: number = (((clock % turn) + turn) % turn) / Math.PI;
    if (x <= 1)
      return onRing(
        host,
        station,
        alpha + (beta - alpha) * x,
        (beta - alpha) / Math.PI,
      );
    return onSeam(
      curve,
      reversed ? 2 - x : x - 1,
      (reversed ? -1 : 1) / Math.PI,
    );
  };
}

/** A real pole cannot be split. */
function closed(chain: IAutoMovieLoftChain, side: "bottom" | "top"): boolean {
  return chain.pole?.end === side || chain.opposite?.end === side;
}

/** A trimmed or shared end has consumed that boundary. */
function cut(
  body: IAutoMovieSolidBody.IBody,
  index: number,
  kind: "start" | "end",
): boolean {
  return body.faces[index]!.cycles.some(
    (cycle: IAutoMovieSolidCycle.ICycle): boolean => cycle.kind === kind,
  );
}

/** The principal end station, mm. */
function end(chain: IAutoMovieLoftChain, side: "bottom" | "top"): number {
  return chain.layers[side === "bottom" ? 0 : chain.layers.length - 1]!.y;
}
