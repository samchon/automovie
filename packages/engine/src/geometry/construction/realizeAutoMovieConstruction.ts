import type {
  AutoMovieConstructionNode,
  AutoMovieConstructionParameter,
  IAutoMovieConstruction,
  IAutoMovieConstructionContinuation,
  IAutoMovieConstructionDiagnostic,
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionTrim,
  IAutoMovieConstructionView,
} from "@automovie/interface";

import { AutoMovieConstructionContinuation } from "./AutoMovieConstructionContinuation";
import type { AutoMovieConstructionRealization } from "./AutoMovieConstructionRealization";
import { AutoMovieConstructionSeeds } from "./AutoMovieConstructionSeeds";
import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import { AutoMovieConstructionWidths } from "./AutoMovieConstructionWidths";
import type { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import { AutoMovieLoftStations } from "./AutoMovieLoftStations";
import { AutoMovieSolidBody } from "./AutoMovieSolidBody";
import { AutoMovieSolidChain } from "./AutoMovieSolidChain";
import type { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import type { AutoMovieSolidJoin } from "./AutoMovieSolidJoin";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import { AutoMovieSolidTrim } from "./AutoMovieSolidTrim";
import { AutoMovieViewLoft } from "./AutoMovieViewLoft";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/**
 * Realize a construction tree: loft every view part from its views, apply every join, continuation and trim in the tree's order (each host before what is built on it, a part's own subtree before the node that attaches it), and draw the body of trimmed faces as one skin that shares every boundary between its faces.
 *
 * A node whose premise breaks is left out with its diagnostic: a view part's broken station leaves that station out, a join or a continuation that cannot keep its premises leaves its part's whole subtree out and its host standing as it was, and a trim that cannot keep its premises leaves its face uncut, so every admitted tree realizes. Admission runs before any work and refuses the whole call by throwing: a chord tolerance that is not positive, a node outside the closed union, a name used twice, or a seed, continuation or trim naming a face that is not a view part (or, where a blend may serve, a join) of the right subtree. A trim's feet are solved to a thousandth of the chord tolerance. A face's open end closes on its pole by a fan; an end with neither a pole nor a shared ring stays open.
 *
 * @evidence contracts/common.md#principled-implementation One recursive walk applies the operators the tree names in the tree's own containment order, and each operator is the kernel's (view loft, intersection trace, rails, blend, trim, body, zip), so the realization adds no geometry of its own; a broken node is rolled back to the state before its part was built, which is what leaving it out means.
 * @evidence contracts/common.md#clear-and-simple-design A tree and a chord tolerance in, one record out; the subtree rule lets any node be realized and checked alone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A broken premise leaves its node out and names it; nothing is retried with relaxed tolerances or replaced by a primitive.
 * @evidence contracts/common.md#meaningful-documentation States the walk's order, the leave-out rule for each node kind, the admission refusals, the trim's foot tolerance, the end closure and the result's units through its type.
 * @evidence contracts/performance.md#efficient-algorithms Each view part is lofted once and each join traced by its operator once (twice when a width law reads the traced curve); the skin is drawn once from the finished body, its stations bisected only where a band departs from its sections by more than the chord.
 * @evidence contracts/performance.md#reuse-equivalent-work A face's surface is built once and shared by every join, trim and the skin that reads it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the records the result returns and one copy of the trim cycles per open join for its rollback, released when that join settles.
 * @param construction The tree, metres and radians.
 * @param props The skin's chord tolerance.
 * @returns The realization.
 */
export function realizeAutoMovieConstruction(
  construction: IAutoMovieConstruction,
  props: AutoMovieConstructionRealization.IProps,
): AutoMovieConstructionRealization.IRealization {
  if (!(props.chord > 0)) throw new Error(`realizeAutoMovieConstruction: chord ${props.chord} m is not positive`);
  admit(construction.root);
  const S: number = AutoMovieConstructionViews.SCALE;
  const chord: number = props.chord * S;
  const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create(construction.name, []);
  const state: IState = {
    faces: new Map(),
    chains: new Map(),
    chainList: [],
    chainSurfaces: [],
    blendSurfaces: [],
    joins: [],
    trims: [],
    diagnostics: [],
    overrides: new Map(),
  };
  const report = (node: string, contract: string, detail: string): void => {
    state.diagnostics.push({ node, contract, detail });
  };
  const absorb = (node: string, list: readonly AutoMovieLoftContract.IDiagnostic[]): void => {
    for (const d of list) report(node, d.contract, d.detail);
  };

  const view = (node: IAutoMovieConstructionView): void => {
    const part: IAutoMovieViewPart | string = AutoMovieConstructionViews.part(node);
    if (typeof part === "string") return report(node.name, "axis", part);
    const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
    absorb(node.name, loft.diagnostics);
    if (loft.chain === null) return;
    let chain: IAutoMovieLoftChain = loft.chain;
    const override: IOverride | undefined = state.overrides.get(node.name);
    if (override !== undefined) {
      const replaced: IAutoMovieLoftChain | string = override.apply(chain);
      if (typeof replaced === "string") override.error = replaced;
      else {
        chain = replaced;
        override.applied = true;
      }
    }
    const surface: IAutoMovieSolidSurface | null = override?.applied === true ? AutoMovieSolidChain.surface(chain) : loft.surface;
    if (surface === null) return report(node.name, "surface", "the lofted chain carries no jets or its middle section is degenerate");
    const first: number = chain.layers[0]!.y;
    const last: number = chain.layers[chain.layers.length - 1]!.y;
    const index: number =
      body.faces.push({
        surface,
        stations: AutoMovieLoftStations.bisect(chain, first, last, chord),
        phases: Array.from({ length: chain.samples }, (_: unknown, k: number): number => (2 * Math.PI * k) / chain.samples),
        cycles: [],
      }) - 1;
    state.faces.set(node.name, index);
    state.chains.set(node.name, chain);
    state.chainList.push(chain);
    state.chainSurfaces.push(surface);
  };

  const join = (node: IAutoMovieConstructionJoin): void => {
    walk(node.host);
    const snapshot: ISnapshot = snap(body, state);
    walk(node.part);
    const fail = (contract: string, detail: string): void => {
      report(node.name, contract, detail);
      restore(body, state, snapshot);
    };
    const partIndex: number | undefined = state.faces.get(node.seed.partFace);
    const hostIndex: number | undefined = state.faces.get(node.seed.hostFace);
    if (partIndex === undefined || partIndex < snapshot.faces) return fail("seed face", `the part face ${node.seed.partFace} was not realized`);
    if (hostIndex === undefined || hostIndex >= snapshot.faces) return fail("seed face", `the host face ${node.seed.hostFace} was not realized`);
    const partSurface: IAutoMovieSolidSurface = body.faces[partIndex]!.surface;
    const { atlas, index }: { atlas: IAutoMovieSolidAtlas; index: number[] } = AutoMovieSolidBody.atlas(body, partIndex);
    const face: number = index.indexOf(hostIndex);
    const tolerance: number = node.tolerance * S;
    const layers: number[] = state.chains.get(node.seed.partFace)!.layers.map((l: IAutoMovieLoftChain.ILayer): number => l.y);
    const seed: AutoMovieSolidIntersection.IInput["seed"] | string = AutoMovieConstructionSeeds.create(node.seed, partSurface, layers, atlas.faces[face]!, face, tolerance);
    if (typeof seed === "string") return fail("seed", seed);
    const parameter: AutoMovieSolidIntersection.Parameter = curveParameter(node.parameter);
    let traced: AutoMovieConstructionWidths.ITraced | null = null;
    if (AutoMovieConstructionWidths.traced(node.partWidth) || AutoMovieConstructionWidths.traced(node.hostWidth)) {
      const r: AutoMovieSolidIntersection.IResult = AutoMovieSolidIntersection.trace({ part: partSurface, host: atlas, seed, parameter, count: node.count, tolerance, grazing: node.grazing });
      if (r.curve === null) {
        absorb(node.name, r.diagnostics);
        return restore(body, state, snapshot);
      }
      traced = { curve: r.curve, part: partSurface, host: atlas, diff: node.kind === "diff" };
    }
    const width: AutoMovieSolidJoin.IInput["width"] | string = AutoMovieConstructionWidths.create(node.partWidth, node.hostWidth, parameter.kind === "phase", traced);
    if (typeof width === "string") return fail("width", width);
    if (node.kind === "diff") body.faces[partIndex]!.inverted = true;
    const merged: AutoMovieSolidBody.IMerged = AutoMovieSolidBody.merge(body, {
      name: node.name,
      kind: node.kind,
      part: partIndex,
      join: { seed, parameter, count: node.count, tolerance, grazing: node.grazing, width },
      count: node.count,
      rows: node.rows,
    });
    absorb(node.name, merged.diagnostics);
    if (merged.blend === null || merged.join === null) return restore(body, state, snapshot);
    const blendFace: number = body.faces.length - 1;
    state.faces.set(node.name, blendFace);
    state.blendSurfaces.push(body.faces[blendFace]!.surface);
    state.joins.push({ join: merged.join, blend: merged.blend });
  };

  const continuation = (node: IAutoMovieConstructionContinuation): void => {
    walk(node.host);
    const hostIndex: number | undefined = state.faces.get(node.hostFace);
    const hostChain: IAutoMovieLoftChain | undefined = state.chains.get(node.hostFace);
    if (hostIndex === undefined || hostChain === undefined) return report(node.name, "host face", `the host face ${node.hostFace} was not realized`);
    const cut: AutoMovieSolidCycle.ICycle["kind"] = node.hostEnd === "bottom" ? "start" : "end";
    if (body.faces[hostIndex]!.cycles.some((c: AutoMovieSolidCycle.ICycle): boolean => c.kind === cut))
      return report(node.name, "shared end", `the host face's ${node.hostEnd} end is already cut away by a join or a trim`);
    const snapshot: ISnapshot = snap(body, state);
    const override: IOverride = {
      apply: (chain: IAutoMovieLoftChain): IAutoMovieLoftChain | string => AutoMovieConstructionContinuation.apply(hostChain, node.hostEnd, chain, node.partEnd),
      applied: false,
      error: null,
    };
    state.overrides.set(node.partFace, override);
    walk(node.part);
    state.overrides.delete(node.partFace);
    const partIndex: number | undefined = state.faces.get(node.partFace);
    if (!override.applied || partIndex === undefined) {
      report(node.name, "shared end", override.error ?? `the part face ${node.partFace} was not realized`);
      return restore(body, state, snapshot);
    }
    const partChain: IAutoMovieLoftChain = state.chains.get(node.partFace)!;
    ring(body, {
      host: hostIndex,
      hostStation: node.hostEnd === "bottom" ? hostChain.layers[0]!.y : hostChain.layers[hostChain.layers.length - 1]!.y,
      hostKind: cut,
      part: partIndex,
      partStation: node.partEnd === "bottom" ? partChain.layers[0]!.y : partChain.layers[partChain.layers.length - 1]!.y,
      partKind: node.partEnd === "bottom" ? "start" : "end",
      count: hostChain.samples,
      sign: AutoMovieConstructionContinuation.sign(node.hostEnd, node.partEnd),
    });
  };

  const trim = (node: IAutoMovieConstructionTrim): void => {
    walk(node.host);
    const index: number | undefined = state.faces.get(node.face);
    if (index === undefined) return report(node.name, "trim face", `the face ${node.face} was not realized`);
    const surface: IAutoMovieSolidSurface = body.faces[index]!.surface;
    const result: AutoMovieSolidTrim.IResult = AutoMovieSolidTrim.create(
      surface,
      node.landmarks.map(AutoMovieConstructionViews.point),
      node.guesses.map((g: [number, number]): [number, number] => [g[0] * S, g[1]]),
      chord / 1000,
    );
    absorb(node.name, result.diagnostics);
    if (result.trim === null) return;
    const t: AutoMovieSolidTrim.ITrim = result.trim;
    const count: number = AutoMovieSolidTrim.DENSITY * node.landmarks.length;
    const owner: number = AutoMovieSolidMesh.owner(body.mesh, surface);
    const chart: [number, number][] = Array.from({ length: count }, (_: unknown, m: number): [number, number] => {
      const at: [number, number, number, number] = t.at((2 * Math.PI * m) / count);
      return [at[0], at[1]];
    });
    const vertices: number[] = chart.map((c: [number, number]): number => AutoMovieSolidMesh.vertex(body.mesh, surface.jet(c[0], c[1]).p, owner, c[0], c[1]));
    body.faces[index]!.cycles.push({
      kind: "hole",
      vertices,
      chart,
      neighbours: chart.map((c: [number, number], m: number): AutoMovieSolidCycle.INeighbour => ({ face: -1, from: c, to: chart[(m + 1) % count]! })),
    });
    state.trims.push(t);
  };

  const walk = (node: AutoMovieConstructionNode): void => {
    switch (node.type) {
      case "view":
        return view(node);
      case "join":
        return join(node);
      case "continue":
        return continuation(node);
      case "trim":
        return trim(node);
    }
  };

  walk(construction.root);
  const open: number[][][] = AutoMovieSolidBody.draw(body);
  close(body, state, open);
  const published: AutoMovieSolidBody.IPublished = AutoMovieSolidBody.publish(body);
  const vertices: number = body.mesh.positions.length / 3;
  return {
    name: construction.name,
    chains: state.chainList,
    surfaces: [...state.chainSurfaces, ...state.blendSurfaces],
    joins: state.joins,
    trims: state.trims,
    body: published,
    mesh: {
      positions: body.mesh.positions.map((x: number): number => x / S),
      indices: body.mesh.indices.slice(),
      coordinates: body.mesh.coordinates.slice(0, 3 * vertices),
      owners: body.mesh.owners.map((o: AutoMovieSolidMesh.IOwner): string => o.name),
    },
    diagnostics: state.diagnostics,
  };
}

/** What the walk builds besides the body. */
interface IState {
  /** Each realized face's index in the body, by its view part's or join's name. */
  faces: Map<string, number>;

  /** Each realized view part's chain, by name. */
  chains: Map<string, IAutoMovieLoftChain>;

  /** The view parts' chains, in walk order. */
  chainList: IAutoMovieLoftChain[];

  /** The view parts' surfaces, in walk order. */
  chainSurfaces: IAutoMovieSolidSurface[];

  /** The blends' surfaces, in walk order. */
  blendSurfaces: IAutoMovieSolidSurface[];

  /** The kept joins. */
  joins: AutoMovieConstructionRealization.IJoin[];

  /** The kept trims. */
  trims: AutoMovieSolidTrim.ITrim[];

  /** Every broken premise. */
  diagnostics: IAutoMovieConstructionDiagnostic[];

  /** Pending end-layer replacements of continuations, by the part face's name. */
  overrides: Map<string, IOverride>;
}

/** A continuation's pending end layer. */
interface IOverride {
  /** The part chain with its end layer replaced, or the premise the pair breaks. */
  apply(chain: IAutoMovieLoftChain): IAutoMovieLoftChain | string;

  /** Whether the part face took it. */
  applied: boolean;

  /** The premise it broke, or null. */
  error: string | null;
}

/** The body and the walk's lists before a part was built, to leave the part out again. */
interface ISnapshot {
  faces: number;
  cycles: AutoMovieSolidCycle.ICycle[][];
  inverted: (boolean | undefined)[];
  positions: number;
  coordinates: number;
  indices: number;
  owners: number;
  blends: number;
  names: Set<string>;
  chainList: number;
  chainSurfaces: number;
  blendSurfaces: number;
  joins: number;
  trims: number;
}

/** A copy of the body's state that a later rollback restores. */
function snap(body: AutoMovieSolidBody.IBody, state: IState): ISnapshot {
  return {
    faces: body.faces.length,
    cycles: body.faces.map((f: AutoMovieSolidBody.IFace): AutoMovieSolidCycle.ICycle[] => f.cycles.map(copy)),
    inverted: body.faces.map((f: AutoMovieSolidBody.IFace): boolean | undefined => f.inverted),
    positions: body.mesh.positions.length,
    coordinates: body.mesh.coordinates.length,
    indices: body.mesh.indices.length,
    owners: body.mesh.owners.length,
    blends: body.blends.length,
    names: new Set(state.faces.keys()),
    chainList: state.chainList.length,
    chainSurfaces: state.chainSurfaces.length,
    blendSurfaces: state.blendSurfaces.length,
    joins: state.joins.length,
    trims: state.trims.length,
  };
}

/** Restore the body and the lists to a snapshot. */
function restore(body: AutoMovieSolidBody.IBody, state: IState, s: ISnapshot): void {
  body.faces.length = s.faces;
  body.faces.forEach((f: AutoMovieSolidBody.IFace, i: number): void => {
    f.cycles = s.cycles[i]!;
    if (s.inverted[i] === undefined) delete f.inverted;
    else f.inverted = s.inverted[i];
  });
  body.mesh.positions.length = s.positions;
  body.mesh.coordinates.length = s.coordinates;
  body.mesh.indices.length = s.indices;
  body.mesh.owners.length = s.owners;
  body.blends.length = s.blends;
  for (const name of [...state.faces.keys()])
    if (!s.names.has(name)) {
      state.faces.delete(name);
      state.chains.delete(name);
    }
  state.chainList.length = s.chainList;
  state.chainSurfaces.length = s.chainSurfaces;
  state.blendSurfaces.length = s.blendSurfaces;
  state.joins.length = s.joins;
  state.trims.length = s.trims;
}

/** A deep copy of a cycle. */
function copy(c: AutoMovieSolidCycle.ICycle): AutoMovieSolidCycle.ICycle {
  return {
    kind: c.kind,
    vertices: c.vertices.slice(),
    chart: c.chart.map((p: [number, number]): [number, number] => [p[0], p[1]]),
    neighbours: c.neighbours.map((n: AutoMovieSolidCycle.INeighbour): AutoMovieSolidCycle.INeighbour => ({ face: n.face, from: [n.from[0], n.from[1]], to: [n.to[0], n.to[1]] })),
  };
}

/** The kernel's curve parameter, millimetres. */
function curveParameter(p: AutoMovieConstructionParameter): AutoMovieSolidIntersection.Parameter {
  switch (p.type) {
    case "phase":
      return { kind: "phase" };
    case "arc":
      return { kind: "arc" };
    case "angle":
      return {
        kind: "angle",
        centre: AutoMovieConstructionViews.point(p.centre),
        normal: AutoMovieConstructionViews.vector(p.normal),
        reference: AutoMovieConstructionViews.vector(p.reference),
      };
  }
}

/** A continuation's shared ring. */
interface IRing {
  host: number;
  hostStation: number;
  hostKind: "start" | "end";
  part: number;
  partStation: number;
  partKind: "start" | "end";
  count: number;
  sign: 1 | -1;
}

/**
 * The shared ring of a continuation: its vertices on the host face's end section at uniform host phases, a winding cycle of the host face there, and the same vertices as a winding cycle of the part face at the matching part phases (the host's phase, or its negative when the part's stations run against the host's).
 */
function ring(body: AutoMovieSolidBody.IBody, r: IRing): void {
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

/** Close every face's open end that its chain closes in a pole, by a fan to the pole. */
function close(body: AutoMovieSolidBody.IBody, state: IState, open: readonly number[][][]): void {
  const chainOf: Map<IAutoMovieSolidSurface, IAutoMovieLoftChain> = new Map(
    state.chainSurfaces.map((s: IAutoMovieSolidSurface, i: number): [IAutoMovieSolidSurface, IAutoMovieLoftChain] => [s, state.chainList[i]!]),
  );
  body.faces.forEach((f: AutoMovieSolidBody.IFace, i: number): void => {
    const chain: IAutoMovieLoftChain | undefined = chainOf.get(f.surface);
    if (chain === undefined) return;
    const first: number = chain.layers[0]!.y;
    const last: number = chain.layers[chain.layers.length - 1]!.y;
    const owner: number = AutoMovieSolidMesh.owner(body.mesh, f.surface);
    for (const cycle of open[i] ?? []) {
      if (cycle.length === 0) continue;
      const station: number = body.mesh.coordinates[3 * cycle[0]! + 1]!;
      const end: "bottom" | "top" = Math.abs(station - first) <= Math.abs(station - last) ? "bottom" : "top";
      const pole: IAutoMovieLoftChain["pole"] = chain.pole?.end === end ? chain.pole : chain.opposite?.end === end ? chain.opposite : undefined;
      if (pole === undefined) continue;
      const apex: number = AutoMovieSolidMesh.vertex(body.mesh, pole.point, owner, end === "bottom" ? first : last, 0);
      const fan: [number, number, number][] = cycle.map((v: number, k: number): [number, number, number] => [v, cycle[(k + 1) % cycle.length]!, apex]);
      AutoMovieSolidMesh.close(body.mesh, fan, f.surface, f.inverted === true);
    }
  });
}

/**
 * The admission: every node of the closed union, every name once, and every seed, continuation and trim naming a face of the right subtree.
 *
 * @throws When the tree breaks one, naming the node and the rule.
 */
function admit(root: AutoMovieConstructionNode): void {
  const seen: Set<string> = new Set();
  const check = (node: AutoMovieConstructionNode): { views: Set<string>; faces: Set<string> } => {
    const name: string = (node as { name?: unknown }).name as string;
    if (typeof name !== "string") throw new Error("realizeAutoMovieConstruction: a node has no name");
    if (seen.has(name)) throw new Error(`realizeAutoMovieConstruction: the name ${name} is used twice`);
    seen.add(name);
    const need = (set: Set<string>, face: string, what: string): void => {
      if (!set.has(face)) throw new Error(`realizeAutoMovieConstruction: ${name}'s ${what} ${face} is not a face of its subtree`);
    };
    switch (node.type) {
      case "view":
        return { views: new Set([name]), faces: new Set([name]) };
      case "join": {
        const host = check(node.host);
        const part = check(node.part);
        need(part.views, node.seed.partFace, "part face");
        need(host.faces, node.seed.hostFace, "host face");
        return { views: union(host.views, part.views), faces: union(union(host.faces, part.faces), new Set([name])) };
      }
      case "continue": {
        const host = check(node.host);
        const part = check(node.part);
        need(host.views, node.hostFace, "host face");
        need(part.views, node.partFace, "part face");
        return { views: union(host.views, part.views), faces: union(host.faces, part.faces) };
      }
      case "trim": {
        const host = check(node.host);
        need(host.faces, node.face, "face");
        return host;
      }
      default:
        throw new Error(`realizeAutoMovieConstruction: ${name} has the unknown type ${(node as { type?: unknown }).type as string}`);
    }
  };
  check(root);
}

/** The union of two name sets. */
function union(a: ReadonlySet<string>, b: ReadonlySet<string>): Set<string> {
  return new Set([...a, ...b]);
}
