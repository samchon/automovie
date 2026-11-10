import fs from "node:fs";
import path from "node:path";
import { AutoMovieViewAxis, type AutoMovieMeshExtract, type IAutoMovieLoftChain } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import { HumanNodePaths } from "./HumanNodePaths";
import type { NodeCaptureSources } from "./NodeCaptureSources";
import { NodeHeadFaceSampling } from "./NodeHeadFaceSampling";
import { NodeHeadReference } from "./NodeHeadReference";
import { NodeHeadTrace } from "./NodeHeadTrace";
import { NodeTrunkCaptureSource } from "./NodeTrunkCaptureSource";
import { NodeTrunkReference } from "./NodeTrunkReference";

type V3 = CaptureModel.Vec3;
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;
type Chart = [number, number];
type Cut = AutoMovieHumanF1Trace.ICut;
type Domain = AutoMovieHumanF1Trace.IDomain;
type Region = "head" | "head_detail";
/** The published F1 curve-index columns used to locate a native contour. */
type Row = readonly [kind: string, ordinal: number, region: Region, file: number, spans: number, winding: string, perimeter: number, area: number, centroid: V3, minimum: V3, maximum: V3, component: number, headMesh: number, fitted: boolean, error: number, below: number[], above: number[]];

/** The indexed reference section and the native height shared by its curves. */
interface ISection {
  index: number;
  coordinateMm: number;
  loops: Row[];
}

/** One archived Hermite segment in its native plane, mm. */
interface ISpan {
  start: V3;
  end: V3;
  startDerivative: V3;
  endDerivative: V3;
}

/** Original curves used as direct observations and displayed without fitting. */
interface IContour {
  station: number;
  centre: V3;
  name: string;
  role: "skin" | "ear" | "mouth" | "detail";
  closed: boolean;
  intervals: number[];
  spans: ISpan[];
}

/**
 * Stage 1 F1 head and neck. Original horizontal curves remain on their
 * archived planes. Only the neck-to-jaw interval uses new tilted cuts of
 * the same raw mesh, because a horizontal cut at the submental floor
 * separates the neck and chin into two loops.
 */
export namespace NodeHeadCaptureSource {
  /** The common neck boundary with the trunk in her world, mm. */
  const BASE: number = 1458;
  /** The local raw submental study bounds bracket the two-loop cut. */
  const FLOOR: number = 1477;
  /** Native head pitch measured in the F1 head receipt, radians. */
  const PITCH: number = 5.5127455104162655 * Math.PI / 180;

  /** The read-only original reference curve publication. */
  const ARCHIVE: string = ".references/curves/hermite/f1";

  /** The provider entry. */
  export const PROVIDER: NodeCaptureSources.IProvider = {
    names: ["head"],
    files: [
      "packages/human/src/executable/NodeHeadCaptureSource.ts",
      "packages/human/src/executable/NodeTrunkReference.ts",
      "packages/human/src/executable/NodeHeadTrace.ts", "packages/human/src/executable/NodeHeadFaceSampling.ts",
      "packages/human/src/executable/NodeHeadReference.ts", "packages/human/src/executable/NodeHeadJunction.ts", "packages/human/src/executable/NodeHeadOrbit.ts",
      "packages/human/src/executable/NodeHeadNativeJunctions.ts", "packages/human/src/executable/NodeHeadSourceSkin.ts",
      "packages/human/src/executable/NodeTrunkCaptureSource.ts",
      "packages/human/src/executable/NodeTrunkArchive.ts",
      "packages/human/src/executable/NodeTrunkCaptureGeometry.ts",
      "packages/human/src/generation/AutoMovieHumanHeadEarLoop.ts",
      "packages/human/src/lofting/AutoMovieHumanHorizontalChain.ts",
      "packages/human/src/generation/AutoMovieHumanF1Trace.ts",
      "packages/human/src/inspection/CaptureSpecs.ts",
      "packages/engine/src/geometry/extract/",
      "packages/engine/src/geometry/construction/",
      "packages/engine/src/geometry/curve/",
      `${ARCHIVE}/index.json`, `${ARCHIVE}/links.json`, `${ARCHIVE}/global.json`, ...["002", "003", "004", "009", "010", "011", "012", "013", "014", "015", "016", "017", "018", "019"].map((file: string): string => `${ARCHIVE}/sections/head/${file}.json`),
    ],
    prepare,
  };

