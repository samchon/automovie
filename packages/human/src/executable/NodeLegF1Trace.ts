import { AutoMovieMeshCourse, AutoMovieViewAxis } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanF1Fork } from "../generation/trunk/AutoMovieHumanF1Fork";
import type { CaptureModel } from "../inspection/CaptureModel";
import type { NodeCaptureSources } from "./NodeCaptureSources";
import { NodeLegF1Archive } from "./NodeLegF1Archive";
import { NodeLegF1Foot } from "./NodeLegF1Foot";
import { NodeLegF1Loft } from "./NodeLegF1Loft";
import { NodeLegF1Rings } from "./NodeLegF1Rings";
import { NodeTrunkCaptureSource } from "./NodeTrunkCaptureSource";
import { NodeTrunkReference } from "./NodeTrunkReference";

type V3 = NodeLegF1Archive.V3;
type V2 = NodeLegF1Archive.V2;
type Side = NodeLegF1Archive.Side;
type Frame = NodeLegF1Archive.Frame;
type ILegFork = NodeLegF1Loft.ILegFork;

/** The measured F1 limb sources and their world chart. */
const { DIGITS, archivePart, archivedAxis, chartLoop, place, world, scale, sub }: typeof NodeLegF1Archive = NodeLegF1Archive;

/** The existing native foot construction and measured boundaries. */
const { footBoundaries, nativeHalfSkin, nativeWeb, observedFootMidpoints, observedToeTip, sewWeb }: typeof NodeLegF1Foot = NodeLegF1Foot;

/** The conic and ordinary leg join, together with its original contour reader. */
const { joinedLoft }: typeof NodeLegF1Loft = NodeLegF1Loft;
const { sampleRay, sectionDeviation }: typeof NodeLegF1Rings = NodeLegF1Rings;
const Trace: typeof AutoMovieHumanF1Trace = AutoMovieHumanF1Trace;
const Geometry: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;

/**
 * Stage-one capture of the archived F1 leg and foot sections. Each cut keeps
 * its own plane and closed Hermite curve. The leg uses observed ordinary
 * strips and the measured native forefoot. Local foot and toe views retain
 * the conic intervals that admit their source sections.
 *
 * @evidence contracts/development/design.md#principled-representation The archive owns the sample origins, directions and Hermite rings. Its raw Z is reflected once to match the native capture mesh.
 * @evidence contracts/development/implementation.md#principled-implementation Evaluates the source Hermite arcs in the exact archived chart. Independent native cuts measure departures of the resulting surface.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing or refused sections remain in the diagnostics; a local capture never fills those intervals with fabricated rings.
 */
