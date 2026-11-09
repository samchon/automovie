import fs from "node:fs/promises";
import { AutoMovieContourLoftCurves64, type AutoMovieViewAxis } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeArmCaptureGeometry } from "./NodeArmCaptureGeometry";
import { NodeArmHandSkin } from "./NodeArmHandSkin";
import type { NodeCaptureSources } from "./NodeCaptureSources";
import { NodeTrunkCaptureSource } from "./NodeTrunkCaptureSource";

type V3 = CaptureModel.Vec3;

/**
 * The F1 arm capture provider. Each arm uses her own archived normal planes
 * from its first independent upper-arm section to the open palm. The
 * ordinary sleeve keeps her measured section shapes where the four-conic
 * trace produced elbow bands. The existing conic wrist ring stays shared.
 */
export namespace NodeArmCaptureSource {
  type IReferenceSection = NodeArmCaptureGeometry.IReferenceSection;
  type IReferencePlane = NodeArmCaptureGeometry.IReferencePlane;
  type IReferenceTerminal = NodeArmCaptureGeometry.IReferenceTerminal;
  type IPalmArchive = NodeArmCaptureGeometry.IPalmArchive;
  const { attachContours, contourCoordinates, describeResidual, difference,
    measuredPalm, openTerminal, physicalPlane, referenceAxis, sleeve, world }: typeof NodeArmCaptureGeometry = NodeArmCaptureGeometry;

  const ARCHIVE: string = ".references/curves/bezier/f1/limbs";
  const DIGITS = ["thumb", "index", "middle", "ring", "pinky"] as const;
  // Last admitted conic ring before each observed terminal chart needs
  // ordinary contours. Both sides have the same source row boundaries.
  const DISTAL: Partial<Record<(typeof DIGITS)[number], number>> = { thumb: 40, index: 37, pinky: 30 };

  /** The provider entry. */
  export const PROVIDER: NodeCaptureSources.IProvider = {
    names: (["left", "right"] as const).flatMap((side: "left" | "right"): string[] => [`arm.${side}`, `thumb.${side}`, `finger.${side}.1`, `finger.${side}.2`, `finger.${side}.3`, `finger.${side}.4`]),
    files: [
      "packages/human/src/executable/NodeArmCaptureSource.ts",
      "packages/human/src/executable/NodeArmHandSkin.ts",
      "packages/human/src/executable/NodeArmNativeSaddle.ts",
      "packages/human/src/executable/NodeArmFingerFan.ts",
      "packages/human/src/executable/NodeArmCaptureGeometry.ts",
      "packages/human/src/executable/NodeTrunkCaptureSource.ts",
      "packages/human/src/executable/NodeTrunkArchive.ts",
      "packages/human/src/executable/NodeTrunkCaptureGeometry.ts",
      "packages/human/src/generation/AutoMovieHumanF1Trace.ts",
      "packages/human/src/generation/arm/AutoMovieHumanArmCurveSpec.ts",
      "packages/human/src/generation/arm/AutoMovieHumanArmJet.ts",
      "packages/human/src/generation/arm/AutoMovieHumanArmF1Pose.ts",
      `${ARCHIVE}/index.json`,
      ...["l", "r"].flatMap((side: string): string[] => [
        `.references/curves/hermite/f1/limbs/arm_${side}/arm_${side}-root-v3-001.json`,
        `${ARCHIVE}/arm_${side}/arm_${side}-v2-001.json`,
        `${ARCHIVE}/records/arm_${side}-joints-v2.json`,
        ...DIGITS.map((digit: string): string => `${ARCHIVE}/${digit}_${side}/${digit}_${side}-v3-001.json`),
      ]),
    ],
    prepare,
  };

  /** Build the selected reference arm or an individual digit. */
  async function prepare(name: string, context: NodeCaptureSources.IContext): Promise<CaptureModel.IPart> {
    const side: "left" | "right" = name.endsWith(".right") || name.includes(".right.") ? "right" : "left";
    return name === `arm.${side}` ? traceArm(name, side, context) : digit(name, side, context);
  }

