import { AutoMovieMeshExtract, AutoMovieViewAxis, type IAutoMovieLoftChain } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanF1Fork } from "../generation/trunk/AutoMovieHumanF1Fork";
import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import type { NodeCaptureSources } from "./NodeCaptureSources";
import { NodeTrunkReference } from "./NodeTrunkReference";
import { NodeTrunkArchive } from "./NodeTrunkArchive";
import { NodeTrunkArmscye } from "./NodeTrunkArmscye";
import { NodeTrunkCaptureGeometry } from "./NodeTrunkCaptureGeometry";
import { NodeTrunkWaist } from "./NodeTrunkWaist";

type V3 = CaptureModel.Vec3;
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;

type ShoulderSkin = NodeTrunkArmscye.ShoulderSkin;

const { archiveRows, armRoots, armRoot, observedArmRoot, archiveAxis, readNeck }: typeof NodeTrunkArchive = NodeTrunkArchive;

const { medianReference, drawn, wire, span, angle, add, sub, scale }: typeof NodeTrunkCaptureGeometry = NodeTrunkCaptureGeometry;

const { armscye }: typeof NodeTrunkArmscye = NodeTrunkArmscye;
const { waist }: typeof NodeTrunkWaist = NodeTrunkWaist;

/**
 * The `trunk.archive` provider supplies the body with the observed fork,
 * waist, shoulders and neck. The separate `trunk` capture retains the
 * historical course described below for comparison.
 *
 * The historical `trunk` study was traced
 * directly from f1's reference (owner's step 1) by the shared builder
 * (`AutoMovieHumanF1Trace.trace`), in her own world: the native artifact in
 * calibration mm with Z negated (`NodeTrunkReference.fromModel`), never
 * registered to a generated datum. The originals drawn are each domain's
 * guide and split lines, read through the engine's outline evaluator (the
 * one the loft reads) on the course's own frames, and the clay is every
 * built domain's loft, so every stage shows one source. Domains are chart
 * boundaries of the guide reading: each ends at the cut before the next
 * opens, nothing joins them, and the receipt names every gap.
 *
 * The course (owner's remedies for the crotch floor, #3161): the trunk ends
 * on the oblique plane through her two forks ({@link NOTCH}, {@link CLEFT}),
 * so its lowest section holds neither her thigh-root lobes nor her gluteal
 * cleft. Her reference carries no trunk joint centres (its skeleton is
 * null), so the course runs through her own section centroids: the area
 * centroid of her fork-plane loop, then along that plane's normal into a
 * jointed turn toward the centroid of her level loop at {@link MID}, then to
 * the centroid of her level loop at {@link TOP}. Each turn's half arclength is
 * `h = 15 theta r / 16`: the jointed turn's quintic angle profile peaks at
 * curvature `(15 / 8) theta / (2 h)`, so this h keeps `k r` at 1 for the
 * largest reach r of her level loops over the turn's range and below 1
 * elsewhere; the trace reads `k r` exactly at every cut from the axis's jet
 * and refuses a domain at 1 or above.
 *
 * This is still a partial study, not the owner's trunk: it ends at
 * {@link TOP}, below the change the `node:f1-trace` receipt
 * (`.shots/f1_trace/receipt-688502de-trunk`) records at 1275.32 to 1277.32
 * mm, where the extraction's three outer pieces become one; the trunk above,
 * to her neck base at 1458 mm with her armscye loops as ports, is unobserved
 * here. No port is drawn until it is traced.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the trace, its world, the course and its basis, the turn bound, the drawn originals, the domains as unjoined chart boundaries, the study's domain and what remains unobserved.
 * @evidence contracts/development/design.md#principled-representation The provider hands the capture one source: every domain's original lines on its own frames, every built chain and her unregistered mesh.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Its consumer is `node:capture` through `NodeCaptureSources`; tracing belongs to `AutoMovieHumanF1Trace`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The study's limits and every domain's refusal and gap are named in its diagnostics rather than presented as the owner's trunk.
 */
export namespace NodeTrunkCaptureSource {
  /**
   * Her pubic notch, the front fork, in her own world mm (`x`, `y`). Read on
   * her exact midsagittal cut (`band-loops.txt`,
   * `AutoMovieHumanTrunkF1Traced.CROTCH_LINE`) as (19.2, 811.2) in the
   * relief registration (`NodeTrunkMeasure.reliefs`: registered X = raw X -
   * 26.8, Z = raw Z less the median raw Z over 1000 < Y < 1400); restored
   * here with X + 26.8, and Z the same median of her mesh ({@link midline}).
   */
  export const NOTCH: [number, number] = [19.2 + 26.8, 811.2];