  /** Draw archived F1 outlines and the turned neck in unchanged world millimetres. */
  async function prepare(name: string, context: NodeCaptureSources.IContext): Promise<CaptureModel.IPart> {
    if (name !== "head") throw new Error(`The head provider draws head, not ${name}`);
    const started: number = performance.now();
    const ref: NodeCaptureSources.IReference = await context.reference();
    const her: NodeTrunkReference.IMesh = NodeTrunkReference.fromModel(ref.model, 1);
    const mesh: AutoMovieMeshExtract.IMesh = { positions: her.points.flat(), indices: her.triangles.flat() };
    const original: ReturnType<typeof archive> = archive();
    const boundary: number = original.face[0]!.station;
    let local: ReturnType<typeof course> | null = null;
    let neck: AutoMovieHumanF1Trace.ITrace | null = null;
    let neckDomains: Domain[] = [];
    const diagnostics: string[] = [];
    try {
      local = course(mesh, boundary);
      const input: AutoMovieHumanF1Trace.IInput = {
        name: "head.neck",
        mesh,
        axis: local.axis,
        cuts: CaptureSpecs.steps(0, local.end, 2),
        order: 64,
        samples: 160,
      };
      neck = AutoMovieHumanF1Trace.trace(input);
      neckDomains = kept(input, neck);
    } catch (error) {
      diagnostics.push(`neck: ${error instanceof Error ? error.message : String(error)}`);
    }
    const face: AutoMovieHumanF1Trace.IOutput[] = level(mesh, "head.face", original.face, local === null ? original.face[0]!.centre : local.axis.at(local.end).origin as V3, true);
    const vault: AutoMovieHumanF1Trace.IOutput[] = level(mesh, "head.vault", original.vault, original.vault[0]!.centre);
    const bands: ReturnType<typeof NodeHeadTrace.linkedBand>[] = original.linked.flatMap((band: { name: string; contours: IContour[] }): ReturnType<typeof NodeHeadTrace.linkedBand>[] => {
      try {
        return [NodeHeadTrace.linkedBand(band.name, band.contours.map((contour: IContour): NodeHeadTrace.IOriginalRing => ({
          station: contour.station,
          points: samples(contour, [0, 0, 0]),
          centre: [contour.centre[0], contour.centre[2]],
        })), mesh)];
      } catch (error) {
        diagnostics.push(`${band.name}: ${error instanceof Error ? error.message : String(error)}`);
        return [];
      }
    });
    const { chains, forehead }: ReturnType<typeof NodeHeadReference.withForehead> = NodeHeadReference.withForehead(ARCHIVE, mesh, [
      ...neckDomains,
      ...face,
      ...vault,
    ].flatMap((domain: Domain | AutoMovieHumanF1Trace.IOutput): IAutoMovieLoftChain[] =>
      domain.loft?.chain ? [domain.loft.chain] : [],
    ).concat(bands.map((band: ReturnType<typeof NodeHeadTrace.linkedBand>): IAutoMovieLoftChain => band.chain)), diagnostics);
    if (neck !== null) diagnostics.push(
      `neck: ${neck.cuts.length} turned cuts, dropped [${neck.dropped.join(", ")}]; end is the archived ${boundary} mm plane`,
      ...neck.cuts.flatMap((cut: Cut): string[] => cut.flags.map((flag: string): string => `neck ${cut.station.toFixed(2)} mm: ${flag}`)),
      ...neck.domains.flatMap((domain: Domain): string[] => [domain.opened, ...domain.diagnostics, ...surface(domain.layers)]),
    );
    diagnostics.push(
      `face: ${original.face.length} exact source stations ${boundary}–${original.face.at(-1)!.station} mm`,
      ...original.face.filter((contour: IContour): boolean => contour.role !== "skin").map((contour: IContour): string =>
        `${contour.station} mm: original ${contour.role} boundary is retained separately from the exterior skin loft`,
      ),
      ...face.filter((study: AutoMovieHumanF1Trace.IOutput): boolean => !study.loft?.chain || chains.includes(study.loft.chain)).flatMap((study): string[] => observations(mesh, "face", study)),
      `vault: ${original.vault.length} exact source stations ${original.vault[0]!.station}–${original.vault.at(-1)!.station} mm`,
      ...vault.flatMap((study: AutoMovieHumanF1Trace.IOutput): string[] => observations(mesh, "vault", study)),
      ...neckDomains.flatMap((domain: Domain): string[] => [
        `neck retained ${domain.span.map((value: number): string => value.toFixed(2)).join("–")} mm: ${domain.loft?.chain ? "lofted" : "refused"}`,
        ...domain.diagnostics,
        ...surface(domain.layers),
        ...NodeHeadTrace.witness(mesh, domain.part?.axis, domain.loft?.chain, domain.layers),
      ]),
      ...original.linkFailures,
      ...bands.filter((band: ReturnType<typeof NodeHeadTrace.linkedBand>): boolean => chains.includes(band.chain)).map((band): string => band.receipt),
      `${chains.length} clay chains; inter-chart boundaries, facial openings and remaining ear ports are pending.`,
    );
    console.log(diagnostics.join("\n"));
    // The capture always draws each spec frame's axes. Give those aids a
    // real head datum without changing the original world-space curves.
    const displayOrigin: V3 = original.face[0]!.centre;
    const capture: CaptureModel.IPart = CaptureSpecs.part({
      part: name,
      frames: [{ name: "head-observation", parent: null, basis: { kind: "derived", rule: "First archived facial ring centre; axes parallel to F1 world" }, relative: { ...AutoMovieHumanArmCurveSpec.IDENTITY, origin: displayOrigin } }],
      root: AutoMovieHumanArmCurveSpec.IDENTITY,
      placement: "F1's actual head and neck in her own world",
      specs: original.shown.map((contour: IContour): Spec => spec(contour, displayOrigin)),
      axis: (): null => null,
      chain: chains[0] ?? null,
      chains,
      allowDomainRefusal: true,
      diagnostics,
      ports: [
        ...(local === null ? [] : [
          { name: "neck-base", frame: "head-observation", point: relative(local.axis.at(0).origin as V3, displayOrigin), radius: 75 },
          { name: "submental", frame: "head-observation", point: relative(local.floor, displayOrigin), radius: 65 },
        ]),
        { name: "ear-root", frame: "head-observation", point: relative([0.064, 1584.3959045410156, -75.612], displayOrigin), radius: 45 },
        ...original.linked.filter((band: { name: string }): boolean => band.name.endsWith("lobe")).map((band: { name: string; contours: IContour[] }) =>
          ({ name: band.name, frame: "head-observation", point: relative(band.contours.at(-1)!.centre, displayOrigin), radius: 35 }),
        ),
      ],
      relations: { parent: "trunk", children: [], shares: ["trunk"], basis: "The 1458 mm reference neck plane is shared. The diagnostic reports boundary recovery. The jets are pending." },
      reference: { status: "available", mesh: display(her), cropToLoft: false, measures: { neckPlaneY: BASE, jawChartEndY: boundary }, method: "F1's original head and neck triangles in mm with Z negated" },
      milliseconds: { ...neck?.ms, head: performance.now() - started },
    });
    NodeHeadFaceSampling.refine(capture, mesh, chains);
    const canonicalNeck: V3[] | null = await NodeTrunkCaptureSource.neckBoundary(mesh);
    NodeHeadTrace.attachNeck(capture, canonicalNeck, mesh, neckDomains.some((domain: Domain): boolean => domain.span[0] === 0 && domain.loft?.chain === chains[0]));
    NodeHeadReference.attachOriginalJunctions(capture, ARCHIVE, mesh, chains, local?.axis, forehead);
    if (local !== null) NodeHeadReference.attachTurnedNeck(capture, mesh, local.axis, chains);
    return capture;
  }