  /**
   * Cut the reference's own arm from its first independent upper-arm section
   * to the open palm. The source records locate the measured arm, elbow,
   * wrist and palm in native world coordinates. Only the chart convention
   * changes when the capture consumes them.
   */
  async function traceArm(name: string, side: "left" | "right", context: NodeCaptureSources.IContext): Promise<CaptureModel.IPart> {
    const limb: string = side === "left" ? "arm_l" : "arm_r";
    const started: number = performance.now();
    const [joints, arm, ref, armscye] = await Promise.all([
      referenceRecord<IReferencePlane[]>(`${ARCHIVE}/records/${limb}-joints-v2.json`),
      referenceRecord<{ stations: IReferenceSection[] }>(`${ARCHIVE}/${limb}/${limb}-v2-001.json`),
      context.reference(),
      NodeTrunkCaptureSource.armBoundary(side),
    ]);
    // The root-v3 records identify index 17 as the first separated arm
    // contour on each side. Keep that exact shared boundary and start the
    // conic at the following measured plane, four millimetres downstream.
    const sections: IReferenceSection[] = arm.stations.slice(17);
    const planes: IReferencePlane[] = sections.map(({ originMm, u, v }: IReferenceSection): IReferencePlane => ({ origin: originMm, u, v }));
    const shoulder: V3 = world(planes[0]!.origin);
    const elbow: V3 = world(joints[0]!.origin);
    const wrist: V3 = world(joints[1]!.origin);
    const cuts: number[] = sections.map((section: IReferenceSection): number => section.stationMm);
    const axis: AutoMovieViewAxis.IAxis = referenceAxis(planes, cuts);
    const mesh: CaptureModel.ITriangles = referenceMesh(ref);
    const { lines, observations } = archivedRings(name, sections, axis, cuts);
    // Both source wrists first exceed 0.9 mm in the four-conic trace at
    // row 127. Keep the last lower-error conic and follow the observed
    // wrist contours through the change in support.
    const palmStart: number = sections.findIndex((section: IReferenceSection): boolean => section.station === 126);
    if (sections[1]?.station !== 18 || palmStart < 2)
      throw new Error(`${name} archive is missing the armscye continuation or palm junction ring`);
    const armCuts: number[] = cuts.slice(1, palmStart + 1);
    let palm: IPalmArchive | undefined;
    let refusal: string | undefined;
    try {
      palm = measuredPalm(side, mesh, sections, palmStart, lines[palmStart]!.points);
    } catch (error) {
      refusal = `measured palm refused: ${error instanceof Error ? error.message : String(error)}`;
    }
    const prepared: number = performance.now() - started;
    const trace: AutoMovieHumanF1Trace.IOutput = AutoMovieHumanF1Trace.create({ name, mesh, axis, cuts: armCuts, order: 32, samples: 64 }, observations);
    const turns: number[] = trace.cuts.flatMap((cut): number[] => cut.kr === null ? [] : [cut.kr]);
    const measured: AutoMovieHumanF1Trace.ILayer[] = trace.layers.filter((layer: AutoMovieHumanF1Trace.ILayer): boolean => layer.fault === null && Number.isFinite(layer.max));
    const worst: AutoMovieHumanF1Trace.ILayer | undefined = measured.reduce<AutoMovieHumanF1Trace.ILayer | undefined>(
      (max, layer) => max === undefined || layer.max > max.max ? layer : max, undefined);
    const boundary: AutoMovieHumanF1Trace.ILayer | undefined = measured.find((layer: AutoMovieHumanF1Trace.ILayer): boolean => layer.station === cuts[palmStart]);
    const diagnostics: string[] = [
      `conic wrist support from archive rows 18–126: ${armCuts.length} contours, ${trace.cuts.length} holding loops, sampled max k*r ${Math.max(...turns).toFixed(4)}`,
      ...(worst === undefined ? [] : [`prior conic sleeve residual ${worst.max.toFixed(3)} mm at ${worst.station.toFixed(3)} mm, ${worst.between ? "between cuts" : "archived cut"}`]),
      ...(boundary === undefined ? [] : [`wrist junction row 126: ${describeResidual(boundary, axis)}`]),
      ...(palm === undefined ? [] : [palm.receipt]),
      ...(refusal === undefined ? [] : [refusal]),
      ...trace.diagnostics,
    ];
    const frame: string = `${name}.world`;
    const port = (name: string, point: V3, radius: number): { name: string; frame: string; point: V3; radius: number } => ({ name, frame, point, radius });
    const part: CaptureModel.IPart = CaptureSpecs.part({
      part: name,
      frames: [{ name: frame, parent: null, basis: { kind: "derived", rule: "reference world axes in the capture chart" }, relative: AutoMovieHumanArmCurveSpec.IDENTITY }],
      root: AutoMovieHumanArmCurveSpec.IDENTITY,
      placement: "F1 reference world from the measured armscye to the open palm",
      specs: [],
      axis: (): null => null,
      chain: trace.loft?.chain ?? null,
      diagnostics,
      ports: [port("upper-arm root", shoulder, 110), port("elbow", elbow, 110), port("wrist", wrist, 95), ...(palm === undefined ? [] : [port("measured open palm", palm.end, 75)])],
      relations: {
        parent: "trunk",
        children: [`thumb.${side}`, ...[1, 2, 3, 4].map((digit: number): string => `finger.${side}.${digit}`)],
        shares: [],
        basis: "measured armscye rim and observed whole-hand terminal. The digit junction remains open",
      },
      reference: { status: "available", mesh, measures: {}, method: "native F1 body in world millimetres, with the capture chart's rightward Z" },
      milliseconds: { referenceCourse: prepared, trace: performance.now() - started - prepared },
    });
    const originals: CaptureModel.ILine[] = palm === undefined ? lines.slice(0, palmStart + 1) : [
      ...lines.slice(0, palmStart),
      ...palm.rows.slice(0, -1).map((row: IReferenceSection): CaptureModel.ILine => ({
        id: `${name}.archive.${row.station}`,
        points: AutoMovieContourLoftCurves64.tessellate(row.loops[0]!.curve, 0.1).map(({ p }): V3 => world(p)),
        closed: true, colour: "008080",
      })),
      { id: `${name}.whole-hand`, points: palm.outline, closed: true, colour: "008080" },
    ];
    originals[0] = { id: `${name}.armscye`, points: armscye, closed: true, colour: "008080" };
    part.curves = [{ id: `${name}.archive`, part: name, frame, kind: "original sections", lines: originals, aids: [], datums: [] }];
    const chain = trace.loft?.chain;
    if (part.loft.status === "available") {
      // Rows 67 and 68 are only 0.179 mm apart and differ by less
      // than 0.32 mm on either arm. Keep the original joint contour 68.
      const sleeveRows = sections.slice(1, palmStart).map((row, i) => ({ row, line: lines[i + 1]! })).filter(({ row }): boolean => row.station !== 67);
      try {
        const wristFrame = axis.at(cuts[palmStart]!);
        const shape = sleeve(part.loft.clay, armscye, physicalPlane(sections[0]!), sleeveRows, physicalPlane(sections[palmStart]!), wristFrame);
        part.loft.clay = shape.clay;
        part.loft.lines = shape.lines;
        const diagnosis: string = `Ordinary sleeve uses ${sleeveRows.length} original intermediate contours and retains all ${armscye.length} armscye and 72 wrist edges.`;
        part.diagnostics.push(diagnosis);
        part.loft.diagnostics.push(diagnosis);
      } catch (error) {
        part.loft = { status: "unavailable", cause: `measured sleeve refused: ${error instanceof Error ? error.message : String(error)}` };
      }
    }
    if (part.loft.status === "available" && palm !== undefined && chain !== null && chain !== undefined && chain.opposite === undefined && chain.pole === undefined) {
      const palmStarted: number = performance.now();
      let diagnosis: string;
      try {
        diagnosis = attachContours(part.loft.clay, palm.rows, lines[palmStart]!.points, axis.at(cuts[palmStart]!), undefined, contourCoordinates(palm.rows, side === "left"));
      } catch (error) {
        diagnosis = `palm junction refused: ${error instanceof Error ? error.message : String(error)}`;
      }
      part.diagnostics.push(diagnosis);
      part.loft.diagnostics.push(diagnosis);
      part.milliseconds.palm = performance.now() - palmStarted;
    }
    if (part.loft.status === "available" && palm !== undefined) {
      const started: number = performance.now();
      try {
        const result = await NodeArmHandSkin.create({
          side, raw: mesh, arm: part.loft.clay, armscye,
          digit: async (label, first): Promise<CaptureModel.ITriangles> => {
            const number: number = DIGITS.indexOf(label);
            const name: string = number === 0 ? `thumb.${side}` : `finger.${side}.${number}`;
            const made: CaptureModel.IPart = await digit(name, side, context, first);
            if (made.loft.status !== "available") throw new Error(made.loft.cause);
            return made.loft.clay;
          },
        });
        part.loft.clay = result.mesh;

        // The audited mesh contains all five digits. Grouped views can omit
        // their separate meshes while individual digit selections stay available.
        part.included = [...part.relations.children];
        part.relations.basis = "measured armscye and five joined original hand courses";
        part.diagnostics.push(...result.diagnostics);
        part.loft.diagnostics.push(...result.diagnostics);
      } catch (error) {
        const diagnosis: string = `native hand continuation refused: ${error instanceof Error ? error.message : String(error)}`;
        part.diagnostics.push(diagnosis);
        part.loft.diagnostics.push(diagnosis);
      }
      part.milliseconds.hand = performance.now() - started;
    }
    return part;
  }


