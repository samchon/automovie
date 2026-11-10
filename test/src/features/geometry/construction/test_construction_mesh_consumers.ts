import {
  AutoMovieConstructionSkin,
  type AutoMovieConstructionState,
  AutoMovieLoftChain,
  type AutoMovieLoftContract,
  AutoMovieSolidBody,
  AutoMovieSolidChain,
  AutoMovieSolidMesh,
  type IAutoMovieLoftChain,
  type IAutoMovieSolidSurface,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import {
  AutoMovieHumanBodySurfaceSolids,
  AutoMovieHumanLoftMesh,
  type IAutoMovieHumanBodyCalibration,
  type IAutoMovieHumanSurfaceContext,
} from "@automovie/human";

import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";
import { nclose } from "../../internal/nclose";

/**
 * The generic and Human skin consumers preserve the same explicit endpoint failure.
 *
 * Scenarios:
 * 1. A public skin:false analytic ellipsoid supplies one real source chain,
 *    without a generated person, private coefficient fit or surface replacement.
 * 2. Body.draw -> ConstructionSkin.close and Human BodySurfaceSolids.draw both
 *    close the full source at its two declared poles.
 * 3. The same published hole touches the bottom sampling end. Both consumers
 *    record the same named partial-periodic failure and cap only the complete
 *    top; the failed bottom arc is never converted to a pole fan.
 * 4. A contradictory shared-ID chart refuses one face; both actual consumers
 *    preserve the unrelated valid sibling and report the same named cause.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Uses actual public view realization, Body.draw/publication, generic Skin.close and Human BodySurfaceSolids.draw, then observes their output mesh and diagnostics through normal context data.
 * @evidence contracts/development/testing.md#independent-expectations A source closed at both ends has two declared pole points. A bottom-contact hole leaves the top intact and prevents a complete bottom ring; exactly one top apex and no bottom apex must therefore be emitted. The two actual reporting adapters must retain the same provider detail, with Human producer body.solids/level7.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares full versus partial endpoint sources through both actual cap consumers, explicit published boundary identity, null skin setup and all collected diagnostic/apex findings. Analytic triangle orientation and foreign charts are owned by the separate boundary/transaction specifications.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable synchronous CPU test through construction_mesh_consumers. It creates small authored chains in process, generates no Human person and starts no process, viewer, renderer or profile.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A public skin:false analytic ellipsoid supplies one real source chain,).
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
  ownedCapReplay(failures, chain);
  if (failures.length !== 0)
    throw new Error(`Actual mesh consumer findings:\n${failures.join("\n")}`);
}

/** Small chord demand distinguishes original cap sampling and true tip provenance from a principal-end fan. */
function ownedCapReplay(failures: string[], chain: IAutoMovieLoftChain): void {
  const surface: IAutoMovieSolidSurface | null =
    AutoMovieSolidChain.surface(chain);
  if (surface === null) {
    failures.push("Owned cap replay has no actual surface.");
    return;
  }
  const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create(
    "owned-cap-consumer",
    [
      {
        surface,
        stations: chain.layers.map(
          (layer: IAutoMovieLoftChain.ILayer): number => layer.y,
        ),
        phases: Array.from(
          { length: chain.samples },
          (_: unknown, index: number): number =>
            (2 * Math.PI * index) / chain.samples,
        ),
      },
    ],
  );
  const context: IAutoMovieHumanSurfaceContext = contextOf([chain]);
  context.tolerance = 0.0005;
  const diagnostics: AutoMovieLoftContract.IDiagnostic[] =
    AutoMovieHumanBodySurfaceSolids.draw(context, {
      stature: 4,
      chains: [chain],
      events: [],
      poles: [],
      apertures: [],
      eyes: [],
      bodies: [AutoMovieSolidBody.publish(body)],
    });
  if (diagnostics.length !== 0)
    failures.push(`Owned cap replay: ${JSON.stringify(diagnostics)}`);
  let interior: number = 0;
  for (
    let index: number = 0;
    index < context.mesh.positions.length;
    index += 3
  ) {
    const station: number = context.coordinates[index + 1]!;
    const phase: number = context.coordinates[index + 2]!;
    for (const pole of [chain.pole, chain.opposite]) {
      if (pole?.source === undefined) continue;
      if (
        pole.point.every((value: number, coordinate: number): boolean =>
          nclose(value, context.mesh.positions[index + coordinate]!, 1e-10),
        ) &&
        station !== pole.source.station
      )
        failures.push(
          "Human cap apex replays a principal-end station instead of its owned tip.",
        );
      if (
        station > Math.min(pole.source.station, pole.source.adjacent) &&
        station < Math.max(pole.source.station, pole.source.adjacent)
      ) {
        interior++;
        const expected: [number, number, number] = AutoMovieLoftChain.point(
          chain,
          station,
          phase,
        );
        if (
          expected.some(
            (value: number, coordinate: number): boolean =>
              !nclose(value, context.mesh.positions[index + coordinate]!, 1e-9),
          )
        )
          failures.push(
            "Human cap interior does not replay its actual original Point0.",
          );
      }
    }
  }
  if (interior === 0)
    failures.push(
      "Small-chord Human cap has no actual interior source samples.",
    );
}

/** One common published source is read by both normal production cap consumers. */
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
  const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create(
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
  const published: AutoMovieSolidBody.IPublished =
    AutoMovieSolidBody.publish(body);
  const state: AutoMovieConstructionState.IState = {
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
  const open: AutoMovieSolidMesh.IOpen[][] = AutoMovieSolidBody.draw(
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

  const context: IAutoMovieHumanSurfaceContext = contextOf([chain]);
  const calibration: IAutoMovieHumanBodyCalibration = {
    stature: 4,
    chains: [chain],
    events: [],
    poles: [],
    apertures: [],
    eyes: [],
    bodies: [published],
  };
  const diagnostics: AutoMovieLoftContract.IDiagnostic[] =
    AutoMovieHumanBodySurfaceSolids.draw(context, calibration);
  poles(failures, `${label}/Human`, context.mesh.positions, chain, cut);
  const human: string[] = diagnostics.map(
    (diagnostic: AutoMovieLoftContract.IDiagnostic): string =>
      diagnostic.detail,
  );
  if (cut) {
    if (
      generic.length !== 1 ||
      !generic[0]!.includes("partial periodic endpoint") ||
      human.length !== 1 ||
      human[0] !== generic[0] ||
      diagnostics[0]?.producer !== "body.solids" ||
      diagnostics[0]?.level !== 7 ||
      diagnostics[0]?.contract !== "face triangulation"
    )
      failures.push(
        `${label}: actual consumer diagnostic mismatch ${JSON.stringify({ generic, diagnostics })}`,
      );
  } else if (generic.length !== 0 || diagnostics.length !== 0)
    failures.push(
      `${label}: unexpected actual consumer diagnostics ${JSON.stringify({ generic, diagnostics })}`,
    );
}

/** Count only source-declared apex coordinates; grid vertices are on regular rings. */
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

/** Normal context data is prepared without replacing the Human consumer or its surface owner. */
function contextOf(
  chains: readonly IAutoMovieLoftChain[],
): IAutoMovieHumanSurfaceContext {
  return {
    mesh: AutoMovieHumanLoftMesh.create(),
    chains: new Map(
      chains.map(
        (chain: IAutoMovieLoftChain): [string, IAutoMovieLoftChain] => [
          chain.name,
          chain,
        ],
      ),
    ),
    events: [],
    poles: new Map(),
    boundaries: new Map(),
    tolerance: 0.5,
    apertures: [],
    details: [],
    indices: new Map(
      chains.map(
        (chain: IAutoMovieLoftChain, index: number): [string, number] => [
          chain.name,
          index,
        ],
      ),
    ),
    coordinates: [],
    roots: new Map(),
    ends: new Map(),
    holes: new Map(),
    rims: new Map(),
  };
}

/** A named malformed-boundary refusal preserves an unrelated valid sibling in both actual paths. */
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
  const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create(
    "named-refusal",
    chains.map(
      (
        value: IAutoMovieLoftChain,
        index: number,
      ): AutoMovieSolidBody.IFaceInput => ({
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
  const published: AutoMovieSolidBody.IPublished =
    AutoMovieSolidBody.publish(body);
  const state: AutoMovieConstructionState.IState = {
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
  const open: AutoMovieSolidMesh.IOpen[][] = AutoMovieSolidBody.draw(
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
  const context: IAutoMovieHumanSurfaceContext = contextOf(chains);
  const calibration: IAutoMovieHumanBodyCalibration = {
    stature: 4,
    chains,
    events: [],
    poles: [],
    apertures: [],
    eyes: [],
    bodies: [published],
  };
  const diagnostics: AutoMovieLoftContract.IDiagnostic[] =
    AutoMovieHumanBodySurfaceSolids.draw(context, calibration);
  poles(
    failures,
    "named/Human/refused",
    context.mesh.positions,
    chain,
    false,
    true,
  );
  poles(
    failures,
    "named/Human/sibling",
    context.mesh.positions,
    sibling,
    false,
  );
  const generic: { node: string; detail: string } | undefined =
    state.diagnostics[0];
  if (
    state.diagnostics.length !== 1 ||
    generic === undefined ||
    !generic.detail.includes("inconsistent face charts") ||
    diagnostics.length !== 1 ||
    diagnostics[0]!.detail !== `${generic.node}: ${generic.detail}` ||
    diagnostics[0]!.producer !== "body.solids" ||
    diagnostics[0]!.level !== 7 ||
    diagnostics[0]!.contract !== "face triangulation"
  )
    failures.push(
      `named refusal diagnostic/sibling mismatch: ${JSON.stringify({ generic: state.diagnostics, diagnostics })}`,
    );
}
