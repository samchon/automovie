import {
  inspectAutoMovieMeshTopology,
  measureAutoMovieMeshCrossings,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import { AutoMovieHumanBodyLaw } from "@automovie/human";
import { AutoMovieHumanNeutralParameters } from "@automovie/human/capture";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionSplit,
  IAutoMovieMesh,
} from "@automovie/interface";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { FamilyConicCaptureFrame } from "./FamilyConicCaptureFrame";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/** Read the normal Human production's four isolated fan subtrees. */
async function run(output: string, compare?: string): Promise<void> {
  const captures =
    compare === undefined
      ? []
      : (JSON.parse(await readFile(compare, "utf8")) as readonly {
          name: string;
          frames: readonly { file: string; camera: N.Camera }[];
        }[]);
  const began = performance.now();
  const { lane } = AutoMovieHumanBodyLaw.define(
    AutoMovieHumanNeutralParameters,
  );
  const defined = performance.now();
  const evaluate = async (node: IAutoMovieConstructionSplit) => {
    const started = performance.now();
    const result = realizeAutoMovieConstruction(
      { name: node.name, root: node },
      { chord: 0.01 / 1000, sources: lane.sourceParts, ...lane.digitalSources },
    );
    const mesh: IAutoMovieMesh = {
      ...result.mesh,
      normals: null,
      uvs: null,
      skin: null,
    };
    const indices = result.mesh.indices;
    const topology = inspectAutoMovieMeshTopology(mesh);
    const crossings = measureAutoMovieMeshCrossings(mesh, mesh, {
      allPairs: true,
    }).filter(({ triangle, other }): boolean => triangle < other);
    const frames = captures.find(
      ({ name }): boolean => `fan.${name}` === node.name,
    )?.frames;
    if (frames !== undefined) {
      const dir = path.join(path.dirname(output), "views", node.hostFace);
      await mkdir(dir, { recursive: true });
      NodeCanvasRaster.initialize();
      const display: N.Mesh = {
        id: node.name,
        positions: mesh.positions,
        indices,
        colour: [0.64, 0.65, 0.67],
      };
      const points = result.body.points.map(({ chain, chart }) => {
        const surface = result.surfaces.find(
          ({ name }): boolean => name === chain,
        )!;
        const p = surface.point?.(...chart) ?? surface.jet(...chart).p;
        return p.map((x) => x / 1000) as N.Point;
      });
      const guides = result.body.faces.flatMap(
        ({ chain, cycles }): N.Curve[] =>
          chain === node.hostFace ||
          node.children.some(({ partFace }): boolean => partFace === chain)
            ? cycles.map(({ points: ids }, i) => ({
                id: `${chain}.${i}`,
                points: ids.map((id) => points[id]!),
                closed: true,
                colour: "325276",
              }))
            : [],
      );
      for (const { file, camera } of frames) {
        if (!file.endsWith("original-clay.png")) continue;
        for (const overlay of [false, true]) {
          const label = overlay ? "guides" : "clay";
          await FamilyConicCaptureFrame.write(
            null,
            dir,
            `${camera.name}.${label}.png`,
            camera,
            [display],
            overlay ? guides : [],
            "depth",
            "Ordinary Human source and realizer",
            label,
            node.name,
            undefined,
            "Live Human fan",
          );
        }
      }
    }
    return {
      name: node.name,
      diagnostics: result.diagnostics,
      topology,
      crossings,
      originalRails: Array.from(
        lane.digitalSources?.splitChildRails?.get(node.name) ?? [],
      ),
      forkPhases: [node.seam, ...node.outer!.map(({ seam }) => seam)],
      strips: result.body.faces
        .filter(({ surface }) => surface !== undefined)
        .map(({ chain, cycles, stations }) => ({
          chain,
          cycles: cycles.map(({ points }) => points.length),
          stations: stations?.length,
        })),
      indexCount: indices.length,
      milliseconds: performance.now() - started,
    };
  };
  const read = (
    node: IAutoMovieConstructionNode,
  ): IAutoMovieConstructionSplit[] => {
    if (
      node.type === "source" ||
      node.type === "view" ||
      node.type === "profile"
    )
      return [];
    if (node.type === "split") return [node];
    return [
      ...read(node.host),
      ...(node.type === "trim" ? [] : read(node.part)),
    ];
  };
  const fans: Awaited<ReturnType<typeof evaluate>>[] = [];
  for (const node of lane.root === null ? [] : read(lane.root)) {
    const result = await evaluate(node);
    fans.push(result);
    console.log(
      `${result.name}: ${result.topology.triangles} triangles, ${result.crossings.length} crossings`,
    );
  }
  await writeFile(
    output,
    JSON.stringify(
      { definitionMs: defined - began, diagnostics: lane.diagnostics, fans },
      null,
      2,
    ) + "\n",
  );
  if (
    fans.length !== 4 ||
    fans.some(
      ({ diagnostics, crossings }) =>
        diagnostics.length > 0 || crossings.length > 0,
    )
  )
    process.exitCode = 1;
}

if (
  typeof require !== "undefined" &&
  require.main === module &&
  path.parse(process.argv[1] ?? "").name === "FamilyConicNativeFanAssembly"
)
  void run(process.argv[2] ?? "", process.argv[3]).catch(
    (error: unknown): void => {
      console.error(error);
      process.exitCode = 1;
    },
  );
