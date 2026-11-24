import {
  AutoMovieLoftViewFullSource,
  AutoMovieSolidVector as Vector,
  measureAutoMovieMeshCrossings,
  measureAutoMovieMeshDefects,
  measureAutoMovieMeshPieces,
  meshOf,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import {
  AutoMovieHumanBodyAnatomy,
  AutoMovieHumanBodyLaw,
  AutoMovieHumanHeadLane,
  AutoMovieHumanTrunkRows,
} from "@automovie/human";
import { AutoMovieHumanNeutralParameters } from "@automovie/human/capture";
import type { IAutoMovieMesh } from "@automovie/interface";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { FamilyConicCaptureFrame as Frame } from "./FamilyConicCaptureFrame";
import { NodeCanvasCamera as Camera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/** A physical chart address with station in mm and phase in radians. */
type Address = [number, number];

/** Narrow replay of the saved neutral head crossings and their original chart. */
export namespace FamilyConicNeutralHeadCrossing {
  /** Draw the same local mesh from the saved body and an independent head. */
  export async function capture(file: string, out: string): Promise<void> {
    const began: number = performance.now();
    const lines: string[] = (await readFile(file, "utf8")).split(/\r?\n/u);
    const row: string | undefined = lines.find((line) =>
      line.startsWith('{"assembly"'),
    );
    if (row === undefined) throw new Error("Expected a saved assembly capture");
    const saved: Pick<IAutoMovieMesh, "positions" | "indices"> & {
      crossings: {
        triangle: number;
        other: number;
        firstOwners: string[];
        otherOwners: string[];
      }[];
    } = JSON.parse(row).assembly.skin;
    const ids: number[] = [
      ...new Set(
        saved.crossings
          .filter(({ firstOwners, otherOwners }) =>
            [...firstOwners, ...otherOwners].every(
              (owner) => owner === "head.mass",
            ),
          )
          .flatMap(({ triangle, other }) => [triangle, other]),
      ),
    ];
    if (ids.length === 0)
      throw new Error("Saved capture has no head-mass witnesses");
    const points: N.Point[] = ids.flatMap((i) => triangle(saved, i));
    const low: N.Point = [0, 1, 2].map((d) =>
      Math.min(...points.map((p) => p[d]!)),
    ) as N.Point;
    const high: N.Point = [0, 1, 2].map((d) =>
      Math.max(...points.map((p) => p[d]!)),
    ) as N.Point;
    const reach: number = Vector.norm(Vector.sub(high, low));
    const centre: N.Point = Vector.scale(Vector.add(low, high), 0.5);
    const savedMesh = crop(saved, centre, reach);
    const prepared = AutoMovieHumanBodyLaw.prepareSources(
      AutoMovieHumanNeutralParameters,
    );
    const head = AutoMovieHumanHeadLane.create(
      prepared.headInputs,
      AutoMovieHumanBodyAnatomy.sexOf(AutoMovieHumanNeutralParameters),
      prepared.common().neckSource,
      prepared.headSource(),
    );
    const authored: number = performance.now();
    const real = realizeAutoMovieConstruction(
      { name: "neutral.head", root: head.root },
      {
        chord: AutoMovieHumanTrunkRows.MAX_GAP / 1000,
        sources: head.source.sources,
        loopSources: head.loopSources,
      },
    );
    const realized: number = performance.now();
    const mesh = crop(real.mesh, centre, reach);
    const source = AutoMovieLoftViewFullSource.create(head.source.massPart);
    const old = savedMesh.crossings.map(({ triangle, other }) => [
      savedMesh.ids[triangle],
      savedMesh.ids[other],
    ]);
    const crossings = mesh.crossings.map(({ triangle, other }) => [
      mesh.ids[triangle]!,
      mesh.ids[other]!,
    ]);
    const addresses = (i: number): Address[] =>
      real.mesh.indices
        .slice(3 * i, 3 * i + 3)
        .map(
          (v): Address => [
            real.mesh.coordinates[3 * v + 1]!,
            real.mesh.coordinates[3 * v + 2]!,
          ],
        );
    const surface = real.surfaces.find(({ name }) => name === "head.mass")!;
    const ownerOf = (v: number): string =>
      real.mesh.owners[real.mesh.coordinates[3 * v]!]!;
    const focused = (i: number) => {
      const tri = triangle(real.mesh, i);
      const chart = addresses(i);
      const owners = real.mesh.indices.slice(3 * i, 3 * i + 3).map(ownerOf);
      const changes: number[] = chart.map(([s, t], j) =>
        owners[j] === "head.mass"
          ? Vector.norm(
              Vector.sub(Vector.scale(tri[j]!, 1000), source.point(s, t)),
            )
          : NaN,
      );
      const normal = Vector.cross(
        Vector.sub(tri[1]!, tri[0]!),
        Vector.sub(tri[2]!, tri[0]!),
      );
      const [s, t] = chart.reduce(
        ([a, b], [u, v]): Address => [a + u / 3, b + v / 3],
        [0, 0],
      );
      const jets = owners.every((owner) => owner === "head.mass")
        ? surface.jet(s, t)
        : null;
      const sided =
        jets === null
          ? null
          : Vector.dot(
              Vector.unit(normal)!,
              Vector.unit(Vector.cross(jets.u, jets.v))!,
            );
      const orientation: number =
        (chart[1]![0] - chart[0]![0]) * (chart[2]![1] - chart[0]![1]) -
        (chart[1]![1] - chart[0]![1]) * (chart[2]![0] - chart[0]![0]);
      return {
        triangle: i,
        owners,
        positions: tri,
        chart,
        changes,
        orientation,
        sided,
      };
    };
    const witnesses = [...new Set(crossings.flat())].map(focused);
    const limits = focused(
      mesh.ids
        .filter((i) =>
          real.mesh.indices
            .slice(3 * i, 3 * i + 3)
            .every((v) => ownerOf(v) === "head.mass"),
        )
        .reduce((first, i) =>
          Vector.norm(Vector.sub(triangle(real.mesh, i)[0]!, centre)) <
          Vector.norm(Vector.sub(triangle(real.mesh, first)[0]!, centre))
            ? i
            : first,
        ),
    );
    const chartCentre: Address = limits.chart[0]!;
    const chartPerChord: number = Vector.norm(surface.jet(...chartCentre).v);
    const grid: number = 32;
    const originalPositions: number[] = [];
    const originalIndices: number[] = [];
    for (let i: number = 0; i <= grid; i++) {
      const read = source.pointAt(
        chartCentre[0] + 1000 * reach * ((2 * i) / grid - 1),
      );
      for (let j: number = 0; j <= grid; j++) {
        originalPositions.push(
          ...Vector.scale(
            read(
              chartCentre[1] +
                (1000 * reach * ((2 * j) / grid - 1)) / chartPerChord,
            ),
            1 / 1000,
          ),
        );
        if (i === 0 || j === 0) continue;
        const d: number = i * (grid + 1) + j;
        const a: number = d - grid - 2;
        originalIndices.push(a, d, a + 1, a, d - 1, d);
      }
    }
    const original = crop(
      { positions: originalPositions, indices: originalIndices },
      centre,
      reach,
    );
    await mkdir(out, { recursive: true });
    NodeCanvasRaster.initialize();
    const camera = Camera.fitAnnotated(
      "head-crossing",
      [0.12, 0, -1],
      [0, 1, 0],
      [centre],
      720,
      720,
    );
    camera.scale = 260 / reach;
    for (const [name, item, marks, label] of [
      ["saved", savedMesh, ids, "Saved neutral assembly"],
      ["head", mesh, crossings.flat(), "Independent neutral head"],
      ["original", original, [], "Original scalp before ear trim"],
    ] as const) {
      const display: N.Mesh = {
        id: name,
        positions: item.mesh.positions,
        indices: item.mesh.indices!,
        normals: meshOf(item.mesh.positions, item.mesh.indices!).normals!,
        colour: [0.64, 0.65, 0.67],
      };
      const curves: N.Curve[] = [...new Set(marks)].map((i): N.Curve => {
        const p = triangle(name === "saved" ? saved : real.mesh, i);
        return {
          id: String(i),
          closed: true,
          xray: true,
          colour: "#c62828",
          points: p,
        };
      });
      await Frame.write(
        null,
        out,
        name + ".clay.png",
        camera,
        [display],
        [],
        "depth",
        label,
        "clay",
        name,
      );
      if (curves.length !== 0)
        await Frame.write(
          null,
          out,
          name + ".witness.png",
          camera,
          [display],
          curves,
          "xray",
          label,
          "witness",
          name,
        );
      if (name !== "original") {
        const guide: N.Curve[] = [];
        for (let i: number = 0; i < item.ids.length; ++i) {
          const positions: N.Point[] = triangle(item.mesh, i);
          const mean: N.Point = Vector.scale(
            positions.reduce(Vector.add),
            1 / 3,
          );
          if (
            !mean.every(
              (value, k) =>
                value >= low[k]! - reach / 6 && value <= high[k]! + reach / 6,
            )
          )
            continue;
          guide.push({
            id: String(item.ids[i]),
            points: positions,
            closed: true,
            colour: "#195071",
            xray: false,
          });
        }
        await Frame.write(
          null,
          out,
          name + ".mesh.png",
          camera,
          [display],
          guide,
          "depth",
          label,
          "mesh",
          name,
        );
      }
    }
    const full = meshOf(real.mesh.positions, real.mesh.indices);
    const wholeCrossings = measureAutoMovieMeshCrossings(full, full);
    const defects = measureAutoMovieMeshDefects(full);
    const pieces = measureAutoMovieMeshPieces(full);
    await writeFile(
      path.join(out, "receipt.json"),
      JSON.stringify(
        {
          milliseconds: {
            authored: authored - began,
            realized: realized - authored,
            evidence: performance.now() - realized,
          },
          diagnostics: real.diagnostics,
          joins: real.joins.map(({ name }) => name),
          saved: { pairs: old, triangles: ids.map((i) => triangle(saved, i)) },
          head: {
            pairs: crossings,
            witnesses,
            triangles: real.mesh.indices.length / 3,
            wholeCrossings,
            topology: {
              pieces,
              openEdges: defects.filter(({ kind }) => kind === "open").length,
              otherDefects: defects.filter(({ kind }) => kind !== "open"),
            },
          },
          original: {
            crossings: original.crossings,
            triangles: original.ids.length,
            chartCentre,
          },
        },
        null,
        2,
      ),
    );
  }
}

/** Three exact world positions of one stored triangle. */
function triangle(
  input: Pick<IAutoMovieMesh, "positions" | "indices">,
  id: number,
): N.Point[] {
  return input
    .indices!.slice(3 * id, 3 * id + 3)
    .map((i): N.Point => input.positions.slice(3 * i, 3 * i + 3) as N.Point);
}

/** Retain original identifiers while checking only triangles around the witness. */
function crop(
  input: Pick<IAutoMovieMesh, "positions" | "indices">,
  centre: N.Point,
  width: number,
) {
  const ids: number[] = [];
  const positions: number[] = [];
  const indices: number[] = [];
  const mapping: number[] = new Array(input.positions.length / 3).fill(-1);
  for (let i: number = 0; i < input.indices!.length; i += 3) {
    const vertices = input.indices!.slice(i, i + 3);
    const ok: boolean = vertices.some((id) =>
      centre.every(
        (c, d) => Math.abs(input.positions[3 * id + d]! - c) <= width,
      ),
    );
    if (!ok) continue;
    ids.push(i / 3);
    for (const v of vertices) {
      if (mapping[v] === -1) {
        mapping[v] = positions.length / 3;
        positions.push(...input.positions.slice(3 * v, 3 * v + 3));
      }
      indices.push(mapping[v]!);
    }
  }
  const mesh: IAutoMovieMesh = {
    positions,
    indices,
    normals: null,
    skin: null,
    uvs: null,
  };
  return {
    ids,
    mesh,
    crossings: measureAutoMovieMeshCrossings(mesh, mesh, { allPairs: true }),
  };
}

if (require.main === module) {
  const [, , file, out] = process.argv;
  if (file === undefined || out === undefined)
    throw new Error(
      "Usage: FamilyConicNeutralHeadCrossing <assembly-jsonl> <output-directory>",
    );
  void FamilyConicNeutralHeadCrossing.capture(file, out).catch(
    (error: unknown): void => {
      console.error(error);
      process.exitCode = 1;
    },
  );
}
