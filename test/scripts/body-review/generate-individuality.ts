/**
 * Author the individuality channels: the traits of a real body that the
 * source's regional fat, muscle, scale and volume controls do not express,
 * each a procedural displacement field on the neutral surface, published as
 * sparse endpoint rows the way every source channel is.
 *
 * Usage, from the repository root:
 *
 *   pnpm exec ttsx -P test/tsconfig.scripts.json test/scripts/body-review/generate-individuality.ts -- [output-dir] [--basis path]
 *
 * This is a field engine over `individualityParameters.ts`, which holds
 * every trait as numbers: (1) a tissue mask read off the endpoint the source
 * already authored over that anatomy, so the new trait ends where the
 * source's own falloff ends, or gates over the surface, (2) a coordinate
 * over that mask, polar between its rims, geodesic from an anatomical point,
 * a height above an anchor or the mask itself, and (3) displacement terms
 * along the normal or gravity with a profile over the coordinate, or a
 * relief of grooves and ridges along skin curves. Right-side endpoints are
 * the exact mirror of the left. Nothing here writes into `test/studies`;
 * `merge-individuality.ts` publishes the result after the census read it.
 */
import type { IAutoMovieHumanBodyBasis } from "@automovie/human";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import {
  type Field,
  type IMesh,
  alongCurve,
  bell,
  geodesic,
  maskOf,
  meshOf,
  mirrored,
  normal,
  polar,
  position,
  rimOf,
  rowsOf,
  smooth,
  smoothstep,
} from "./individualityFields";
import {
  ANCHORS,
  type Anchor,
  type Coordinate,
  type ICurveTerm,
  type IEndpointSpec,
  type IGate,
  type IRimSelection,
  type ISkinPoint,
  type ITraitSpec,
  type Profile,
  TRAITS,
} from "./individualityParameters";
import { vertexNormals } from "./poseCorrectiveSolver";

const ROOT = path.resolve(__dirname, "../../..");
const STUDY = path.join(ROOT, "test/studies/human-body/connected-basis");
/** A vertex facing the camera side less than this is not on that face of the body. */
const FACING = 0.5;
/** A displacement below this, metres, is not worth a row. */
const ROW_THRESHOLD = 1e-6;

type Channel = IAutoMovieHumanBodyBasis["channels"][number];

/** The anchors every parameter is measured from, resolved once per basis. */
type IAnchors = Record<Exclude<Anchor, "mask">, number[]>;

/** The evaluation context of one trait: its mesh, anchors, mask and coordinate. */
interface IContext {
  mesh: IMesh;
  anchors: IAnchors;
  mask: Field;
  maskHeight: number;
  coordinate: Field | null;
}

const anchorOf = (context: IContext, anchor: Anchor | undefined): number[] =>
  anchor === undefined
    ? [0, 0, 0]
    : anchor === "mask"
      ? [0, context.maskHeight, 0]
      : context.anchors[anchor];

/** The quantity a gate steps over, at one vertex. */
function measureOf(context: IContext, gate: IGate, v: number): number {
  const p = position(context.mesh, v);
  const n = normal(context.mesh, v);
  const origin = anchorOf(context, gate.anchor);
  switch (gate.measure) {
    case "height":
      return p[1] - origin[1];
    case "absX":
      return Math.abs(p[0] - origin[0]);
    case "normalX":
      return n[0];
    case "absNormalX":
      return Math.abs(n[0]);
    case "normalZ":
      return n[2];
    case "backwardNormalZ":
      return -n[2];
  }
}

const gatesOf = (context: IContext, gates: IGate[], v: number): number =>
  gates.reduce(
    (weight, gate) =>
      weight * smoothstep(gate.from, gate.to, measureOf(context, gate, v)),
    1,
  );

function profileOf(profile: Profile, t: number): number {
  switch (profile.kind) {
    case "plateau":
      return (
        smoothstep(0, profile.rise, t) * (1 - smoothstep(profile.fall, 1, t))
      );
    case "bell":
      return bell(profile.centre, profile.sigma, t);
    case "step":
      return smoothstep(profile.from, profile.to, t);
    case "constant":
      return 1;
  }
}

