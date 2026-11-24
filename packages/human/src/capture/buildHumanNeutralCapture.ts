import {
  AutoMovieSolidChain,
  inspectAutoMovieMeshTopology,
  markAutoMovieConstructionCurves,
  measureAutoMovieMeshPieces,
  realizeAutoMovieConstruction,
  sampleAutoMovieConstructionCurves,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionRealization,
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanBodyLaw,
  IAutoMovieHumanBodySources,
  IAutoMovieHumanBodySurface,
  IAutoMovieHumanHeadComposer,
  IAutoMovieHumanHeadLane,
  IAutoMovieHumanParameters,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieLoftChain,
  IAutoMovieMark,
  IAutoMovieMesh,
  IAutoMovieMeshPiece,
  IAutoMovieMeshTopology,
  IAutoMovieSolidBody,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanBodySurface } from "../generation/AutoMovieHumanBodySurface";
import { AutoMovieHumanTrunkRows } from "../generation/AutoMovieHumanTrunkRows";
import { AutoMovieHumanHeadLane } from "../generation/head/AutoMovieHumanHeadLane";
import { AutoMovieHumanNeutralParameters } from "./AutoMovieHumanNeutralParameters";
import { buildHumanSurfaceCapture } from "./buildHumanSurfaceCapture";
import { inspectHumanNeutralArmscye } from "./inspectHumanNeutralArmscye";
import { inspectHumanNeutralTopology } from "./inspectHumanNeutralTopology";

/** Name of the synthetic neutral survey subject in the inspector. */
const SUBJECT: string = "ansur-male-neutral";

/** Evaluate the requested case through the actual body definition and skin. */
function evaluate(parameters: IAutoMovieHumanParameters): {
  calibration: IAutoMovieHumanBodyCalibration;
  mesh: IAutoMovieMesh;
  solidSurfaces: ReadonlyMap<string, IAutoMovieSolidSurface>;
  triangleGroups: IAutoMovieHumanBodySurface.IOutput["mesh"]["groups"];
  nailClipping?: IAutoMovieHumanBodySurface.IOutput["nailClipping"];
  topology: IAutoMovieMeshTopology;
  pieces: IAutoMovieMeshPiece[];
  diagnostics: string[];
  declaration: ReturnType<typeof inspectHumanNeutralTopology>;
  trianglesByOwner: { name: string; triangles: number }[];
  milliseconds: { calibration: number; skin: number; verification: number };
} {
  const start: number = performance.now();
  const definition: IAutoMovieHumanBodyLaw.IDefinition =
    AutoMovieHumanBodyLaw.define(parameters);
  const declaration: ReturnType<typeof inspectHumanNeutralTopology> =
    inspectHumanNeutralTopology(definition);
  const calibration: IAutoMovieHumanBodyCalibration =
    AutoMovieHumanBodyLaw.realize(definition).body;
  const calibrated: number = performance.now();
  let solidSurfaces: ReadonlyMap<string, IAutoMovieSolidSurface> = new Map();
  const surface: IAutoMovieHumanBodySurface.IOutput =
    AutoMovieHumanBodySurface.generate(calibration, [], (charts): void => {
      solidSurfaces = charts;
    });
  const skinned: number = performance.now();
  // Calibration and its skin use millimetres. The inspector uses metres.
  const mesh: IAutoMovieMesh = {
    positions: surface.mesh.positions.map((mm: number): number => mm / 1000),
    indices: surface.mesh.indices,
    normals: surface.normals,
    uvs: null,
    skin: null,
  };
  const topology: IAutoMovieMeshTopology = inspectAutoMovieMeshTopology(mesh);
  const pieces: IAutoMovieMeshPiece[] = measureAutoMovieMeshPieces(mesh);
  const trianglesByOwner: { name: string; triangles: number }[] =
    emittedTriangles(surface.mesh);
  const diagnostics: string[] = [
    ...declaration.diagnostics,
    ...(calibration.diagnostics ?? []).map(
      ({ producer, contract, detail }): string =>
        `${producer} (${contract}): ${detail}`,
    ),
  ];
  const drawn: Set<string> = new Set(trianglesByOwner.map(({ name }) => name));
  const absent: string[] = declaration.owners.filter(
    (name: string): boolean => !drawn.has(name),
  );
  if (absent.length !== 0)
    diagnostics.push(`skin has no triangles for ${absent.join(", ")}`);
  if (
    !topology.watertight ||
    topology.nonFinite !== 0 ||
    topology.volume <= 0 ||
    pieces.length !== 1 ||
    !pieces[0]!.manifold ||
    !pieces[0]!.consistentlyWound ||
    pieces[0]!.genus !== 0
  )
    diagnostics.push(
      `skin: ${topology.boundaryEdges} boundary edges, ${topology.nonManifoldEdges} non-manifold edges, ${topology.nonFinite} non-finite values, ${topology.volume} cubic metres, ${pieces.length} pieces, manifold=${pieces[0]?.manifold ?? false}, consistently wound=${pieces[0]?.consistentlyWound ?? false}, genus=${pieces[0]?.genus ?? "unavailable"}`,
    );
  return {
    calibration,
    mesh,
    solidSurfaces,
    triangleGroups: surface.mesh.groups,
    nailClipping: surface.nailClipping,
    topology,
    pieces,
    diagnostics,
    declaration,
    trianglesByOwner,
    milliseconds: {
      calibration: calibrated - start,
      skin: skinned - calibrated,
      verification: performance.now() - skinned,
    },
  };
}