  async function referenceRecord<T>(file: string): Promise<T> {
    return JSON.parse(await fs.readFile(HumanNodePaths.resolve(file), "utf8")) as T;
  }

  function referenceMesh(ref: NodeCaptureSources.IReference): CaptureModel.ITriangles {
    const body = ref.model.parts.find((part): boolean => part.id === "body");
    if (body?.geometry.type !== "mesh" || body.geometry.mesh.indices === null)
      throw new Error("F1 reference has no native body triangles");
    const source: number[] = body.geometry.mesh.positions;
    const positions: number[] = [];
    for (let i: number = 0; i < source.length; i += 3) positions.push(source[i]! * 1000, source[i + 1]! * 1000, -source[i + 2]! * 1000);
    return { positions, indices: body.geometry.mesh.indices };
  }

  /**
   * Trace the digit's own v3 contour succession in the observed hand pose.
   * The archive's first independent ring and terminal receipt identify its
   * interval. The former remains open for the palm junction.
   */
  async function digit(name: string, side: "left" | "right", context: NodeCaptureSources.IContext, first?: number): Promise<CaptureModel.IPart> {
    const index: number = name.startsWith("thumb.") ? 0 : Number(name.split(".")[2]);
    const digitName: (typeof DIGITS)[number] | undefined = DIGITS[index];
    if (digitName === undefined) throw new Error(`Unknown reference digit ${name}`);
    const family: string = `${digitName}_${side === "left" ? "l" : "r"}`;
    const started: number = performance.now();
    const [archive, indexRecord, ref] = await Promise.all([
      referenceRecord<{ stations: IReferenceSection[] }>(`${ARCHIVE}/${family}/${family}-v3-001.json`),
      referenceRecord<{ families: IReferenceFamily[] }>(`${ARCHIVE}/index.json`),
      context.reference(),
    ]);
    const observedRoot: number | undefined = indexRecord.families.find((row: IReferenceFamily): boolean => row.name === `${family}-root-v3`)?.meta.index;
    const terminal = indexRecord.families.find((row: IReferenceFamily): boolean => row.name === `${family}-v3`)?.meta.terminal?.terminal;
    const last: IReferenceSection | undefined = archive.stations.reduce<IReferenceSection | undefined>(
      (last, row) => row.loops.length !== 0 ? row : last, undefined);
    if (observedRoot === undefined || last === undefined || terminal?.singleTipQualified !== true || terminal.maximum.pointsMm.length !== 1)
      throw new Error(`${name}: archive is missing the independent root or regular terminal`);
    const root: number = first ?? observedRoot;
    if (root < observedRoot || !archive.stations.some((row: IReferenceSection): boolean => row.station === root && row.loops.length === 1))
      throw new Error(`${name}: requested continuation does not start at an observed independent ring`);
    const sections: IReferenceSection[] = archive.stations.filter((row: IReferenceSection): boolean => row.station >= root && row.station <= last.station);
    const tip: V3 = world(terminal.maximum.pointsMm[0]!);
    const cuts: number[] = sections.map((row: IReferenceSection): number => row.stationMm);
    const axis: AutoMovieViewAxis.IAxis = referenceAxis(sections.map(({ originMm, u, v }: IReferenceSection): IReferencePlane => ({ origin: originMm, u, v })), cuts);
    const { lines, observations } = archivedRings(name, sections, axis, cuts);
    const mesh: CaptureModel.ITriangles = referenceMesh(ref);
    const lastConic: number = DISTAL[digitName] ?? last.station;
    const split: number = sections.findIndex((row: IReferenceSection): boolean => row.station === lastConic);
    if (split < 1) throw new Error(`${name}: archive is missing the last conic ring`);
    const conicCuts: number[] = cuts.slice(0, split + 1);
    const prepared: number = performance.now() - started;
    const trace: AutoMovieHumanF1Trace.IOutput = AutoMovieHumanF1Trace.create({ name, mesh, axis, cuts: conicCuts, order: 32, samples: 64 }, observations);
    const end: AutoMovieHumanF1Trace.ILayer | undefined = trace.layers.find((layer: AutoMovieHumanF1Trace.ILayer): boolean =>
      layer.station === conicCuts[conicCuts.length - 1] && layer.fault === null);
    const frame: string = `${name}.world`;
    const part: CaptureModel.IPart = CaptureSpecs.part({
      part: name,
      frames: [{ name: frame, parent: null, basis: { kind: "derived", rule: "reference world axes in the capture chart" }, relative: AutoMovieHumanArmCurveSpec.IDENTITY }],
      root: AutoMovieHumanArmCurveSpec.IDENTITY,
      placement: `F1 ${digitName} in her own world from archived v3 rows ${root}–${last.station}`,
      specs: [],
      axis: (): null => null,
      chain: trace.loft?.chain ?? null,
      diagnostics: [
        `archive rows ${root}–${lastConic}: ${conicCuts.length} conic contours, ${trace.cuts.length} raw holding loops`,
        ...(end === undefined ? [] : [`last conic row ${lastConic}: ${describeResidual(end, axis)}`]),
        ...trace.diagnostics,
      ],
      ports: [
        { name: "independent root", frame, point: world(sections[0]!.originMm), radius: 30 },
        { name: "measured tip", frame, point: tip, radius: 25 },
      ],
      relations: { parent: `arm.${side}`, children: [], shares: [], basis: "the measured digit ring remains open pending its palm junction" },
      reference: { status: "available", mesh: digitReference(mesh, lines), measures: {}, method: "native F1 triangles in the digit's world-space display bounds" },
      milliseconds: { referenceCourse: prepared, trace: performance.now() - started - prepared },
    });
    part.curves = [{ id: `${name}.archive`, part: name, frame, kind: "archived Bézier sections", lines, aids: [], datums: [] }];
    if (part.loft.status === "available" && lastConic < last.station) {
      let diagnosis: string;
      try {
        diagnosis = attachContours(part.loft.clay, sections.slice(split), lines[split]!.points, axis.at(cuts[split]!), terminal);
      } catch (error) {
        diagnosis = `ordinary distal contour loft refused: ${error instanceof Error ? error.message : String(error)}`;
      }
      part.diagnostics.push(diagnosis);
      part.loft.diagnostics.push(diagnosis);
    } else if (part.loft.status === "available") {
      const lastPlane = axis.at(cuts[cuts.length - 1]!);
      const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
      const advance: number = S.dot(difference(tip, lastPlane.origin as V3), S.cross(lastPlane.v as V3, lastPlane.u as V3));
      if (advance > 0) {
        const mesh: CaptureModel.ITriangles = part.loft.clay;
        const { base, boundary } = openTerminal(mesh, lastPlane);
        const apex: number = mesh.positions.length / 3;
        mesh.positions.push(...tip);
        for (let i: number = 0; i < boundary.length; ++i)
          mesh.indices.push(apex, base + ((i + 1) % boundary.length), base + i);
        part.diagnostics.push(`closed at the archive's unique observed tip, ${advance.toFixed(3)} mm past the last cut`);
      } else part.diagnostics.push(`the measured tip lies ${advance.toFixed(3)} mm along the final plane normal; the end remains open`);
    }
    return part;
  }