  /** The physical error against her raw rings, including the between-cut checks. */
  function surface(layers: readonly AutoMovieHumanF1Trace.ILayer[]): string[] {
    if (layers.length === 0) return [];
    const measured: AutoMovieHumanF1Trace.ILayer[] = layers.filter((layer: AutoMovieHumanF1Trace.ILayer): boolean => layer.fault === null);
    const max: number = Math.max(0, ...measured.map((layer: AutoMovieHumanF1Trace.ILayer): number => layer.max));
    return [
      `${measured.length}/${layers.length} readable surface checks, ${measured.filter((layer: AutoMovieHumanF1Trace.ILayer): boolean => layer.max > AutoMovieHumanF1Trace.TOLERANCE).length} exceed tolerance, worst ${max.toFixed(3)} mm`,
      ...layers.flatMap((layer: AutoMovieHumanF1Trace.ILayer): string[] => layer.fault === null ? [] : [`station ${layer.station.toFixed(2)} mm: ${layer.fault}`]),
    ];
  }

  /** Select exact indexed skin stations and a small set of original display curves. */
  function archive(): { face: IContour[]; vault: IContour[]; shown: IContour[]; linked: { name: string; contours: IContour[] }[]; linkFailures: string[] } {
    const root: string = HumanNodePaths.resolve(ARCHIVE);
    const index: {
      files: { file: string; region: Region; firstSection: number; lastSection: number }[];
      sections: ISection[];
    } = JSON.parse(fs.readFileSync(path.join(root, "index.json"), "utf8"));
    const cache: Map<string, { sections: { index: number; curves: { ordinal: number; kind: string; curve: { closed: boolean; phaseIntervals: number[]; spans: ISpan[] } }[] }[] }> = new Map();
    const read = (section: ISection, row: Row, role: IContour["role"]): IContour => {
      const region: Region = row[2];
      const file: (typeof index.files)[number] | undefined = index.files.find((entry: (typeof index.files)[number]): boolean =>
        entry.region === region && section.index >= entry.firstSection && section.index <= entry.lastSection,
      );
      if (file === undefined) throw new Error(`head: archive index has no ${region} file for section ${section.index}`);
      const loaded = cache.get(file.file) ?? JSON.parse(fs.readFileSync(path.join(root, file.file), "utf8"));
      cache.set(file.file, loaded);
      const curve: { closed: boolean; phaseIntervals: number[]; spans: ISpan[] } | undefined = loaded.sections
        .find((entry: { index: number }): boolean => entry.index === section.index)?.curves
        .find((entry: { ordinal: number; kind: string }): boolean => entry.ordinal === row[1] && entry.kind === row[0])?.curve;
      if (curve === undefined) throw new Error(`head: no ${region} curve ${row[1]} at section ${section.index}`);
      return {
        name: `original.${region}.${section.index}.${row[1]}`,
        station: section.coordinateMm,
        centre: [row[8][0], section.coordinateMm, -row[8][2]],
        role,
        closed: curve.closed,
        intervals: curve.phaseIntervals,
        spans: curve.spans,
      };
    };
    const linked: { name: string; contours: IContour[] }[] = [];
    const linkFailures: string[] = [];
    const track = (name: string, first: number, last: number, firstOrdinal: number | undefined, role: IContour["role"]): void => {
      const sections: ISection[] = index.sections.filter((section: ISection): boolean => section.index >= first && section.index <= last);
      const contours: IContour[] = [];
      let prior: Row | undefined;
      for (const section of sections) {
        const ordinal: number | undefined = prior === undefined ? firstOrdinal : prior[16].length === 1 ? prior[16][0] : undefined;
        const candidates: Row[] = section.loops.filter((entry: Row): boolean => entry[0] === "closed" && entry[2] === "head" &&
          (prior === undefined && ordinal === undefined ? entry[9][2] <= 0 && entry[10][2] >= 0 : entry[1] === ordinal),
        );
        const row: Row | undefined = candidates.reduce<Row | undefined>((a: Row | undefined, b: Row): Row =>
          a === undefined || Math.abs(b[7]) > Math.abs(a[7]) ? b : a, undefined);
        if (row === undefined || (prior !== undefined && (row[15].length !== 1 || row[15][0] !== prior[1]))) {
          linkFailures.push(`${name}: no one-to-one original connection at F1 section ${section.index}`);
          return;
        }
        contours.push(read(section, row, role));
        prior = row;
      }
      if (contours.length >= 2) linked.push({ name, contours });
    };
    // These F1 runs begin at the adjacent conic boundary and end where the
    // exterior's reciprocal correspondence changes or its closed ring ends.
    const exterior: readonly (readonly [number, number])[] = [
      [882, 933], [936, 944], [945, 946], [947, 1076],
      [1219, 1306], [1405, 1432], [1533, 1674], [2686, 2755],
    ];
    for (const [first, last] of exterior) track(`head.face-linked.${first}`, first, last, undefined, "skin");
    track("head.left-lobe", 925, 933, 2, "ear");
    track("head.right-lobe", 931, 935, 2, "ear");
    const pick = (heights: readonly number[], region: Region, ear?: 1 | -1): IContour[] => {
      const eligible = (row: Row): boolean =>
        row[2] === region && (region !== "head" || row[0] === "closed") &&
        (ear === undefined || (ear === 1 ? row[9][2] > 0 : row[10][2] < 0));
      const sections: ISection[] = index.sections.filter((section: ISection): boolean =>
        section.coordinateMm >= BASE && section.loops.some(eligible),
      );
      const unique: Map<number, ISection> = new Map();
      for (const target of heights) {
        const section: ISection = sections.reduce((a: ISection, b: ISection): ISection =>
          Math.abs(a.coordinateMm - target) <= Math.abs(b.coordinateMm - target) ? a : b,
        );
        unique.set(section.index, section);
      }
      return [...unique.values()].map((section: ISection): IContour => {
        const rows: Row[] = section.loops.filter(eligible);
        const skin: Row[] = region === "head" ? rows.filter((row: Row): boolean => row[9][2] <= 0 && row[10][2] >= 0) : [];
        const candidates: Row[] = skin.length === 0 ? rows : skin;
        const row: Row = candidates.reduce((a: Row, b: Row): Row =>
          (region === "head" ? Math.abs(a[7]) >= Math.abs(b[7]) : a[6] >= b[6]) ? a : b,
        );
        // At F1 section 531 the large oral cavity boundary meets the
        // external boundary at the lip opening. Its measured skin area
        // continues through the event, but its contour is no longer a
        // one-to-one external skin ring.
        const role: IContour["role"] = region === "head_detail" ? "detail" : skin.length === 0 ? "ear" : section.index === 531 ? "mouth" : "skin";
        return read(section, row, role);
      });
    };
    const face: IContour[] = pick(CaptureSpecs.steps(1518, 1604, 4), "head");
    const vault: IContour[] = pick(CaptureSpecs.steps(1604, 1698, 5), "head");
    const shown: IContour[] = [
      ...pick([1464, 1478, 1518, 1521.930809021, 1540, 1574, 1584.39590454102, 1596.1820602416992, 1604, 1654, 1698], "head"),
      ...pick([1547.258644104004, 1550.6594848632813, 1555.3087615966797, 1563.79025131464], "head"),
      ...pick([1543.1770324707031], "head", -1),
      ...pick([1541.095314025879], "head", 1),
      ...pick([1518, 1540, 1574, 1604], "head_detail"),
    ];
    return { face, vault, shown, linked, linkFailures };
  }

