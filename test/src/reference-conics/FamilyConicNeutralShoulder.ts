import {
  AutoMovieSolidChain,
  AutoMovieSolidVector as V,
  meshOf,
} from "@automovie/engine";
import { buildHumanNeutralCapture } from "@automovie/human/capture";
import fs from "node:fs/promises";
import path from "node:path";

import { FamilyConicCaptureFrame as Frame } from "./FamilyConicCaptureFrame";
import { FamilyConicMpfbArmscye as Armscye } from "./FamilyConicMpfbArmscye";
import { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";
import { NodeCanvasCamera as Camera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/** Matched anatomical views of the actual neutral shoulder and public skin. */
export async function captureNeutralShoulders(
  out: string,
  asset?: string,
  meridianFile?: string,
): Promise<void> {
  const source = await Mpfb.load(asset);
  const publicGuide = Armscye.guide(source, Armscye.measure(source));
  const reference = registration(
    {
      id: "mpfb.hm08.left",
      positions: Array.from(source.body.positions, (mm) => mm / 1000),
      indices: Array.from(source.body.indices),
      colour: [0.64, 0.65, 0.67],
    },
    publicGuide.points.map((point) => V.scale(point, 1 / 1000)),
    1,
  );
  const body =
    meridianFile === undefined ? buildHumanNeutralCapture.inspect() : undefined;
  const meridians =
    meridianFile === undefined ? [] : await readMeridians(meridianFile);
  await fs.mkdir(out, { recursive: true });
  NodeCanvasRaster.initialize();
  const reports = [];
  for (const side of ["left", "right"] as const) {
    const candidate =
      body === undefined
        ? meridians.find((item) => item.side === side)?.part
        : actual(body, side);
    if (candidate === undefined)
      throw new Error(`No requested ${side} shoulder capture`);
    const neutral = registration(
      { ...candidate.mesh, colour: reference.mesh.colour },
      candidate.guide,
      side === "left" ? 1 : -1,
    );
    const ring = [...reference.curve.points, ...neutral.curve.points];
    const below = (points: readonly N.Point[]): readonly N.Point[] =>
      points.filter((point) => point[1] < 0);
    const lower = [
      ...below(reference.curve.points),
      ...below(neutral.curve.points),
    ];
    const cameras = [
      Camera.fitAnnotated("front", [1, 0, 0], [0, 1, 0], ring, 760, 760),
      Camera.fitAnnotated("back", [-1, 0, 0], [0, 1, 0], ring, 760, 760),
      Camera.fitAnnotated("below", [0, -1, 0], [1, 0, 0], ring, 760, 760),
      Camera.fitAnnotated(
        "axilla-close",
        [1, -1, 1],
        [0, 1, 0],
        lower,
        760,
        760,
      ),
    ];
    for (const camera of cameras)
      for (const [subject, result] of [
        [body === undefined ? "physicalLoop" : "neutral", neutral],
        ["reference", reference],
      ] as const)
        for (const guide of [false, true]) {
          const pass = guide ? "guides" : "clay";
          const file = `${side}.${camera.name}.${subject}.${pass}.png`;
          reports.push(
            await Frame.write(
              null,
              out,
              file,
              camera,
              [result.mesh],
              guide ? [result.curve] : [],
              "depth",
              `${subject} | ${side} shoulder | ${camera.name}`,
              pass,
              `shoulder.${side}`,
              undefined,
              subject,
            ),
          );
        }
  }
  await fs.writeFile(
    path.join(out, "receipt.json"),
    JSON.stringify(
      {
        reports,
        diagnostics: body?.diagnostics,
        topology: body?.topology,
        trianglesByOwner: body?.trianglesByOwner,
        meridianFile,
      },
      null,
      2,
    ),
  );
}

type Side = "left" | "right";
type Part = { mesh: N.Mesh; guide: N.Point[] };

function actual(
  body: ReturnType<typeof buildHumanNeutralCapture.inspect>,
  side: Side,
): Part {
  const name = `blend.arm.${side}.trunk`;
  const chain = body.calibration.chains.find(
    (candidate) => candidate.name === name,
  );
  const surface =
    body.solidSurfaces.get(name) ??
    (chain === undefined ? null : AutoMovieSolidChain.surface(chain));
  if (surface === null || surface.domain === undefined)
    throw new Error(`The actual neutral skin has no ${name} chart`);
  const flex = (surface.domain[0] + surface.domain[1]) / 2;
  const guide = Array.from({ length: 64 }, (_, i) =>
    V.scale(
      surface.jet(flex, ((surface.period ?? 2 * Math.PI) * i) / 64).p,
      1 / 1000,
    ),
  );
  const { positions, indices, normals } = body.mesh;
  if (indices === null)
    throw new Error("The neutral shoulder inspection needs indexed skin");
  return {
    mesh: {
      id: name,
      positions,
      indices,
      ...(normals === null ? {} : { normals }),
      colour: [0.64, 0.65, 0.67],
    },
    guide,
  };
}

async function readMeridians(
  file: string,
): Promise<{ side: Side; part: Part }[]> {
  const report = (await fs.readFile(file, "utf8")).trim().split(/\r?\n/u);
  return report.flatMap((line) => {
    const { side, physicalLoop } = JSON.parse(line) as {
      side: Side;
      physicalLoop?: {
        guide: N.Point[];
        skin: Pick<N.Mesh, "positions" | "indices">;
      };
    };
    if (physicalLoop === undefined) return [];
    return [
      {
        side,
        part: {
          mesh: {
            id: `ansur.meridians.${side}`,
            ...physicalLoop.skin,
            colour: [0.64, 0.65, 0.67],
          },
          guide: physicalLoop.guide.map((point) => V.scale(point, 1 / 1000)),
        },
      },
    ];
  });
}
/**
 * Recenter each actual loop at its centroid. Reflection presents the right from
 * the same anatomical view as the left. Crop beyond one loop diameter.
 */
function registration(
  mesh: N.Mesh,
  points: N.Point[],
  side: 1 | -1,
): { mesh: N.Mesh; curve: N.Curve } {
  const centre = V.scale(
    points.reduce((sum, point) => V.add(sum, point), [0, 0, 0]),
    1 / points.length,
  );
  const move = (point: N.Point): N.Point => [
    point[0] - centre[0],
    point[1] - centre[1],
    side * (point[2] - centre[2]),
  ];
  const loop = points.map(move);
  const reach = 2 * Math.max(...loop.map(V.norm));
  const positions: number[] = [];
  const near: boolean[] = [];
  for (let at = 0; at < mesh.positions.length; at += 3) {
    const point = move([
      mesh.positions[at]!,
      mesh.positions[at + 1]!,
      mesh.positions[at + 2]!,
    ]);
    positions.push(...point);
    near.push(V.norm(point) <= reach);
  }
  const indices: number[] = [];
  for (let at = 0; at < mesh.indices.length; at += 3) {
    const [a, b, c] = [
      mesh.indices[at]!,
      mesh.indices[at + 1]!,
      mesh.indices[at + 2]!,
    ];
    if (near[a] || near[b] || near[c])
      indices.push(a, side > 0 ? b : c, side > 0 ? c : b);
  }
  const normals =
    mesh.normals?.map((value, index) =>
      index % 3 === 2 ? side * value : value,
    ) ??
    meshOf(positions, indices).normals ??
    undefined;
  return {
    mesh: {
      ...mesh,
      positions,
      indices,
      ...(normals === undefined ? {} : { normals }),
    },
    curve: { id: `${mesh.id}.armscye`, points: loop, closed: true },
  };
}

if (
  /^FamilyConicNeutralShoulder\.[cm]?[jt]s$/u.test(
    path.basename(process.argv[1] ?? ""),
  )
) {
  const out = process.argv[2];
  if (out === undefined)
    throw new Error(
      "Usage: FamilyConicNeutralShoulder <output-directory> [exact-hm08-obj] [--meridians=<source-report>]",
    );
  const inputs = process.argv.slice(3);
  const meridians = inputs
    .find((arg) => arg.startsWith("--meridians="))
    ?.slice("--meridians=".length);
  const asset = inputs.find((arg) => !arg.startsWith("--"));
  void captureNeutralShoulders(out, asset, meridians).catch(
    (error: unknown): void => {
      console.error(error);
      process.exitCode = 1;
    },
  );
}