/** The weighted mean height of a field. */
function heightOf(mesh: IMesh, field: Field): number {
  let sum = 0;
  let weight = 0;
  for (let v = 0; v < mesh.vertices; v++) {
    sum += field[v] * mesh.surface.positions[v * 3 + 1];
    weight += field[v];
  }
  return weight > 0 ? sum / weight : 0;
}

/** The seeds a rim selection names, on a mask. */
function seedsOf(context: IContext, selection: IRimSelection): number[] {
  const { mesh, mask } = context;
  const threshold =
    selection.height === undefined
      ? context.maskHeight
      : anchorOf(context, selection.anchor)[1] + selection.height;
  const candidates = selection.interior
    ? [...new Array(mesh.vertices).keys()].filter((v) => mask[v] > 0)
    : rimOf(mesh, mask);
  return candidates.filter((v) => {
    const y = mesh.surface.positions[v * 3 + 1];
    return selection.side === "all"
      ? true
      : selection.side === "below"
        ? y < threshold
        : y >= threshold;
  });
}

function coordinateOf(context: IContext, spec: Coordinate): Field {
  const { mesh, mask } = context;
  switch (spec.kind) {
    case "polar":
      return polar(
        mesh,
        mask,
        seedsOf(context, spec.lower),
        seedsOf(context, spec.upper),
      );
    case "mask":
      return mask;
    case "height": {
      const origin = anchorOf(context, spec.anchor)[1];
      const field = new Float64Array(mesh.vertices);
      for (let v = 0; v < mesh.vertices; v++)
        field[v] = mesh.surface.positions[v * 3 + 1] - origin;
      return field;
    }
    case "lateralPoint": {
      const origin = anchorOf(context, spec.anchor);
      let centre = -1;
      for (let v = 0; v < mesh.vertices; v++) {
        const p = position(mesh, v);
        if (
          Math.abs(p[1] - (origin[1] + spec.height)) > spec.halfHeight ||
          Math.abs(p[2] - origin[2]) > spec.halfDepth
        )
          continue;
        if (centre < 0 || p[0] > mesh.surface.positions[centre * 3]) centre = v;
      }
      if (centre < 0) throw new Error("no skin in the lateral point's slab");
      return geodesic(mesh, [centre], null);
    }
  }
}

/** A skin point: the anchor offset, projected onto the nearest front- or back-facing vertex. */
function skinPointOf(
  context: IContext,
  point: ISkinPoint,
  side: 1 | -1,
): number[] {
  const { mesh } = context;
  const origin = anchorOf(context, point.anchor);
  const x = side * (Math.abs(origin[0]) + point.x);
  const y = origin[1] + point.y;
  const z = origin[2] + (point.z ?? 0);
  let best = -1;
  let bestDistance = Infinity;
  for (let v = 0; v < mesh.vertices; v++) {
    if (point.project !== "nearest") {
      const facing =
        mesh.normals[v * 3 + 2] * (point.project === "front" ? 1 : -1);
      if (facing < FACING) continue;
    }
    const p = position(mesh, v);
    const distance =
      point.project === "nearest"
        ? Math.hypot(p[0] - x, p[1] - y, p[2] - z)
        : Math.hypot(p[0] - x, p[1] - y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = v;
    }
  }
  return position(mesh, best);
}

