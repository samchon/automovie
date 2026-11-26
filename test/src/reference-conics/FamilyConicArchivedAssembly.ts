import {
  AutoMovieLoftChain,
  AutoMovieSolidVector,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import { AutoMovieHumanConicLoft } from "@automovie/human";
import type {
  IAutoMovieConstruction,
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionNode,
  IAutoMovieConstructionPort,
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
  shoulder: "left" | "right" | undefined,
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
  const scoped =
    shoulder === undefined
      ? undefined
      : shoulderRoot(construction.root, shoulder);
  const name = "archived-assembly";
  const begin = performance.now();
  const result = realizeAutoMovieConstruction(
    scoped === undefined
      ? { name, root: construction.root, fills: construction.fills }
      : { name, root: scoped.root },
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
  const edges =
    scoped === undefined ? undefined : shoulderEdges(result, scoped.port.band);
  const radial =
    scoped === undefined
      ? undefined
      : shoulderRadialReadings(
          result,
          scoped.port,
          sources.get(scoped.port.partFace)!,
        );
  const guides: N.Curve[] =
    edges ??
    result.chains.flatMap((chain) => {
      const first = chain.layers[0]!.y;
      const last = chain.layers.at(-1)!.y;
      const phases = [0, Math.PI / 2];
      const rows = Array.from({ length: 32 }, (_, i) => {
        const at = AutoMovieLoftChain.sampler(
          chain,
          first + ((last - first) * i) / 31,
        );
        return phases.map(
          (phase) => at(phase).map((mm) => mm / 1000) as N.Point,
        );
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
    const camera = edges?.length
      ? frameCamera(
          original,
          edges.flatMap(({ points }) => points),
        )
      : frameHands && (hand === "left" || hand === "right")
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
        ...(scoped === undefined
          ? {}
          : { operators: [scoped.port.name, scoped.root.name], radial }),
        triangles: indices.length / 3,
        diagnostics: result.diagnostics,
        frames,
      },
      null,
      2,
    ) + "\n",
  );
}

/** Isolate the historical port and its cutter, keeping all three source leaves. */
function shoulderRoot(
  root: IAutoMovieConstructionNode,
  side: "left" | "right",
) {
  const suffix = side === "right" ? ".mirror" : "";
  const find = (
    node: IAutoMovieConstructionNode,
    name: string,
  ): IAutoMovieConstructionNode => {
    if (node.name === name) return node;
    if ("host" in node) return find(node.host, name);
    throw new Error("Archive lacks shoulder ancestor " + name);
  };
  const cut = find(root, "cut.axilla" + suffix);
  if (
    cut.type !== "join" ||
    cut.host.type !== "port" ||
    cut.host.name !== "armscye.arm" + suffix
  )
    throw new Error(
      "Archive does not declare the original armscye and axilla cutter",
    );
  const port: IAutoMovieConstructionPort = cut.host;
  const host = find(port.host, port.hostFace);
  const part = find(port.part, port.partFace);
  const isolated: IAutoMovieConstructionJoin = {
    ...cut,
    host: { ...port, host, part },
  };
  return { root: isolated, port };
}

/**
 * Read the original parent line in the child's proximal section planes. A
 * missing or ambiguous station and a reversed radial projection are separate
 * observations. Station brackets are sampled at the original arm layers.
 */
function shoulderRadialReadings(
  result: IAutoMovieConstructionRealization.IRealization,
  port: IAutoMovieConstructionPort,
  arm: IAutoMovieViewPart,
) {
  const band = result.surfaces.find(({ name }) => name === port.band);
  if (band === undefined) return null;
  const { add, cross, dot, scale, sub, unit } = AutoMovieSolidVector;
  const reach =
    arm.stations[0]! + 1000 * Math.max(...(port.rails ?? [port.rail]));
  const planes = [
    0,
    ...arm.stations.filter((s) => s > 0 && s < reach),
    reach,
  ].map((station) => {
    const frame = arm.axis.at(station);
    return { station, origin: frame.origin, normal: cross(frame.u, frame.v) };
  });
  return Array.from({ length: port.count }, (_, i) => {
    const clock = (i * 2 * Math.PI) / port.count;
    const host = band.jet(0, clock);
    const heights = planes.map(({ origin, normal }) =>
      dot(sub(host.p, origin), normal),
    );
    const stations = planes.flatMap(({ station }, k) => {
      const height = heights[k]!;
      if (height === 0) return [station];
      const after = heights[k + 1];
      if (after === undefined || height * after >= 0) return [];
      let low = station;
      let high = planes[k + 1]!.station;
      for (;;) {
        const mid = (low + high) / 2;
        if (mid === low || mid === high) return [mid];
        const frame = arm.axis.at(mid);
        const value = dot(sub(host.p, frame.origin), cross(frame.u, frame.v));
        if (value === 0) return [mid];
        if (Math.sign(value) === Math.sign(height)) low = mid;
        else high = mid;
      }
    });
    const station = stations[0];
    if (stations.length !== 1 || station === undefined)
      return { clock, stationCandidates: stations };
    const child = arm.axis.jet?.(station);
    const normal = unit(cross(host.u, host.v));
    if (child === undefined || child === null || normal === null)
      return { clock, station, regular: false };
    const radial = sub(host.p, child.value.origin);
    const x = dot(radial, child.value.u);
    const y = dot(radial, child.value.v);
    const radius = Math.hypot(x, y);
    if (radius === 0) return { clock, station, regular: false };
    const ray = scale(
      add(scale(child.value.u, x), scale(child.value.v, y)),
      1 / radius,
    );
    const moving = add(
      child.first.origin,
      add(scale(child.first.u, x), scale(child.first.v, y)),
    );
    const projection = band.orientation * dot(normal, ray);
    const numerator = -band.orientation * dot(normal, moving);
    return {
      clock,
      station,
      radius,
      sectionPhase: Math.atan2(y, x),
      projection,
      slope: projection === 0 ? null : numerator / projection,
      planeResidual: Math.abs(dot(radial, cross(child.value.u, child.value.v))),
    };
  });
}

/** Read the published positions of the actual port boundary and trimmed cycles. */
function shoulderEdges(
  result: IAutoMovieConstructionRealization.IRealization,
  band: string,
): N.Curve[] {
  const face = result.body.faces.find(({ chain }) => chain === band);
  if (face === undefined) return [];
  const surfaces = new Map(
    result.surfaces.map((surface) => [surface.name, surface]),
  );
  return [...(face.domainLoops ?? []), ...face.cycles].map((cycle, i) => ({
    id: band + "." + i,
    closed: true,
    colour: "b42d3a",
    points: cycle.points.map((index) => {
      const { chain, chart } = result.body.points[index]!;
      const surface = surfaces.get(chain)!;
      const point = surface.point?.(...chart) ?? surface.jet(...chart).p;
      return point.map((mm) => mm / 1000) as N.Point;
    }),
  }));
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
  const points: N.Point[] = [];
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const owner = mesh.owners[mesh.coordinates[i]!];
    const z = mesh.positions[i + 2]!;
    if (
      z > 0 !== (side === "left") ||
      owner === undefined ||
      !/^(hand|finger\.[^.]+)(\.mirror)?$/.test(owner)
    )
      continue;
    points.push([mesh.positions[i]!, mesh.positions[i + 1]!, z]);
  }
  if (points.length === 0)
    throw new Error("The archive contains no indexed hand for " + side);
  return frameCamera(camera, points);
}

function frameCamera(camera: N.Camera, points: readonly N.Point[]): N.Camera {
  const axes = [camera.right, camera.up, camera.back];
  const bounds = axes.map(() => ({ low: Infinity, high: -Infinity }));
  for (const point of points) {
    axes.forEach((axis, j) => {
      const target = Camera.dot(point, axis);
      const bound = bounds[j]!;
      bound.low = Math.min(bound.low, target);
      bound.high = Math.max(bound.high, target);
    });
  }
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
const shoulder = scopes
  .find((scope) => scope.startsWith("--shoulder="))
  ?.slice(11);
if (shoulder !== undefined && shoulder !== "left" && shoulder !== "right")
  throw new Error("Choose --shoulder=left or --shoulder=right");
void capture(
  construction,
  placement,
  cameras,
  out,
  scopes.filter((s) => !s.startsWith("--")),
  scopes.includes("--frame-hands"),
  shoulder,
).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
