import fs from "node:fs/promises";
import { AutoMovieContourLoftCurves64, AutoMovieMeshCourse, AutoMovieMeshExtract, type IAutoMovieContourLoft64, type IAutoMovieCurve64, tessellateAutoMovieContourLoft64, tessellateAutoMovieContourStrip64 } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeTrunkArchive } from "./NodeTrunkArchive";
import { NodeTrunkCaptureGeometry } from "./NodeTrunkCaptureGeometry";

type V3 = CaptureModel.Vec3;
type V2 = [number, number];
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;

type ArmRoot = NodeTrunkArchive.ArmRoot;

const { armRoots, insideArmRoot, observedArmRoot, archiveWorld, archiveCurve, withoutClosingMarker }: typeof NodeTrunkArchive = NodeTrunkArchive;

const { armDot, armBoundaryGap, indexedTrunkReceipt, increasingPhase, edgeSense, wire, add, sub, scale, cross, STEP }: typeof NodeTrunkCaptureGeometry = NodeTrunkCaptureGeometry;

/** Trace the measured F1 armscye and shared distal arm rim. */
export namespace NodeTrunkArmscye {
  /** One original trunk rail and its positions in the emitted shoulder skin. */
  export type TrunkRail = {
    /** Height of the archived horizontal rail in millimetres. */
    station: number;
    /** Ordered capture-world points in millimetres. */
    points: V3[];
    /** Position indices in the emitted shoulder mesh in the same order. */
    indices: number[];
    /** Signed directed use of the rail by the retained shoulder triangles. */
    direction: number;
  };
  /** Shoulder patch and its two ordered trunk attachment rails, when available. */
  export type ShoulderSkin = {
    /** Generated shoulder skin and its original comparison and measurement lines. */
    part: CaptureModel.IPart;
    /** Qualified lower and upper attachment rails, or null when either is unavailable. */
    rails: [TrunkRail, TrunkRail] | null;
  };

