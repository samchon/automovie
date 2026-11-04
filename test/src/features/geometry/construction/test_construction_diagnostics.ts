import { type AutoMovieConstructionRealization, realizeAutoMovieConstruction } from "@automovie/engine";
import type {
  AutoMovieConstructionNode,
  IAutoMovieConstructionDiagnostic,
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionKnot,
  IAutoMovieConstructionView,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A construction refuses an inadmissible tree as a whole and records every
 * broken premise as its diagnostic on the node that broke it, the rest of
 * the solid realizing: one made bad tree per refusal and per contract, and a
 * clean tree with neither.
 *
 * Scenarios:
 * 1. A clean four-part assembly records no diagnostic.
 * 2. Each made tree with a broken premise records its contract on its node: an order of 10 (`order`), stations out of order (`stations`), an outline's knots out of order (`outline`), a pole without its zero knot (`pole knot`), a front edge crossing its opposite (`outline order`), a box not holding its axis (`half extent`), a girth past the box's rectangle (`girth in reach`), a shoulder of 1.2 (`shoulder`), a post that never meets its beam from a point seed (`one loop per contact`) and from a search seed (`seed`), two equal cylinders touching (`transversal contact`), a station width on a host (`width`), a continuation from a pole end (`shared end`), a trim of three landmarks (`margin landmarks`), a trim landmark a metre past its face's end (`landmark foot`).
 * 3. Each inadmissible tree throws instead of realizing: two parts of one name, a seed naming no face of its subtree, a chord of zero, a node of an unknown kind.
 *
 * @evidence contracts/testing.md#behavioral-verification Realizes each made tree with `realizeAutoMovieConstruction` and reads its diagnostics' `node` and `contract`, or catches its refusal. It catches a broken premise that throws instead of being recorded, one recorded on the wrong node or under the wrong contract, an inadmissible tree realized as if it were sound, and a clean tree that records something; any realization that refuses what its admission states and names every broken premise passes.
 * @evidence contracts/testing.md#independent-expectations Each contract and its trigger are the kernel's published list (its answers on the core move: the view loft's, the trace's, the join's, the continuation's, the trim's and the realization's own contracts, and its admission refusals) and the interface types' rules (`IAutoMovieConstructionView`, `IAutoMovieConstructionJoin`, `IAutoMovieConstructionContinuation`, `IAutoMovieConstructionTrim`, `AutoMovieConstructionPole`, `IAutoMovieConstructionStationWidth`). Oracle limit: a bad tree may record further contracts its first breach causes; the test requires its own contract on its own node, not that it is the only one.
 * @evidence contracts/testing.md#distinguishing-cases Positive: the clean assembly. Negative: one tree per contract and per refusal. Each node kind's realized geometry belongs to its own spec test.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_diagnostics`; it realizes made trees in process and starts no host, browser or GPU.
 */
export function test_construction_diagnostics(): void {
  const failures: string[] = [];
  const realize: (root: AutoMovieConstructionNode) => IAutoMovieConstructionDiagnostic[] = (root: AutoMovieConstructionNode): IAutoMovieConstructionDiagnostic[] => {
    const r: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "made", root }, { chord: 1e-4 });
    return r.diagnostics;
  };
  const named: (d: IAutoMovieConstructionDiagnostic[]) => string = (d: IAutoMovieConstructionDiagnostic[]): string =>
    d.map((x: IAutoMovieConstructionDiagnostic): string => `${x.node} ${x.contract}`).join("; ") || "nothing";

  // 1. A clean tree.
  const clean: IAutoMovieConstructionDiagnostic[] = realize(ConstructionShapes.assembly(1, "left"));
  if (clean.length !== 0) failures.push(`clean assembly: ${named(clean)}`);

  // 2. Broken premises, each recorded on its node.
  for (const [contract, node, tree] of broken()) {
    let found: IAutoMovieConstructionDiagnostic[];
    try {
      found = realize(tree);
    } catch (error) {
      failures.push(`${contract}: the realization threw (${(error as Error).message}) instead of recording it`);
      continue;
    }
    if (!found.some((d: IAutoMovieConstructionDiagnostic): boolean => d.contract === contract && d.node === node)) failures.push(`${contract}: not recorded on ${node} (recorded: ${named(found)})`);
  }

  // 3. Inadmissible trees, each refused.
  for (const [what, tree] of refused()) {
    let realized: string | null = null;
    try {
      realized = named(realize(tree));
    } catch {
      // Refused, as the admission states.
    }
    if (realized !== null) failures.push(`${what}: realized instead of refused (recorded: ${realized})`);
  }
  if (failures.length !== 0) throw new Error(`${failures.length} diagnostic failures:\n${failures.join("\n")}`);
}

