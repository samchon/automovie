import {
  AutoMovieLoftChain,
  AutoMovieSolidVector as V,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import {
  AutoMovieHumanBodyLaw,
  AutoMovieHumanConicLoft,
} from "@automovie/human";
import { AutoMovieHumanF1 as Figure } from "@automovie/human/capture";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionSplit,
  IAutoMovieLoftChain,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";
import { f1 } from "@automovie/motions/executable/internal";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes } from "./render/NodeCanvasTypes";

type Row = { station: number; points: P3[] };
type Section = { y: number; z: number };

/** Read plantar transverse sections and the carried sagittal line. */
async function main(output: string): Promise<void> {
  const start = performance.now();
  const posed = Figure.assemble();
  const scope = Figure.sourceScope(posed, "leg");
  const { family } = scope;
  const loft = AutoMovieHumanConicLoft.create(family, family.knots);
  if (loft.chain === null) throw new Error(JSON.stringify(loft.diagnostics));
  const pternion = posed.point("pternion");
  const up: P3 = [0, 1, 0];
  const ball = V.scale(
    V.add(posed.point("bigtoe1"), posed.point("littletoe1")),
    0.5,
  );
  const travel = V.sub(ball, pternion);
  const forward = V.unit(V.sub(travel, V.scale(up, V.dot(travel, up))))!;
  const lateral = V.cross(forward, up);
  const anterior = (p: P3): number => V.dot(V.sub(p, pternion), forward);
  const footLength = Math.max(
    ...["bigtoe", "indextoe", "middletoe", "ringtoe", "littletoe"].map((name) =>
      anterior(posed.point(name + "Pad")),
    ),
  );
  const terminal = loft.chain.layers.at(-1)!.y;
  const begin = Math.max(loft.chain.layers[0]!.y, terminal - footLength);
  const count = loft.chain.samples;
  const phases = Array.from(
    { length: count },
    (_, i) => (2 * Math.PI * i) / count,
  );
  const grid = (pitch: number): Row[] =>
    Array.from(
      { length: Math.ceil((terminal - begin) / pitch) + 1 },
      (_, i) => {
        const station = Math.min(terminal, begin + i * pitch);
        const at = AutoMovieLoftChain.sampler(loft.chain!, station);
        return { station, points: phases.map(at) };
      },
    );
  const fine = grid(0.5);
  const coarse = fine.filter((_, i) => i % 2 === 0 || i === fine.length - 1);
  const floor = Math.min(
    ...fine.map(({ points }) => Math.min(...points.map((p) => p[1]))),
  );
  const medial = (p: P3): Section => ({
    y: p[1] - floor,
    z: -V.dot(V.sub(p, pternion), lateral),
  });
  const slices = (rows: Row[]) =>
    Array.from({ length: Math.ceil(footLength / 3) + 1 }, (_, i) => {
      const x = Math.min((2 * footLength) / 3, footLength / 3 + i);
      const points = section(rows, x, anterior, medial);
      return { x, ...plantar(points) };
    });
  const withRelief = sagittal(loft.chain, fine);
  const wall = AutoMovieHumanConicLoft.create(
    {
      ...family,
      reliefs: family.reliefs?.filter((r) => r.name !== "leg.hollow.2"),
    },
    family.knots,
  );
  if (wall.chain === null) throw new Error(JSON.stringify(wall.diagnostics));
  await writeFile(
    output,
    JSON.stringify(
      {
        footLength,
        longitudinalAxis: forward,
        floor,
        units: "mm",
        armaturePose: "authored standing reference",
        distalDatum: "farthest held named toe pad",
        arch: { coarse: slices(coarse), fine: slices(fine) },
        sagittal: {
          withRelief,
          withoutAnkleRelief: sagittal(wall.chain, fine),
        },
        milliseconds: performance.now() - start,
      },
      null,
      2,
    ),
  );
}

/** Interpolate only the crossed cell of each prepared source phase. */
function section(
  rows: Row[],
  x: number,
  anterior: (p: P3) => number,
  medial: (p: P3) => Section,
): Section[] {
  return rows[0]!.points.flatMap((_, phase) => {
    for (let i = 1; i < rows.length; i += 1) {
      const a = rows[i - 1]!.points[phase]!;
      const b = rows[i]!.points[phase]!;
      const p = anterior(a);
      const q = anterior(b);
      if (x < p || x > q || q === p) continue;
      return [medial(V.add(a, V.scale(V.sub(b, a), (x - p) / (q - p))))];
    }
    return [];
  });
}