  /** Keep the exact archive planes, with origins in their measured skin loop. */
  function level(mesh: AutoMovieMeshExtract.IMesh, name: string, contours: readonly IContour[], start: V3, split: boolean = false): AutoMovieHumanF1Trace.IOutput[] {
    const byStation: Map<number, IContour> = new Map(contours.map((contour: IContour): [number, IContour] => [contour.station, contour]));
    const skin: Set<number> = new Set(contours.filter((contour: IContour): boolean => contour.role === "skin").map((contour: IContour): number => contour.station));
    const intervals: number[][] = spans(contours.map((contour: IContour): number => contour.station), skin);
    return intervals.filter((interval: number[]): boolean => interval.length >= 2).flatMap((interval: number[]): AutoMovieHumanF1Trace.IOutput[] => {
      const cuts: IContour[] = interval.map((station: number): IContour => byStation.get(station)!);
      const origin: V3 = cuts[0] === contours[0] ? start : cuts[0]!.centre;
      return levelSpan(mesh, name, cuts, origin, split);
    });
  }

  /** The chart centres of one continuous original exterior interval. */
  function levelSpan(mesh: AutoMovieMeshExtract.IMesh, name: string, contours: readonly IContour[], start: V3, split: boolean): AutoMovieHumanF1Trace.IOutput[] {
    const centres: V3[] = contours.map((contour: IContour, i: number): V3 => i === 0 ? start : contour.centre);
    const axis: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.level(
      contours.map((contour: IContour, i: number): AutoMovieViewAxis.IAxisKnot1 => ({ station: contour.station, value: centres[i]![0] })),
      contours.map((contour: IContour, i: number): AutoMovieViewAxis.IAxisKnot1 => ({ station: contour.station, value: centres[i]![2] })),
    );
    const observations: Map<number, Chart[]> = new Map(contours.map((contour: IContour, i: number): [number, Chart[]] =>
      [contour.station, samples(contour, centres[i]!)],
    ));
    const input: AutoMovieHumanF1Trace.IInput = { name, mesh, axis, cuts: contours.map((contour: IContour): number => contour.station), order: 64, samples: 160 };
    if (split) {
      const direct: AutoMovieHumanF1Trace.ITrace = AutoMovieHumanF1Trace.trace(input, observations);
      return kept(input, direct, observations).map((domain: Domain): AutoMovieHumanF1Trace.IOutput => ({
        part: domain.part,
        cuts: direct.cuts.filter((cut: Cut): boolean => cut.station >= domain.span[0] && cut.station <= domain.span[1]),
        dropped: direct.dropped,
        diagnostics: [domain.opened, ...domain.diagnostics],
        runs: domain.runs,
        layers: domain.layers,
        loft: domain.loft,
        ms: direct.ms,
      }));
    }
    const full: AutoMovieHumanF1Trace.IOutput = AutoMovieHumanF1Trace.create(input, observations);
    if (full.loft?.chain) return [full];
    const admitted: Set<number> = new Set(full.cuts.filter((cut: Cut): boolean =>
      (cut.kr === null || cut.kr < 1) && cut.shoulders.every((rho: number | null): boolean => rho !== null && rho > 0 && rho < 1),
    ).map((cut: Cut): number => cut.station));
    // Keep the refused source plane in the receipt. Independent conic spans
    // stop on either side of it until its own joint has been traced.
    return [
      full,
      ...spans(input.cuts, admitted).filter((cuts: number[]): boolean => cuts.length >= 2 && cuts.length < input.cuts.length).map((cuts: number[]): AutoMovieHumanF1Trace.IOutput =>
        AutoMovieHumanF1Trace.create({ ...input, name: `${name}.${cuts[0]}`, cuts }, observations),
      ),
    ];
  }