/** Count nonempty emitted triangle ranges by construction owner. */
function emittedTriangles(
  mesh: IAutoMovieHumanBodySurface.IOutput["mesh"],
): { name: string; triangles: number }[] {
  const triangles: Map<string, number> = new Map();
  for (const [index, group] of mesh.groups.entries()) {
    const next: number = mesh.groups[index + 1]?.start ?? mesh.indices.length;
    const count: number = (next - group.start) / 3;
    if (count === 0) continue;
    const slash: number = group.name.lastIndexOf("/");
    const name: string = slash === -1 ? group.name : group.name.slice(0, slash);
    triangles.set(name, (triangles.get(name) ?? 0) + count);
  }
  return [...triangles].map(([name, count]) => ({ name, triangles: count }));
}

/** Build a capture figure after all of its construction and skin checks pass. */
export function buildHumanNeutralCapture(
  subject: string = SUBJECT,
): ReturnType<typeof buildHumanSurfaceCapture> {
  const { calibration, mesh, diagnostics, solidSurfaces } =
    buildHumanNeutralCapture.inspect();
  if (diagnostics.length !== 0)
    throw new Error(`${subject}\n${diagnostics.join("\n")}`);

  const chains: IAutoMovieLoftChain[] = [];
  const surfaces: IAutoMovieSolidSurface[] = [];
  for (const chain of calibration.chains) {
    const surface: IAutoMovieSolidSurface | null =
      solidSurfaces.get(chain.name) ?? AutoMovieSolidChain.surface(chain);
    if (surface === null) continue;
    chains.push(chain);
    surfaces.push(surface);
  }
  const marks: IAutoMovieMark[] = markAutoMovieConstructionCurves(
    sampleAutoMovieConstructionCurves({ chains, surfaces, diagnostics: [] }),
    subject,
  );
  return buildHumanSurfaceCapture(subject, "body", mesh, marks);
}

/** The same source and skin checks serve explicit neutral variation cases. */
export namespace buildHumanNeutralCapture {
  /** Inspect one case without creating a render scene. */
  export function inspect(
    parameters: IAutoMovieHumanParameters = AutoMovieHumanNeutralParameters,
  ): ReturnType<typeof evaluate> {
    return evaluate(parameters);
  }

  /** Dispatch the separately invoked neutral diagnostic command. */
  export function command(args: readonly string[]): void {
    if (args.includes("--sources")) inspectNeutralSources();
    else if (args.includes("--armscye-sources"))
      inspectHumanNeutralArmscye({
        useDatum: args.includes("--shoulder-datum"),
        chordDirection: args.includes("--chord-direction"),
        firstClearRing: args.includes("--first-clear-ring"),
        slices: args.includes("--level-slices"),
        slopeGrid: args.includes("--slope-grid"),
      });
    else if (args.includes("--head-skin")) inspectNeutralHead(true);
    else if (args.includes("--head")) inspectNeutralHead(false);
    else if (args.includes("--topology")) {
      const topology: ReturnType<typeof inspectHumanNeutralTopology> =
        inspectHumanNeutralTopology(
          AutoMovieHumanBodyLaw.define(AutoMovieHumanNeutralParameters),
        );
      console.log(JSON.stringify(topology));
      if (topology.diagnostics.length !== 0) process.exitCode = 1;
    } else inspectNeutralBody();
  }
}

/**
 * Inspect original admission independently when the complete body stops at one
 * source.
 */
function inspectNeutralSources(): void {
  const context: IAutoMovieHumanBodySources.IOriginal =
    AutoMovieHumanBodyLaw.prepareSources(AutoMovieHumanNeutralParameters);
  const observe: (name: string, read: () => unknown) => void = (
    name: string,
    read: () => unknown,
  ): void => {
    const start: number = performance.now();
    try {
      const result: unknown = read();
      console.log(
        JSON.stringify({
          name,
          milliseconds: performance.now() - start,
          result,
        }),
      );
    } catch (error) {
      console.log(
        JSON.stringify({
          name,
          milliseconds: performance.now() - start,
          error: String(error),
        }),
      );
    }
  };
  const describe = (source: IAutoMovieHumanSourceDefinition | null) =>
    source === null
      ? null
      : {
          part: source.part?.name ?? null,
          rootInterval: source.massConnection?.rootInterval,
          diagnostics: source.diagnostics,
        };
  observe("head", () => {
    const definition: IAutoMovieHumanHeadComposer.IDefinition = context
      .headSource()
      .originals();
    return {
      parts: [...definition.sources.keys()],
      diagnostics: definition.base.diagnostics,
      attachments: definition.attachments
        .filter(({ error }): boolean => error !== null)
        .map(({ name, parent, error }) => ({ name, parent, error })),
    };
  });
  observe("trunk", () => {
    const trunk: ReturnType<typeof AutoMovieHumanBodyLaw.trunkSource> =
      AutoMovieHumanBodyLaw.trunkSource(context);
    return {
      parts: trunk.sources.map(({ result }) => describe(result)),
      diagnostics: trunk.diagnostics,
    };
  });
  const limbs: ReturnType<typeof context.limbSources> = context.limbSources();
  for (const side of ["left", "right"] as const) {
    const arm: ReturnType<typeof limbs.arm> = limbs.arm(side);
    const leg: ReturnType<typeof limbs.leg> = limbs.leg(side);
    observe(`arm.${side}`, () => describe(arm.definition()));
    for (const name of arm.digitNames)
      observe(name, () => describe(arm.digit(name)?.definition ?? null));
    observe(`leg.${side}`, () => describe(leg.leg.current()));
    observe(`foot.${side}`, () => describe(leg.definition()));
    observe(`toes.${side}`, () =>
      leg.toes().map(({ definition }) => describe(definition)),
    );
  }
}

