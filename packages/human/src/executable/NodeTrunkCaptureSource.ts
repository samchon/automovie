import { type AutoMovieMeshExtract, AutoMovieViewAxis, AutoMovieViewOutline, type IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import type { NodeCaptureSources } from "./NodeCaptureSources";
import { NodeTrunkReference } from "./NodeTrunkReference";

type V3 = CaptureModel.Vec3;
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;

/**
 * The trunk region's own `node:capture` provider for `trunk`, traced
 * directly from f1's reference (owner's step 1) by the shared builder
 * (`AutoMovieHumanF1Trace`), in her own world: the native artifact in
 * calibration mm with Z negated (`NodeTrunkReference.fromModel`), never
 * registered to a generated datum. The originals drawn are the trace's own
 * outlines and shoulders, read through the engine's outline evaluator (the
 * one the loft reads), and the clay is the same part's loft, so every stage
 * shows one source.
 *
 * The course is straight and vertical on her midline (`u` = +X anterior,
 * `v` = +Z, stations world height along `v x u` = +Y), its origin the middle
 * of her trunk loop's four extents at 1100 mm.
 *
 * This is a named partial study, not the owner's trunk. It runs level from
 * {@link BOTTOM} to {@link TOP} only. The owner's trunk runs from the oblique
 * plane through her forks (the notch and the cleft top) to her neck base at
 * 1458 mm, with her armscye loops as ports; both ends and the ports are
 * unobserved here (#3158, #3161, #3163). {@link TOP} is the last station
 * below the change the `node:f1-trace` receipt
 * (`.shots/f1_trace/receipt-688502de-trunk`) records in the extraction's
 * outer pieces: at 1275.32 mm three (the piece holding the axis 53370 mm^2,
 * two others 6605 mm^2 each), at 1277.32 mm one of 66575 mm^2, their sum,
 * with no bridged gap flagged. That the change is her axilla saddle is a
 * hypothesis until frames of that place are opened over the reference: every
 * raw chain of those cuts is open and the outer pieces are joined across
 * zero-length gaps. No port is drawn until it is traced.
 */
export namespace NodeTrunkCaptureSource {
  /** Her fork-plane loop height, mm: the trunk's traced lower end. */
  export const BOTTOM: number = 831.32;

  /** The study's upper end, mm: the last level station below the receipt's merge of outer pieces (see the namespace comment). */
  export const TOP: number = 1275.32;

  /** Cut spacing, mm (her cuts every 2 mm), and layer spacing, mm (S00's 6 mm gap). */
  export const STEP: { cut: number; layer: number } = { cut: 2, layer: 6 };

  /** Section order and ring samples: S00's (`AutoMovieHumanTrunkS00.of`: order 64, 160 samples). */
  export const LOFT: { order: number; samples: number } = { order: 64, samples: 160 };

  /** The provider entry. */
  export const PROVIDER: NodeCaptureSources.IProvider = {
    names: ["trunk"],
    files: ["packages/human/src/executable/NodeTrunkCaptureSource.ts", "packages/human/src/generation/AutoMovieHumanF1Trace.ts", "packages/human/src/executable/NodeTrunkReference.ts", "packages/engine/src/geometry/extract/", "packages/engine/src/geometry/construction/"],
    prepare,
  };

  /** Build `trunk` for the capture tool. */
  async function prepare(name: string, context: NodeCaptureSources.IContext): Promise<CaptureModel.IPart> {
    if (name !== "trunk") throw new Error(`The trunk provider draws trunk, not ${name}`);
    const ms: Record<string, number> = {};
    const ref: NodeCaptureSources.IReference = await context.reference();
    const t0: number = performance.now();
    const her: NodeTrunkReference.IMesh = NodeTrunkReference.fromModel(ref.model, 1);
    const mesh: AutoMovieMeshExtract.IMesh = { positions: her.points.flat(), indices: her.triangles.flat() };
    ms.reference = performance.now() - t0;

    // The course origin: the middle of her trunk loop's extents at 1100 mm,
    // read on the vertical through her world origin.
    const t1: number = performance.now();
    const probe: AutoMovieHumanF1Trace.ICut | null = AutoMovieHumanF1Trace.read(mesh, AutoMovieViewAxis.straight([0, 0, 0], [1, 0, 0], [0, 0, 1]), 1100);
    if (probe === null) throw new Error("trunk: no loop of her mesh holds the world origin's vertical at 1100 mm");
    const origin: V3 = [(probe.extents[0] + probe.extents[1]) / 2, 0, (probe.extents[2] + probe.extents[3]) / 2];
    const axis: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.straight(origin, [1, 0, 0], [0, 0, 1]);
    const direct: AutoMovieHumanF1Trace.IOutput = AutoMovieHumanF1Trace.create({ name, mesh, axis, cuts: span(BOTTOM, TOP, STEP.cut), stations: span(BOTTOM, TOP, STEP.layer), order: LOFT.order, samples: LOFT.samples });
    ms.trace = performance.now() - t1;
    Object.assign(ms, Object.fromEntries(Object.entries(direct.ms).map(([k, v]: [string, number]): [string, number] => [`trace.${k}`, v])));

    // The complete receipt in the capture log: every cut, every run, every diagnostic.
    console.log(`trunk trace: origin (${origin[0].toFixed(3)}, ${origin[2].toFixed(3)}) mm, ${direct.cuts.length} cuts, dropped [${direct.dropped.join(", ")}], part ${direct.part === null ? "refused" : "built"}, chain ${direct.loft === null || direct.loft.chain === null ? "null" : "ok"}`);
    for (const c of direct.cuts) console.log(`  cut ${c.station.toFixed(2)} | extents ${c.extents.map((e: number): string => e.toFixed(3)).join(" ")} | touch ${c.touch.map((e: number): string => e.toFixed(2)).join(" ")} | rho ${c.shoulders.map((r: number | null): string => (r === null ? "null" : r.toFixed(4))).join(" ")} | reach ${c.reach.map((r: number): string => r.toFixed(2)).join(" ")} | area ${c.area.toFixed(0)} | centroid ${c.centroid?.map((x: number): string => x.toFixed(2)).join(",") ?? "null"} | kr ${typeof c.kr === "number" ? c.kr.toFixed(4) : "unobserved"} | flags ${c.flags.join("; ") || "none"} | checks ${c.checks.join("; ") || "none"}`);
    for (const r of direct.runs) console.log(`  run ${r.name}: ${r.knots.length} knots, reducer ${r.reducer.toExponential(3)}, actual ${r.actual.toFixed(4)} mm, pinned [${r.pinned.map((s: number): string => s.toFixed(2)).join(", ")}] | ${r.knots.map((k: [number, number, number]): string => `(${k[0].toFixed(2)}, ${k[1].toFixed(4)}, ${k[2].toFixed(4)})`).join(" ")}`);
    for (const l of direct.layers) console.log(`  layer ${l.station.toFixed(2)}: her loop against the section, max ${l.max.toFixed(3)} mm (signed ${l.signed.toFixed(3)} at phase ${((l.phase * 180) / Math.PI).toFixed(1)} deg), mean ${l.mean.toFixed(3)} mm`);
    for (const d of direct.diagnostics) console.log(`  diagnostic ${d}`);

    const worst: AutoMovieHumanF1Trace.ILayer | undefined = direct.layers.reduce<AutoMovieHumanF1Trace.ILayer | undefined>((a: AutoMovieHumanF1Trace.ILayer | undefined, b: AutoMovieHumanF1Trace.ILayer): AutoMovieHumanF1Trace.ILayer => (a === undefined || b.max > a.max ? b : a), undefined);
    const diagnostics: string[] = [
      ...direct.diagnostics,
      `her whole loop against the loft's section at ${direct.layers.length} layers on cut stations: ${direct.layers.filter((l: AutoMovieHumanF1Trace.ILayer): boolean => l.max > AutoMovieHumanF1Trace.TOLERANCE).length} exceed ${AutoMovieHumanF1Trace.TOLERANCE} mm; largest ${worst === undefined ? "none" : `${worst.max.toFixed(3)} mm at ${worst.station.toFixed(2)} mm, phase ${((worst.phase * 180) / Math.PI).toFixed(1)} deg`}`,
      `trunk traced directly (AutoMovieHumanF1Trace) from ${BOTTOM} to ${TOP} mm on her unregistered mesh: ${direct.cuts.length} cuts, dropped [${direct.dropped.join(", ")}], runs ${direct.runs.map((r: AutoMovieHumanF1Trace.IRun): string => `${r.name} ${r.knots.length} knots (actual ${r.actual.toFixed(3)} mm)`).join(", ")}`,
      `partial study: level ${BOTTOM} to ${TOP} mm only; at ${TOP + STEP.cut} mm the extraction's three outer pieces become one (axilla saddle hypothesis, not yet observed in a frame); the owner's trunk from the oblique fork plane to 1458 mm with her armscye ports is unobserved (#3158, #3161, #3163)`,
      ...(context.pose === "reference" ? ["pose reference: the trunk has no posed state; drawn in her own pose"] : []),
    ];
    const part: IAutoMovieViewPart | null = direct.part;
    return CaptureSpecs.part({
      part: name,
      frames: [{ name: "world", parent: null, basis: { kind: "derived", rule: "her own world: the reference artifact in calibration mm, Z negated (ISB), unregistered" }, relative: AutoMovieHumanArmCurveSpec.IDENTITY }],
      root: AutoMovieHumanArmCurveSpec.IDENTITY,
      placement: "her own world; no registration",
      specs: part === null ? [] : specs(part),
      axis: (frame: string): { origin: V3; distal: V3 } | null => (frame === "world" ? { origin, distal: [0, 1, 0] } : null),
      outline: (spec: Spec, station: number): number | null => (part === null ? null : value(part, spec.name, station)),
      quarters: (spec: Spec): readonly (readonly [string, string])[] | null => QUARTERS[spec.name] ?? null,
      chain: direct.loft?.chain ?? null,
      diagnostics,
      ports: [],
      relations: {
        parent: null,
        children: ["head", "arm.left", "arm.right", "leg.left", "leg.right"],
        shares: ["head", "arm.left", "arm.right", "leg.left", "leg.right"],
        basis: "the trunk's traced ends and ports are pending (#3158, #3161, #3163); relations name the intended neighbours only",
      },
      reference: { status: "available", mesh: { positions: mesh.positions as number[], indices: mesh.indices as number[] }, measures: { courseOriginX: origin[0], courseOriginZ: origin[2] }, method: "her own world: the reference artifact in calibration mm with Z negated, unregistered" },
      milliseconds: ms,
    });
  }

  /** The spec names of the four outlines, in the part's `+u`, `-u`, `+v`, `-v` order, with their world directions. */
  const OUTLINES: [string, V3][] = [
    ["trunk.anterior", [1, 0, 0]],
    ["trunk.posterior", [-1, 0, 0]],
    ["trunk.right", [0, 0, 1]],
    ["trunk.left", [0, 0, -1]],
  ];

  /** Each fullness spec's quarter, bounded by its two neighbouring outlines (q0 between +u and +v, ...). */
  const QUARTERS: Record<string, readonly (readonly [string, string])[]> = {
    "trunk.rho0": [["trunk.anterior", "trunk.right"]],
    "trunk.rho1": [["trunk.right", "trunk.posterior"]],
    "trunk.rho2": [["trunk.posterior", "trunk.left"]],
    "trunk.rho3": [["trunk.left", "trunk.anterior"]],
  };

  /** The part's outlines and shoulders as capture specs in her world frame. */
  function specs(part: IAutoMovieViewPart): Spec[] {
    const sources: IAutoMovieViewPart.IOutline[] = [part.front.positive, part.front.negative, part.side.positive, part.side.negative];
    const top: IAutoMovieViewPart.IOutline[] = part.fullness.kind === "top" ? [...part.fullness.shoulders] : [];
    const first: number = part.stations[0]!;
    const last: number = part.stations[part.stations.length - 1]!;
    const spec = (name: string, source: IAutoMovieViewPart.IOutline, direction: V3 | null): Spec => ({
      name,
      frame: "world",
      datums: [],
      constraints: [],
      representation: {
        kind: "outline",
        parameter: "station, world height mm",
        direction: direction === null ? null : [direction[0], direction[1], direction[2]],
        walk: 0,
        domain: [first, last],
        knots: source.knots.map((k: IAutoMovieViewPart.IKnot): AutoMovieHumanArmCurveSpec.IOutlineKnot => ({ site: k.site, station: k.station, q: k.station, value: Math.abs(k.value), first: 0, second: 0 })),
        handleRule: "traced knots of her own cuts (AutoMovieHumanF1Trace); the display reads the engine's AutoMovieViewOutline, the evaluator the loft reads",
      },
      aids: [],
      consumers: ["trunk loft"],
    });
    return [...OUTLINES.map(([n, d]: [string, V3], k: number): Spec => spec(n, sources[k]!, d)), ...top.map((s: IAutoMovieViewPart.IOutline, q: number): Spec => spec(`trunk.rho${q}`, s, null))];
  }

  /** The exact displayed value of a named spec at a station: the engine outline of the part's own source, as a magnitude along the spec's direction. */
  function value(part: IAutoMovieViewPart, name: string, station: number): number | null {
    const k: number = OUTLINES.findIndex(([n]: [string, V3]): boolean => n === name);
    const sources: IAutoMovieViewPart.IOutline[] = [part.front.positive, part.front.negative, part.side.positive, part.side.negative];
    const source: IAutoMovieViewPart.IOutline | undefined = k >= 0 ? sources[k] : part.fullness.kind === "top" ? part.fullness.shoulders[Number(name.replace("trunk.rho", ""))] : undefined;
    if (source === undefined) return null;
    const outline: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(source);
    if ("contract" in outline) return null;
    const read: number | string = AutoMovieViewOutline.value(outline, station);
    return typeof read === "string" ? null : k >= 0 ? Math.abs(read) : read;
  }

  /** Stations from a to b every step, b included. */
  function span(a: number, b: number, step: number): number[] {
    const out: number[] = [];
    for (let s: number = a; s < b - 1e-9; s += step) out.push(Number(s.toFixed(6)));
    out.push(b);
    return out;
  }
}