  /** Keep accepted split charts and bound each refused section by its real neighbours. */
  function kept(
    input: AutoMovieHumanF1Trace.IInput,
    trace: AutoMovieHumanF1Trace.ITrace,
    observed?: ReadonlyMap<number, Chart[]>,
  ): Domain[] {
    return trace.domains.flatMap((domain: Domain): Domain[] => {
      if (domain.loft?.chain) return [domain];
      const inDomain: Cut[] = trace.cuts.filter((cut: Cut): boolean => cut.station >= domain.span[0] && cut.station <= domain.span[1]);
      const admitted: Set<number> = new Set(inDomain.filter((cut: Cut): boolean =>
        (cut.kr === null || cut.kr < 1) && cut.pieces.every((piece: Cut["pieces"][number]): boolean =>
          piece.split !== null && piece.shoulders.every((rho: number | null): boolean => rho !== null && rho > 0 && rho < 1),
        ),
      ).map((cut: Cut): number => cut.station));
      return [
        domain,
        ...spans(inDomain.map((cut: Cut): number => cut.station), admitted).filter((cuts: number[]): boolean => cuts.length >= 2 && cuts.length < inDomain.length).flatMap((cuts: number[]): Domain[] =>
          AutoMovieHumanF1Trace.trace({ ...input, name: `${input.name}.${cuts[0]}`, cuts }, observed).domains,
        ),
      ];
    });
  }