/** Apply the clinical 60-degree plantar cutoff from the same lower section. */
function plantar(points: Section[]) {
  if (points.length === 0) return {};
  const width =
    Math.max(...points.map((p) => p.z)) - Math.min(...points.map((p) => p.z));
  const first = points.reduce(
    (best, p, i) => (p.y < points[best]!.y ? i : best),
    0,
  );
  const sense =
    points[(first + 1) % points.length]!.z > points[first]!.z ? 1 : -1;
  let last = points[first]!;
  for (let i = 1; i < points.length; i += 1) {
    const next = points[(first + sense * i + points.length) % points.length]!;
    const rise = next.y - last.y;
    const run = next.z - last.z;
    if (!(run > 0) || rise > Math.sqrt(3) * run) break;
    last = next;
  }
  return {
    width,
    height: last.y,
    depth: last.z - points[first]!.z,
    total: points.length,
  };
}

/** Follow the carried phase-zero sagittal guide in its world x/y projection. */
function sagittal(chain: IAutoMovieLoftChain, stations: Row[]) {
  const points = stations.map(({ station }) =>
    AutoMovieLoftChain.sampler(chain, station)(0),
  );
  return points.slice(1, -1).map((p, i) => {
    const a = V.sub(p, points[i]!);
    const b = V.sub(points[i + 2]!, p);
    const length = (Math.hypot(a[0], a[1]) + Math.hypot(b[0], b[1])) / 2;
    const turn = Math.atan2(
      a[0] * b[1] - a[1] * b[0],
      a[0] * b[0] + a[1] * b[1],
    );
    return { station: stations[i + 1]!.station, p, turnPerMm: turn / length };
  });
}

/** Locate the existing operator in the complete standing declaration. */
function foot(
  node: IAutoMovieConstructionNode,
  name: string,
): IAutoMovieConstructionSplit | undefined {
  if (node.type === "split" && node.name === name) return node;
  if ("host" in node) {
    const host = foot(node.host, name);
    if (host !== undefined) return host;
  }
  if ("part" in node) return foot(node.part, name);
  if (node.type === "split")
    for (const child of node.children) {
      const result = foot(child.part, name);
      if (result !== undefined) return result;
    }
  return undefined;
}

/** Observe the original proximal opening and both orientations of each toe. */
function incidence(
  root: IAutoMovieConstructionSplit,
  mesh: ReturnType<typeof realizeAutoMovieConstruction>["mesh"],
  clipX: number,
) {
  if (mesh === null) throw new Error("The native foot emitted no skin");
  const { indices, positions, coordinates, owners } = mesh;
  const vertexCount = positions.length / 3;
  const edgeUse = new Map<number, number>();
  const toe = root.children.map(({ partFace }) => ({
    owner: partFace,
    id: owners.indexOf(partFace),
    beyondClip: { outward: 0, inward: 0 },
    farthestX: -Infinity,
  }));
  const worldX = (vertex: number) => positions[vertex * 3]!;
  const owner = (vertex: number) => coordinates[vertex * 3]!;
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i]!;
    const b = indices[i + 1]!;
    const c = indices[i + 2]!;
    for (const [from, to] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const) {
      const key = Math.min(from, to) * vertexCount + Math.max(from, to);
      edgeUse.set(key, (edgeUse.get(key) ?? 0) + 1);
    }
    const pad = toe.find(({ id }) => id === owner(a));
    if (pad === undefined || owner(b) !== pad.id || owner(c) !== pad.id)
      continue;
    pad.farthestX = Math.max(pad.farthestX, worldX(a), worldX(b), worldX(c));
    if (Math.min(worldX(a), worldX(b), worldX(c)) <= clipX) continue;
    const dy = positions[b * 3 + 1]! - positions[a * 3 + 1]!;
    const dz = positions[b * 3 + 2]! - positions[a * 3 + 2]!;
    const ey = positions[c * 3 + 1]! - positions[a * 3 + 1]!;
    const ez = positions[c * 3 + 2]! - positions[a * 3 + 2]!;
    const facing = dy * ez - dz * ey;
    if (facing > 0) pad.beyondClip.outward++;
    else if (facing < 0) pad.beyondClip.inward++;
  }
  const boundary = new Map<string, number>();
  let distalBoundary = 0;
  let nonmanifold = 0;
  for (const [key, count] of edgeUse) {
    if (count > 2) nonmanifold++;
    if (count !== 1) continue;
    const a = Math.floor(key / vertexCount);
    const b = key % vertexCount;
    if (Math.max(worldX(a), worldX(b)) >= clipX) distalBoundary++;
    const label = [owners[owner(a)], owners[owner(b)]].join(" / ");
    boundary.set(label, (boundary.get(label) ?? 0) + 1);
  }
  return {
    triangles: indices.length / 3,
    owners,
    boundary: Object.fromEntries(boundary),
    distalBoundary,
    nonmanifold,
    toe,
  };
}