/** The signed relief of one curve set on one side, per vertex, and its groove field. */
function reliefOf(
  context: IContext,
  curves: ICurveTerm[],
  side: 1 | -1,
): { relief: Field; groove: Field } {
  const { mesh } = context;
  const relief = new Float64Array(mesh.vertices);
  const groove = new Float64Array(mesh.vertices);
  for (const curve of curves) {
    const copies = curve.repeat?.count ?? 1;
    const step = curve.repeat?.step ?? [0, 0, 0];
    for (let copy = 0; copy < copies; copy++) {
      const points = curve.points.map((point) =>
        skinPointOf(
          context,
          {
            ...point,
            x: point.x + step[0] * copy,
            y: point.y + step[1] * copy,
            z: (point.z ?? 0) + step[2] * copy,
          },
          side,
        ),
      );
      const { distance } = alongCurve(
        mesh,
        points.length === 1 ? [points[0], points[0]] : points,
      );
      for (let v = 0; v < mesh.vertices; v++) {
        if (!Number.isFinite(distance[v])) continue;
        const shape =
          bell(0, curve.sigma, distance[v]) *
          gatesOf(context, curve.gates ?? [], v);
        relief[v] += curve.amplitude * shape;
        groove[v] += shape;
      }
    }
  }
  // where curves cross, the groove is one groove, not the sum of two
  for (let v = 0; v < mesh.vertices; v++)
    if (groove[v] > 1) {
      relief[v] /= groove[v];
      groove[v] = 1;
    }
  return { relief, groove };
}

/** The displacement map of one endpoint under the trait's context. */
function endpointOf(
  context: IContext,
  spec: IEndpointSpec,
): Map<number, number[]> {
  const { mesh, mask, coordinate } = context;
  const out = new Map<number, number[]>();
  const push = (v: number, d: number[]): void => {
    if (Math.hypot(d[0], d[1], d[2]) < ROW_THRESHOLD) return;
    const here = out.get(v) ?? [0, 0, 0];
    out.set(v, [here[0] + d[0], here[1] + d[1], here[2] + d[2]]);
  };
  for (const term of spec.terms ?? []) {
    if (coordinate === null)
      throw new Error("a term needs a coordinate: " + spec.id);
    for (let v = 0; v < mesh.vertices; v++) {
      if (mask[v] <= 0) continue;
      const weight =
        mask[v] *
        term.amplitude *
        profileOf(term.profile, coordinate[v]) *
        gatesOf(context, term.gates ?? [], v);
      const direction =
        term.direction === "normal"
          ? normal(mesh, v)
          : term.direction === "up"
            ? [0, 1, 0]
            : [0, -1, 0];
      push(
        v,
        direction.map((one) => one * weight),
      );
    }
  }
  if (spec.relief !== undefined) {
    const sides: (1 | -1)[] = spec.relief.bothSides ? [1, -1] : [1];
    for (const side of sides) {
      const { relief, groove } = reliefOf(context, spec.relief.curves, side);
      for (let v = 0; v < mesh.vertices; v++) {
        if (mask[v] <= 0) continue;
        const raise =
          spec.relief.raise === undefined
            ? 0
            : spec.relief.raise.amplitude *
              (1 - Math.min(1, groove[v])) *
              gatesOf(context, spec.relief.raise.gates, v);
        const size = mask[v] * (relief[v] + raise);
        push(
          v,
          normal(mesh, v).map((one) => one * size),
        );
      }
    }
  }
  return out;
}

/** The context of one trait: its mask, the mask's height and its coordinate. */
function contextOf(
  mesh: IMesh,
  anchors: IAnchors,
  targets: Record<string, number[]>,
  spec: ITraitSpec,
): IContext {
  let mask: Field;
  if (spec.region.endpoint !== undefined) {
    const rows = targets[spec.region.endpoint];
    if (rows === undefined)
      throw new Error("no source endpoint " + spec.region.endpoint);
    mask = maskOf(mesh, rows, spec.region.floor ?? 0);
    if (spec.region.smooth !== undefined)
      mask = smooth(
        mesh,
        mask,
        spec.region.smooth.sweeps,
        spec.region.smooth.relax,
      );
  } else mask = new Float64Array(mesh.vertices).fill(1);
  // the region's gates may be offset from the mask's own height, which is
  // read before they apply
  const partial: IContext = {
    mesh,
    anchors,
    mask,
    maskHeight: heightOf(mesh, mask),
    coordinate: null,
  };
  const gated = new Float64Array(mesh.vertices);
  for (let v = 0; v < mesh.vertices; v++)
    gated[v] = mask[v] * gatesOf(partial, spec.region.gates, v);
  const context: IContext = {
    ...partial,
    mask: gated,
    maskHeight: heightOf(mesh, gated),
  };
  context.coordinate =
    spec.coordinate === undefined
      ? null
      : coordinateOf(context, spec.coordinate);
  return context;
}

