import type {
  AutoMovieConstructionNode,
  IAutoMovieConstruction,
  IAutoMovieConstructionContinuation,
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionTrim,
  IAutoMovieConstructionView,
} from "@automovie/interface";

import { AutoMovieConstructionAdmission } from "./AutoMovieConstructionAdmission";
import { AutoMovieConstructionContinuation } from "./AutoMovieConstructionContinuation";
import type { AutoMovieConstructionRealization } from "./AutoMovieConstructionRealization";
import { AutoMovieConstructionRing } from "./AutoMovieConstructionRing";
import { AutoMovieConstructionSeeds } from "./AutoMovieConstructionSeeds";
import { AutoMovieConstructionSkin } from "./AutoMovieConstructionSkin";
import { AutoMovieConstructionState } from "./AutoMovieConstructionState";
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
  AutoMovieConstructionAdmission.admit(construction.root);
  const S: number = AutoMovieConstructionViews.SCALE;
  const chord: number = props.chord * S;
  const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create(construction.name, []);
  const state: AutoMovieConstructionState.IState = {
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
    const override: AutoMovieConstructionState.IOverride | undefined = state.overrides.get(node.name);
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
    const snapshot: AutoMovieConstructionState.ISnapshot = AutoMovieConstructionState.snap(body, state);
    walk(node.part);
    const fail = (contract: string, detail: string): void => {
      report(node.name, contract, detail);
      AutoMovieConstructionState.restore(body, state, snapshot);
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
    const parameter: AutoMovieSolidIntersection.Parameter = AutoMovieConstructionViews.parameter(node.parameter);
    let traced: AutoMovieConstructionWidths.ITraced | null = null;
    if (AutoMovieConstructionWidths.traced(node.partWidth) || AutoMovieConstructionWidths.traced(node.hostWidth)) {
      const r: AutoMovieSolidIntersection.IResult = AutoMovieSolidIntersection.trace({ part: partSurface, host: atlas, seed, parameter, count: node.count, tolerance, grazing: node.grazing });
      if (r.curve === null) {
        absorb(node.name, r.diagnostics);
        return AutoMovieConstructionState.restore(body, state, snapshot);
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
      join: { seed, parameter, count: node.count, tolerance, grazing: node.grazing, width, ...(traced === null ? {} : { curve: traced.curve }) },
      count: node.count,
      rows: node.rows,
    });
    absorb(node.name, merged.diagnostics);
    if (merged.blend === null || merged.join === null) return AutoMovieConstructionState.restore(body, state, snapshot);
    const blendFace: number = body.faces.length - 1;
    state.faces.set(node.name, blendFace);
    state.blendSurfaces.push(body.faces[blendFace]!.surface);
    state.joins.push({ name: node.name, hostFace: node.seed.hostFace, partFace: node.seed.partFace, join: merged.join, blend: merged.blend });
  };

  const continuation = (node: IAutoMovieConstructionContinuation): void => {
    walk(node.host);
    const hostIndex: number | undefined = state.faces.get(node.hostFace);
    const hostChain: IAutoMovieLoftChain | undefined = state.chains.get(node.hostFace);
    if (hostIndex === undefined || hostChain === undefined) return report(node.name, "host face", `the host face ${node.hostFace} was not realized`);
    const cut: AutoMovieSolidCycle.ICycle["kind"] = node.hostEnd === "bottom" ? "start" : "end";
    if (body.faces[hostIndex]!.cycles.some((c: AutoMovieSolidCycle.ICycle): boolean => c.kind === cut))
      return report(node.name, "shared end", `the host face's ${node.hostEnd} end is already cut away by a join or a trim`);
    const snapshot: AutoMovieConstructionState.ISnapshot = AutoMovieConstructionState.snap(body, state);
    const override: AutoMovieConstructionState.IOverride = {
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
      return AutoMovieConstructionState.restore(body, state, snapshot);
    }
    const partChain: IAutoMovieLoftChain = state.chains.get(node.partFace)!;
    AutoMovieConstructionRing.create(body, {
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
  AutoMovieConstructionSkin.close(body, state, open);
  const published: AutoMovieSolidBody.IPublished = AutoMovieSolidBody.publish(body);
  return {
    name: construction.name,
    chains: state.chainList,
    surfaces: [...state.chainSurfaces, ...state.blendSurfaces],
    joins: state.joins,
    trims: state.trims,
    body: published,
    mesh: AutoMovieConstructionSkin.mesh(body),
    diagnostics: state.diagnostics,
  };
}
