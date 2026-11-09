const entered: number = performance.now();

import fs from "node:fs/promises";
import path from "node:path";

import { CaptureComparison } from "../inspection/CaptureComparison";
import { CaptureManifest } from "../inspection/CaptureManifest";
import type { CaptureModel } from "../inspection/CaptureModel";
import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import { CaptureOptions } from "../inspection/CaptureOptions";
import { CaptureOutliers } from "../inspection/CaptureOutliers";
import { CaptureSelection } from "../inspection/CaptureSelection";
import type { NodeCanvasTypes as N } from "../inspection/NodeCanvasTypes";
import { HumanNodeArtifacts } from "./HumanNodeArtifacts";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeCanvasRaster } from "./NodeCanvasRaster";
import { NodeCanvasReferenceBackground } from "./NodeCanvasReferenceBackground";
import { NodeCaptureOutputs } from "./NodeCaptureOutputs";
import { NodeCapturePlan } from "./NodeCapturePlan";
import { NodeCaptureRender } from "./NodeCaptureRender";
import { NodeCaptureSources } from "./NodeCaptureSources";

/**
 * `pnpm --dir packages/human node:capture`: one selection of parts captures
 * everything a question about them needs, in one process. From part globs it
 * expands each original curve alone, each part alone, the part with its
 * neighbours and the whole figure; draws the four stages (original 2D curves
 * with their construction aids over the registered reference, generated loft
 * curves, loft curves over default clay, clay) at the six axis views, high
 * and low obliques and a close-up at each joint or port, in each part's own
 * segment frame and in the world frame; and writes individual PNGs, one
 * contact sheet per part, stage and frame mode, and a manifest. The source
 * is prepared once and every frame reuses it; no whole-figure calibration or
 * final realization is requested. `--compare` reproduces an earlier packet's
 * cells and writes before/after pairs. Unavailable stages, parts and
 * neighbours are explicit cells with their causes.
 */