  /** Her gluteal cleft top, the back fork, in her own world mm, from (-106.4, 873.4) the same way. */
  export const CLEFT: [number, number] = [-106.4 + 26.8, 873.4];

  /** Height of the level loop whose centroid the course's middle passes, mm (her mid trunk, the probe of the earlier study). */
  export const MID: number = NodeTrunkCaptureGeometry.MID;

  /** Height of the level loop whose centroid ends the study's course, mm: below the receipt's merge of outer pieces at 1275.32 to 1277.32. */
  export const TOP: number = 1270;

  /** Spacing, mm, of the level loops read for the turns' largest reach. */
  export const REACH_STEP: number = 10;

  /** Cut spacing along the course, mm (her cuts every 2 mm), and layer spacing, mm (S00's 6 mm gap). */
  export const STEP: { cut: number; layer: number } = NodeTrunkCaptureGeometry.STEP;

  /** Station spacing of the drawn original lines, mm: display samples of the engine evaluator, the capture's own `CaptureSpecs.STEP`. */
  export const DRAW: number = NodeTrunkCaptureGeometry.DRAW;

  /** Section order and ring samples: S00's (`AutoMovieHumanTrunkS00.of`: order 64, 160 samples). */
  export const LOFT: { order: number; samples: number } = NodeTrunkCaptureGeometry.LOFT;

  /** The provider entry; `files` are the generating sources the capture hashes. */
  export const PROVIDER: NodeCaptureSources.IProvider = {
    names: ["trunk", "trunk.waist", "trunk.fork", "trunk.archive", "trunk.armscye", "trunk.joins"],
    files: [
      "packages/human/src/executable/NodeTrunkCaptureSource.ts",
      "packages/human/src/executable/NodeTrunkCaptureGeometry.ts",
      "packages/human/src/executable/NodeTrunkArchive.ts",
      "packages/human/src/executable/NodeTrunkArmscye.ts",
      "packages/human/src/executable/NodeTrunkSkin.ts",
      "packages/human/src/executable/NodeTrunkWaist.ts",
      "packages/human/src/generation/AutoMovieHumanF1Trace.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanF1Fork.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanTrunkF1Traced.ts",
      "packages/human/src/executable/NodeTrunkReference.ts",
      "packages/human/src/inspection/CaptureSpecs.ts",
      "packages/engine/src/geometry/extract/",
      "packages/engine/src/geometry/construction/",
    ],
    prepare,
  };

  /**
   * Her midline Z: the median Z of her mesh's points with 1000 < Y < 1400,
   * the relief registration's own rule (`NodeTrunkMeasure.reliefs`).
   */
  export function midline(points: readonly (readonly number[])[]): number {
    const zs: number[] = points.filter((p: readonly number[]): boolean => p[1]! > 1000 && p[1]! < 1400).map((p: readonly number[]): number => p[2]!).sort((a: number, b: number): number => a - b);
    if (zs.length === 0) throw new Error("trunk: her mesh has no point with 1000 < Y < 1400 for her midline");
    return zs[Math.floor(zs.length / 2)]!;
  }

  /**
   * Read the exact world-mm neck boundary shared by the trunk and head.
   *
   * @param mesh The original F1 skin in ISB world millimetres.
   * @returns The ordered 1458 mm section without its repeated closing marker, if present.
   *
   * @evidence contracts/development/design.md#minimal-and-owned-surface The trunk and head consume the same section and conversion.
   */
  export async function neckBoundary(mesh: AutoMovieMeshExtract.IMesh): Promise<V3[] | null> {
    return readNeck(mesh, archiveAxis(await archiveRows()), []);
  }

  /**
   * Read the archived arm port in ISB world millimetres.
   *
   * @param side The side of the original independent arm section.
   * @returns The exact sampled boundary, ordered about the distal normal.
   *
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both sides of the shoulder connection consume one measured boundary.
   */
  export async function armBoundary(side: "left" | "right"): Promise<V3[]> {
    return observedArmRoot(await armRoot(side === "left" ? "l" : "r"));
  }

