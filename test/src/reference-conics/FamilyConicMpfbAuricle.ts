import {
  AutoMovieLoftRelief,
  AutoMovieLoftViewFullSource,
  AutoMovieSolidVector as Vector,
  inspectAutoMovieMeshTopology,
  measureAutoMovieMeshPieces,
  meshOf,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import {
  AutoMovieHumanBodyAnatomy,
  AutoMovieHumanBodyLaw,
  AutoMovieHumanHeadEarContact,
  AutoMovieHumanHeadLane,
  AutoMovieHumanTrunkRows,
} from "@automovie/human";
import { AutoMovieHumanNeutralParameters } from "@automovie/human/capture";
import type {
  IAutoMovieConstructionRealization,
  IAutoMovieLoftRelief,
  IAutoMovieLoftViewFullSource,
  IAutoMovieMesh,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { FamilyConicCaptureFrame as Frame } from "./FamilyConicCaptureFrame";
import { FamilyConicMpfbHead } from "./FamilyConicMpfbHead";
import { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";
import { NodeCanvasCamera as Camera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/** Matched auricle stills from the public reference and actual neutral head. */
export namespace FamilyConicMpfbAuricle {
  /**
   * Compare profiles, frontal views, section curves and close posterolateral
   * views.
   */
  export async function capture(
    out: string,
    asset?: string,
    baseline?: string,
    sourceOnly: boolean = false,
    attachmentOnly: boolean = false,
    carrierOnly: boolean = false,
  ): Promise<void> {
    const start: number = performance.now();
    const parameters = AutoMovieHumanNeutralParameters;
    const body = AutoMovieHumanBodyLaw.prepareSources(parameters);
    const head = AutoMovieHumanHeadLane.create(
      body.headInputs,
      AutoMovieHumanBodyAnatomy.sexOf(parameters),
      body.common().neckSource,
      body.headSource(),
    );
    const authored: number = performance.now();
    if (attachmentOnly) {
      const parent: IAutoMovieLoftViewFullSource.IReader =
        AutoMovieLoftViewFullSource.create(head.source.massPart);
      const reads = (["left", "right"] as const).map((side) => {
        const part = head.source.sources.get("auricle." + side);
        if (part === undefined)
          throw new Error("Neutral head has no original auricle." + side);
        return measureContact(
          part,
          AutoMovieLoftViewFullSource.create(part),
          parent,
          side === "left" ? 1 : -1,
        );
      });
      await mkdir(out, { recursive: true });
      await writeFile(
        path.join(out, "attachment.json"),
        JSON.stringify(
          {
            authoredMilliseconds: authored - start,
            geometry: reads,
          },
          null,
          2,
        ),
      );
      return;
    }
    const source: Mpfb.ISource = await Mpfb.load(asset);
    const reference = FamilyConicMpfbHead.measure(source);
    const options = {
      sources: head.source.sources,
      loopSources: head.loopSources,
      chord: AutoMovieHumanTrunkRows.MAX_GAP / 1000,
    };
    const result =
      sourceOnly || carrierOnly
        ? null
        : realizeAutoMovieConstruction(
            {
              name: "ansur-male-neutral.head",
              root: head.root,
            },
            options,
          );
    let realizationMilliseconds: number = performance.now() - authored;
    const diagnostics = [...(result?.diagnostics ?? [])];
    const clay: N.Point = [0.64, 0.65, 0.67];
    const referencePositions: number[] = Array.from(
      source.body.positions,
      (mm: number): number => mm / 1000,
    );
    const referenceIndices: number[] = Array.from(source.body.indices);
    const referenceMesh: N.Mesh = {
      id: "mpfb.hm08.skin",
      positions: referencePositions,
      indices: referenceIndices,
      normals: meshOf(referencePositions, referenceIndices).normals!,
      colour: clay,
    };
    const meshOfAuricle = (
      built: IAutoMovieConstructionRealization.IRealization,
    ): N.Mesh => ({
      id: built.name,
      ...built.mesh,
      normals: auricleNormals(built),
      colour: clay,
    });
    const headMesh: N.Mesh | null =
      result === null ? null : meshOfAuricle(result);
    const topologyMesh: IAutoMovieMesh | null =
      result === null
        ? null
        : {
            positions: result.mesh.positions,
            indices: result.mesh.indices,
            normals: null,
            uvs: null,
            skin: null,
          };
    const frames: (Awaited<ReturnType<typeof Frame.write>> & {
      camera: N.Camera;
    })[] = [];
    const geometry: (Partial<ReturnType<typeof inspectFields>> &
      Partial<ReturnType<typeof inspectRails>> &
      ReturnType<typeof inspectChord> & {
        name: string;
        posteriorOutline: number[];
        heldRailJetError: number | null;
      })[] = [];
    const previous: readonly {
      name: string;
      witnesses: ReturnType<typeof inspectRails>["witnesses"];
    }[] =
      baseline === undefined
        ? []
        : JSON.parse(await readFile(baseline, "utf8")).geometry;
    const comparisons: string[] = [];
    await mkdir(out, { recursive: true });
    NodeCanvasRaster.initialize();
    const missing: string[] =
      result === null
        ? []
        : ["auricle.left", "auricle.right"].filter(
            (face: string): boolean =>
              !result.joins.some(({ partFace }): boolean => partFace === face),
          );
    if (result !== null && missing.length !== 0)
      throw new Error(
        JSON.stringify({
          missing,
          diagnostics: result.diagnostics.filter(({ node }): boolean =>
            node.includes("auricle"),
          ),
        }),
      );
    for (const side of ["left", "right"] as const) {
      const face: string = "auricle." + side;
      const original: IAutoMovieViewPart | undefined =
        head.source.sources.get(face);
      if (original === undefined)
        throw new Error("Neutral head has no original " + face);
      const part: IAutoMovieViewPart = carrierOnly
        ? { ...original, reliefs: [] }
        : original;
      const read: IAutoMovieLoftViewFullSource.IReader =
        AutoMovieLoftViewFullSource.create(part);
      const prepare: number = performance.now();
      const ear =
        result ??
        realizeAutoMovieConstruction(
          { name: face, root: { type: "source", name: face, source: face } },
          carrierOnly
            ? { ...options, sources: new Map([[face, part]]) }
            : options,
        );
      if (result === null) {
        realizationMilliseconds += performance.now() - prepare;
        diagnostics.push(...ear.diagnostics);
      }
      const generatedMesh: N.Mesh = headMesh ?? meshOfAuricle(ear);
      const join = ear.joins.find(({ partFace }) => partFace === face);
      geometry.push({
        name: face,
        ...(carrierOnly ? {} : inspectFields(part, read)),
        ...(join === undefined ? {} : inspectRails(join, read)),
        ...inspectChord(ear.mesh, face, read),
        posteriorOutline: posteriorOutline(read),
        heldRailJetError: replay(
          read,
          previous.find(({ name }) => name === face)?.witnesses,
        ),
      });
      const [low, high] = read.domain;
      const generatedEnds: N.Point[] = [
        metres(read.point(low, 0)),
        metres(read.point(high, 0)),
      ];
      const { e, f } = reference.ears[side];
      const referenceEnds: N.Point[] = [metres(f.point), metres(e.point)];
      const sign: number = side === "left" ? 1 : -1;
      const scale = Math.max(high - low, Math.abs(e.point[1] - f.point[1]));
      const chart: N.Curve[] = sections(original, read);
      for (const [kind, back] of [
        ["profile", [0, 0, sign]],
        ["front", [1, 0, 0]],
        ["close", [-0.5, 0, sign]],
      ] as const) {
        for (const [label, mesh, ends] of [
          ["MPFB HM08", referenceMesh, referenceEnds],
          [
            carrierOnly
              ? "ANSUR auricle carrier"
              : sourceOnly
                ? "ANSUR auricle source"
                : "ANSUR neutral",
            generatedMesh,
            generatedEnds,
          ],
        ] as const) {
          const camera: N.Camera = Camera.fitAnnotated(
            kind,
            [...back],
            [0, 1, 0],
            ends,
            650,
            720,
          );
          camera.scale =
            ((kind === "close" ? 0.92 : 0.77) * (camera.height - 105) * 1000) /
            scale;
          const id: string = mesh === referenceMesh ? "mpfb" : "neutral";
          for (const pass of kind === "profile" && id === "neutral"
            ? ["clay", "sections"]
            : ["clay"]) {
            const file: string = `${id}.${side}.${kind}.${pass}.png`;
            const frame = await Frame.write(
              null,
              out,
              file,
              camera,
              [mesh],
              pass === "sections" ? chart : [],
              "depth",
              label,
              pass,
              face,
              id === "neutral"
                ? {
                    stage: carrierOnly
                      ? "original auricle carrier"
                      : sourceOnly
                        ? "original auricle source"
                        : "issued head",
                    realization: "mesh-returned",
                    diagnosticCount: ear.diagnostics.length,
                  }
                : undefined,
              label,
            );
            frames.push({ ...frame, camera });
          }
        }
        const sources: string[] = [
          `mpfb.${side}.${kind}.clay.png`,
          `neutral.${side}.${kind}.clay.png`,
          ...(kind === "profile"
            ? [`neutral.${side}.${kind}.sections.png`]
            : []),
        ];
        const file: string = `${side}.${kind}.comparison.png`;
        await comparison(out, file, sources);
        comparisons.push(file);
      }
    }
    await writeFile(
      path.join(out, "receipt.json"),
      JSON.stringify(
        {
          asset: source.source,
          milliseconds: {
            source: authored - start,
            realization: realizationMilliseconds,
          },
          normalMethod:
            "Analytic auricle and join charts, vertex normals for reference and other faces",
          scope: carrierOnly
            ? "original auricle carrier"
            : sourceOnly
              ? "original auricle"
              : "issued head",
          joins: result?.joins.map(({ name }) => name) ?? [],
          diagnostics: diagnostics.map(({ node, contract }) => ({
            node,
            contract,
          })),
          contactClock: result === null ? null : "paired native level branches",
          ...(topologyMesh === null
            ? {}
            : {
                topology: inspectAutoMovieMeshTopology(topologyMesh),
                pieces: measureAutoMovieMeshPieces(topologyMesh),
              }),
          geometry,
          frames,
          comparisons,
        },
        null,
        2,
      ),
    );
  }
}

/** Evaluate the meeting of the two original fields in each common level plane. */
function measureContact(
  part: IAutoMovieViewPart,
  ear: IAutoMovieLoftViewFullSource.IReader,
  scalp: IAutoMovieLoftViewFullSource.IReader,
  side: 1 | -1,
) {
  const named = part.front.positive.knots;
  const sitePoint = (name: string, angle: number): N.Point => {
    const station: number | undefined = named.find(
      ({ site }) => site === name,
    )?.station;
    if (station === undefined)
      throw new Error(`${part.name} has no ${name} guide`);
    return ear.point(station, angle);
  };
  const a: N.Point = sitePoint("subaurale", 0);
  const b: N.Point = sitePoint("superaurale", 0);
  const c: N.Point = sitePoint("otobasion.superius", Math.PI);
  const j: N.Point = sitePoint("posterior.j", 0);
  const sites = AutoMovieHumanHeadEarContact.levels(part, ear, scalp, side);
  return {
    name: part.name,
    calipers: {
      length: Vector.norm(Vector.sub(b, a)),
      breadth: Vector.norm(Vector.sub(j, c)),
      chordDot: Vector.dot(Vector.sub(b, a), Vector.sub(j, c)),
    },
    loop: AutoMovieHumanHeadEarContact.observe(
      ear,
      scalp,
      side,
      sites,
      part.samples,
    ),
    sites,
  };
}

/** Read published ear and blend charts at their actual issued vertices. */
function auricleNormals(
  result: IAutoMovieConstructionRealization.IRealization,
): number[] {
  const { mesh } = result;
  const normals: number[] = meshOf(mesh.positions, mesh.indices).normals!;
  for (const surface of result.surfaces) {
    if (
      !surface.name.startsWith("auricle.") &&
      !surface.name.startsWith("blend.auricle.")
    )
      continue;
    const owner: number = mesh.owners.indexOf(surface.name);
    const vertices: number[] = [];
    for (let i: number = 0; i < mesh.coordinates.length; i += 3) {
      if (mesh.coordinates[i] !== owner) continue;
      const s: number = mesh.coordinates[i + 1]!;
      if (
        surface.domain !== undefined &&
        (s === surface.domain[0] || s === surface.domain[1])
      )
        continue;
      vertices.push(i);
    }
    vertices.sort(
      (a: number, b: number): number =>
        mesh.coordinates[a + 1]! - mesh.coordinates[b + 1]!,
    );
    for (let start: number = 0; start < vertices.length; ) {
      const station: number = mesh.coordinates[vertices[start]! + 1]!;
      const jet: (t: number) => IAutoMovieSolidSurface.IJet =
        surface.jetAt?.(station) ?? ((t: number) => surface.jet(station, t));
      while (
        start < vertices.length &&
        mesh.coordinates[vertices[start]! + 1] === station
      ) {
        const i: number = vertices[start++]!;
        const { u, v } = jet(mesh.coordinates[i + 2]!);
        const unit: N.Point | null = Vector.unit(Vector.cross(u, v));
        if (unit === null) continue;
        normals[i] = unit[0] * surface.orientation;
        normals[i + 1] = unit[1] * surface.orientation;
        normals[i + 2] = unit[2] * surface.orientation;
      }
    }
  }
  return normals;
}

/** Compare each same-chart ear triangle centre to its exact native source. */
function inspectChord(
  mesh: IAutoMovieConstructionRealization.IMesh,
  face: string,
  ear: IAutoMovieLoftViewFullSource.IReader,
): {
  triangles: number;
  maximumCentroidError: number;
  meanCentroidError: number;
} {
  const owner: number = mesh.owners.indexOf(face);
  const [low, high] = ear.domain;
  let triangles: number = 0;
  let maximumCentroidError: number = 0;
  let sum: number = 0;
  for (let i: number = 0; i < mesh.indices.length; i += 3) {
    const corners: number[] = mesh.indices
      .slice(i, i + 3)
      .map((v: number): number => v * 3);
    if (!corners.every((v: number): boolean => mesh.coordinates[v] === owner))
      continue;
    const stations: number[] = corners.map(
      (v: number): number => mesh.coordinates[v + 1]!,
    );
    if (stations.some((s: number): boolean => s <= low || s >= high)) continue;
    const angles: number[] = corners.map(
      (v: number): number => mesh.coordinates[v + 2]!,
    );
    const first: number = angles[0]!;
    const station: number =
      stations.reduce((a: number, b: number): number => a + b, 0) / 3;
    const phase: number =
      first +
      angles.reduce(
        (a: number, t: number): number =>
          a + Math.atan2(Math.sin(t - first), Math.cos(t - first)),
        0,
      ) /
        3;
    const point: N.Point = ear.point(station, phase);
    const error: number = Math.hypot(
      ...point.map(
        (coordinate: number, axis: number): number =>
          coordinate -
          (1000 *
            corners.reduce(
              (a: number, v: number): number => a + mesh.positions[v + axis]!,
              0,
            )) /
            3,
      ),
    );
    triangles++;
    maximumCentroidError = Math.max(maximumCentroidError, error);
    sum += error;
  }
  if (triangles === 0) throw new Error(face + " has no interior skin triangle");
  return {
    triangles,
    maximumCentroidError,
    meanCentroidError: sum / triangles,
  };
}

/** Put the exact native captures next to each other at their original size. */
async function comparison(
  out: string,
  file: string,
  sources: string[],
): Promise<void> {
  const images = await Promise.all(
    sources.map((source: string) => loadImage(path.join(out, source))),
  );
  const { width, height } = images[0]!;
  const canvas = createCanvas(width * images.length, height);
  const context = canvas.getContext("2d");
  for (let i: number = 0; i < images.length; i++)
    context.drawImage(images[i]!, i * width, 0);
  await writeFile(path.join(out, file), canvas.toBuffer("image/png"));
}

/** Station intervals occupied by the accepted original attachment. */
type RailWitness = { chart: [number, number]; jet: number[] };

function inspectRails(
  attachment: IAutoMovieConstructionRealization.IJoin,
  source: IAutoMovieLoftViewFullSource.IReader,
): {
  contactStations: [number, number];
  railStations: [number, number];
  railPhaseFromAnterior: number;
  witnesses: RailWitness[];
} {
  const contacts: number[] = attachment.join.curve.points.map(({ s }) => s);
  const rails: [number, number][] = attachment.join.curve.points.flatMap(
    ({ t }): [number, number][] => {
      const rail = attachment.join.rail(t);
      return rail === null ? [] : [[rail.s, rail.phi]];
    },
  );
  return {
    contactStations: [Math.min(...contacts), Math.max(...contacts)],
    railStations: [
      Math.min(...rails.map(([s]) => s)),
      Math.max(...rails.map(([s]) => s)),
    ],
    railPhaseFromAnterior: Math.max(
      ...rails.map(([, t]) =>
        Math.abs(Math.atan2(Math.sin(t - Math.PI), Math.cos(t - Math.PI))),
      ),
    ),
    witnesses: [
      ...attachment.join.curve.points.map(({ s, phi }): [number, number] => [
        s,
        phi,
      ]),
      ...rails,
    ].map((chart): RailWitness => ({ chart, jet: jets(source, chart) })),
  };
}

function jets(
  source: IAutoMovieLoftViewFullSource.IReader,
  [s, t]: [number, number],
): number[] {
  const j = source.jet(s, t);
  return [...j.p, ...j.u, ...j.v, ...j.uu, ...j.uv, ...j.vv];
}

function replay(
  source: IAutoMovieLoftViewFullSource.IReader,
  witnesses: readonly RailWitness[] | undefined,
): number | null {
  if (witnesses === undefined) return null;
  let maximum: number = 0;
  for (const { chart, jet } of witnesses) {
    const next: number[] = jets(source, chart);
    for (let i: number = 0; i < next.length; i++)
      maximum = Math.max(maximum, Math.abs(next[i]! - jet[i]!));
  }
  return maximum;
}

function posteriorOutline(
  source: IAutoMovieLoftViewFullSource.IReader,
): number[] {
  const [low, high] = source.domain;
  const length: number = high - low;
  const [bottom, top] = [source.point(low, 0)[0], source.point(high, 0)[0]];
  return Array.from({ length: 15 }, (_, i: number): number => {
    const f: number = (i + 1) / 16;
    const read = source.pointAt(low + f * length);
    const x: number = Math.min(
      ...Array.from(
        { length: 128 },
        (_, j: number): number => read((j * Math.PI) / 64)[0],
      ),
    );
    return (bottom + f * (top - bottom) - x) / length;
  });
}

/** Sample each cubic cell centre and compare the two native ear sheets. */
function inspectFields(
  part: IAutoMovieViewPart,
  ear: IAutoMovieLoftViewFullSource.IReader,
): {
  name: string;
  minimumBackClearance: number;
  peakHeights: { name: string; millimetres: number }[];
} {
  const fields: readonly IAutoMovieLoftRelief[] = part.reliefs ?? [];
  const common: IAutoMovieLoftRelief | undefined = fields[0];
  if (common === undefined)
    throw new Error(part.name + " has no measured relief fields");
  const [low, high] = common.stations;
  const [left, right] = common.phases;
  const peakHeights = fields.map(
    ({ name }): { name: string; millimetres: number } => ({
      name,
      millimetres: 0,
    }),
  );
  let minimumBackClearance: number = Infinity;
  for (let j: number = 0; j < common.rows - 3; j++) {
    const s: number = low + ((j + 0.5) * (high - low)) / (common.rows - 3);
    const point = ear.pointAt(s);
    for (let i: number = 0; i < common.columns - 3; i++) {
      const t: number =
        left + ((i + 0.5) * (right - left)) / (common.columns - 3);
      minimumBackClearance = Math.min(
        minimumBackClearance,
        Vector.dot(Vector.sub(point(t), point(-t)), common.axis),
      );
      for (let k: number = 0; k < fields.length; k++) {
        const height: number = AutoMovieLoftRelief.height(fields[k]!, s, t)[0];
        if (Math.abs(height) > Math.abs(peakHeights[k]!.millimetres))
          peakHeights[k]!.millimetres = height;
      }
    }
  }
  return { name: part.name, minimumBackClearance, peakHeights };
}

/** Sections of the actual authored outer ear field in metres. */
function sections(
  part: IAutoMovieViewPart,
  ear: IAutoMovieLoftViewFullSource.IReader,
): N.Curve[] {
  const [low, high] = ear.domain;
  const phases: readonly [number, number] | undefined =
    part.reliefs?.[0]?.phases;
  if (phases === undefined) throw new Error(part.name + " has no crest chart");
  const [left, right] = phases;
  const stations: number[] = part.front.positive.knots
    .map(({ station }) => station)
    .filter((station: number): boolean => station > low && station < high);
  const quarter = [1, 2, 3].map(
    (i: number): number => left + ((right - left) * i) / 4,
  );
  const sample = (position: (u: number) => N.Point): N.Point[] =>
    Array.from(
      { length: 129 },
      (_, i: number): N.Point => metres(position(i / 128)),
    );
  return [
    ...stations.map(
      (s: number): N.Curve => ({
        id: `${part.name}.station.${s}`,
        closed: false,
        colour: "156B78",
        points: sample(
          (u: number): N.Point => ear.point(s, left + u * (right - left)),
        ),
      }),
    ),
    ...quarter.map(
      (t: number): N.Curve => ({
        id: `${part.name}.phase.${t}`,
        closed: false,
        colour: "CE424D",
        points: sample(
          (u: number): N.Point => ear.point(low + u * (high - low), t),
        ),
      }),
    ),
  ];
}

function metres(point: N.Point): N.Point {
  return Vector.scale(point, 1 / 1000);
}

if (require.main === module) {
  const args: string[] = process.argv.slice(2);
  const sourceOnly: boolean = args.includes("--source-only");
  const attachmentOnly: boolean = args.includes("--attachment-only");
  const carrierOnly: boolean = args.includes("--carrier-only");
  const [target, asset, baseline] = args.filter(
    (arg) =>
      arg !== "--source-only" &&
      arg !== "--attachment-only" &&
      arg !== "--carrier-only",
  );
  if (target === undefined)
    throw new Error(
      "Usage: FamilyConicMpfbAuricle <output-directory> [exact-hm08-obj] [--source-only | --carrier-only | --attachment-only]",
    );
  void FamilyConicMpfbAuricle.capture(
    path.resolve(target),
    asset,
    baseline,
    sourceOnly,
    attachmentOnly,
    carrierOnly,
  ).catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
}
