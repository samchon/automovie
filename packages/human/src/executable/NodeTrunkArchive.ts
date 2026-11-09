import fs from "node:fs/promises";
import { AutoMovieContourLoftCurves64, AutoMovieMeshCourse, AutoMovieMeshExtract, AutoMovieViewAxis, type IAutoMovieCurve64 } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanF1Fork } from "../generation/trunk/AutoMovieHumanF1Fork";
import type { CaptureModel } from "../inspection/CaptureModel";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeTrunkCaptureGeometry } from "./NodeTrunkCaptureGeometry";

type V3 = CaptureModel.Vec3;
type V2 = [number, number];

const { armDot, increasingPhase, span, add, sub, scale, MID, STEP }: typeof NodeTrunkCaptureGeometry = NodeTrunkCaptureGeometry;

/** Read the archived F1 trunk sections and the exact source boundaries. */
export namespace NodeTrunkArchive {
  /** Endpoints and endpoint derivatives from one original Hermite span. */
  type HermiteSpan = { start: V3; end: V3; startDerivative: V3; endDerivative: V3 };

  /** One original section and its recorded Hermite loops in archive millimetres. */
  export type TrunkStation = {
    coordinateMm: number;
    originMm: V3;
    loops: { kind: string; fit: { sampleMaximumMm: number; polylineUpperEstimateMm: number; toleranceMet: boolean }; curve: { name: string; closed: boolean; phaseIntervals: number[]; spans: HermiteSpan[] } }[];
  };
  /** An original arm section with its archive frame and course distance. */
  export type ArmRoot = TrunkStation & { u: V3; v: V3; normal: V3; stationMm: number };

  export async function archiveRows(): Promise<TrunkStation[]> {
    const files: string[] = ["001", "002"].map((file: string): string => HumanNodePaths.resolve(`.references/curves/hermite/f1/limbs/trunk/trunk-horizontal-v2-${file}.json`));
    const packets: { stations: TrunkStation[] }[] = await Promise.all(files.map(async (file: string): Promise<{ stations: TrunkStation[] }> => JSON.parse(await fs.readFile(file, "utf8")) as { stations: TrunkStation[] }));
    return packets.flatMap((packet: { stations: TrunkStation[] }): TrunkStation[] => packet.stations);
  }

  export async function armRoots(): Promise<ArmRoot[]> {
    return Promise.all([armRoot("l"), armRoot("r")]);
  }

  /** Read the first independent arm section, row 17 at s68 on the arm course. */
  export async function armRoot(side: "l" | "r"): Promise<ArmRoot> {
    const arm: string = `arm_${side}`;
    const file: string = HumanNodePaths.resolve(`.references/curves/hermite/f1/limbs/${arm}/${arm}-root-v3-001.json`);
    return (JSON.parse(await fs.readFile(file, "utf8")) as { stations: ArmRoot[] }).stations[0]!;
  }

  /** Read row 16 for the inboard plane only. Its loop can still contain the trunk. */
  export async function insideArmRoot(side: "l" | "r"): Promise<ArmRoot> {
    const arm: string = `arm_${side}`;
    const file: string = HumanNodePaths.resolve(`.references/curves/hermite/f1/limbs/${arm}/${arm}-v2-001.json`);
    const { stations } = JSON.parse(await fs.readFile(file, "utf8")) as { stations: ArmRoot[] };
    return stations[16]!;
  }

  /** Sample the exact archived curve at its 0.2 mm chord tolerance. */
  export function observedArmRoot(arm: ArmRoot): V3[] {
    const outer: ArmRoot["loops"] = arm.loops.filter((loop): boolean => loop.kind === "closed" && loop.curve.closed);
    if (outer.length !== 1) throw new Error("Armscye: the original oblique root does not have one closed outer contour");
    const points: V3[] = AutoMovieContourLoftCurves64.tessellate(archiveCurve(outer[0]!.curve), 0.2)
      .map(({ p }): V3 => archiveWorld(p));
    return armDot(AutoMovieMeshCourse.newell(points), archiveWorld(arm.normal)) > 0 ? points : points.reverse();
  }

  /** Reflect archive Z into the capture frame, preserving millimetres, pose and side names. */
  export function archiveWorld([x, y, z]: V3): V3 {
    return [x, y, -z];
  }

  /** Convert the observed Hermite intervals to the existing native cubic representation. */
  export function archiveCurve(source: TrunkStation["loops"][number]["curve"]): IAutoMovieCurve64.Cubic {
    return {
      type: "cubicBezier",
      name: source.name,
      closed: source.closed,
      unit: "mm",
      phaseUnit: "mm",
      phaseIntervals: source.phaseIntervals,
      spans: source.spans.map((span: HermiteSpan, i: number): IAutoMovieCurve64.Span => {
        const third: number = source.phaseIntervals[i]! / 3;
        return [span.start, add(span.start, scale(span.startDerivative, third)), sub(span.end, scale(span.endDerivative, third)), span.end];
      }),
    };
  }