  /** Build `trunk` for the capture tool. */
  async function prepare(name: string, context: NodeCaptureSources.IContext): Promise<CaptureModel.IPart> {
    const ms: Record<string, number> = {};
    const ref: NodeCaptureSources.IReference = await context.reference();
    const t0: number = performance.now();
    const her: NodeTrunkReference.IMesh = NodeTrunkReference.fromModel(ref.model, 1);
    const mesh: AutoMovieMeshExtract.IMesh = { positions: her.points.flat(), indices: her.triangles.flat() };
    ms.reference = performance.now() - t0;
    if (name === "trunk.waist") return waist(name, mesh, ms);
    if (name === "trunk.fork") return forkWire(name, mesh, midline(her.points), ms);
    if (name === "trunk.armscye") return (await armscye(name, mesh, ms)).part;
    if (name === "trunk.archive" || name === "trunk.joins") {
      const fork: AutoMovieHumanF1Fork.IResult = AutoMovieHumanF1Fork.read(mesh, midline(her.points));
      const aboveFork: number = Math.max(...fork.ring.map((point: V3): number => point[1]));
      const armRows: ArmRoot[] = await armRoots();
      const heights: number[] = armRows.flatMap((row: TrunkStation): number[] => row.loops.flatMap((loop): number[] => loop.curve.spans.map((span: HermiteSpan): number => span.start[1])));
      const shoulder: ShoulderSkin = await armscye("trunk.armscye", mesh, ms);
      return waist(name, mesh, ms, [aboveFork, 1458], { fork, armscye: [Math.min(...heights), Math.max(...heights)], shoulder });
    }
    if (name !== "trunk") throw new Error(`The trunk provider does not draw ${name}`);

    // Her midline by the relief registration's rule, and the course's level
    // loops read on the vertical through her mid-trunk box centre there.
    const t1: number = performance.now();
    const z: number = midline(her.points);
    const vertical = (x: number, zz: number): AutoMovieViewAxis.IAxis => AutoMovieViewAxis.straight([x, 0, zz], [1, 0, 0], [0, 0, 1]);
    const probe: AutoMovieHumanF1Trace.ICut | null = AutoMovieHumanF1Trace.read(mesh, vertical(0, z), MID);
    if (probe === null) throw new Error(`trunk: no loop of her mesh holds her midline's vertical at ${MID} mm`);
    const centre: V3 = [(probe.extents[0] + probe.extents[1]) / 2, 0, z];
    const level = (y: number): AutoMovieHumanF1Trace.ICut => {
      const cut: AutoMovieHumanF1Trace.ICut | null = AutoMovieHumanF1Trace.read(mesh, vertical(centre[0], z), y);
      if (cut === null || cut.centroid === null) throw new Error(`trunk: no loop of her mesh holds the course's vertical at ${y} mm`);
      return cut;
    };

    const fork: AutoMovieHumanF1Fork.IResult = AutoMovieHumanF1Fork.read(mesh, z);
    const { normal, centroid: c0 } = fork.parentPlane;
    const c2: V3 = level(MID).centroid!;
    const c3: V3 = level(TOP).centroid!;

    // Each turn's half arclength from k r < 1 at the largest reach of her
    // level loops over the turn's range.
    const reach = (from: number, to: number): number => {
      let out: number = 0;
      for (let y: number = from; y <= to; y += REACH_STEP) out = Math.max(out, ...level(y).loop.map(([a, b]: [number, number]): number => Math.hypot(a, b)));
      return out;
    };
    const lower: number = reach(Math.ceil(c0[1] / REACH_STEP) * REACH_STEP, MID);
    const upper: number = reach(MID, TOP);
    const h1: number = (15 * angle(normal, sub(c2, c0)) * lower) / 16;
    const c1: V3 = add(c0, scale(normal, 2 * h1));
    const halves: number[] = [(15 * angle(normal, sub(c2, c1)) * lower) / 16, (15 * angle(sub(c2, c1), sub(c3, c2)) * upper) / 16];
    const centres: V3[] = [c0, c1, c2, c3];
    const jointed: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(centres, halves, [1, 0, 0]);
    if (typeof jointed === "string") throw new Error(`trunk: her course is not admitted: ${jointed}`);
    const runs: AutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(centres, halves);
    if (typeof runs === "string") throw new Error(`trunk: her course's runs are not admitted: ${runs}`);
    const length: number = runs[runs.length - 1]!.end;
    const direct: AutoMovieHumanF1Trace.ITrace = AutoMovieHumanF1Trace.trace({ name, mesh, axis: jointed, cuts: span(0, length, STEP.cut), stations: span(0, length, STEP.layer), order: LOFT.order, samples: LOFT.samples });
    ms.trace = performance.now() - t1;
    Object.assign(ms, Object.fromEntries(Object.entries(direct.ms).map(([k, v]: [string, number]): [string, number] => [`trace.${k}`, v])));

    // The complete receipt in the capture log: the course, every cut, every domain with its runs, surface checks, diagnostics and gaps.
    const fmt = (v: readonly number[]): string => `(${v.map((x: number): string => x.toFixed(3)).join(", ")})`;
    const pt = (v: readonly number[] | null): string => (v === null ? "null" : `(${v.map((x: number): string => x.toFixed(1)).join(",")})`);
    const num = (v: number | null, d: number): string => (v === null ? "null" : v.toFixed(d));
    console.log(`trunk fork: parent ${fork.ring.length}, left ${fork.left.length}, right ${fork.right.length}, seam ${fork.crotch.length} points; ${fork.crotch.filter((p: V3): boolean => fork.left.includes(p) && fork.right.includes(p)).length} seam points share identity; original endpoint deltas ${fmt(fork.endpointDisplacement)} mm; left centroid ${fmt(fork.leftPlane.centroid)}, right centroid ${fmt(fork.rightPlane.centroid)}; flags ${fork.flags.join("; ") || "none"}`);
    console.log(`trunk course: midline z ${z.toFixed(3)} (median raw z over 1000 < y < 1400), fork normal ${fmt(normal)}, centres ${centres.map(fmt).join(" ")}, halves ${halves.map((h: number): string => h.toFixed(3)).join(", ")} mm, reach lower ${lower.toFixed(2)} upper ${upper.toFixed(2)} mm, runs ${runs.map((r: AutoMovieViewAxis.IRun): string => `[${r.start.toFixed(2)}, ${r.end.toFixed(2)}]`).join(" ")}, length ${length.toFixed(2)} mm`);
    console.log(`trunk trace: ${direct.cuts.length} cuts, dropped [${direct.dropped.join(", ")}], ${direct.domains.length} domains, ${direct.domains.filter((d: AutoMovieHumanF1Trace.IDomain): boolean => d.loft?.chain !== null && d.loft?.chain !== undefined).length} with a chain`);
    for (const c of direct.cuts)
      console.log(
        `  cut ${c.station.toFixed(2)} | domain ${c.domain} | extents ${c.extents.map((e: number): string => e.toFixed(3)).join(" ")} | guides ${c.guides.map(pt).join(" ")} | gaps ${c.gaps.map((g: number): string => g.toFixed(3)).join(" ")} | pieces ${c.pieces.map((p: AutoMovieHumanF1Trace.ICut["pieces"][number]): string => `${pt(p.split)} a ${num(p.angle, 4)} rho ${num(p.shoulders[0], 4)}/${num(p.shoulders[1], 4)}`).join(" ; ")} | features ${c.features.map((list: AutoMovieHumanF1Trace.ICut["features"][number], k: number): string => `${["+u", "-u", "+v", "-v"][k]} ${list.map((f: AutoMovieHumanF1Trace.ICut["features"][number][number]): string => `${f.kind === "crest" ? "c" : "n"}${pt(f.point)}`).join(" ") || "none"}`).join(" ; ")} | area ${c.area.toFixed(0)} | kr ${typeof c.kr === "number" ? c.kr.toFixed(4) : "unobserved"} | flags ${c.flags.join("; ") || "none"} | checks ${c.checks.join("; ") || "none"}`,
      );
    direct.domains.forEach((d: AutoMovieHumanF1Trace.IDomain, k: number): void => {
      const faults: AutoMovieHumanF1Trace.ILayer[] = d.layers.filter((l: AutoMovieHumanF1Trace.ILayer): boolean => l.fault !== null);
      const read: AutoMovieHumanF1Trace.ILayer[] = d.layers.filter((l: AutoMovieHumanF1Trace.ILayer): boolean => l.fault === null);
      const worst: AutoMovieHumanF1Trace.ILayer | undefined = read.reduce<AutoMovieHumanF1Trace.ILayer | undefined>((a: AutoMovieHumanF1Trace.ILayer | undefined, b: AutoMovieHumanF1Trace.ILayer): AutoMovieHumanF1Trace.ILayer => (a === undefined || b.max > a.max ? b : a), undefined);
      console.log(`trunk domain ${k} [${d.span[0].toFixed(2)}, ${d.span[1].toFixed(2)}] mm, opened by ${d.opened}: part ${d.part === null ? "refused" : "built"}, chain ${d.loft?.chain ? "ok" : "null"}, surface checks ${d.layers.length} (${d.layers.filter((l: AutoMovieHumanF1Trace.ILayer): boolean => l.between).length} between cuts), ${faults.length} unreadable, ${read.filter((l: AutoMovieHumanF1Trace.ILayer): boolean => l.max > AutoMovieHumanF1Trace.TOLERANCE).length} over ${AutoMovieHumanF1Trace.TOLERANCE} mm, largest ${worst === undefined ? "none" : `${worst.max.toFixed(3)} mm at ${worst.station.toFixed(2)}${worst.between ? " (between cuts)" : ""} phase ${((worst.phase * 180) / Math.PI).toFixed(1)} deg`}`);
      for (const r of d.runs) console.log(`  run ${k}.${r.name}: ${r.knots.length} knots, reducer ${r.reducer.toExponential(3)}, actual ${r.actual.toFixed(4)}, pinned [${r.pinned.map((s: number): string => s.toFixed(2)).join(", ")}]`);
      for (const l of d.layers) console.log(`  surface ${k} ${l.station.toFixed(2)}${l.between ? " between" : ""}: ${l.fault ?? `max ${l.max.toFixed(3)} mm (signed ${l.signed.toFixed(3)} at phase ${((l.phase * 180) / Math.PI).toFixed(1)} deg), mean ${l.mean.toFixed(3)} mm`}`);
      for (const line of d.diagnostics) console.log(`  diagnostic ${k}: ${line}`);
    });
    const gaps: string[] = direct.domains.slice(1).map((d: AutoMovieHumanF1Trace.IDomain, k: number): string => `between domain ${k} ending ${direct.domains[k]!.span[1].toFixed(2)} mm and domain ${k + 1} opening ${d.span[0].toFixed(2)} mm: no surface, not joined`);
    for (const g of gaps) console.log(`  gap ${g}`);

    const built: AutoMovieHumanF1Trace.IDomain[] = direct.domains.filter((d: AutoMovieHumanF1Trace.IDomain): boolean => d.part !== null);
    const chains: IAutoMovieLoftChain[] = direct.domains.flatMap((d: AutoMovieHumanF1Trace.IDomain): IAutoMovieLoftChain[] => (d.loft?.chain ? [d.loft.chain] : []));
    const kr: number = Math.max(0, ...direct.cuts.map((c: AutoMovieHumanF1Trace.ICut): number => c.kr ?? 0));
    const diagnostics: string[] = [
      ...direct.domains.flatMap((d: AutoMovieHumanF1Trace.IDomain, k: number): string[] => d.diagnostics.map((line: string): string => `domain ${k} [${d.span[0].toFixed(2)}, ${d.span[1].toFixed(2)}] mm: ${line}`)),
      `trunk traced directly (AutoMovieHumanF1Trace.trace) on her course from her fork plane to her level loop at ${TOP} mm (${length.toFixed(2)} mm of arclength): ${direct.cuts.length} cuts, dropped [${direct.dropped.join(", ")}], largest k r ${kr.toFixed(4)}, ${direct.domains.length} domains of which ${built.length} built and ${chains.length} with a chain`,
      ...direct.domains.map((d: AutoMovieHumanF1Trace.IDomain, k: number): string => `domain ${k} covers [${d.span[0].toFixed(2)}, ${d.span[1].toFixed(2)}] mm, opened by ${d.opened}; ${d.part === null ? "refused" : d.loft?.chain ? "lofted" : "built, no chain"}`),
      ...gaps.map((g: string): string => `gap ${g}`),
      `partial study: ends at her level loop at ${TOP} mm; the trunk to 1458 mm with her armscye ports is unobserved (#3158, #3163); domains are unaccepted chart readings`,
      ...(context.pose === "reference" ? ["pose reference: the trunk has no posed state; drawn in her own pose"] : []),
    ];
    return CaptureSpecs.part({
      part: name,
      frames: [{ name: "world", parent: null, basis: { kind: "derived", rule: "her own world: the reference artifact in calibration mm, Z negated (ISB), unregistered" }, relative: AutoMovieHumanArmCurveSpec.IDENTITY }],
      root: AutoMovieHumanArmCurveSpec.IDENTITY,
      placement: "her own world; no registration",
      specs: [
        ...built.flatMap((d: AutoMovieHumanF1Trace.IDomain): Spec[] => drawn(d.part!, jointed, d.span, `trunk.${direct.domains.indexOf(d)}`)),
        wire("trunk.fork.left", [...fork.left, fork.left[0]!], "Ordered original left fork boundary"),
        wire("trunk.fork.right", [...fork.right, fork.right[0]!], "Ordered original right fork boundary"),
        wire("trunk.fork.crotch", fork.crotch, "Measured shared median seam"),
      ],
      axis: (): { origin: V3; distal: V3 } | null => null,
      chain: chains[0] ?? null,
      chains,
      diagnostics,
      ports: [{ name: "fork", frame: "world", point: c0, radius: Math.max(...fork.ring.map((point: V3): number => Math.hypot(...sub(point, c0)))) }],
      relations: {
        parent: null,
        children: ["head", "arm.left", "arm.right", "leg.left", "leg.right"],
        shares: ["head", "arm.left", "arm.right", "leg.left", "leg.right"],
        basis: "the fork boundary is measured; the joined skin and the neck and shoulder ports are pending (#3158, #3161, #3163)",
      },
      reference: { status: "available", mesh: { positions: mesh.positions as number[], indices: mesh.indices as number[] }, measures: { midline: z, forkNormalX: normal[0], forkNormalY: normal[1] }, method: "her own world: the reference artifact in calibration mm with Z negated, unregistered" },
      milliseconds: ms,
    });
  }