  /** Exercise the two observed arm merges in the original horizontal charts. */
  export async function armscye(name: string, mesh: AutoMovieMeshExtract.IMesh, ms: Record<string, number>): Promise<ShoulderSkin> {
    type SavedCurve = NodeTrunkArchive.TrunkStation["loops"][number]["curve"];
    type SavedSection = { index: number; coordinateMm: number; curves: { ordinal: number; kind: string; winding: 1 | -1; curve: SavedCurve }[] };
    type SavedLink = { beforeMm: number; afterMm: number; groups: [number[], number[]][]; unsupported: Record<string, number> };
    const started: number = performance.now();
    const source: string = ".references/curves/hermite/f1";
    const read = async <T>(file: string): Promise<T> => JSON.parse(await fs.readFile(HumanNodePaths.resolve(`${source}/${file}.json`), "utf8")) as T;
    const [global, links, ...regions] = await Promise.all([
      read<{ loft: { events: IAutoMovieContourLoft64.IEvent[]; chordToleranceMm: number } }>("global"),
      read<{ intervals: SavedLink[] }>("links"),
      ...["trunk/005", "trunk/006", "arm_l/004", "arm_r/004"].map((file: string): Promise<{ sections: SavedSection[] }> => read(`sections/${file}`)),
    ] as const);
    // The adjacent archive rows bracket both oblique arm roots in world Y.
    const first: number = 247;
    const last: number = 258;
    const sections: IAutoMovieContourLoft64.ISection[] = [];
    for (let index: number = first; index <= last; ++index) {
      const rows: SavedSection[] = regions.flatMap(({ sections: saved }): SavedSection[] => saved.filter((row: SavedSection): boolean => row.index === index));
      const coordinateMm: number = rows[0]!.coordinateMm;
      const curves = rows.flatMap(({ curves }): SavedSection["curves"] => curves).sort((a, b): number => a.ordinal - b.ordinal);
      if (rows.some((row: SavedSection): boolean => row.coordinateMm !== coordinateMm) ||
        curves.some((row, ordinal: number): boolean => row.ordinal !== ordinal || row.kind !== "closed" || !row.curve.closed))
        throw new Error(`armscye: original section ${index} does not provide all ordered closed curves`);
      sections.push({
        coordinateMm,
        loops: curves.map(({ winding, curve }) => ({ winding, curve: archiveCurve(curve) })),
      });
    }
    const from: number = sections[0]!.coordinateMm;
    const to: number = sections[sections.length - 1]!.coordinateMm;
    const events: IAutoMovieContourLoft64.IEvent[] = global.loft.events.filter((event: IAutoMovieContourLoft64.IEvent): boolean => event.beforeMm >= from && event.afterMm <= to);
    const intervals: IAutoMovieContourLoft64.IInterval[] = links.intervals.slice(first, last).map(({ beforeMm, afterMm, groups, unsupported }): IAutoMovieContourLoft64.IInterval => {
      if (Object.keys(unsupported).length !== 0) throw new Error(`armscye: the original link ${beforeMm}→${afterMm} has unresolved components`);
      return { beforeMm, afterMm, groups: groups.map(([before, after]) => ({ before, after, supported: true, reason: null })) };
    });
    // The paired front rays place the bilateral shoulder marks at world
    // y1278.627–1307.986 mm. Archive links 252–255 bracket them between
    // the last saddle's upper rail and section 256. Keep all those anchors
    // and both saddle links while splitting only the four ordinary spans.
    const refined = await shoulderObservations(mesh, sections, intervals, intervals.slice(252 - first, 256 - first));
    const generated: IAutoMovieContourLoft64.IResult = tessellateAutoMovieContourLoft64({ sections: refined.sections, events, intervals: refined.intervals, chordToleranceMm: global.loft.chordToleranceMm });
    const originalRows: Map<number, number> = new Map(sections.map(({ coordinateMm }, row: number): [number, number] => [coordinateMm, first + row]));
    const lines: CaptureModel.ILine[] = refined.sections.flatMap(({ coordinateMm, loops }): CaptureModel.ILine[] => loops.map(({ curve }, loop: number): CaptureModel.ILine => ({
      id: originalRows.has(coordinateMm) ? `armscye.original.${originalRows.get(coordinateMm)}.${loop}` : `armscye.observed.${coordinateMm}.${loop}`,
      points: AutoMovieContourLoftCurves64.tessellate(curve, global.loft.chordToleranceMm).map(({ p }): V3 => archiveWorld(p)),
      closed: true,
      colour: "9e4c74",
    })));
    const positions: number[] = generated.mesh.positions.map((value: number, i: number): number => value * (i % 3 === 2 ? -1000 : 1000));
    const indices: number[] = [];
    for (let i: number = 0; i < (generated.mesh.indices?.length ?? 0); i += 3)
      indices.push(generated.mesh.indices![i]!, generated.mesh.indices![i + 2]!, generated.mesh.indices![i + 1]!);
    const diagnostics: string[] = [
      `original armscye: ${sections.length} archived cuts and ${refined.sections.length - sections.length} measured post-saddle cuts, ${events.map((event: IAutoMovieContourLoft64.IEvent): string => `${event.name} ${event.coordinateMm} mm`).join(", ")}; ${indices.length / 3} triangles, ${generated.unresolved.length} unresolved groups`,
      ...refined.diagnostics,
      ...generated.unresolved.map((problem): string => JSON.stringify(problem)),
    ];
    let skin: CaptureModel.ITriangles = { positions, indices };
    const overlay: CaptureModel.ILine[] = [];
    const ports: { name: string; frame: string; point: V3; radius: number }[] = [];
    for (const [i, arm] of (await armRoots()).entries()) {
      const side: string = i === 0 ? "left" : "right";
      const origin: V3 = archiveWorld(arm.originMm);
      const u: V3 = archiveWorld(arm.u);
      const v: V3 = archiveWorld(arm.v);
      const root: V3[] = observedArmRoot(arm);
      overlay.push({ id: `arm.${side}.original-root`, points: root, closed: true, colour: "a82568" });
      ports.push({ name: `arm-${side}-root`, frame: "world", point: origin, radius: Math.max(...root.map((point: V3): number => Math.hypot(...sub(point, origin)))) });
      const cut: AutoMovieMeshExtract.ISection = AutoMovieMeshExtract.outline(skin, { origin, axes: [cross(v, u), u, v] }, [0], 0, AutoMovieHumanF1Trace.TOLERANCE, 0)[0]!;
      for (const [j, loop] of cut.loops.entries())
        overlay.push({ id: `arm.${side}.loft-crossing.${j}`, points: loop.points.map(([a, b]: V2): V3 => add(origin, add(scale(u, a), scale(v, b)))), closed: loop.closed, colour: "205fb4" });
      const heights: number[] = root.map((point: V3): number => point[1]);
      diagnostics.push(`${side} arm original root: ${root.length} samples, y ${Math.min(...heights).toFixed(3)}–${Math.max(...heights).toFixed(3)} mm. Loft-plane intersection: ${cut.loops.map((loop: AutoMovieMeshExtract.ILoop): string => `${loop.closed ? "closed" : "open"} ${loop.points.length} points`).join(", ") || "none"}; ${cut.flags.join("; ") || "no extraction flags"}.`);
      const distal: IAutoMovieContourLoft64.IResult["construction"][number] | undefined = generated.construction
        .find((loop): boolean => loop.id.endsWith(`.section.0.loop.${i === 0 ? 2 : 1}`));
      if (distal === undefined) throw new Error(`Armscye: missing lower ${side} source ring`);
      try {
        const normal: V3 = archiveWorld(arm.normal);
        const seed: V3[] = distal.points.map(([x, y, z]: V3): V3 => [1000 * x, 1000 * y, -1000 * z]);
        const trimmed = trimArmscye(skin, origin, normal, seed);
        const measured: V2[] = root.map((point: V3): V2 => [armDot(sub(point, origin), u), armDot(sub(point, origin), v)]);
        const boundary: V2[] = trimmed.boundary.map((point: V3): V2 => [armDot(sub(point, origin), u), armDot(sub(point, origin), v)]);
        diagnostics.push(`${side} arm local trim: one closed ${boundary.length}-edge loop, ${skin.indices.length / 3 - trimmed.skin.indices.length / 3} net fewer triangles. Observed-to-trim ${armBoundaryGap(measured, boundary).toFixed(3)} mm, trim-to-observed ${armBoundaryGap(boundary, measured).toFixed(3)} mm.`);
        try {
          const proximal: ArmRoot = await insideArmRoot(i === 0 ? "l" : "r");
          const rootGap: number = armDot(sub(origin, archiveWorld(proximal.originMm)), normal);
          if (Math.hypot(...cross(proximal.normal, arm.normal)) > 1e-12 || !(rootGap > 0))
            throw new Error("the two observed root planes are not ordered and parallel");
          const station: number = proximal.stationMm + rootGap;
          const planes = Array.from({ length: 16 }, (_: unknown, index: number) => {
            const offset: number = rootGap * (16 - index) / 16;
            return { station: station - offset, origin: sub(origin, scale(normal, offset)), u, v };
          });
          const originalCuts: AutoMovieMeshCourse.ISection[] = AutoMovieMeshCourse.cut(mesh, planes, AutoMovieHumanF1Trace.TOLERANCE, 0);
          const admitted: { station: number; origin: V3; raw: V3[]; trim: ReturnType<typeof trimArmscye> }[] = [];

          // A sleeve plane is usable only when it holds the original arm
          // alone and leaves a closed cut on the retained shoulder mesh.
          for (const [j, plane] of planes.entries()) {
            const originalCut: AutoMovieMeshCourse.ISection = originalCuts[j]!;
            const raw: V3[] | null = originalCut.loop === null ? null : withoutClosingMarker(originalCut.loop.map(([a, b]: V2): V3 => add(plane.origin, add(scale(u, a), scale(v, b)))), `${side} arm ${plane.station.toFixed(3)}`, diagnostics);
            const local: boolean = raw !== null && raw.every((point: V3): boolean => point[1] >= from && point[1] <= to);
            let result: string = "no raw holding closed contour";
            if (raw !== null) result = local ? "raw local holding loop" : `raw holding loop includes trunk (y ${Math.min(...raw.map((point: V3): number => point[1])).toFixed(3)} to ${Math.max(...raw.map((point: V3): number => point[1])).toFixed(3)} mm)`;
            try {
              const trim = trimArmscye(skin, plane.origin, normal, seed);
              if (local) admitted.push({ station: plane.station, origin: plane.origin, raw: raw!, trim });
              result += `; generated local trim ${trim.boundary.length} closed edges`;
            } catch (error: unknown) {
              result += `; generated local trim refused: ${error instanceof Error ? error.message : String(error)}`;
            }
            diagnostics.push(`${side} arm s${plane.station.toFixed(3)}: ${result}.`);
          }
          // The first usable plane preserves the most shoulder. A separate
          // middle observation carries the shape to the shared distal rim
          // without spanning two contours in the same plane.
          const base = admitted[0];
          const middle = admitted.length < 2 ? undefined : admitted[Math.floor(admitted.length / 2)];
          if (base === undefined || middle === undefined)
            throw new Error(`only ${admitted.length}/16 observed inboard planes provide both independent closed rings`);
          const strip = armCollar(base.trim.skin, base.trim.boundary, base.trim.boundaryIndices, [middle.raw, root], normal);
          const plane = { station: (middle.station + station) / 2, origin: scale(add(middle.origin, origin), 0.5), u, v };
          const source: AutoMovieMeshCourse.ISection = AutoMovieMeshCourse.cut(mesh, [plane], AutoMovieHumanF1Trace.TOLERANCE, 0)[0]!;
          const built: AutoMovieMeshCourse.ISection = AutoMovieMeshCourse.cut(strip, [plane], AutoMovieHumanF1Trace.TOLERANCE, 0)[0]!;
          const error: string = source.loop === null || built.loop === null
            ? "the raw or generated midpoint has no holding closed contour"
            : `${Math.max(armBoundaryGap(source.loop, built.loop), armBoundaryGap(built.loop, source.loop)).toFixed(3)} mm bidirectional raw midpoint deviation`;
          diagnostics.push(`${side} arm collar: local trim s${base.station.toFixed(3)}, raw local contour s${middle.station.toFixed(3)} (${middle.raw.length} vertices), shared row 17 s${station.toFixed(3)} (${root.length} vertices), ${error}.`);
          overlay.push(
            { id: `arm.${side}.inner-retained-edge`, points: base.trim.boundary, closed: true, colour: "008f6e" },
            { id: `arm.${side}.inside-observation`, points: middle.raw, closed: true, colour: "c48b1f" },
          );
          skin = strip;
        } catch (error: unknown) {
          diagnostics.push(`${side} arm collar refused: ${error instanceof Error ? error.message : String(error)}`);
          overlay.push({ id: `arm.${side}.retained-edge`, points: trimmed.boundary, closed: true, colour: "008f6e" });
          skin = trimmed.skin;
        }
      } catch (error: unknown) {
        diagnostics.push(`${side} arm local trim refused: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    const lower: TrunkRail | null = shoulderRail(skin, generated.construction, 0, from);
    const upper: TrunkRail | null = shoulderRail(skin, generated.construction, refined.sections.length - 1, to);
    const rails: [TrunkRail, TrunkRail] | null = lower !== null && upper !== null && lower.direction !== upper.direction ? [lower, upper] : null;
    diagnostics.push(rails === null
      ? "The original lower and upper torso rails do not both remain exact free cycles."
      : `The shoulder sheet retains ${rails[0].indices.length}/${rails[1].indices.length} exact lower and upper torso rail edges.`);
    diagnostics.push(...indexedTrunkReceipt(skin));
    ms.armscye = performance.now() - started;
    console.log(diagnostics.join("\n"));
    const capture: CaptureModel.IPart = CaptureSpecs.part({
      part: name,
      frames: [{ name: "world", parent: null, basis: { kind: "derived", rule: "F1 source world millimetres with Z negated" }, relative: AutoMovieHumanArmCurveSpec.IDENTITY }],
      root: AutoMovieHumanArmCurveSpec.IDENTITY,
      placement: "F1 source world",
      specs: [...lines, ...overlay.filter((line: CaptureModel.ILine): boolean => line.id.endsWith(".original-root"))]
        .map((line: CaptureModel.ILine): Spec => wire(line.id, [...line.points, line.points[0]!], "Actual archived armscye contour")),
      axis: (): null => null,
      chain: null,
      ports,
      diagnostics,
      relations: { parent: "trunk.archive", children: ["arm.left", "arm.right"], shares: [], basis: "observed horizontal arm merge intervals before oblique shoulder trimming" },
      reference: { status: "available", mesh: armscyeReference(mesh, from, to), cropToLoft: false, measures: { fromY: from, toY: to }, method: "original source skin in the armscye slab, including both arms" },
      milliseconds: ms,
    });
    capture.loft = indices.length === 0
      ? { status: "unavailable", cause: diagnostics.join("; ") }
      : { status: "available", lines: overlay, clay: skin, diagnostics };
    return { part: capture, rails };
  }

  /** Split observed one-to-one links at intervening unbridged source contours. */
  async function shoulderObservations(
    mesh: AutoMovieMeshExtract.IMesh,
    sections: IAutoMovieContourLoft64.ISection[],
    intervals: IAutoMovieContourLoft64.IInterval[],
    selected: IAutoMovieContourLoft64.IInterval[],
  ): Promise<{ sections: IAutoMovieContourLoft64.ISection[]; intervals: IAutoMovieContourLoft64.IInterval[]; diagnostics: string[] }> {
    const axis = NodeTrunkArchive.archiveAxis(await NodeTrunkArchive.archiveRows());
    const stations: number[] = selected.flatMap(({ beforeMm, afterMm }): number[] => {
      const pieces: number = Math.ceil((afterMm - beforeMm) / STEP.cut);
      return Array.from({ length: pieces - 1 }, (_: unknown, i: number): number => beforeMm + (afterMm - beforeMm) * (i + 1) / pieces);
    });
    const physical: AutoMovieMeshExtract.IMesh = NodeTrunkArchive.exactReferenceVertices(mesh);
    const cuts: AutoMovieMeshCourse.ISection[] = AutoMovieMeshCourse.cut(physical, stations.map((station: number) => ({ station, ...axis.at(station) })), AutoMovieHumanF1Trace.TOLERANCE, 0);
    const observed: IAutoMovieContourLoft64.ISection[] = [];
    const diagnostics: string[] = [];
    for (const { plane: { station, origin }, loop, pieces, flags } of cuts) {
      if (loop === null || pieces !== 1 || flags.length !== 0) {
        diagnostics.push(`armscye y${station.toFixed(3)} rejected: ${pieces} original outer loops; ${flags.join("; ") || "no holding loop"}.`);
        continue;
      }
      const points: V3[] = withoutClosingMarker(loop.map(([u, v]: V2): V3 => [origin[0] + u, station, -origin[2] - v]), "armscye source", diagnostics);
      // The original polygon edges are straight cubic spans. Their measured
      // vertices and chord lengths remain the authority for the strip.
      const steps: V3[] = points.map((point: V3, i: number): V3 => sub(points[(i + 1) % points.length]!, point));
      const phaseIntervals: number[] = steps.map((step: V3): number => Math.hypot(...step));
      if (points.length < 3 || phaseIntervals.some((length: number): boolean => !(length > 0))) {
        diagnostics.push(`armscye y${station.toFixed(3)} rejected: the original holding loop has a collapsed edge.`);
        continue;
      }
      const curve: IAutoMovieCurve64.Cubic = {
        type: "cubicBezier", name: `armscye.source.${station}`, closed: true, unit: "mm", phaseUnit: "mm",
        phaseIntervals,
        spans: points.map((point: V3, i: number): IAutoMovieCurve64.Span => [
          point, add(point, scale(steps[i]!, 1 / 3)), add(point, scale(steps[i]!, 2 / 3)), points[(i + 1) % points.length]!,
        ]),
      };
      observed.push({ coordinateMm: station, loops: [{ winding: 1, curve }] });
    }
    const refined: IAutoMovieContourLoft64.IInterval[] = intervals.flatMap((interval): IAutoMovieContourLoft64.IInterval[] => {
      const { beforeMm, afterMm, groups } = interval;
      const within: number[] = observed.map((section): number => section.coordinateMm).filter((station: number): boolean => station > beforeMm && station < afterMm);
      if (within.length === 0) return [interval];
      const rails: number[] = [beforeMm, ...within, afterMm];
      return rails.slice(1).map((end: number, i: number) => ({ beforeMm: rails[i]!, afterMm: end, groups }));
    });
    return { sections: [...sections, ...observed].sort((a, b): number => a.coordinateMm - b.coordinateMm), intervals: refined, diagnostics };
  }

  /** Read one original horizontal rail back from the actual emitted index boundary. */
  function shoulderRail(skin: CaptureModel.ITriangles, construction: IAutoMovieContourLoft64.IResult["construction"], section: number, station: number): TrunkRail | null {
    const original = construction.find((loop): boolean => loop.id.endsWith(`.section.${section}.loop.0`));
    if (original === undefined) return null;
    const points: V3[] = increasingPhase(original.points.map(([x, y, z]: V3): V3 => [x * 1000, y * 1000, z * -1000]));
    const candidates: Map<string, number | null> = new Map(points.map((point: V3): [string, null] => [point.join(","), null]));
    const used: Set<number> = new Set(skin.indices);
    for (const vertex of used) {
      const key: string = skin.positions.slice(3 * vertex, 3 * vertex + 3).join(",");
      if (!candidates.has(key)) continue;
      if (candidates.get(key) !== null) return null;
      candidates.set(key, vertex);
    }
    const indices: number[] = [];
    for (const point of points) {
      const vertex: number | null | undefined = candidates.get(point.join(","));
      if (vertex === null || vertex === undefined) return null;
      indices.push(vertex);
    }
    const faces: [number, number, number][] = [];
    for (let i: number = 0; i < skin.indices.length; i += 3) faces.push([skin.indices[i]!, skin.indices[i + 1]!, skin.indices[i + 2]!]);
    const sense: number = edgeSense(indices, faces);
    return Math.abs(sense) === indices.length ? { station, points, indices, direction: Math.sign(sense) } : null;
  }

  /** Cut only the positive-side sheet connected to the actual distal arm ring. */
  function trimArmscye(mesh: CaptureModel.ITriangles, origin: V3, normal: V3, seed: readonly V3[]): { skin: CaptureModel.ITriangles; boundary: V3[]; boundaryIndices: number[] } {
    const positions: number[] = [...mesh.positions];
    const at = (i: number): V3 => [positions[3 * i]!, positions[3 * i + 1]!, positions[3 * i + 2]!];
    const length: number = positions.length / 3;
    const sign: number[] = Array.from({ length }, (_: unknown, i: number): number => armDot(sub(at(i), origin), normal));
    const parents: Int32Array = Int32Array.from({ length }, (_: unknown, i: number): number => i);
    const owner = (index: number): number => {
      while (parents[index] !== index) {
        parents[index] = parents[parents[index]!]!;
        index = parents[index]!;
      }
      return index;
    };
    for (let i: number = 0; i < mesh.indices.length; i += 3) {
      const positive: number[] = mesh.indices.slice(i, i + 3).filter((vertex: number): boolean => sign[vertex]! > 0);
      for (let j: number = 1; j < positive.length; ++j) parents[owner(positive[j]!)] = owner(positive[0]!);
    }
    const source: Set<string> = new Set(seed.map((point: V3): string => point.join(",")));
    const components: Set<number> = new Set();
    for (const vertex of mesh.indices)
      if (sign[vertex]! > 0 && source.has(at(vertex).join(","))) components.add(owner(vertex));
    if (components.size !== 1) throw new Error(`the observed distal ring meets ${components.size} positive-side sheets`);
    const selected: number = [...components][0]!;
    const indices: number[] = [];
    const crossings: Map<string, number> = new Map();
    const cutVertices: Set<number> = new Set();
    const cutEdges: Map<string, { a: number; b: number; uses: number }> = new Map();
    const key = (a: number, b: number): string => a < b ? `${a},${b}` : `${b},${a}`;
    const intersection = (a: number, b: number): number => {
      if (sign[a] === 0 || sign[b] === 0) {
        const vertex: number = sign[a] === 0 ? a : b;
        cutVertices.add(vertex);
        return vertex;
      }
      const edge: string = key(a, b);
      const old: number | undefined = crossings.get(edge);
      if (old !== undefined) return old;
      const vertex: number = positions.length / 3;
      positions.push(...add(at(a), scale(sub(at(b), at(a)), sign[a]! / (sign[a]! - sign[b]!))));
      crossings.set(edge, vertex);
      cutVertices.add(vertex);
      return vertex;
    };
    for (let i: number = 0; i < mesh.indices.length; i += 3) {
      const face: number[] = mesh.indices.slice(i, i + 3);
      const positive: number | undefined = face.find((vertex: number): boolean => sign[vertex]! > 0);
      if (positive === undefined || owner(positive) !== selected) {
        indices.push(face[0]!, face[1]!, face[2]!);
        continue;
      }
      const kept: number[] = [];
      for (let j: number = 0; j < 3; ++j) {
        const a: number = face[j]!;
        const b: number = face[(j + 1) % 3]!;
        if (sign[a]! <= 0) kept.push(a);
        if ((sign[a]! > 0) !== (sign[b]! > 0)) kept.push(intersection(a, b));
      }
      const polygon: number[] = kept.filter((vertex: number, j: number): boolean => vertex !== kept[(j + kept.length - 1) % kept.length]);
      if (polygon.length < 3) continue;
      for (let j: number = 0; j < polygon.length; ++j) {
        const a: number = polygon[j]!;
        const b: number = polygon[(j + 1) % polygon.length]!;
        if (!cutVertices.has(a) || !cutVertices.has(b)) continue;
        const edge: string = key(a, b);
        const previous = cutEdges.get(edge);
        if (previous === undefined) cutEdges.set(edge, { a, b, uses: 1 });
        else ++previous.uses;
      }
      for (let j: number = 2; j < polygon.length; ++j) indices.push(polygon[0]!, polygon[j - 1]!, polygon[j]!);
    }
    const next: Map<number, number> = new Map();
    for (const { a, b, uses } of cutEdges.values()) {
      if (uses !== 1) continue;
      if (next.has(a)) throw new Error("the local trim boundary branches");
      next.set(a, b);
    }
    if (next.size < 3) throw new Error("the selected arm did not leave a closed boundary");
    const start: number = next.keys().next().value!;
    const boundary: V3[] = [];
    const boundaryIndices: number[] = [];
    let current: number = start;
    do {
      boundary.push(at(current));
      boundaryIndices.push(current);
      const following: number | undefined = next.get(current);
      if (following === undefined || boundary.length > next.size) throw new Error("the local trim boundary is open");
      current = following;
    } while (current !== start);
    if (boundary.length !== next.size) throw new Error("the local trim has more than one boundary loop");
    return { skin: { positions, indices }, boundary, boundaryIndices };
  }

  /** Continue the retained edge through the original parallel arm sections. */
  function armCollar(skin: CaptureModel.ITriangles, boundary: V3[], boundaryIndices: number[], observed: V3[][], normal: V3): CaptureModel.ITriangles {
    const positions: number[] = [...skin.positions];
    const indices: number[] = [...skin.indices];
    const owned: Map<V3, number> = new Map(boundary.map((point: V3, i: number): [V3, number] => [point, boundaryIndices[i]!]));
    const increasing: boolean = armDot(AutoMovieMeshCourse.newell(boundary), normal) > 0;
    let before: V3[] = boundary;
    for (const ring of observed) {
      const after: V3[] = (armDot(AutoMovieMeshCourse.newell(ring), normal) > 0) === increasing ? ring : [...ring].reverse();
      const triangles: [V3, V3, V3][] = [];
      tessellateAutoMovieContourStrip64(before, after, (a: V3, b: V3, c: V3): void => { triangles.push([a, b, c]); }, undefined, (observation): void => {
        if (!observation.qualified) throw new Error(observation.diagnostics.join(" | ") || "ordinary collar did not qualify");
      });
      const first: number = edgeSense(before, triangles);
      const second: number = edgeSense(after, triangles);
      if (Math.abs(first) !== before.length || Math.abs(second) !== after.length || Math.sign(first) === Math.sign(second))
        throw new Error("ordinary collar does not consume both full original edge cycles");
      for (const [a, b, c] of triangles)
        for (const point of first < 0 ? [a, b, c] : [a, c, b]) {
          let vertex: number | undefined = owned.get(point);
          if (vertex === undefined) {
            vertex = positions.length / 3;
            positions.push(...point);
            owned.set(point, vertex);
          }
          indices.push(vertex);
        }
      before = after;
    }
    return { positions, indices };
  }

  /** Keep the source triangles meeting the shoulder slab and frame their used vertices. */
  function armscyeReference(mesh: AutoMovieMeshExtract.IMesh, from: number, to: number): CaptureModel.ITriangles {
    const positions: number[] = [];
    const indices: number[] = [];
    const remap: Map<number, number> = new Map();
    const y = (vertex: number): number => mesh.positions[3 * vertex + 1]!;
    for (let i: number = 0; i + 2 < mesh.indices.length; i += 3) {
      const face: [number, number, number] = [mesh.indices[i]!, mesh.indices[i + 1]!, mesh.indices[i + 2]!];
      const [a, b, c]: number[] = face.map(y);
      if (Math.max(a!, b!, c!) < from || Math.min(a!, b!, c!) > to) continue;
      for (const vertex of face) {
        let target: number | undefined = remap.get(vertex);
        if (target === undefined) {
          target = positions.length / 3;
          remap.set(vertex, target);
          positions.push(mesh.positions[3 * vertex]!, y(vertex), mesh.positions[3 * vertex + 2]!);
        }
        indices.push(target);
      }
    }
    return { positions, indices };
  }
}