  /** Keep original triangles near the digit for the same-camera display. */
  function digitReference(mesh: CaptureModel.ITriangles, lines: readonly CaptureModel.ILine[]): CaptureModel.ITriangles {
    const lower: V3 = [Infinity, Infinity, Infinity];
    const upper: V3 = [-Infinity, -Infinity, -Infinity];
    for (const line of lines)
      for (const point of line.points)
        for (let i: number = 0; i < 3; ++i) {
          lower[i] = Math.min(lower[i]!, point[i]! - 8);
          upper[i] = Math.max(upper[i]!, point[i]! + 8);
        }
    const inside = (vertex: number): boolean => lower.every((lo: number, i: number): boolean =>
      mesh.positions[vertex * 3 + i]! >= lo && mesh.positions[vertex * 3 + i]! <= upper[i]!);
    const positions: number[] = [];
    const indices: number[] = [];
    const used: Map<number, number> = new Map();
    for (let i: number = 0; i < mesh.indices.length; i += 3) {
      const triangle: number[] = mesh.indices.slice(i, i + 3);
      if (!triangle.some(inside)) continue;
      for (const vertex of triangle) {
        let local: number | undefined = used.get(vertex);
        if (local === undefined) {
          local = positions.length / 3;
          used.set(vertex, local);
          positions.push(...mesh.positions.slice(vertex * 3, vertex * 3 + 3));
        }
        indices.push(local);
      }
    }
    return { positions, indices };
  }