  /** Display the reference fork without generating a course or a surface. */
  function forkWire(name: string, mesh: AutoMovieMeshExtract.IMesh, z: number, ms: Record<string, number>): CaptureModel.IPart {
    const started: number = performance.now();
    const fork: AutoMovieHumanF1Fork.IResult = AutoMovieHumanF1Fork.read(mesh, z);
    const centre: V3 = fork.parentPlane.centroid;
    const heights: number[] = fork.ring.map((p: V3): number => p[1]);
    const reference: CaptureModel.ITriangles = medianReference(mesh, [Math.min(...heights), Math.max(...heights)], z);
    ms.fork = performance.now() - started;
    const shared: number = fork.crotch.filter((point: V3): boolean => fork.left.includes(point) && fork.right.includes(point)).length;
    const diagnostics: string[] = [
      `original fork contour: ${fork.ring.length} points, left ${fork.left.length}, right ${fork.right.length}, shared seam ${shared}/${fork.crotch.length}`,
      `raw median crossings differ from rounded survey endpoints by ${fork.endpointDisplacement.map((d: number): string => d.toFixed(3)).join(", ")} mm`,
      ...fork.flags,
    ];
    console.log(diagnostics.join("\n"));
    return CaptureSpecs.part({
      part: name,
      frames: [{ name: "world", parent: null, basis: { kind: "derived", rule: "F1 source world millimetres with Z negated" }, relative: AutoMovieHumanArmCurveSpec.IDENTITY }],
      root: AutoMovieHumanArmCurveSpec.IDENTITY,
      placement: "F1 source world",
      specs: [
        wire("trunk.fork.left", [...fork.left, fork.left[0]!], "Ordered original left fork boundary"),
        wire("trunk.fork.right", [...fork.right, fork.right[0]!], "Ordered original right fork boundary"),
        wire("trunk.fork.crotch", fork.crotch, "Measured shared median seam"),
      ],
      axis: (): null => null,
      chain: null,
      ports: [{ name: "fork", frame: "world", point: centre, radius: Math.max(...fork.ring.map((point: V3): number => Math.hypot(...sub(point, centre)))) }],
      diagnostics,
      relations: { parent: null, children: ["leg.left", "leg.right"], shares: ["leg.left", "leg.right"], basis: "single source contour and shared median seam" },
      reference: { status: "available", mesh: reference, cropToLoft: false, measures: { midline: z }, method: "original median skin around the measured fork" },
      milliseconds: ms,
    });
  }
}
