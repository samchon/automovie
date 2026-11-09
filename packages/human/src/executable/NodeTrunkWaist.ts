import { AutoMovieContourLoftCurves64, AutoMovieMeshCourse, AutoMovieMeshExtract, AutoMovieViewAxis, AutoMovieViewChain, evaluateAutoMovieCurve64, type IAutoMovieCurve64, type IAutoMovieLoftChain, type IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanF1Fork } from "../generation/trunk/AutoMovieHumanF1Fork";
import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import { NodeTrunkArchive } from "./NodeTrunkArchive";
import { NodeTrunkCaptureGeometry } from "./NodeTrunkCaptureGeometry";
import type { NodeTrunkArmscye } from "./NodeTrunkArmscye";
import { NodeTrunkSkin } from "./NodeTrunkSkin";

type V3 = CaptureModel.Vec3;
type V2 = [number, number];
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;
type WaistArcs = IAutoMovieViewPart.IQuarters<AutoMovieHumanF1Trace.IObservedArc[]>;

type TrunkStation = NodeTrunkArchive.TrunkStation;
type ShoulderSkin = NodeTrunkArmscye.ShoulderSkin;
type UpperCuts = NodeTrunkSkin.UpperCuts;

const { archiveRows, archiveCurve, archiveAxis, exactReferenceVertices, forkTransition }: typeof NodeTrunkArchive = NodeTrunkArchive;

const { medianReference, drawn, wire, angle, add, sub, scale, cross, MID, STEP, LOFT }: typeof NodeTrunkCaptureGeometry = NodeTrunkCaptureGeometry;

const { connectedArchive }: typeof NodeTrunkSkin = NodeTrunkSkin;

/** Read the archived F1 trunk course and compare its waist loft with the original contours. */
export namespace NodeTrunkWaist {
  // The source skin is continuous at the eleven inspected upper-trunk seams.
  // Their measured endpoint gaps are at most 0.000854 mm. The 0.001 mm limit
  // applies only to uniquely paired original endpoints on these missing cuts.
  const UPPER_SPLICE_MM: number = 0.001;