  export function archiveAxis(rows: readonly TrunkStation[]): AutoMovieViewAxis.IAxis {
    const middle: TrunkStation | undefined = rows.find((row: TrunkStation): boolean => row.coordinateMm >= MID);
    if (middle === undefined) throw new Error("trunk: the original curves do not include the archive origin station");
    const [x, , z]: V3 = middle.originMm;
    return AutoMovieViewAxis.straight([x, 0, -z], [1, 0, 0], [0, 0, 1]);
  }

  /** Reuse raw vertex identity only where all three original coordinates are equal. */
  export function exactReferenceVertices(mesh: AutoMovieMeshExtract.IMesh): AutoMovieMeshExtract.IMesh {
    const vertices: Map<string, number> = new Map();
    const alias: Int32Array = new Int32Array(mesh.positions.length / 3);
    for (let index: number = 0; index < alias.length; ++index) {
      const start: number = index * 3;
      const key: string = `${mesh.positions[start]},${mesh.positions[start + 1]},${mesh.positions[start + 2]}`;
      const owner: number | undefined = vertices.get(key);
      alias[index] = owner ?? index;
      if (owner === undefined) vertices.set(key, index);
    }
    return { positions: mesh.positions, indices: Array.from(mesh.indices, (index: number): number => alias[index]!) };
  }

  /** Read the original skin between the measured fork and the first level section. */
  export function forkTransition(mesh: AutoMovieMeshExtract.IMesh, start: AutoMovieHumanF1Fork.IResult["parentPlane"], end: V3, diagnostics: string[]): Map<number, V3[]> {
    // Intermediate planes interpolate the two actual plane equations. Their common intersection remains fixed.
    const count: number = Math.ceil((end[1] - start.centroid[1]) / STEP.cut);
    const a: number = armDot(start.normal, start.centroid);
    const v: V3 = [0, 0, 1];
    const planes = Array.from({ length: count - 1 }, (_: unknown, index: number) => {
      const t: number = (index + 1) / count;
      const n: V3 = add(scale(start.normal, 1 - t), [0, t, 0]);
      const x: number = start.centroid[0] * (1 - t) + end[0] * t;
      const z: number = start.centroid[2] * (1 - t) + end[2] * t;
      const y: number = ((1 - t) * a + t * end[1] - n[0] * x) / n[1];
      const u: V3 = scale([n[1], -n[0], 0], 1 / Math.hypot(n[0], n[1]));
      return { station: y, origin: [x, y, z] as V3, u, v };
    });
    const cuts: AutoMovieMeshCourse.ISection[] = AutoMovieMeshCourse.cut(mesh, planes, AutoMovieHumanF1Trace.TOLERANCE, 0);
    const rings: Map<number, V3[]> = new Map();
    for (const section of cuts) {
      const { station, origin, u }: AutoMovieMeshCourse.IPlane = section.plane;
      const contour: V3[] = section.loop?.map(([p, q]: V2): V3 => add(origin, add(scale(u, p), scale(v, q)))) ?? [];
      const inside: boolean = contour.length > 0 && contour.every((point: V3): boolean =>
        armDot(sub(point, start.centroid), start.normal) > 0 && point[1] < end[1],
      );
      if (section.pieces === 1 && inside)
        rings.set(station, increasingPhase(withoutClosingMarker(contour, "fork transition", diagnostics)));
      diagnostics.push(`fork transition y${station.toFixed(3)}: ${section.pieces} strict outer loops, ${contour.length} holding vertices, ${section.flags.join("; ") || "no flags"}; ${section.pieces === 1 && inside ? "retained original ring" : "no ordered closed ring"}.`);
    }
    return rings;
  }

  export function readNeck(mesh: AutoMovieMeshExtract.IMesh, axis: AutoMovieViewAxis.IAxis, diagnostics: string[]): V3[] | null {
    const y: number = 1458;
    const section: AutoMovieHumanF1Trace.ICut | null = AutoMovieHumanF1Trace.read(mesh, axis, y);
    if (section === null) return null;
    const { origin }: ReturnType<AutoMovieViewAxis.IAxis["at"]> = axis.at(y);
    const points: V3[] = increasingPhase(section.loop.map(([u, v]: V2): V3 => [origin[0]! + u, y, origin[2]! + v]));
    return withoutClosingMarker(points, "neck 1458 mm", diagnostics);
  }

  /** The reference outline can repeat its first point as a closing marker. */
  export function withoutClosingMarker(points: V3[], label: string, diagnostics: string[]): V3[] {
    const first: V3 = points[0]!;
    const last: V3 = points[points.length - 1]!;
    const same = (point: V3): boolean => point[0] === first[0] && point[1] === first[1] && point[2] === first[2];
    if (!same(last) || points.slice(1, -1).some(same)) return points;
    diagnostics.push(`${label}: repeated closing marker (${first.join(", ")}) excluded, ${points.length - 1} unchanged physical boundary points`);
    return points.slice(0, -1);
  }
}