/** Trees that break one premise each, with the contract and the node that must record it. */
function broken(): [string, string, AutoMovieConstructionNode][] {
  const tube: () => IAutoMovieConstructionView = (): IAutoMovieConstructionView => ConstructionShapes.cylinder("tube", ConstructionShapes.DOWN, 0.02, 0.1);
  const egg: () => IAutoMovieConstructionView = (): IAutoMovieConstructionView => ConstructionShapes.ellipsoid("egg", ConstructionShapes.DOWN, 0.03, 0.02, 0.05);
  const edit: (change: (t: IAutoMovieConstructionView) => void, base?: IAutoMovieConstructionView) => IAutoMovieConstructionView = (
    change: (t: IAutoMovieConstructionView) => void,
    base: IAutoMovieConstructionView = tube(),
  ): IAutoMovieConstructionView => {
    change(base);
    return base;
  };
  const knots: (value: number, site: string) => IAutoMovieConstructionKnot[] = (value: number, site: string): IAutoMovieConstructionKnot[] =>
    [0, 0.1].map((s: number, i: number): IAutoMovieConstructionKnot => ({ site: `${site} ${i}`, station: s, value }));
  const left: IAutoMovieConstructionJoin = ConstructionShapes.assembly(1, "left") as IAutoMovieConstructionJoin;
  left.hostWidth = { type: "station", value: 0.01 };
  return [
    ["order", "tube", edit((t: IAutoMovieConstructionView): void => void (t.order = 10))],
    ["stations", "tube", edit((t: IAutoMovieConstructionView): void => void ([t.stations[2], t.stations[3]] = [t.stations[3]!, t.stations[2]!]))],
    ["outline", "tube", edit((t: IAutoMovieConstructionView): void => void ([t.front.positive.knots[2], t.front.positive.knots[3]] = [t.front.positive.knots[3]!, t.front.positive.knots[2]!]))],
    ["pole knot", "egg", edit((t: IAutoMovieConstructionView): void => void (t.front.positive.knots[t.front.positive.knots.length - 1]!.value = 0.001), egg())],
    ["outline order", "tube", edit((t: IAutoMovieConstructionView): void => void (t.front.negative.knots[4]!.value = 0.03))],
    ["half extent", "tube", edit((t: IAutoMovieConstructionView): void => t.side.negative.knots.forEach((k: IAutoMovieConstructionKnot): void => void (k.value = 0.005)))],
    ["girth in reach", "tube", edit((t: IAutoMovieConstructionView): void => void (t.fullness = { type: "girth", girth: { knots: knots(0.2, "girth") }, departures: null }))],
    ["shoulder", "tube", edit((t: IAutoMovieConstructionView): void => void (t.fullness = { type: "shoulder", shoulder: { knots: knots(1.2, "shoulder") }, departures: null }))],
    ["one loop per contact", "blend.post", apart("point")],
    ["seed", "blend.post", apart("search")],
    ["transversal contact", "blend.even", even()],
    ["width", "blend.nail", left],
    ["shared end", "neck", { type: "continue", name: "neck", host: egg(), hostFace: "egg", hostEnd: "top", part: tube(), partFace: "tube", partEnd: "bottom" }],
    ["margin landmarks", "slot", slot(3, 0)],
    ["landmark foot", "slot", slot(8, 1)],
  ];
}