  /** Loft the observed original horizontal sections inside the requested trunk range. */
  export async function waist(name: string, mesh: AutoMovieMeshExtract.IMesh, ms: Record<string, number>, [from, to]: [number, number] = [1000, 1190], joins?: { fork: AutoMovieHumanF1Fork.IResult; armscye: [number, number]; shoulder: ShoulderSkin }): Promise<CaptureModel.IPart> {
    const rows: TrunkStation[] = (await archiveRows()).filter((row: TrunkStation): boolean => row.coordinateMm >= from && row.coordinateMm <= to);
    if (rows.length < 2) throw new Error(`${name}: the original curves do not cover the requested trunk range`);
    const axis: AutoMovieViewAxis.IAxis = archiveAxis(rows);
    const { origin: [x, , zz] }: ReturnType<AutoMovieViewAxis.IAxis["at"]> = axis.at(MID);
    const z: number = -zz;
    const observations: Map<number, V2[]> = new Map();
    const observedArcs: Map<number, WaistArcs> = new Map();
    const charts: { layout: string; cuts: number[] }[] = [];
    const features: Map<string, { last: number; lines: V3[][] }> = new Map();
    const failures: string[] = [];
    let chart: (typeof charts)[number] | undefined;
    for (const [rowIndex, row] of rows.entries()) {
      const loop: TrunkStation["loops"][number] | undefined = row.loops[0];
      if (row.loops.length !== 1 || loop === undefined || loop.kind !== "closed" || !loop.curve.closed) {
        failures.push(`station ${row.coordinateMm.toFixed(3)} mm does not have one archived closed outer curve`);
        chart = undefined;
        continue;
      }
      const source: typeof loop.curve = loop.curve;
      // Exact Hermite-to-Bernstein controls, in the original curve's phase chart.
      const cubic: IAutoMovieCurve64.Cubic = archiveCurve(source);
      const knots: AutoMovieContourLoftCurves64.Knot[] = AutoMovieContourLoftCurves64.tessellate(cubic, 0.1);
      const outline: V2[] = knots.map(({ p }: AutoMovieContourLoftCurves64.Knot): V2 => [p[0] - x, z - p[2]]);
      observations.set(row.coordinateMm, outline);
      if (joins !== undefined) continue;
      const observed = waistArcs(cubic, knots, outline);
      for (const [key, point] of observed.features) {
        const line = features.get(key) ?? { last: -2, lines: [] };
        if (line.last !== rowIndex - 1) line.lines.push([]);
        line.lines[line.lines.length - 1]!.push([x + point[0], row.coordinateMm, point[1] - z]);
        line.last = rowIndex;
        features.set(key, line);
      }
      if (typeof observed.section === "string") {
        failures.push(`station ${row.coordinateMm.toFixed(3)} mm: ${observed.section}`);
        chart = undefined;
        continue;
      }
      if (chart === undefined || chart.layout !== observed.section.layout) {
        chart = { layout: observed.section.layout, cuts: [] };
        charts.push(chart);
      }
      chart.cuts.push(row.coordinateMm);
      observedArcs.set(row.coordinateMm, observed.section.arcs);
    }
    const cuts: number[] = rows.map((row: TrunkStation): number => row.coordinateMm);
    const bounds: [number, number] = [cuts[0]!, cuts[cuts.length - 1]!];
    if (joins !== undefined) {
      const missing: number[] = cuts.filter((station: number): boolean => !observations.has(station));
      const planes = missing.map((station: number) => {
        const { origin, u, v }: ReturnType<AutoMovieViewAxis.IAxis["at"]> = axis.at(station);
        return { station, origin, u, v };
      });
      const physical: AutoMovieMeshExtract.IMesh = exactReferenceVertices(mesh);
      const raw: AutoMovieMeshCourse.ISection[] = AutoMovieMeshCourse.cut(physical, planes, AutoMovieHumanF1Trace.TOLERANCE, 0);
      const upper: UpperCuts = { lines: [], ports: [] };
      for (const [index, section] of raw.entries()) {
        const station: number = missing[index]!;
        const strict: boolean = section.loop !== null && section.pieces === 1 && section.flags.length === 0;
        failures.push(`upper trunk raw y${station.toFixed(3)} after exact-coordinate source indexing: ${section.pieces} strict outer loops, ${section.loop === null ? "no holding loop" : `${section.loop.length} holding vertices`}, ${section.flags.join("; ") || "no flags"}.`);
        if (strict) {
          observations.set(station, section.loop!);
          continue;
        }
        const pairs: number = upperCutEndpoints(physical, planes[index]!, upper, failures);
        if (pairs === 0) continue;
        const closed: AutoMovieMeshCourse.ISection = AutoMovieMeshCourse.cut(physical, [planes[index]!], AutoMovieHumanF1Trace.TOLERANCE, UPPER_SPLICE_MM)[0]!;
        const observed: boolean = closed.loop !== null && closed.pieces === 1 &&
          closed.flags.filter((flag: string): boolean => flag.startsWith("bridged:")).length === pairs &&
          closed.flags.every((flag: string): boolean => flag.startsWith("open:") || flag.startsWith("bridged:"));
        if (observed) observations.set(station, closed.loop!);
        failures.push(`upper trunk y${station.toFixed(3)}: ${observed ? `closed one original holding loop through ${pairs} measured source seams` : "measured source seams did not close one holding loop"}.`);
      }
      const first: number = cuts[0]!;
      const fork: Map<number, V3[]> = forkTransition(physical, joins.fork.parentPlane, axis.at(first).origin as V3, failures);
      return connectedArchive(name, mesh, axis, observations, cuts, joins.fork, joins.armscye, joins.shoulder, fork, upper, failures, ms);
    }
    const start: number = performance.now();
    const fits = charts.flatMap((domain, index: number) => {
      if (domain.cuts.length < 2) {
        failures.push(`station ${domain.cuts[0]!.toFixed(3)} mm has no adjacent cut with the same admitted source contacts`);
        return [];
      }
      // Reuse the exact original ordinates to avoid duplicate layer stations.
      const stations: number[] = domain.cuts.filter((_: number, i: number): boolean => i % (STEP.layer / STEP.cut) === 0 || i + 1 === domain.cuts.length);
      const nameAt: string = `${name}.${index}`;
      const fit: AutoMovieHumanF1Trace.IOutput = AutoMovieHumanF1Trace.create({ name: nameAt, mesh, axis, cuts: domain.cuts, stations, order: LOFT.order, samples: LOFT.samples }, observations, observedArcs);
      console.log(`${nameAt}: ${domain.cuts.length} original cuts from ${domain.cuts[0]!.toFixed(3)} to ${domain.cuts[domain.cuts.length - 1]!.toFixed(3)} mm, ${fit.loft?.chain ? "lofted" : "refused"}, ${domain.layout}`);
      return [{ nameAt, fit, bounds: [domain.cuts[0]!, domain.cuts[domain.cuts.length - 1]!] as [number, number] }];
    });
    const layers: AutoMovieHumanF1Trace.ILayer[] = fits.flatMap(({ fit }) => fit.layers);
    ms.trace = performance.now() - start;
    const measured: AutoMovieHumanF1Trace.ILayer[] = layers.filter((layer: AutoMovieHumanF1Trace.ILayer): boolean => layer.fault === null);
    const worst: AutoMovieHumanF1Trace.ILayer | undefined = measured.reduce<AutoMovieHumanF1Trace.ILayer | undefined>(
      (largest: AutoMovieHumanF1Trace.ILayer | undefined, layer: AutoMovieHumanF1Trace.ILayer): AutoMovieHumanF1Trace.ILayer => largest === undefined || layer.max > largest.max ? layer : largest,
      undefined,
    );
    const quarter = (phase: number): number => Math.floor(((phase + 2 * Math.PI) % (2 * Math.PI)) / (Math.PI / 2));
    for (const between of [false, true]) {
      const layers: AutoMovieHumanF1Trace.ILayer[] = measured.filter((layer: AutoMovieHumanF1Trace.ILayer): boolean => layer.between === between);
      const errors: number[] = layers.map((layer: AutoMovieHumanF1Trace.ILayer): number => layer.max).sort((a: number, b: number): number => a - b);
      if (errors.length !== 0)
        console.log(`waist ${between ? "mid-station" : "source-station"} radial maxima in mm: n=${errors.length}, within 0.5=${errors.filter((error: number): boolean => error <= AutoMovieHumanF1Trace.TOLERANCE).length}, min=${errors[0]!.toFixed(3)}, median=${errors[Math.floor(errors.length / 2)]!.toFixed(3)}, p95=${errors[Math.ceil(errors.length * 0.95) - 1]!.toFixed(3)}, max=${errors[errors.length - 1]!.toFixed(3)}`);
    }
    console.log("waist layer,station_mm,location,quadrant,phase_deg,signed_mm,mean_mm,max_mm");
    for (const layer of measured)
      console.log(`waist layer,${layer.station.toFixed(6)},${layer.between ? "between" : "cut"},${quarter(layer.phase)},${((layer.phase * 180) / Math.PI).toFixed(4)},${layer.signed.toFixed(4)},${layer.mean.toFixed(4)},${layer.max.toFixed(4)}`);
    for (const { nameAt, fit } of fits)
      for (const layer of fit.layers)
        if (layer.fault !== null) console.log(`unreadable layer ${nameAt} at ${layer.station.toFixed(6)} mm (${layer.between ? "between" : "cut"}): ${layer.fault}`);
    if (worst !== undefined) {
      const cut: AutoMovieHumanF1Trace.ICut | null = AutoMovieHumanF1Trace.read(mesh, axis, worst.station);
      const point: [number, number] | undefined = cut?.loop.find(([u, v]: [number, number]): boolean => Math.atan2(v, u) === worst.phase);
      if (point !== undefined) {
        const [u, v]: [number, number] = point;
        const radius: number = Math.hypot(u, v) - worst.signed;
        console.log(`waist maximum: q${quarter(worst.phase)}, raw (${x + u}, ${worst.station}, ${v - z}), loft (${x + radius * Math.cos(worst.phase)}, ${worst.station}, ${radius * Math.sin(worst.phase) - z}), signed ${worst.signed.toFixed(4)} mm`);
      }
    }
    const reference: CaptureModel.ITriangles = medianReference(mesh, bounds, -z);
    const diagnostics: string[] = [
      `${name}: ${observations.size}/${cuts.length} closed original Hermite sections, ${bounds[0].toFixed(3)} to ${bounds[1].toFixed(3)} mm; joins are not realized`,
      `original fit: largest sampled deviation ${Math.max(...rows.flatMap((row: TrunkStation): number[] => row.loops.filter((loop) => loop.kind === "closed").map((loop): number => loop.fit.sampleMaximumMm))).toFixed(3)} mm; largest conservative estimate ${Math.max(...rows.flatMap((row: TrunkStation): number[] => row.loops.filter((loop) => loop.kind === "closed").map((loop): number => loop.fit.polylineUpperEstimateMm))).toFixed(3)} mm`,
      `generated chains versus raw mesh: ${measured.length} measured layers (${measured.filter((layer: AutoMovieHumanF1Trace.ILayer): boolean => layer.between).length} between cuts), ${layers.length - measured.length} unreadable, maximum ${worst === undefined ? "unobserved" : `${worst.max.toFixed(3)} mm at ${worst.station.toFixed(3)} mm${worst.between ? " between cuts" : ""}`}`,
      `${charts.length} consecutive source layouts, ${failures.length} refused source cuts; separate charts are not joined`,
      ...failures,
      ...fits.flatMap(({ fit }) => fit.diagnostics),
    ];
    console.log(diagnostics.join("\n"));
    const chains: IAutoMovieLoftChain[] = fits.flatMap(({ fit }): IAutoMovieLoftChain[] => fit.loft?.chain ? [fit.loft.chain] : []);
    const capture: CaptureModel.IPart = CaptureSpecs.part({
      part: name,
      frames: [{ name: "world", parent: null, basis: { kind: "derived", rule: "F1 Hermite world millimetres with Z negated (ISB)" }, relative: AutoMovieHumanArmCurveSpec.IDENTITY }],
      root: AutoMovieHumanArmCurveSpec.IDENTITY,
      placement: "her own world",
      specs: [
        ...Array.from(features).flatMap(([key, value]): Spec[] => value.lines.flatMap((points: V3[], i: number): Spec[] => points.length >= 2 ? [wire(`${name}.source.${key}.${i}`, points, "Actual archived crest or median notch")] : [])),
        ...fits.flatMap(({ nameAt, fit, bounds: domain }): Spec[] => fit.part === null ? [] : drawn(fit.part, axis, domain, nameAt)),
      ],
      axis: (): null => null,
      chain: chains[0] ?? null,
      chains,
      allowDomainRefusal: true,
      diagnostics,
      ports: [],
      relations: { parent: null, children: [], shares: [], basis: "independent archived trunk charts before joins" },
      reference: { status: "available", mesh: reference, cropToLoft: false, measures: { fromY: bounds[0], toY: bounds[1] }, method: "original median skin in the selected slab with original triangle coordinates and Z negated" },
      milliseconds: ms,
    });
    if (capture.loft.status === "available") {
      const refused: string[] = capture.loft.diagnostics.filter((line: string): boolean => line.startsWith("domain "));
      console.log(`${name}: ${chains.length - refused.length}/${chains.length} native charts drew at every requested capture sample`);
      for (const diagnostic of refused) console.log(diagnostic);
    } else console.log(capture.loft.cause);
    return capture;
  }