  /** Consecutive measured stations between explicit refused cuts. */
  function spans(stations: readonly number[], admitted: ReadonlySet<number>): number[][] {
    const result: number[][] = [];
    let span: number[] | null = null;
    for (const station of stations) {
      if (!admitted.has(station)) span = null;
      else if (span === null) {
        span = [station];
        result.push(span);
      } else span.push(station);
    }
    return result;
  }

  /** Keep the actual support interval and measurements of each independent loft. */
  function observations(mesh: AutoMovieMeshExtract.IMesh, name: string, study: AutoMovieHumanF1Trace.IOutput): string[] {
    const first: number | undefined = study.cuts[0]?.station;
    const last: number | undefined = study.cuts.at(-1)?.station;
    return [
      `${name} ${first}–${last} mm: ${study.loft?.chain ? "lofted" : "refused"}`,
      ...study.diagnostics.map((line: string): string => `${name}: ${line}`),
      ...surface(study.layers),
      ...NodeHeadTrace.witness(mesh, study.part?.axis, study.loft?.chain, study.layers),
    ];
  }

  /** Turn only between the shared neck base and the first archived face ring to observe the submental floor. */
  function course(mesh: AutoMovieMeshExtract.IMesh, endY: number): { axis: AutoMovieViewAxis.IAxis; end: number; floor: V3 } {
    const vertical: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.horizontal();
    const read = (y: number): Cut & { centroid: V3 } => {
      const cut: Cut | null = AutoMovieHumanF1Trace.read(mesh, vertical, y);
      if (cut === null || cut.centroid === null) throw new Error(`head: no raw outer loop holding the neck at ${y} mm`);
      return { ...cut, centroid: cut.centroid };
    };
    const base: V3 = read(BASE).centroid;
    const floor: Cut = read(FLOOR);
    const first: number = FLOOR - 3;
    const last: number = FLOOR + 27;
    const x: number = base[0] + Math.tan(PITCH) * (last - first);
    const centres: V3[] = [base, [base[0], first, base[2]], [x, last, base[2]], [x, endY, base[2]]];
    const half = (heights: readonly number[]): number => {
      const reach: number = Math.max(...heights.map((y: number): number => Math.max(...read(y).loop.map(([a, b]: Chart): number => Math.hypot(a - base[0], b - base[2])))));
      return 15 * PITCH * reach / (16 * 0.9);
    };
    const halves: number[] = [half([BASE, first, FLOOR + 5]), half([last - 5, last, endY])];
    const axis: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(centres, halves, [1, 0, 0]);
    const runs: AutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(centres, halves);
    if (typeof axis === "string" || typeof runs === "string") throw new Error(`head: refused local course: ${typeof axis === "string" ? axis : runs}`);
    return { axis, end: runs[runs.length - 1]!.end, floor: [floor.extents[0], FLOOR, base[2]] };
  }