/** Print the observed skin and all reported whole-route refusals. */
function inspectNeutralBody(): void {
  const start: number = performance.now();
  try {
    const {
      calibration,
      topology,
      pieces,
      diagnostics,
      declaration,
      trianglesByOwner,
      milliseconds,
    } = buildHumanNeutralCapture.inspect();
    console.log({
      milliseconds,
      chains: calibration.chains.map(({ name }): string => name),
      trianglesByOwner,
      declaration,
      diagnostics,
      topology,
      pieces,
    });
    if (diagnostics.length !== 0) process.exitCode = 1;
  } catch (error) {
    console.error({ milliseconds: performance.now() - start, error });
    process.exitCode = 1;
  }
}

/** Run the actual neutral head subtree, with optional regional triangulation. */
function inspectNeutralHead(skin: boolean): void {
  const start: number = performance.now();
  const context: IAutoMovieHumanBodySources.IOriginal =
    AutoMovieHumanBodyLaw.prepareSources(AutoMovieHumanNeutralParameters);
  const head: IAutoMovieHumanHeadLane.IOutput = AutoMovieHumanHeadLane.create(
    context.headInputs,
    AutoMovieHumanBodyAnatomy.sexOf(AutoMovieHumanNeutralParameters),
    context.common().neckSource,
    context.headSource(),
  );
  const authored: number = performance.now();
  const construction = { name: SUBJECT + ".head", root: head.root };
  const options = {
    sources: head.source.sources,
    loopSources: head.loopSources,
    chord: AutoMovieHumanTrunkRows.MAX_GAP / 1000,
  };
  const result = skin
    ? realizeAutoMovieConstruction(construction, options)
    : realizeAutoMovieConstruction(construction, { ...options, skin: false });
  const mesh: IAutoMovieConstructionRealization.IMesh | null = result.mesh;
  console.log(
    JSON.stringify({
      name: SUBJECT + ".head",
      authoredMilliseconds: authored - start,
      realizedMilliseconds: performance.now() - authored,
      joins: result.joins.map(({ name }) => name),
      ...(mesh !== null
        ? {
            vertices: mesh.positions.length / 3,
            triangles: mesh.indices.length / 3,
            failedFaceCycles: inspectFailedFaceCycles(result),
          }
        : {}),
      diagnostics: result.diagnostics,
    }),
  );
  if (result.diagnostics.length !== 0 || (skin && mesh === null))
    process.exitCode = 1;
}

/** Read failed cycles with their exact shared-edge incident faces. */
function inspectFailedFaceCycles(
  result:
    | IAutoMovieConstructionRealization.IRealization
    | IAutoMovieConstructionRealization.IWithoutSkin,
): {
  chain: string;
  cycles: {
    kind: IAutoMovieSolidBody.IPublished["faces"][number]["cycles"][number]["kind"];
    chart: [number, number][];
    incident: string[][];
  }[];
}[] {
  const failed: Set<string> = new Set(
    result.diagnostics
      .filter(({ contract }): boolean => contract === "face triangulation")
      .map(({ node }): string => node),
  );
  if (failed.size === 0) return [];

  /** An undirected edge's key is its two immutable published IDs. */
  const edge = (a: number, b: number): string =>
    a < b ? `${a}:${b}` : `${b}:${a}`;
  const incidence: Map<string, string[]> = new Map();
  for (const face of result.body.faces)
    for (const cycle of face.cycles)
      for (const [i, a] of cycle.points.entries()) {
        const key: string = edge(
          a,
          cycle.points[(i + 1) % cycle.points.length]!,
        );
        const owners: string[] | undefined = incidence.get(key);
        if (owners === undefined) incidence.set(key, [face.chain]);
        else owners.push(face.chain);
      }
  return result.body.faces
    .filter(({ chain }): boolean => failed.has(chain))
    .map(({ chain, cycles }) => ({
      chain,
      cycles: cycles.map(({ kind, chart, points }) => ({
        kind,
        chart,
        incident: points.map(
          (point: number, i: number): string[] =>
            incidence.get(edge(point, points[(i + 1) % points.length]!))!,
        ),
      })),
    }));
}