  /** Record the physical ends of each original open chain without joining them. */
  function upperCutEndpoints(mesh: AutoMovieMeshExtract.IMesh, plane: AutoMovieMeshCourse.IPlane, upper: UpperCuts, diagnostics: string[]): number {
    const { origin, u, v }: AutoMovieMeshCourse.IPlane = plane;
    const section: AutoMovieMeshExtract.ISection = AutoMovieMeshExtract.outline(mesh, { origin, axes: [cross(v, u), u, v] }, [0], 0, AutoMovieHumanF1Trace.TOLERANCE, 0)[0]!;
    const height: string = plane.station.toFixed(3);
    const ends: { name: string; point: V3 }[] = [];
    const colour: string[] = ["9e3265", "1d70ad", "288a59"];
    for (const [index, loop] of section.loops.filter((loop: AutoMovieMeshExtract.ILoop): boolean => !loop.closed).entries()) {
      const points: V3[] = loop.points.map(([a, b]: V2): V3 => add(origin, add(scale(u, a), scale(v, b))));
      if (points.length < 2) continue;
      const id: string = `upper-${height}-chain-${index + 1}`;
      upper.lines.push({ id, points, closed: false, colour: colour[index % colour.length]! });
      ends.push({ name: `${index + 1}.start`, point: points[0]! }, { name: `${index + 1}.end`, point: points[points.length - 1]! });
    }
    const pairs: { a: typeof ends[number]; b: typeof ends[number]; gap: number }[] = [];
    for (let i: number = 0; i < ends.length; ++i)
      for (let j: number = i + 1; j < ends.length; ++j)
        pairs.push({ a: ends[i]!, b: ends[j]!, gap: Math.hypot(...sub(ends[i]!.point, ends[j]!.point)) });
    pairs.sort((a, b): number => a.gap - b.gap);
    diagnostics.push(`upper y${height} exact source ends: ${ends.map(({ name, point }): string => `${name} (${point.map((value: number): string => value.toFixed(6)).join(", ")})`).join("; ")}.`);
    diagnostics.push(`upper y${height} all observed endpoint distances in mm: ${pairs.map(({ a, b, gap }): string => `${a.name}→${b.name} ${gap.toFixed(6)}`).join("; ")}.`);
    const framed: Set<string> = new Set();
    let view: number = 1;
    for (const { a, b, gap } of pairs) {
      if (framed.has(a.name) && framed.has(b.name)) continue;
      upper.ports.push({ name: `upper-${height}-gap-${view++}`, point: scale(add(a.point, b.point), 0.5), radius: Math.max(15, 2 * gap) });
      framed.add(a.name);
      framed.add(b.name);
    }
    const near = pairs.filter(({ gap }): boolean => gap <= UPPER_SPLICE_MM);
    const distinct: Set<string> = new Set(near.flatMap(({ a, b }): string[] => [a.name, b.name]));
    return near.length * 2 === ends.length && distinct.size === ends.length &&
      near.every(({ a, b }): boolean => a.name.split(".")[0] !== b.name.split(".")[0]) ? near.length : 0;
  }