/** Trees the admission refuses, each with what is wrong. */
function refused(): [string, AutoMovieConstructionNode][] {
  const twice: IAutoMovieConstructionJoin = ConstructionShapes.assembly(1, "left") as IAutoMovieConstructionJoin;
  (twice.part as IAutoMovieConstructionView).name = "post";
  const nowhere: IAutoMovieConstructionJoin = ConstructionShapes.assembly(1, "left") as IAutoMovieConstructionJoin;
  nowhere.seed = { ...nowhere.seed, hostFace: "nothing" };
  const flat: IAutoMovieConstructionJoin = ConstructionShapes.assembly(1, "left") as IAutoMovieConstructionJoin;
  flat.partWidth = { type: "chord", value: 0 };
  return [
    ["two parts named post", twice],
    ["a seed naming no face", nowhere],
    ["a chord of zero", flat],
    ["a node of an unknown kind", { type: "group", name: "g" } as unknown as AutoMovieConstructionNode],
  ];
}

/** The assembly's beam and post with the post moved 0.2 m off the beam along `y`, seeded at a point or by a search. */
function apart(seed: "point" | "search"): AutoMovieConstructionNode {
  const beam: IAutoMovieConstructionView = ConstructionShapes.cylinder("beam", { origin: { x: -0.1, y: 0, z: 0 }, u: { x: 0, y: 0, z: 1 }, v: { x: 0, y: 1, z: 0 } }, 0.03, 0.2);
  const post: IAutoMovieConstructionView = ConstructionShapes.cylinder("post", { origin: { x: 0, y: 0.2, z: 0 }, u: { x: 0, y: 1, z: 0 }, v: { x: 1, y: 0, z: 0 } }, 0.015, 0.08);
  const join: IAutoMovieConstructionJoin = ConstructionShapes.join("merge", "blend.post", beam, post, { partFace: "post", hostFace: "beam", part: [0.031, Math.PI / 2], host: [0.115, 0.01] }, { part: { type: "chord", value: 0.005 }, host: { type: "chord", value: 0.005 } }) as IAutoMovieConstructionJoin;
  if (seed === "search") join.seed = { type: "search", partFace: "post", hostFace: "beam", phase: Math.PI / 2, from: 0, to: 1 };
  return join;
}

/** Two cylinders of equal radius 0.02 m crossing at right angles: their surfaces touch along lines, a tangential contact. */
function even(): AutoMovieConstructionNode {
  const beam: IAutoMovieConstructionView = ConstructionShapes.cylinder("beam", { origin: { x: -0.1, y: 0, z: 0 }, u: { x: 0, y: 0, z: 1 }, v: { x: 0, y: 1, z: 0 } }, 0.02, 0.2);
  const post: IAutoMovieConstructionView = ConstructionShapes.cylinder("post", { origin: { x: 0, y: 0, z: 0 }, u: { x: 0, y: 1, z: 0 }, v: { x: 1, y: 0, z: 0 } }, 0.02, 0.08);
  return ConstructionShapes.join("merge", "blend.even", beam, post, { partFace: "post", hostFace: "beam", part: [0.02, Math.PI / 2], host: [0.12, 0.01] }, { part: { type: "chord", value: 0.005 }, host: { type: "chord", value: 0.005 } });
}

/**
 * A slot trimmed in a 0.02 m cylinder from `count` landmarks round station
 * 0.05 m, phase 0, lifted 0.5 mm off it; the first landmark moved `offset`
 * metres along the cylinder (past the face's end when it is a metre).
 */
function slot(count: number, offset: number): AutoMovieConstructionNode {
  const angles: number[] = Array.from({ length: count }, (_: unknown, m: number): number => (2 * Math.PI * m) / count);
  return {
    type: "trim",
    name: "slot",
    host: ConstructionShapes.cylinder("tube", ConstructionShapes.DOWN, 0.02, 0.1),
    face: "tube",
    landmarks: angles.map((t: number, m: number): IAutoMovieVector3 => ({ x: 0.0205 * Math.cos(0.15 * Math.cos(t)), y: 0.0205 * Math.sin(0.15 * Math.cos(t)), z: -(0.05 + 0.01 * Math.sin(t) + (m === 0 ? offset : 0)) })),
    guesses: angles.map((t: number): [number, number] => [0.05 + 0.01 * Math.sin(t), 0.15 * Math.cos(t)]),
  };
}