  /** The archived independent-root row and observed single-tip record. */
  interface IReferenceFamily {
    name: string;
    meta: { index?: number; terminal?: { terminal: IReferenceTerminal } };
  }

  /** Sample one archive contour in the same plane and chart used by the trace. */
  function archivedRings(
    name: string,
    sections: readonly IReferenceSection[],
    axis: AutoMovieViewAxis.IAxis,
    cuts: readonly number[],
  ): { lines: CaptureModel.ILine[]; observations: Map<number, [number, number][]> } {
    const observations: Map<number, [number, number][]> = new Map();
    const lines: CaptureModel.ILine[] = sections.map((section: IReferenceSection, i: number): CaptureModel.ILine => {
      const station: number = cuts[i]!;
      const chart = axis.at(station);
      const loop = section.loops.find((entry): boolean => entry.kind === "closed" && entry.curve.closed);
      if (section.loops.length !== 1 || loop === undefined) throw new Error(`${name} archive station ${section.station} must have one closed contour`);
      const points: V3[] = AutoMovieContourLoftCurves64.tessellate(loop.curve, 0.1).map(({ p }: AutoMovieContourLoftCurves64.Knot): V3 => world(p));
      observations.set(station, points.map((point: V3): [number, number] => {
        const relative: V3 = difference(point, chart.origin as V3);
        return [AutoMovieHumanArmCurveSpec.dot(relative, chart.u as V3), AutoMovieHumanArmCurveSpec.dot(relative, chart.v as V3)];
      }));
      return { id: `${name}.archive.${section.station}`, points, closed: true, colour: "008080" };
    });
    return { lines, observations };
  }
}