  /** Read both midline recesses and their flanking crests from one actual archived ring. */
  function waistArcs(cubic: IAutoMovieCurve64.Cubic, knots: AutoMovieContourLoftCurves64.Knot[], outline: V2[]): {
    features: ReadonlyMap<string, V2>;
    section: { layout: string; arcs: WaistArcs } | string;
  } {
    const reading: AutoMovieMeshCourse.IReading = AutoMovieMeshCourse.read(outline, AutoMovieHumanF1Trace.TOLERANCE);
    const index = (point: V2): number => outline.findIndex(([u, v]: V2): boolean => u === point[0] && v === point[1]);
    const indices: number[] = [0, 2, 1, 3].map((direction: number): number =>
      outline.findIndex((point: V2): boolean => point[direction < 2 ? 0 : 1] === reading.extents[direction]),
    );
    const features: Map<string, V2> = new Map();
    const marks: Map<number, string> = new Map();
    for (const [direction, q, label] of [[0, 0, "front"], [1, 2, "back"]] as const) {
      const crest = (positive: boolean): AutoMovieMeshCourse.IFeature | undefined =>
        reading.features[direction].filter((feature: AutoMovieMeshCourse.IFeature): boolean => feature.kind === "crest" && (positive ? feature.point[1] > 0 : feature.point[1] < 0))
          .reduce<AutoMovieMeshCourse.IFeature | undefined>((a, b) => a === undefined || b.value > a.value ? b : a, undefined);
      const left: AutoMovieMeshCourse.IFeature | undefined = crest(false);
      const right: AutoMovieMeshCourse.IFeature | undefined = crest(true);
      if (left === undefined || right === undefined) continue;
      const centre: AutoMovieMeshCourse.IFeature | undefined = reading.features[direction]
        .filter((feature: AutoMovieMeshCourse.IFeature): boolean => feature.kind === "notch" && feature.point[1] > left.point[1] && feature.point[1] < right.point[1])
        .reduce<AutoMovieMeshCourse.IFeature | undefined>((a, b) => a === undefined || Math.abs(b.point[1]) < Math.abs(a.point[1]) ? b : a, undefined);
      if (centre === undefined) continue;
      for (const [side, feature] of [["left", left], ["centre", centre], ["right", right]] as const) {
        const key: string = `${label}.${side}`;
        features.set(key, feature.point);
        marks.set(index(feature.point), key);
      }
      // A physically symmetric crest retains its side when the sampled extrema tie within extraction tolerance.
      if (Math.abs(right.point[0] - reading.extents[direction]) <= AutoMovieHumanF1Trace.TOLERANCE) indices[q] = index(right.point);
    }
    const dir: number = AutoMovieMeshCourse.newell(outline.map(([u, v]: V2): V3 => [u, 0, v]))[1] < 0 ? 1 : -1;
    const next = (i: number): number => (i + dir + outline.length) % outline.length;
    const tangent = (i: number): V2 => {
      const d: IAutoMovieCurve64.Vector = evaluateAutoMovieCurve64(cubic, knots[i]!.phase).tangentPerParameter;
      return [dir * d[0], -dir * d[2]];
    };
    const arcIndices = (from: number, to: number): number[] => {
      const arc: number[] = [from];
      while (arc[arc.length - 1] !== to) arc.push(next(arc[arc.length - 1]!));
      return arc;
    };
    if (indices.includes(-1) || new Set(indices).size !== 4) return { features, section: "no four distinct observed directional supports" };
    const cardinal: V2[] = [[0, 1], [-1, 0], [0, -1], [1, 0]];
    const axes: Map<number, V2> = new Map(indices.map((guide: number, q: number): [number, V2] => [guide, cardinal[q]!]));
    const curves: number[][] = indices.map((guide: number, q: number): number[] => arcIndices(guide, indices[(q + 1) % 4]!));
    if (curves.reduce((sum: number, arc: number[]): number => sum + arc.length - 1, 0) !== outline.length)
      return { features, section: "the four observed supports do not follow the source winding" };
    const faults: string[] = [];
    const layout: string[] = [];
    const pieces: AutoMovieHumanF1Trace.IObservedArc[][] = curves.map((arc: number[], q: number): AutoMovieHumanF1Trace.IObservedArc[] => {
      const start: number = arc[0]!;
      const end: number = arc[arc.length - 1]!;
      const contacts: number[] = arc.filter((i: number): boolean => i === start || i === end || marks.has(i));
      const supports: number[] = [start];
      const names: string[] = [marks.get(start) ?? `guide${q}`];
      for (let i: number = 1; i < contacts.length; ++i) {
        const a: number = contacts[i - 1]!;
        const b: number = contacts[i]!;
        const labelA: string = marks.get(a) ?? "";
        const labelB: string = marks.get(b) ?? "";
        if (labelA !== "" && labelB !== "" && (labelA.endsWith(".centre") || labelB.endsWith(".centre")) && labelA.split(".")[0] === labelB.split(".")[0]) {
          // The observed tangent of greatest fore-aft inclination lies between each recess and its crest.
          let turn: number | undefined;
          let inclination: number = -Infinity;
          for (const node of arcIndices(a, b).slice(1, -1)) {
            const d: V2 = tangent(node);
            const value: number = Math.abs(d[0]) / Math.hypot(...d);
            if (value > inclination) {
              inclination = value;
              turn = node;
            }
          }
          if (turn !== undefined) {
            supports.push(turn);
            names.push(`${labelA}-${labelB}`);
          }
        }
        supports.push(b);
        if (b !== end) names.push(labelB);
      }
      layout.push(names.join(","));
      return supports.slice(0, -1).flatMap((a: number, i: number): AutoMovieHumanF1Trace.IObservedArc[] => {
        const b: number = supports[i + 1]!;
        const t0: V2 = axes.get(a) ?? tangent(a);
        const t1: V2 = axes.get(b) ?? tangent(b);
        const [rho, reach]: [number | null, number | null] = AutoMovieMeshCourse.shoulder(arcIndices(a, b).map((j: number): V2 => outline[j]!), t0, t1);
        if (rho === null || reach === null || !(rho > 0 && rho < 1 && reach > 0)) {
          faults.push(`q${q} ${names[i]}: ${rho === null ? "no conic crossing on the source arc" : `rho ${rho.toFixed(4)}`}`);
          return [];
        }
        return [{ point: outline[a]!, angle: Math.atan2(t0[1], t0[0]), rho, reach }];
      });
    });
    if (faults.length !== 0) return { features, section: faults.join(" | ") };
    const all: AutoMovieHumanF1Trace.IObservedArc[] = pieces.flat();
    const native: AutoMovieViewChain.ISection = AutoMovieViewChain.of({
      points: all.map((arc: AutoMovieHumanF1Trace.IObservedArc): V2 => arc.point),
      tangents: pieces.flatMap((quarter: AutoMovieHumanF1Trace.IObservedArc[], q: number): V2[] => quarter.map((arc: AutoMovieHumanF1Trace.IObservedArc, i: number): V2 => i === 0 ? cardinal[q]! : [Math.cos(arc.angle), Math.sin(arc.angle)])),
      shoulders: all.map((arc: AutoMovieHumanF1Trace.IObservedArc): number => arc.rho),
    });
    return { features, section: native.fault ?? { layout: layout.join(" / "), arcs: pieces as WaistArcs } };
  }
}