export namespace NodeCapture {
  /** Run the capture and print the contact-sheet paths. */
  export async function run(argv: readonly string[]): Promise<void> {
    const started: number = performance.now();
    const times: Record<string, number> = { startupToEntry: entered };

    // Options, merged over an optional plan file and an earlier packet's request.
    const planPath: string | null = CaptureOptions.planFile(argv);
    const plan: Partial<CaptureOptions.IOptions> = planPath === null ? {} : JSON.parse(await fs.readFile(here(planPath), "utf8"));
    let options: CaptureOptions.IOptions = CaptureOptions.parse(argv, plan);
    let earlier: CaptureComparison.IRead | null = null;
    let earlierDir: string | null = null;
    if (options.compare !== null) {
      earlierDir = here(options.compare);
      const manifest: Record<string, unknown> = JSON.parse(await fs.readFile(path.join(earlierDir, "manifest.json"), "utf8"));
      earlier = CaptureComparison.read(manifest, "arm.left");
      const request: Partial<CaptureOptions.IOptions> =
        earlier.tool === "node:capture"
          ? { ...(manifest.request as Partial<CaptureOptions.IOptions>), compare: options.compare, out: null }
          : { parts: ["arm.left"], scopes: ["individual"], stages: ["original"], frames: ["world"], views: [...new Set(earlier.frames.map((f: CaptureComparison.IEarlier): string => f.camera))], compare: options.compare };
      options = CaptureOptions.parse(argv, { ...request, ...plan });
    }
    times.options = performance.now() - started;

    // Source preparation, once per run.
    const preparing: number = performance.now();
    const context: NodeCaptureSources.IContext = await NodeCaptureSources.context(options.pose);
    times.inputLoad = performance.now() - preparing;
    const providers: Map<string, NodeCaptureSources.IProvider> = NodeCaptureSources.providers();
    const patterns: RegExp[] = options.parts.map(CaptureSelection.glob);
    const needed: string[] = [...providers.keys()].filter(
      (n: string): boolean => options.scopes.some((s: CaptureSelection.Scope): boolean => s !== "individual") || patterns.some((re: RegExp): boolean => re.test(n)),
    );

    // Source identities at entry, before any provider evaluates its source; compared again at exit.
    const hashing: number = performance.now();
    const sourceFiles: string[] = ["packages/playground/src/human-parameters/f1.ts", ...new Set(needed.flatMap((n: string): readonly string[] => providers.get(n)!.files)), ...CODE];
    const before: Record<string, string> = await NodeCaptureSources.identities(sourceFiles);
    times.identityEntry = performance.now() - hashing;
    const parts: Map<string, CaptureModel.IPart> = new Map();
    const failed: Map<string, string> = new Map();
    const constructing: number = performance.now();
    for (const name of needed)
      try {
        parts.set(name, await providers.get(name)!.prepare(name, context));
      } catch (error: unknown) {
        failed.set(name, `provider failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
      }
    times.construction = performance.now() - constructing;
    const reference: NodeCaptureSources.IReference | null = parts.size === 0 ? null : await context.reference();
    if (reference !== null) times.referenceRead = reference.milliseconds;

    // Selection expansion over drawable, failed and known parts.
    const infos: CaptureSelection.IPartInfo[] = [
      ...[...providers.keys()].map((name: string): CaptureSelection.IPartInfo => {
        const p: CaptureModel.IPart | undefined = parts.get(name);
        if (p !== undefined) return { name, unavailable: null, parent: p.relations.parent, children: p.relations.children, shares: p.relations.shares, curves: p.curves.map((c: CaptureModel.ICurve): string => c.id) };
        return { name, unavailable: failed.get(name) ?? "not prepared in this run", parent: null, children: [], shares: [], curves: [] };
      }),
      ...NodeCaptureSources.KNOWN.filter((k: CaptureModel.IKnown): boolean => !providers.has(k.name)).map((k: CaptureModel.IKnown): CaptureSelection.IPartInfo => ({ name: k.name, unavailable: k.cause, parent: k.relations.parent, children: k.relations.children, shares: k.relations.shares, curves: [] })),
    ];
    const expanded: CaptureSelection.IOutput = CaptureSelection.expand(infos, options.parts, options.scopes, options.stages);

    // Cells and the reference-background owner over every display mesh the cached rows use.

    // Multi-part rows fit their cameras on inlying parts: the limit is CaptureOutliers.STATURES statures of the person, display metres.
    const stature: number = AutoMovieHumanBodyAnatomy.resolve(context.person.parameters).stature;
    const limit: number = (CaptureOutliers.STATURES * stature) / 1000;
    const cells: NodeCapturePlan.ICell[] = NodeCapturePlan.cells({ selections: expanded.selections, parts, frames: options.frames, views: options.views, size: options.size, earlier: earlier?.frames ?? null, limit });
    const outlying: NodeCaptureOutputs.IOutlying[] = [];
    for (const cell of cells)
      if ((cell.outliers.length !== 0 || cell.invalid.length !== 0) && !outlying.some((o: NodeCaptureOutputs.IOutlying): boolean => o.selection === cell.selection && o.frame === cell.frame))
        outlying.push({
          selection: cell.selection,
          frame: cell.frame,
          parts: cell.outliers.map((o: CaptureOutliers.IOutlier): { name: string; distance: number } => ({ name: o.name, distance: o.distance })),
          limit,
          invalid: cell.invalid,
        });
    const mesh: NodeCaptureRender.IMeshes = NodeCaptureRender.meshes();
    const cached: (row: CaptureSelection.ISelection) => boolean = (row: CaptureSelection.ISelection): boolean =>
      options.referenceCache === "all" || (options.referenceCache === "rows" && row.kind !== "curve");
    const references: Set<N.Mesh> = new Set();
    for (const cell of cells)
      if (cell.stage === "original" && cached(cell.row))
        for (const name of cell.row.parts) {
          const m: N.Mesh | null = mesh(parts.get(name)!, "reference", cell.display, NodeCaptureRender.crop(cell.row, parts, cell.display));
          if (m !== null) references.add(m);
        }
    const owner: NodeCanvasReferenceBackground.IOwner | null = reference === null || references.size === 0 ? null : await NodeCanvasReferenceBackground.create(reference.sha256, [...references]);
    if (owner !== null) times.referenceBackgroundIdentity = owner.identityMilliseconds;
    times.canvasInitialize = NodeCanvasRaster.initialize().milliseconds;

    // Draw every cell.
    const stamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    const out: string = options.out === null ? HumanNodePaths.resolve(`packages/human/.shots/f1_capture/capture-${stamp}`) : here(options.out);
    await fs.mkdir(out, { recursive: true });
    const frames: CaptureManifest.IFrame[] = [];
    const images: Map<string, Buffer> = new Map();
    const drawing: number = performance.now();
    for (const cell of cells) {
      const base: Omit<CaptureManifest.IFrame, "status" | "cause" | "file" | "sha256" | "resolved" | "curves" | "meshes" | "lineMode" | "referenceBackground" | "milliseconds" | "unavailable"> = {
        frame: cell.frame,
        selection: cell.selection,
        stage: cell.stage,
        camera: cell.camera,
        kind: cell.row.kind,
        owner: cell.row.owner,
        parts: cell.row.parts,
        curve: cell.row.curve,
        displayFrame: cell.display.name,
      };
      const key: CaptureManifest.IKey = { frame: cell.frame, selection: cell.selection, stage: cell.stage, camera: cell.camera };
      const t0: number = performance.now();
      const scene: NodeCaptureRender.IScene | { cause: string } = cell.resolved === null ? { cause: cell.cause ?? "no camera" } : NodeCaptureRender.scene(cell.row, cell.stage, parts, cell.display, mesh);
      if ("cause" in scene) {
        frames.push({ ...base, status: "unavailable", cause: scene.cause, file: null, sha256: null, resolved: cell.resolved, curves: [], meshes: [], lineMode: "depth", referenceBackground: null, unavailable: cell.row.unavailable, milliseconds: { display: performance.now() - t0, raster: 0, encode: 0, write: 0 } });
        continue;
      }
      const camera: N.Camera = cell.resolved!;
      const curves: N.Curve[] = NodeCaptureRender.finish(scene, camera);
      const missing: string = scene.unavailable.length === 0 ? "" : ` | not drawn: ${scene.unavailable.map((u: { name: string }): string => u.name).join(", ")}`;
      const label: string = `${cell.selection} | ${cell.stage} | ${cell.frame}:${cell.display.name}${missing}`;
      const display: number = performance.now() - t0;
      const rendered: ReturnType<typeof NodeCanvasRaster.render> & { referenceBackground?: N.ReferenceBackground } =
        owner !== null && scene.reference && cached(cell.row) ? await owner.render(camera, scene.meshes, curves, scene.lineMode, label) : NodeCanvasRaster.render(camera, scene.meshes, curves, scene.lineMode, label);
      const file: string = path.posix.join("frames", cell.frame, cell.selection.replace(/\//g, "__"), `${cell.stage}.${key.camera}.png`);
      await fs.mkdir(path.join(out, path.dirname(file)), { recursive: true });
      const saved: N.Frame = await HumanNodeArtifacts.frame(out, file, { scope: cell.selection, stage: cell.stage, camera, meshes: scene.meshes, curves, lineMode: scene.lineMode }, { png: rendered.png, milliseconds: rendered.milliseconds, pixels: rendered.pixels, referenceBackground: rendered.referenceBackground });
      images.set(CaptureManifest.key(key), rendered.png);
      frames.push({
        ...base,
        status: "drawn",
        cause: null,
        file,
        sha256: saved.sha256,
        resolved: camera,
        curves: [...new Set(saved.curves)],
        meshes: saved.meshes,
        lineMode: scene.lineMode,
        referenceBackground: rendered.referenceBackground ?? null,
        unavailable: scene.unavailable,
        milliseconds: { display, raster: rendered.milliseconds.canvas + rendered.milliseconds.raster, encode: rendered.milliseconds.encode, write: saved.milliseconds.write },
      });
    }
    times.frames = performance.now() - drawing;

    // Contact sheets, before/after pairs and the manifest.
    const sheeting: number = performance.now();
    const sheets: NodeCaptureOutputs.ISheet[] = await NodeCaptureOutputs.sheets(out, frames, images, expanded, options.cell, stamp, outlying);
    times.sheets = performance.now() - sheeting;
    const pairing: number = performance.now();
    const compared: NodeCaptureOutputs.ICompared | null =
      earlier === null || earlierDir === null ? null : await NodeCaptureOutputs.pairs(out, earlierDir, earlier, frames, images, options.size, options.cell);
    times.pairs = performance.now() - pairing;
    const planned: CaptureManifest.IKey[] = cells.map((c: NodeCapturePlan.ICell): CaptureManifest.IKey => ({ frame: c.frame, selection: c.selection, stage: c.stage, camera: c.camera }));
    const problems: string[] = [
      ...CaptureManifest.problems(planned, frames),
      ...outlying.flatMap((o: NodeCaptureOutputs.IOutlying): string[] => [
        ...o.parts.map((p: { name: string; distance: number }): string => `outlier part ${p.name} in ${o.selection} (${o.frame}): ${p.distance.toFixed(2)} m from the figure median, limit ${o.limit.toFixed(2)} m; cameras fitted without it`),
        ...(o.invalid ?? []).map((p: { name: string; dropped: number; total: number }): string => `non-finite framing in part ${p.name} in ${o.selection} (${o.frame}): ${p.dropped} of ${p.total} points are NaN or infinite; cameras fitted without them`),
      ]),
      ...frames
        .filter((f: CaptureManifest.IFrame): boolean => f.status === "unavailable" && f.cause !== null && (f.cause.startsWith("camera not finite") || f.cause.startsWith("every framing point is non-finite")))
        .map((f: CaptureManifest.IFrame): string => `cell ${CaptureManifest.key(f)}: ${f.cause}`),
    ];
    const after: Record<string, string> = await NodeCaptureSources.identities(sourceFiles);
    const changed: string[] = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((f: string): boolean => before[f] !== after[f]);
    times.total = performance.now() - started;
    const sum: (k: keyof CaptureManifest.IMilliseconds) => number = (k: keyof CaptureManifest.IMilliseconds): number => frames.reduce((s: number, f: CaptureManifest.IFrame): number => s + f.milliseconds[k], 0);
    await HumanNodeArtifacts.json(out, "manifest.json", {
      tool: "node:capture",
      version: 1,
      createdUtc: new Date().toISOString(),
      person: "f1",
      argv,
      request: options,
      sources: {
        identities: before,
        identitiesAtExit: after,
        changedDuringRun: changed,
        referenceSha256: reference?.sha256 ?? null,
        parts: [...parts.values()].map((p: CaptureModel.IPart): Record<string, unknown> => ({
          name: p.name,
          root: p.root,
          placement: p.placement,
          relations: p.relations,
          bounds: CaptureOutliers.bounds(p.name, [...p.curves.flatMap((c: CaptureModel.ICurve): CaptureModel.Vec3[] => c.lines.flatMap((l: CaptureModel.ILine): CaptureModel.Vec3[] => l.points)), ...(p.loft.status === "available" ? triples(p.loft.clay.positions) : [])]),
          curves: p.curves.map((c: CaptureModel.ICurve): Record<string, unknown> => ({
            id: c.id,
            frame: c.frame,
            kind: c.kind,
            bounds: CaptureOutliers.bounds(c.id, c.lines.flatMap((l: CaptureModel.ILine): CaptureModel.Vec3[] => l.points)),

            // Every line, aid and datum holding a NaN or infinite coordinate, with its first such point.
            nonFinite: [
              ...[...c.lines, ...c.aids].flatMap((l: CaptureModel.ILine): { id: string; index: number; point: (number | string)[] }[] => {
                const k: number = l.points.findIndex((q: CaptureModel.Vec3): boolean => CaptureOutliers.finite([q]).dropped !== 0);
                return k < 0 ? [] : [{ id: l.id, index: k, point: l.points[k]!.map(String) }];
              }),
              ...c.datums.flatMap((q: CaptureModel.Vec3, k: number): { id: string; index: number; point: (number | string)[] }[] => (CaptureOutliers.finite([q]).dropped === 0 ? [] : [{ id: `datum:${k}`, index: k, point: q.map(String) }])),
            ],
          })),
          ports: p.ports,
          loft: p.loft.status === "available" ? { status: "available", diagnostics: p.loft.diagnostics, triangles: p.loft.clay.indices.length / 3 } : p.loft,
          reference: p.reference.status === "available" ? { status: "available", method: p.reference.method, measures: p.reference.measures, triangles: p.reference.mesh.indices.length / 3 } : p.reference,
          milliseconds: p.milliseconds,
          diagnostics: p.diagnostics,
        })),
        failed: Object.fromEntries(failed),
      },
      selection: { matched: expanded.matched, unavailable: expanded.unavailable, selections: expanded.selections },
      timings: { ...times, cells: { display: sum("display"), raster: sum("raster"), encode: sum("encode"), write: sum("write") } },
      counts: { planned: planned.length, drawn: frames.filter((f: CaptureManifest.IFrame): boolean => f.status === "drawn").length, unavailable: frames.filter((f: CaptureManifest.IFrame): boolean => f.status === "unavailable").length },
      problems,
      outliers: { statures: CaptureOutliers.STATURES, stature, limitMetres: limit, rows: outlying },
      sheets,
      comparison: compared,
      frames,
    });
    console.log(`node:capture ${out}`);
    console.log(`cells planned ${planned.length}, drawn ${frames.filter((f: CaptureManifest.IFrame): boolean => f.status === "drawn").length}, unavailable ${frames.filter((f: CaptureManifest.IFrame): boolean => f.status === "unavailable").length}, manifest problems ${problems.length}`);
    for (const u of expanded.unavailable) console.log(`unavailable ${u.name}: ${u.cause}`);
    for (const [name, cause] of failed) console.log(`FAILED ${name}: ${cause.split("\n")[0]}`);
    for (const f of changed) console.log(`CHANGED DURING RUN ${f}: the frames may show either version`);
    for (const s of sheets) console.log(path.join(out, s.file));
    if (compared !== null) for (const s of compared.sheets) console.log(path.join(out, s));
    console.log(`total ${(times.total / 1000).toFixed(1)} s (startup ${(entered / 1000).toFixed(1)} s before entry)`);
    if (problems.length !== 0) {
      for (const p of problems.slice(0, 20)) console.error(`manifest: ${p}`);
      process.exitCode = 1;
    }
  }

  /** Capture code whose bytes identify the observer. */
  const CODE: readonly string[] = [
    "packages/human/src/executable/NodeCapture.ts",
    "packages/human/src/executable/NodeCaptureArmReference.ts",
    "packages/human/src/executable/NodeCaptureOutputs.ts",
    "packages/human/src/executable/NodeCapturePlan.ts",
    "packages/human/src/executable/NodeCaptureRender.ts",
    "packages/human/src/executable/NodeCaptureSheet.ts",
    "packages/human/src/executable/NodeCaptureSources.ts",
    "packages/human/src/executable/NodeCanvasRaster.ts",
    "packages/human/src/inspection/CaptureCameras.ts",
    "packages/human/src/inspection/CaptureComparison.ts",
    "packages/human/src/inspection/CaptureManifest.ts",
    "packages/human/src/inspection/CaptureModel.ts",
    "packages/human/src/inspection/CaptureOptions.ts",
    "packages/human/src/inspection/CaptureSelection.ts",
    "packages/human/src/inspection/CaptureSpecs.ts",
  ];

  /** Points of a flat XYZ array. */
  function triples(flat: readonly number[]): CaptureModel.Vec3[] {
    const out: CaptureModel.Vec3[] = [];
    for (let i: number = 0; i + 2 < flat.length; i += 3) out.push([flat[i]!, flat[i + 1]!, flat[i + 2]!]);
    return out;
  }

  /** A command-line path from the directory the command was typed in (`INIT_CWD` under pnpm, which runs the script in the package). */
  function here(file: string): string {
    return path.resolve(process.env.INIT_CWD ?? process.cwd(), file);
  }
}

void NodeCapture.run(process.argv.slice(2)).catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