/** Read the full source and local indexed geometry through the live entry point. */
async function tips(
  output: string,
  input: string,
  clipX: number,
): Promise<void> {
  const { root, sources } = Figure.construction();
  const rows = [];
  for (const [side, name] of [
    ["left", "fan.leg"],
    ["right", "fan.leg.mirror"],
  ] as const) {
    const local = foot(root, name);
    if (local === undefined) throw new Error("Missing standing source " + name);
    const archived = JSON.parse(
      await readFile(input + `/${side}.construction.json`, "utf8"),
    );
    const started = performance.now();
    const result = realizeAutoMovieConstruction(
      { name, root: local },
      { chord: 0.001, sources },
    );
    rows.push({
      side,
      declarationMatchesArchive:
        JSON.stringify(local) === JSON.stringify(archived.root),
      ...incidence(local, result.mesh, clipX),
      diagnostics: result.diagnostics,
      milliseconds: performance.now() - started,
    });
  }
  await writeFile(output, JSON.stringify({ clipX, rows }, null, 2));
}

/**
 * Read actual parameterized originals and their independent full-parent
 * request.
 */
async function parameterized(output: string): Promise<void> {
  let started: number = performance.now();
  const context = AutoMovieHumanBodyLaw.prepareSources(f1);
  const bodyMs: number = performance.now() - started;
  started = performance.now();
  const ankle = context.limbSources().leg("left").leg.ankle();
  const region = ankle.source.region!;
  const station = region.at(ankle.ankleStation);
  const ankleSection = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map(
    (phase) => station.phase(phase),
  );
  const regionalMs: number = performance.now() - started;

  const names = [
    "foot.left",
    "toe.left.1",
    "toe.left.2",
    "toe.left.3",
    "toe.left.4",
    "toe.left.5",
  ];
  started = performance.now();
  const originals = names.map((name) =>
    AutoMovieHumanBodyLaw.original(context, name),
  );
  const originalsMs: number = performance.now() - started;
  const partial = {
    trunkRequested: context.trunk !== undefined,
    milliseconds: { ...context.milliseconds },
  };

  started = performance.now();
  const meshes: NodeCanvasTypes.Mesh[] = [];
  const observations = originals.map((original, i) => {
    const name = names[i]!;
    if (original?.view === null || original?.view === undefined)
      return { name, diagnostics: original?.diagnostics ?? [] };
    const made = realizeAutoMovieConstruction(
      { name, root: original.view },
      { chord: 0.001 },
    );
    const { positions, indices } = made.mesh;
    if (positions.length !== 0)
      meshes.push({
        id: name,
        positions,
        indices: indices ?? [],
        colour: [0.64, 0.65, 0.67],
      });
    return {
      name,
      diagnostics: [...original.diagnostics, ...made.diagnostics],
      triangles: (indices?.length ?? 0) / 3,
      digest: createHash("sha256")
        .update(JSON.stringify({ positions, indices }))
        .digest("hex"),
    };
  });
  const meshMs: number = performance.now() - started;

  started = performance.now();
  const frames: string[] = [];
  if (meshes.length !== 0) {
    NodeCanvasRaster.initialize();
    const bounds: P3[] = meshes.flatMap(({ positions }) =>
      Array.from(
        { length: positions.length / 3 },
        (_, i): P3 => [
          positions[3 * i]!,
          positions[3 * i + 1]!,
          positions[3 * i + 2]!,
        ],
      ),
    );
    for (const view of ["left", "top", "high-oblique"]) {
      const camera = NodeCanvasCamera.fit(view, bounds, 900, 700);
      const file = output + "." + view + ".png";
      await writeFile(
        file,
        NodeCanvasRaster.render(
          camera,
          meshes,
          [],
          "depth",
          "Parameterized left foot originals | " + view,
        ).png,
      );
      frames.push(file);
    }
  }
  const rasterMs: number = performance.now() - started;

  started = performance.now();
  let complete: unknown;
  try {
    const result = ankle.source.complete();
    complete = { part: result.part.name, stations: result.part.stations };
  } catch (error: unknown) {
    complete = {
      refusal: error instanceof Error ? error.message : String(error),
    };
  }
  const completeMs: number = performance.now() - started;
  const report = {
    regional: {
      ankleStation: ankle.ankleStation,
      interval: region.domain,
      ankleSection,
      unavailable: station.unavailable,
    },
    partial,
    complete: {
      result: complete,
      trunkRequested: context.trunk !== undefined,
      milliseconds: { ...context.milliseconds },
    },
    observations,
    frames,
    timing: { bodyMs, regionalMs, originalsMs, meshMs, rasterMs, completeMs },
  };
  await writeFile(output, JSON.stringify(report, null, 2));
}

const [output, input, clipX] = process.argv.slice(2);
if (
  output === undefined ||
  (input !== undefined &&
    input !== "--parameterized" &&
    !Number.isFinite(Number(clipX)))
)
  throw new Error(
    "Supply an output path, optionally --parameterized or the archived input directory and clip X in metres",
  );
void (
  input === undefined
    ? main(output)
    : input === "--parameterized"
      ? parameterized(output)
      : tips(output, input, Number(clipX))
).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
