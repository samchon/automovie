import {
  AutoMovieConstructionSkin,
  AutoMovieSolidBody,
  AutoMovieSolidChain,
  AutoMovieSolidMesh,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionState,
  IAutoMovieLoftChain,
  IAutoMovieSolidBody,
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";
import { nclose } from "../../internal/nclose";

/**
 * The engine cap consumer preserves an explicit endpoint failure.
 *
 * A two-pole analytic ellipsoid closes at both original poles. A bottom hole
 * refuses the bottom cap and preserves the top. A contradictory chart is
 * reported on its own face while an unrelated sibling still closes.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Uses public view realization, Body.draw and Skin.close and observes the resulting mesh and diagnostics.
 * @evidence contracts/development/testing.md#independent-expectations The original source declares two apex coordinates. A bottom-contact hole must prevent that cap while preserving the complete top.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares a full source, a partial endpoint and a malformed chart with a valid sibling.
 * @evidence contracts/development/testing.md#execution-ownership The test builds small analytic chains in process and needs no viewer or renderer.
 * @evidence contracts/development/common.md#meaningful-documentation Describes the analytic cases and which independent outcomes they exercise.
 */
export function test_construction_mesh_consumers(): void {
  const failures: string[] = [];
  const source: ReturnType<typeof realizeAutoMovieConstruction> =
    realizeAutoMovieConstruction(
      {
        name: "endpoint-consumers",
        root: ConstructionShapes.ellipsoid(
          "tube",
          ConstructionShapes.DOWN,
          0.001,
          0.001,
          0.002,
          9,
        ),
      },
      { chord: 0.0005, skin: false },
    );
  if (
    source.mesh !== null ||
    source.chains.length !== 1 ||
    source.diagnostics.length !== 0
  )
    failures.push(`source setup: ${JSON.stringify(source.diagnostics)}`);
  const chain: IAutoMovieLoftChain | undefined = source.chains[0];
  if (
    chain === undefined ||
    chain.pole === undefined ||
    chain.opposite === undefined
  )
    throw new Error(
      `Endpoint consumer fixture has no two-pole chain: ${failures.join(";")}`,
    );
  for (const cut of [false, true]) {
    try {
      inspect(failures, chain, cut);
    } catch (error) {
      failures.push(`${cut ? "partial" : "full"}: ${String(error)}`);
    }
  }
  namedRefusal(failures, chain);
  if (failures.length !== 0)
    throw new Error(`Actual mesh consumer findings:\n${failures.join("\n")}`);
}

/** Read the original chain through the engine cap consumer. */
function inspect(
  failures: string[],
  chain: IAutoMovieLoftChain,
  cut: boolean,
): void {
  const label: string = cut ? "partial" : "full";
  const surface: IAutoMovieSolidSurface | null =
    AutoMovieSolidChain.surface(chain);
  if (surface === null) {
    failures.push(`${label}: actual chain carries no surface jets`);
    return;
  }
  const first: number = chain.layers[0]!.y;
  const last: number = chain.layers[chain.layers.length - 1]!.y;
  const stations: number[] = chain.layers.map(
    (layer: IAutoMovieLoftChain.ILayer): number => layer.y,
  );
  const phases: number[] = Array.from(
    { length: chain.samples },
    (_: unknown, k: number): number => (2 * Math.PI * k) / chain.samples,
  );
  const body: IAutoMovieSolidBody.IBody = AutoMovieSolidBody.create(
    `consumer-${label}`,
    [{ surface, stations, phases }],
  );
  if (cut) {
    const chart: [number, number][] = [
      [first, -0.3],
      [first + (last - first) / 4, -0.3],
      [first + (last - first) / 4, 0.3],
      [first, 0.3],
    ];
    const owner: number = AutoMovieSolidMesh.owner(body.mesh, surface);
    const vertices: number[] = chart.map(([u, v]: [number, number]): number =>
      AutoMovieSolidMesh.vertex(body.mesh, surface.jet(u, v).p, owner, u, v),
    );
    body.faces[0]!.cycles.push({
      kind: "hole",
      vertices,
      chart,
      neighbours: [],
    });
  }
  const state: IAutoMovieConstructionState.IState = {
    faces: new Map([[chain.name, 0]]),
    chains: new Map([[chain.name, chain]]),
    chainList: [chain],
    chainSurfaces: [surface],
    blendSurfaces: [],
    joins: [],
    trims: [],
    diagnostics: [],
    overrides: new Map(),
  };
  const open: IAutoMovieSolidMesh.IOpen[][] = AutoMovieSolidBody.draw(
    body,
    (name: string, detail: string): void => {
      state.diagnostics.push({
        node: name,
        contract: "face triangulation",
        detail,
      });
    },
  );
  AutoMovieConstructionSkin.close(body, state, open);
  const generic: string[] = state.diagnostics.map(
    (diagnostic: { node: string; detail: string }): string =>
      `${diagnostic.node}: ${diagnostic.detail}`,
  );
  poles(failures, `${label}/generic`, body.mesh.positions, chain, cut);

  if (
    cut
      ? generic.length !== 1 ||
        !generic[0]!.includes("partial periodic endpoint")
      : generic.length !== 0
  )
    failures.push(
      `${label}: unexpected engine diagnostics ${JSON.stringify(generic)}`,
    );
}

/**
 * Count only source-declared apex coordinates; grid vertices are on regular
 * rings.
 */
function poles(
  failures: string[],
  label: string,
  positions: readonly number[],
  chain: IAutoMovieLoftChain,
  cut: boolean,
  refused: boolean = false,
): void {
  for (const pole of [chain.pole, chain.opposite]) {
    if (pole === undefined) {
      failures.push(`${label}: lost fixture pole`);
      continue;
    }
    let count: number = 0;
    for (let id: number = 0; id < positions.length / 3; id++)
      if (
        pole.point.every((value: number, k: number): boolean =>
          nclose(positions[3 * id + k]!, value, 1e-10),
        )
      )
        count++;
    const expected: number = refused || (cut && pole.end === "bottom") ? 0 : 1;
    if (count !== expected)
      failures.push(
        `${label}: ${pole.end} apex count ${count}, expected ${expected}`,
      );
  }
}

/** A named malformed-boundary refusal preserves an unrelated valid sibling. */
function namedRefusal(failures: string[], chain: IAutoMovieLoftChain): void {
  const siblingSource: ReturnType<typeof realizeAutoMovieConstruction> =
    realizeAutoMovieConstruction(
      {
        name: "sibling",
        root: ConstructionShapes.ellipsoid(
          "sibling",
          { ...ConstructionShapes.DOWN, origin: { x: 0.01, y: 0, z: 0 } },
          0.001,
          0.001,
          0.002,
          9,
        ),
      },
      { chord: 0.0005, skin: false },
    );
  const sibling: IAutoMovieLoftChain | undefined = siblingSource.chains[0];
  if (sibling === undefined || siblingSource.diagnostics.length !== 0) {
    failures.push("named refusal: sibling setup failed");
    return;
  }
  const chains: IAutoMovieLoftChain[] = [chain, sibling];
  const surfaces: (IAutoMovieSolidSurface | null)[] = chains.map(
    (value: IAutoMovieLoftChain): IAutoMovieSolidSurface | null =>
      AutoMovieSolidChain.surface(value),
  );
  if (surfaces[0] === null || surfaces[1] === null) {
    failures.push("named refusal: missing actual source surface");
    return;
  }
  const body: IAutoMovieSolidBody.IBody = AutoMovieSolidBody.create(
    "named-refusal",
    chains.map(
      (
        value: IAutoMovieLoftChain,
        index: number,
      ): IAutoMovieSolidBody.IFaceInput => ({
        surface: surfaces[index]!,
        stations: value.layers.map(
          (layer: IAutoMovieLoftChain.ILayer): number => layer.y,
        ),
        phases: Array.from(
          { length: value.samples },
          (_: unknown, k: number): number => (2 * Math.PI * k) / value.samples,
        ),
      }),
    ),
  );
  const first: number = chain.layers[0]!.y;
  const middle: number = (first + chain.layers[chain.layers.length - 1]!.y) / 2;
  const chart: [number, number][] = [
    [first, 1],
    [middle, 1],
    [middle, 1.3],
    [first, 1 + 4 * Number.EPSILON],
  ];
  const owner: number = AutoMovieSolidMesh.owner(body.mesh, surfaces[0]!);
  const ids: number[] = chart
    .slice(0, 3)
    .map(([u, v]: [number, number]): number =>
      AutoMovieSolidMesh.vertex(
        body.mesh,
        surfaces[0]!.jet(u, v).p,
        owner,
        u,
        v,
      ),
    );
  body.faces[0]!.cycles.push({
    kind: "hole",
    vertices: [...ids, ids[0]!],
    chart,
    neighbours: [],
  });
  const state: IAutoMovieConstructionState.IState = {
    faces: new Map(
      chains.map(
        (value: IAutoMovieLoftChain, index: number): [string, number] => [
          value.name,
          index,
        ],
      ),
    ),
    chains: new Map(
      chains.map(
        (value: IAutoMovieLoftChain): [string, IAutoMovieLoftChain] => [
          value.name,
          value,
        ],
      ),
    ),
    chainList: chains,
    chainSurfaces: [surfaces[0]!, surfaces[1]!],
    blendSurfaces: [],
    joins: [],
    trims: [],
    diagnostics: [],
    overrides: new Map(),
  };
  const open: IAutoMovieSolidMesh.IOpen[][] = AutoMovieSolidBody.draw(
    body,
    (node: string, detail: string): void => {
      state.diagnostics.push({ node, contract: "face triangulation", detail });
    },
  );
  AutoMovieConstructionSkin.close(body, state, open);
  poles(
    failures,
    "named/generic/refused",
    body.mesh.positions,
    chain,
    false,
    true,
  );
  poles(failures, "named/generic/sibling", body.mesh.positions, sibling, false);
  const generic: { node: string; detail: string } | undefined =
    state.diagnostics[0];
  if (
    state.diagnostics.length !== 1 ||
    generic === undefined ||
    !generic.detail.includes("inconsistent face charts")
  )
    failures.push(
      `named refusal diagnostic/sibling mismatch: ${JSON.stringify(state.diagnostics)}`,
    );
}