  /** Read the archived cubic on its original plane, at no more than 0.5 mm of phase. */
  function samples(contour: IContour, origin: V3): Chart[] {
    return contour.spans.flatMap((span: ISpan, i: number): Chart[] => {
      const h: number = contour.intervals[i]!;
      const count: number = Math.max(1, Math.ceil(h / AutoMovieHumanF1Trace.TOLERANCE));
      return Array.from({ length: count }, (_: unknown, k: number): Chart => {
        const t: number = k / count;
        const s: number = 1 - t;
        const value = (d: number): number =>
          (1 + 2 * t) * s * s * span.start[d]! +
          t * s * s * h * span.startDerivative[d]! +
          t * t * (3 - 2 * t) * span.end[d]! -
          t * t * s * h * span.endDerivative[d]!;
        return [value(0) - origin[0], -value(2) - origin[2]];
      });
    });
  }

  /** Exact Hermite-to-Bézier conversion for display, with native Z reflected. */
  function spec(contour: IContour, origin: V3): Spec {
    const world = (p: V3): V3 => relative([p[0], p[1], -p[2]], origin);
    const controls: V3[] = [world(contour.spans[0]!.start)];
    contour.spans.forEach((span: ISpan, i: number): void => {
      const scale: number = contour.intervals[i]! / 3;
      controls.push(
        world([0, 1, 2].map((d: number): number => span.start[d]! + scale * span.startDerivative[d]!) as V3),
        world([0, 1, 2].map((d: number): number => span.end[d]! - scale * span.endDerivative[d]!) as V3),
        world(span.end),
      );
    });
    // The capture closes the last span back to the first control.
    if (contour.closed) controls.pop();
    return { name: contour.name, frame: "head-observation", datums: [], constraints: [], representation: { kind: "bezier", points: controls, closed: contour.closed, handleRule: "exact native F1 cubic Hermite span controls" }, aids: [], consumers: ["head trace observation"] };
  }

  /** World point in the translation-only observation frame. */
  function relative(point: V3, origin: V3): V3 {
    return [point[0] - origin[0], point[1] - origin[1], point[2] - origin[2]];
  }

  /** The reference display keeps original triangles that reach the neck plane. */
  function display(mesh: NodeTrunkReference.IMesh): { positions: number[]; indices: number[] } {
    const positions: number[] = [];
    const indices: number[] = [];
    const remap: Map<number, number> = new Map();
    for (const triangle of mesh.triangles) {
      if (triangle.every((index: number): boolean => mesh.points[index]![1] < BASE)) continue;
      // Reflecting Z reverses winding. Reverse it again for the rendered skin.
      for (const index of [triangle[0], triangle[2], triangle[1]]) {
        let at: number | undefined = remap.get(index);
        if (at === undefined) {
          at = positions.length / 3;
          remap.set(index, at);
          positions.push(...mesh.points[index]!);
        }
        indices.push(at);
      }
    }
    return { positions, indices };
  }
}
