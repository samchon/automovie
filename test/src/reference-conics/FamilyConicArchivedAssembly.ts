import { AutoMovieLoftChain, realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanConicLoft } from "@automovie/human";
import type {
  IAutoMovieConstruction,
  IAutoMovieConstructionRealization,
  IAutoMovieHumanConicLoft,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { FamilyConicCaptureFrame as Frame } from "./FamilyConicCaptureFrame";
import { NodeCanvasCamera as Camera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster as Raster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * Replay a locally supplied archived construction for visual debugging. The
 * archive already owns its boundaries, original view curves and placement.
 * Restore only the callable axes that JSON cannot carry.
 */
async function capture(
  constructionFile: string,
  placementFile: string,
  cameraFile: string,
  out: string,
  scopes: readonly string[],
  frameHands: boolean,
): Promise<void> {
  const [constructionBytes, placementBytes, cameraBytes] = await Promise.all(
    [constructionFile, placementFile, cameraFile].map((file) => readFile(file)),
  );
  const construction = JSON.parse(constructionBytes!.toString()) as Pick<
    IAutoMovieConstruction,
    "root" | "fills"
  > & {
    sources: Record<string, Omit<IAutoMovieViewPart, "axis">>;
  };
  const { assembled } = JSON.parse(placementBytes!.toString()) as {
    assembled: Record<string, IAutoMovieHumanConicLoft.IFamily>;
  };
  const { views } = JSON.parse(cameraBytes!.toString()) as {
    views: { frames: N.Frame[] };
  };
  const sources = new Map(
    Object.entries(construction.sources).map(([name, part]) => {
      const original = name.replace(/\.mirror$/, "");
      const family = assembled[original];
      if (family === undefined)
        throw new Error("Archive lacks the placed original for " + name);
      const placed =
        original === name
          ? family
          : AutoMovieHumanConicLoft.mirror(family, name);
      return [name, { ...part, axis: AutoMovieHumanConicLoft.axis(placed) }];
    }),
  );
  const cameras = views.frames.filter(
    ({ file }) =>
      file.endsWith(".clay.png") && scopes.some((s) => file.startsWith(s)),
  );
  if (cameras.length === 0)
    throw new Error("No archived replay camera selected");
  const name = "archived-assembly";
  const begin = performance.now();
  const result = realizeAutoMovieConstruction(
    { name, root: construction.root, fills: construction.fills },
    { chord: 0.001, sources },
  );
  console.log(
    JSON.stringify({
      stage: "realization",
      milliseconds: performance.now() - begin,
      triangles: result.mesh.indices.length / 3,
      diagnostics: result.diagnostics,
    }),
  );
  const { positions, indices } = result.mesh;
  if (indices.length === 0)
    throw new Error("The archived assembly has no skin to render");
  const mesh: N.Mesh = {
    id: name,
    positions,
    indices,
    colour: [0.64, 0.65, 0.67],
  };
  const guides: N.Curve[] = result.chains.flatMap((chain) => {
    const first = chain.layers[0]!.y;
    const last = chain.layers.at(-1)!.y;
    const phases = [0, Math.PI / 2];
    const rows = Array.from({ length: 32 }, (_, i) => {
      const at = AutoMovieLoftChain.sampler(
        chain,
        first + ((last - first) * i) / 31,
      );
      return phases.map((phase) => at(phase).map((mm) => mm / 1000) as N.Point);
    });
    return phases.map((phase, i) => ({
      id: chain.name + "." + phase,
      points: rows.map((row) => row[i]!),
      closed: false,
      colour: "b42d3a",
    }));
  });
  await mkdir(out, { recursive: true });
  Raster.initialize();
  const frames = [];
  for (const { file, camera: original, scope } of cameras) {
    const hand = /^hand\.(left|right)$/.exec(scope)?.[1];
    const camera =
      frameHands && (hand === "left" || hand === "right")
        ? handCamera(result.mesh, original, hand)
        : original;
    for (const pass of ["clay", "curves-over-clay"] as const) {
      const saved = await Frame.write(
        null,
        out,
        file.replace(/clay\.png$/, pass + ".png"),
        camera,
        [mesh],
        pass === "clay" ? [] : guides,
        "depth",
        name,
        pass,
        scope,
        {
          stage: pass,
          realization: "mesh-returned",
          diagnosticCount: result.diagnostics.length,
        },
      );
      frames.push({ ...saved, camera, retargeted: camera !== original });
    }
  }
  const hash = (data: Buffer) =>
    createHash("sha256").update(data).digest("hex");
  await writeFile(
    path.join(out, "receipt.json"),
    JSON.stringify(
      {
        constructionHash: hash(constructionBytes!),
        placementHash: hash(placementBytes!),
        cameraHash: hash(cameraBytes!),
        triangles: indices.length / 3,
        diagnostics: result.diagnostics,
        frames,
      },
      null,
      2,
    ) + "\n",
  );
}

/**
 * Move a saved camera to the actual hand while preserving its orientation and
 * scale.
 */
function handCamera(
  mesh: IAutoMovieConstructionRealization.IMesh,
  camera: N.Camera,
  side: "left" | "right",
): N.Camera {
  const axes = [camera.right, camera.up, camera.back];
  const bounds = axes.map(() => ({ low: Infinity, high: -Infinity }));
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const owner = mesh.owners[mesh.coordinates[i]!];
    const z = mesh.positions[i + 2]!;
    if (
      z > 0 !== (side === "left") ||
      owner === undefined ||
      !/^(hand|finger\.[^.]+)(\.mirror)?$/.test(owner)
    )
      continue;
    const point: N.Point = [mesh.positions[i]!, mesh.positions[i + 1]!, z];
    axes.forEach((axis, j) => {
      const target = Camera.dot(point, axis);
      const bound = bounds[j]!;
      bound.low = Math.min(bound.low, target);
      bound.high = Math.max(bound.high, target);
    });
  }
  if (bounds.some(({ low }) => !Number.isFinite(low)))
    throw new Error("The archive contains no indexed hand for " + side);
  const mid = bounds.map(({ low, high }) => (low + high) / 2);
  const target = [0, 1, 2].map((k) =>
    axes.reduce((sum, axis, i) => sum + axis[k]! * mid[i]!, 0),
  ) as N.Point;
  return { ...camera, target };
}

const [construction, placement, cameras, out, ...scopes] =
  process.argv.slice(2);
if (!construction || !placement || !cameras || !out || !scopes.length)
  throw new Error(
    "Supply a construction, placement, camera receipt, output and view scopes",
  );
void capture(
  construction,
  placement,
  cameras,
  out,
  scopes.filter((s) => s !== "--frame-hands"),
  scopes.includes("--frame-hands"),
).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