function channelsOf(spec: ITraitSpec): Channel[] {
  const envelope = {
    minimum: spec.negative === undefined ? 0 : -1,
    maximum: 1,
  };
  if (!spec.mirrored)
    return [
      {
        id: spec.id,
        kind: "shape",
        group: spec.group,
        mirror: null,
        ...envelope,
        positive: spec.positive.id,
        negative: spec.negative?.id ?? null,
      },
    ];
  const right = (endpoint: string): string => endpoint.replace("/l-", "/r-");
  return [
    {
      id: `${spec.id}Left`,
      kind: "shape",
      group: spec.group,
      mirror: `${spec.id}Right`,
      ...envelope,
      positive: spec.positive.id,
      negative: spec.negative?.id ?? null,
    },
    {
      id: `${spec.id}Right`,
      kind: "shape",
      group: spec.group,
      mirror: `${spec.id}Left`,
      ...envelope,
      positive: right(spec.positive.id),
      negative: spec.negative === undefined ? null : right(spec.negative.id),
    },
  ];
}

function main(): void {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const basisPath = args.includes("--basis")
    ? path.resolve(args[args.indexOf("--basis") + 1])
    : path.join(STUDY, "basis.json.gz");
  const output = path.resolve(
    args.filter(
      (arg, at) => !arg.startsWith("--") && args[at - 1] !== "--basis",
    )[0] ?? path.join(ROOT, ".shots/body-review/individuality"),
  );
  fs.mkdirSync(output, { recursive: true });
  const basis: IAutoMovieHumanBodyBasis = JSON.parse(
    zlib.gunzipSync(fs.readFileSync(basisPath)).toString("utf8"),
  );
  const surface = basis.surfaces[0];
  const mesh = meshOf(
    surface,
    vertexNormals(surface.positions, surface.indices),
  );
  const landmark = (id: string): number[] => {
    const at = basis.landmarks.ids.indexOf(id);
    if (at < 0) throw new Error(`no landmark ${id}`);
    return basis.landmarks.positions.slice(at * 3, at * 3 + 3);
  };
  const anchorOf = (rule: (typeof ANCHORS)[keyof typeof ANCHORS]): number[] =>
    "landmark" in rule
      ? landmark(rule.landmark)
      : [
          0,
          heightOf(
            mesh,
            maskOf(mesh, surface.targets[rule.endpoint], rule.floor),
          ),
          0,
        ];
  const anchors = Object.fromEntries(
    Object.entries(ANCHORS).map(([name, rule]) => [name, anchorOf(rule)]),
  ) as IAnchors;
  const channels: Channel[] = [];
  const rows: Record<string, number[]> = {};
  const stats: Record<string, { vertices: number; mostMetres: number }> = {};
  for (const spec of TRAITS) {
    const context = contextOf(mesh, anchors, surface.targets, spec);
    channels.push(...channelsOf(spec));
    for (const endpoint of [spec.positive, spec.negative])
      if (endpoint !== undefined) {
        const left = rowsOf(endpointOf(context, endpoint));
        rows[endpoint.id] = left;
        if (spec.mirrored)
          rows[endpoint.id.replace("/l-", "/r-")] = mirrored(mesh, left);
      }
  }
  for (const [id, list] of Object.entries(rows)) {
    let most = 0;
    for (let at = 0; at < list.length; at += 4)
      most = Math.max(
        most,
        Math.hypot(list[at + 1], list[at + 2], list[at + 3]),
      );
    stats[id] = { vertices: list.length / 4, mostMetres: most };
    console.log(
      id.padEnd(40),
      String(list.length / 4).padStart(6),
      (most * 1000).toFixed(1),
      "mm",
    );
  }
  fs.writeFileSync(
    path.join(output, "individuality.json"),
    JSON.stringify({ basis: basis.id, channels, rows, stats }),
  );
}

main();