export namespace NodeLegF1Trace {
  /**
   * Prepares a leg comparison from its archived F1 planes and curves.
   *
   * @param name Capture part name.
   * @param side Capture side, matched to the archive by the native mesh.
   * @param context Shared capture inputs.
   * @param root The exact native root rim when building a digit for the sewn foot.
   * @returns Original guides, the assembled part surface and the native reference mesh.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and each capture layer.
   * @evidence contracts/development/implementation.md#principled-implementation The shared loft reads Hermite loops in their archived planes and checks the resulting surface against the native mesh.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refused station stays visible in the diagnostics and separates the readable intervals.
   */
  export async function prepare(name: string, side: Side, context: NodeCaptureSources.IContext, root?: V3[]): Promise<CaptureModel.IPart> {
    const source = await context.reference();
    const { family, variant, files, rows, portion, kneeStation } = archivePart(name, side);
    if (rows.length < 2) throw new Error(`${name}: fewer than two observed region planes`);
    const her = NodeTrunkReference.fromModel(source.model, 1);
    const mesh = { positions: her.points.flat(), indices: her.triangles.flat() };
    const frames = rows.map((row): Frame => ({
      origin: world(row.originMm),
      u: world(row.u),
      v: scale(world(row.v), -1),
    }));
    const stations = rows.map((row): number => row.stationMm);
    const axis = archivedAxis(stations, frames);
    const observations = new Map<number, V2[]>();
    for (const [i, row] of rows.entries()) {
      const loops = row.loops.filter((loop): boolean => loop.kind === "closed");
      if (loops.length === 1) observations.set(row.stationMm, chartLoop(loops[0]!.curve, frames[i]!));
    }
    const direction = side === "left" ? -1 : 1;
    const firstFrame = frames[0]!;
    let referenceStart = { centroid: firstFrame.origin as V3, normal: scale(AutoMovieViewAxis.normal(firstFrame) as V3, -1) };
    let boundary: V3[] | null = root ?? null;
    let legFork: ILegFork | undefined;
    let cuts = stations;
    if (portion === "leg") {
      const midline = NodeTrunkCaptureSource.midline(her.points);
      const fork = AutoMovieHumanF1Fork.read(mesh, midline);
      boundary = fork[side];
      referenceStart = fork.parentPlane;
      legFork = { parent: fork.parentPlane, half: side === "left" ? fork.leftPlane : fork.rightPlane, direction, midline };
      const { centroid, normal } = fork.parentPlane;
      const first = stations.findIndex((s): boolean => {
        const loop = observations.get(s);
        return loop !== undefined && loop.every((uv): boolean => {
          const p = place(axis.at(s), uv);
          return direction * (p[2] - midline) > 0 && Geometry.dot(sub(p, centroid), normal) < 0;
        });
      });
      if (first < 0) throw new Error(`${name}: no archived thigh loop lies entirely below its fork and on its own side`);
      cuts = stations.slice(first);
    }
    console.log(`${name}: archived ${files.join(", ")}, ${rows.length} exact planes, ${observations.size} unique closed sections`);
    const create = (name: string, stations: number[]): AutoMovieHumanF1Trace.IOutput =>
      Trace.create({ name, mesh, axis, cuts: stations, stations, order: 32, samples: 64 }, observations);
    const conicCuts = root === undefined ? cuts : cuts.slice(1);
    // The F1 thigh conic missed the native contour at every tested interior
    // cut and midpoint between the first independent thigh ring and the knee
    // boundary. The observed ordinary strip spans that entire interval.
    const full = portion === "leg" ? undefined : create(name, conicCuts);
    const runs = full === undefined ? [] : full.part === null ? admittedRuns(conicCuts, full) : [conicCuts];
    const traces = full === undefined ? [] : full.part === null ? runs.map((run, i) => create(`${name}.${i}`, run)) : [full];
    const chains = traces.flatMap((trace) => trace.loft?.chain ? [trace.loft.chain] : []);
    const lastFrame = frames[frames.length - 1]!;
    const tip = portion === "toe" ? observedToeTip(family, side, lastFrame, her) : undefined;
    const carriesForefoot = portion !== "toe";
    const footCuts = portion === "leg" ? observedFootMidpoints(rows, axis, mesh, observations) : [];
    const footRefinements = footCuts.filter((cut): boolean => cut.points > 0).map((cut): number => cut.station);
    // The last two archive cuts have a double ray. The native web starts at
    // the actual last regular section and contains the skin through both cuts.
    const hostCuts = portion === "leg" ? cuts.slice(0, -2) : cuts;
    const seedStation = hostCuts[hostCuts.length - 1]!;
    const observedPorts = carriesForefoot
      ? footBoundaries(side, axis.at(seedStation), observations.get(seedStation)!, mesh)
      : { ports: [], diagnostics: [] };
    const { ports } = observedPorts;
    const diagnostics = [
      `Archived ${family}-${variant} native planes and loops, ${rows.length} stations, ${observations.size} unique closed sections; ${chains.length}/${traces.length} conic intervals lofted.`,
      ...(full?.diagnostics ?? []),
      ...traces.flatMap((trace, i): string[] => {
        const between = trace.layers.filter((layer): boolean => layer.between && layer.fault === null);
        const worst = between.reduce<AutoMovieHumanF1Trace.ILayer | undefined>((a, b) => a === undefined || b.max > a.max ? b : a, undefined);
        const span = runs[i]!;
        return [
          `Interval ${i} [${span[0]!.toFixed(3)}, ${span[span.length - 1]!.toFixed(3)}] mm, ${trace.loft?.chain ? "lofted" : "refused"}; ${between.length} readable mid-stations, maximum ${worst === undefined ? "unavailable" : `${worst.max.toFixed(3)} mm at ${worst.station.toFixed(3)} mm`}.`,
          ...(trace === full ? [] : trace.diagnostics),
        ];
      }),
      portion === "leg"
        ? `First independent archive ring at ${cuts[0]!.toFixed(3)} mm; proximal boundary uses the trunk's observed ${side} fork ring, ${boundary!.length} exact points.`
        : `Local ${portion} interval [${cuts[0]!.toFixed(3)}, ${cuts[cuts.length - 1]!.toFixed(3)}] mm, with its observed root.`,
      ...(tip === undefined ? [] : [tip.diagnostic]),
      ...observedPorts.diagnostics,
      ...footCuts.map(({ station, label, points }): string => `${label} at ${station.toFixed(3)} mm: ${points === 0 ? "no regular strict native ring" : `${points} strict native cut points`}.`),
      ...ports.map((port): string => `${port.name}: ${port.points.length} native boundary points, observed-loop departure ${port.error.toFixed(3)} mm.`),
    ];
    let loft: CaptureModel.ILoft | undefined;
    let capAttached = false;
    if (carriesForefoot && ports.length === DIGITS.length + 1) {
      try {
        const web = nativeWeb(her, side, ports);
        const host = joinedLoft(chains.filter((chain): boolean => chain.layers[chain.layers.length - 1]!.y !== seedStation), hostCuts, observations, axis, boundary, mesh, diagnostics, undefined, web.seed, legFork, footRefinements);
        const toes = await Promise.all(web.roots.map((rim, i) => prepare(`toe.${side}.${i + 1}`, side, context, rim)));
        loft = sewWeb(host, web, toes, diagnostics);
      } catch (error: unknown) {
        diagnostics.push(`Native forefoot sewing refused: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (portion === "toe" && family.startsWith("littletoe_") && tip?.point === null) {
      try {
        const last = observations.get(cuts[cuts.length - 1]!)!;
        const cap = nativeHalfSkin(her, side, {
          name: "little toe terminal",
          frame: lastFrame,
          points: last.map((uv): V3 => place(lastFrame, uv)),
        });
        const host = joinedLoft(chains, cuts, observations, axis, boundary, mesh, diagnostics, null, cap.ring);
        loft = sewWeb(host, { skin: cap.skin, seed: cap.ring, roots: [] }, [], diagnostics, "little toe terminal");
        capAttached = true;
      } catch (error: unknown) {
        diagnostics.push(`Native little toe terminal sewing refused: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    loft ??= joinedLoft(chains, hostCuts, observations, axis, boundary, mesh, diagnostics, tip?.point, undefined, legFork, footRefinements);
    if (kneeStation !== undefined && loft.status === "available") {
      // Reuse the earlier lower-leg midpoint planes, including the interval
      // up to the original forefoot seed, to track where the seam error moves.
      const lowerStart = cuts.findIndex((station): boolean => station === kneeStation) - 1;
      const lower = [...cuts.slice(lowerStart, -2), cuts[cuts.length - 1]!];
      const planes = lower.slice(1).map((station, i): AutoMovieMeshCourse.IPlane => {
        const middle = (station + lower[i]!) / 2;
        const frame = axis.at(middle);
        return { station: middle, origin: frame.origin as V3, u: frame.u as V3, v: frame.v as V3 };
      });
      const native = AutoMovieMeshCourse.cut(mesh, planes, Trace.TOLERANCE);
      const candidate = AutoMovieMeshCourse.cut(loft.clay, planes, Trace.TOLERANCE);
      const readings = planes.flatMap((plane, i): { station: number; error: number }[] => {
        const a = native[i]!.loop, b = candidate[i]!.loop;
        return a === null || b === null ? [] : [{ station: plane.station, error: sectionDeviation(a, b) }];
      }).sort((a, b): number => a.error - b.error);
      const worst = readings[readings.length - 1];
      const receipt = `Lower leg including native forefoot: ${readings.length}/${planes.length} same prior midpoint cuts${worst === undefined ? "" : `. Median ${readings[Math.floor(readings.length / 2)]!.error.toFixed(3)} mm, maximum ${worst.error.toFixed(3)} mm at ${worst.station.toFixed(3)} mm`}.`;
      diagnostics.push(receipt);
      loft.diagnostics.push(receipt);
    }
    console.log(`${name}: ${diagnostics.join("\n")}`);
    const labels = portion === "leg"
      ? direction < 0 ? ["anterior", "lateral", "posterior", "medial"] : ["anterior", "medial", "posterior", "lateral"]
      : ["u-positive", "v-positive", "u-negative", "v-negative"];
    const curves = labels.map((label, q): CaptureModel.ICurve => ({
      id: `${name}.${label}`,
      part: name,
      frame: "world",
      kind: "Guide read from archived F1 Hermite sections",
      lines: [
        ...runs.map((run, i): CaptureModel.ILine => ({
          id: `${name}.${label}.${i}`,
          points: full!.cuts.filter((cut): boolean => cut.station >= run[0]! && cut.station <= run[run.length - 1]!).map((cut): V3 => place(axis.at(cut.station), cut.guides[q]!)),
          closed: false,
          colour: ["#26883c", "#b1253e", "#dc7825", "#2268ad"][q]!,
        })),
        ...(kneeStation === undefined ? [] : [{
          id: `${name}.${label}.observed-leg`,
          points: hostCuts.flatMap((station): V3[] => {
            const point = sampleRay(axis.at(station), observations.get(station)!, Math.cos(q * Math.PI / 2), Math.sin(q * Math.PI / 2));
            return point === null ? [] : [point];
          }),
          closed: false,
          colour: ["#26883c", "#b1253e", "#dc7825", "#2268ad"][q]!,
        }]),
      ],
      aids: [],
      datums: [],
    }));
    if (ports.length > 0) curves.push({
      id: `${name}.native-branches`,
      part: name,
      frame: "world",
      kind: "Native forefoot and digit boundaries",
      lines: ports.map((port, i): CaptureModel.ILine => ({
        id: port.name,
        points: port.points,
        closed: true,
        colour: ["#39763d", "#aa2130", "#0054ba", "#ce7200", "#773995", "#007c85"][i]!,
      })),
      aids: [],
      datums: [],
    });
    const normal = AutoMovieViewAxis.normal(lastFrame) as V3;
    let referenceEnd = lastFrame;
    let endAlong = 0;
    const extra = ports.flatMap((port): V3[] => port.points);
    if ((carriesForefoot || capAttached) && loft.status === "available") {
      for (let i = 0; i < loft.clay.positions.length; i += 3)
        extra.push([loft.clay.positions[i]!, loft.clay.positions[i + 1]!, loft.clay.positions[i + 2]!]);
    }
    for (const point of extra) {
      const along = Geometry.dot(sub(point, lastFrame.origin as V3), normal);
      if (along > endAlong) {
        referenceEnd = { ...lastFrame, origin: point };
        endAlong = along;
      }
    }
    return {
      name,
      root: "world",
      placement: "The reference's native world and pose, in millimetres.",
      frames: [{ name: "world", parent: null, world: Geometry.IDENTITY }],
      curves,
      ports: portion === "toe"
        ? [{ name: "toe root", point: firstFrame.origin as V3, radius: 20 }]
        : ports.map((port) => ({ name: port.name, point: port.frame.origin as V3, radius: 35 })),
      loft,
      reference: {
        status: "available",
        mesh: displayMesh(her, referenceStart, referenceEnd, boundary, cuts, observations, axis, portion === "toe", tip?.point, extra),
        measures: {},
        method: "The reference's native world and pose, in millimetres.",
      },
      relations: {
        parent: portion === "leg" ? "trunk" : portion === "foot" ? `leg.${side}` : `foot.${side}`,
        children: portion === "leg" ? [`foot.${side}`] : portion === "foot" ? DIGITS.map((_, i): string => `toe.${side}.${i + 1}`) : [],
        shares: [],
        basis: "Intended neighbours at the open ends of the archived family.",
      },
      diagnostics,
      milliseconds: full?.ms ?? {},
    };
  }
}

/** Separate readable contiguous intervals if the complete conic trace refuses a station. */
function admittedRuns(stations: number[], result: AutoMovieHumanF1Trace.IOutput): number[][] {
  const admitted = new Set(result.cuts.filter((cut): boolean => cut.shoulders.every((rho): boolean => rho !== null && rho > 0 && rho < 1) && (cut.kr === null || cut.kr < 1)).map((cut): number => cut.station));
  const runs: number[][] = [];
  let run: number[] = [];
  for (const station of stations) {
    if (admitted.has(station)) run.push(station);
    else {
      if (run.length > 1) runs.push(run);
      run = [];
    }
  }
  if (run.length > 1) runs.push(run);
  return runs;
}

/** Select triangles in the observed leg envelope for comparison. */
function displayMesh(
  her: NodeTrunkReference.IMesh,
  start: AutoMovieHumanF1Fork.IResult["parentPlane"],
  end: Frame,
  boundary: V3[] | null,
  cuts: number[],
  observations: ReadonlyMap<number, V2[]>,
  axis: AutoMovieViewAxis.IAxis,
  tight: boolean,
  tip?: V3 | null,
  extra: V3[] = [],
): CaptureModel.ITriangles {
  const minimum: V3 = [Infinity, Infinity, Infinity];
  const maximum: V3 = [-Infinity, -Infinity, -Infinity];
  const bounds = (point: V3): void => {
    for (const d of [0, 1, 2] as const) {
      minimum[d] = Math.min(minimum[d], point[d]);
      maximum[d] = Math.max(maximum[d], point[d]);
    }
  };
  for (const p of boundary ?? []) bounds(p);
  for (const p of extra) bounds(p);
  if (tip !== undefined && tip !== null) bounds(tip);
  for (const station of cuts) {
    const frame = axis.at(station);
    for (const point of observations.get(station) ?? []) bounds(place(frame, point));
  }
  const endNormal = AutoMovieViewAxis.normal(end) as V3;
  const dimensions = tight ? [0, 1, 2] : [2];
  const positions: number[] = [];
  const indices: number[] = [];
  for (const [a, b, c] of her.triangles) {
    const points: V3[] = [her.points[a]!, her.points[b]!, her.points[c]!];
    if (
      dimensions.some((d): boolean => points.every((p): boolean => p[d]! < minimum[d]!) || points.every((p): boolean => p[d]! > maximum[d]!)) ||
      points.every((p): boolean => Geometry.dot(sub(p, start.centroid), start.normal) > 0) ||
      points.every((p): boolean => Geometry.dot(sub(p, tip ?? end.origin as V3), endNormal) > 0)
    ) continue;
    const first = positions.length / 3;
    positions.push(...points.flat());
    indices.push(first, first + 1, first + 2);
  }
  return { positions, indices };
}
