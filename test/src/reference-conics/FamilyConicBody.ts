import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { AutoMovieLoftChain } from "../../../packages/engine/src/geometry/construction/AutoMovieLoftChain";
import type { AutoMovieLoftFrame } from "../../../packages/engine/src/geometry/construction/AutoMovieLoftFrame";
import type { AutoMovieViewAxis } from "../../../packages/engine/src/geometry/construction/AutoMovieViewAxis";
import type { AutoMovieViewLoft as L } from "../../../packages/engine/src/geometry/construction/AutoMovieViewLoft";
import { NodeCanvasRaster } from "../../../packages/human/src/executable/NodeCanvasRaster";
import { NodeCanvasCamera } from "../../../packages/human/src/inspection/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "../../../packages/human/src/inspection/NodeCanvasTypes";
import { FamilyConicFit as F } from "./FamilyConicFit";
import { FamilyConicLoft as K } from "./FamilyConicLoft";
import { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * Whole-part conic families on the f1 reference: each part is cut along its
 * own jointed course, fitted on a sparse shared knot vector, stored as plain
 * numbers, regenerated from that stored text through the engine's view loft,
 * measured against the cuts and rendered beside the reference.
 */
namespace FamilyConicBody {
  /** Sampled position target of campaign 1, mm. */
  const TARGET_MM: number = 0.5;

  /** Least distance between two station knots, mm. */
  const GAP_MM: number = 12;

  /** Spacing of the fitting sections, mm; the withheld sections stand midway. */
  const STEP_MM: number = 4;

  /** The plain limb layout, then the same with a median anchor in every quarter. */
  const LIMB: { layout: C.ILayout; refines: boolean }[] = [
    { layout: C.limb(false), refines: false },
    { layout: C.limb(true), refines: true },
  ];

  /** One part to fit. */
  interface IPart {
    /** Chain name. */
    name: string;

    /** Course centres, mm. */
    centres: R.V[];

    /** Turn half lengths at the interior centres, mm. */
    halves: number[];

    /** Chart `u` seed. */
    up: R.V;

    /** Fitted station interval, mm of course arclength. */
    domain: [number, number];

    /** Also emitted mirrored in the median plane `z = 0`. */
    mirrored: boolean;

    /** Section layouts to try in order, each starting from the previous one's result when `refines` says it is that layout split once. */
    layouts: { layout: C.ILayout; refines: boolean }[];
  }

  /** Run every part and write the receipt and the renders. */
  export async function main(): Promise<void> {
    const started: number = performance.now();
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-body", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const log = (event: string, detail: object): void => void process.stdout.write(JSON.stringify({ event, ...detail, elapsedMs: Math.round(performance.now() - started) }) + "\n");
    const source: R.ISource = await R.load(root);
    const joint = (name: string): R.V => source.joints.get(name)!;
    const only: string[] = process.argv.slice(2);
    const parts: IPart[] = (
      [
        { name: "arm", centres: [joint("upperarm_r"), joint("lowerarm_r"), joint("hand_r")], halves: [30], up: [1, 0, 0], domain: [76, 500], mirrored: true, layouts: LIMB },
        { name: "leg", centres: [joint("thigh_r"), joint("calf_r"), joint("foot_r")], halves: [40], up: [1, 0, 0], domain: [124, 820], mirrored: true, layouts: LIMB },
        { name: "trunk", centres: [[0, 780, 0], [0, 1480, 0]], halves: [], up: [1, 0, 0], domain: [150, 492], mirrored: false, layouts: LIMB },
      ] satisfies IPart[]
    ).filter((part: IPart): boolean => only.length === 0 || only.includes(part.name));
    const meshes: N.Mesh[] = [];
    const curves: N.Curve[] = [];
    const receipt: unknown[] = [];
    for (const part of parts) {
      const axis: AutoMovieViewAxis.IAxis = K.axis(part);

      // Observe: exact native cuts on the course's own planes, fitting sections every STEP_MM and withheld sections midway.
      const rows: F.IRow[] = [];
      const skipped: number[] = [];
      const hollows: string[] = [];
      for (let s: number = part.domain[0], i: number = 0; s <= part.domain[1] + 1e-9; s += STEP_MM / 2, ++i) {
        const cut: R.ICut = R.cut(source.body, axis.at(s));
        if (cut.loop === null) skipped.push(s);
        else {
          // The family is the tape wall: it reads the section's convex hull. How far the skin lies inside that hull is measured apart, as relief.
          const wall: C.P[] = R.hull(cut.loop);
          rows.push({ s, points: wall, heldout: i % 2 === 1 });
          let deepest: number = 0;
          let where: number = 0;
          for (const p of cut.loop) {
            const phi: number = Math.atan2(p[1], p[0]);
            const depth: number = C.radius(wall, phi) - Math.hypot(p[0], p[1]);
            if (depth > deepest) {
              deepest = depth;
              where = phi;
            }
          }
          hollows.push(s.toFixed(0) + ":" + deepest.toFixed(1) + "@" + ((where * 180) / Math.PI).toFixed(0));
        }
      }
      log("family-body-hollows", { part: part.name, deepestMmAtDegrees: hollows.filter((_: string, i: number): boolean => i % 6 === 0).join(" ") });
      log("family-body-observed", { part: part.name, sections: rows.length, skipped });

      // Fit: grow the shared knot vector at the worst open fitting sections until the target holds or no section is open.
      let best: F.IResult | null = null;
      const trail: unknown[] = [];
      for (const { layout, refines } of part.layouts) {
        // A split layout starts from the plain one's final knots and values, cut exactly at each quarter's median.
        let knots: number[] = best === null || !refines ? [part.domain[0], (part.domain[0] + part.domain[1]) / 2, part.domain[1]] : [...best.knots];
        let initial: number[][] | undefined = best === null || !refines ? undefined : F.refine(best.values);
        const fields: number = C.units(layout).length;
        let result: F.IResult;
        for (;;) {
          result = F.fit(rows, knots, layout, 4, initial);
          const row = { fields, knots: knots.length, scalars: knots.length * (1 + fields), trainMaxMm: round(result.training.maximumMm), trainMeanMm: round(result.training.meanMm), heldMaxMm: round(result.heldout.maximumMm), heldMeanMm: round(result.heldout.meanMm), fault: result.fault, ms: Math.round(result.milliseconds) };
          trail.push(row);
          log("family-body-candidate", { part: part.name, ...row });
          if (result.fault !== null || result.training.maximumMm <= 0.9 * TARGET_MM) break;
          const open: F.IResult["rows"] = result.rows.filter((r: F.IResult["rows"][number]): boolean => !r.heldout && r.maximumMm > 0.9 * TARGET_MM && knots.every((k: number): boolean => Math.abs(k - r.s) >= GAP_MM)).sort((a, b) => b.maximumMm - a.maximumMm);
          const added: number[] = [];
          for (const r of open) if (added.length < 4 && added.every((s: number): boolean => Math.abs(s - r.s) >= 2 * GAP_MM)) added.push(r.s);
          if (added.length === 0) break;
          const next: number[] = [...knots, ...added].sort((a: number, b: number): number => a - b);
          initial = F.resample(result.values, knots, next);
          knots = next;
        }
        if (result.fault === null && (best === null || result.training.maximumMm < best.training.maximumMm - 0.05)) best = result;
        if (best !== null && Math.max(best.training.maximumMm, best.heldout.maximumMm) <= TARGET_MM) break;
      }
      if (best === null) {
        receipt.push({ part: part.name, trail, fault: "no admissible family" });
        continue;
      }
      log("family-body-rows", { part: part.name, worst: best.rows.filter((r) => r.maximumMm > TARGET_MM).map((r) => r.s.toFixed(0) + (r.heldout ? "h" : "t") + ":" + r.maximumMm.toFixed(2) + "@" + ((r.phase * 180) / Math.PI).toFixed(0)).join(" ") });

      // Store as rounded text, then regenerate from that text alone through the engine.
      const stored: string = JSON.stringify({ name: part.name, centres: part.centres.map((c: R.V): number[] => c.map(round)), halves: part.halves, up: part.up, layout: best.layout, knots: best.knots.map(round), values: best.values.map((field: number[], f: number): number[] => field.map(C.units(best!.layout)[f] === "mm" ? round : round4)) });
      await fs.writeFile(path.join(out, part.name + ".family.json"), stored);
      const definition: K.IStored = JSON.parse(stored) as K.IStored;
      const stations: number[] = rows.map((row: F.IRow): number => row.s);
      const lofted: number = performance.now();
      const loft: L.IResult = K.create(definition, stations);
      const loftMs: number = performance.now() - lofted;
      if (loft.chain === null) {
        receipt.push({ part: part.name, trail, engineFault: loft.diagnostics });
        log("family-body-engine", { part: part.name, fault: loft.diagnostics });
        continue;
      }
      const chain: NonNullable<L.IResult["chain"]> = loft.chain;
      const stage: AutoMovieViewAxis.IAxis = K.axis(definition);
      let maximum: number = 0;
      let sum: number = 0;
      let n: number = 0;
      for (const row of rows) {
        const frame: AutoMovieLoftFrame.IFrame = stage.at(row.s);
        for (const vertex of row.points) {
          const p: R.V = AutoMovieLoftChain.point(chain, row.s, Math.atan2(vertex[1], vertex[0])) as R.V;
          const d: R.V = [p[0] - frame.origin[0], p[1] - frame.origin[1], p[2] - frame.origin[2]];
          const e: number = Math.abs(Math.hypot(d[0] * frame.u[0] + d[1] * frame.u[1] + d[2] * frame.u[2], d[0] * frame.v[0] + d[1] * frame.v[1] + d[2] * frame.v[2]) - Math.hypot(vertex[0], vertex[1]));
          maximum = Math.max(maximum, e);
          sum += e;
          ++n;
        }
      }
      const engine = { storedBytes: Buffer.byteLength(stored), fields: best.values.length, knots: best.knots.length, scalars: best.knots.length * (1 + best.values.length), fitTrainMaxMm: round(best.training.maximumMm), fitHeldMaxMm: round(best.heldout.maximumMm), engineMaxMm: round(maximum), engineMeanMm: round(sum / n), loftMs: Math.round(loftMs), diagnostics: loft.diagnostics };
      log("family-body-engine", { part: part.name, ...engine });
      receipt.push({ part: part.name, domainMm: part.domain, sections: rows.length, skipped, trail, engine });

      // Display grid: every observed station by 128 phases, mirrored when the part has a twin.
      const rings: R.V[][] = stations.map((s: number): R.V[] => Array.from({ length: 128 }, (_: unknown, j: number): R.V => AutoMovieLoftChain.point(chain, s, (2 * Math.PI * j) / 128) as R.V));
      for (const sign of part.mirrored ? [1, -1] : [1]) {
        const positions: number[] = [];
        const indices: number[] = [];
        for (const ring of rings) for (const p of ring) positions.push(p[0] / 1000, p[1] / 1000, (sign * p[2]) / 1000);
        for (let i: number = 0; i + 1 < rings.length; ++i)
          for (let j: number = 0; j < 128; ++j) {
            const a: number = i * 128 + j;
            const b: number = i * 128 + ((j + 1) % 128);
            if (sign > 0) indices.push(a, a + 128, b, b, a + 128, b + 128);
            else indices.push(a, b, a + 128, b, b + 128, a + 128);
          }
        meshes.push({ id: part.name + (sign > 0 ? "" : ".mirror"), positions, indices, colour: [0.64, 0.65, 0.67] });
        for (const m of definition.knots.map((k: number): number => stations.reduce((a: number, b: number): number => (Math.abs(b - k) < Math.abs(a - k) ? b : a))))
          curves.push({ id: part.name + ".knot." + m + "." + sign, points: rings[stations.indexOf(m)]!.map((p: R.V): N.Point => [p[0] / 1000, p[1] / 1000, (sign * p[2]) / 1000]), closed: true, colour: "b84b29" });
      }
      await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify({ schema: "f1-family-conic-body-v1", targetMm: TARGET_MM, parts: receipt, milliseconds: performance.now() - started }, null, 2));
    }

    // Same cameras for the reference and the regenerated parts, framed on the reference.
    const reference: N.Mesh = { id: "reference.body", positions: Array.from(source.body.positions, (x: number): number => x / 1000), indices: Array.from(source.body.indices), colour: [0.64, 0.65, 0.67] };
    const bounds: N.Point[] = [];
    for (let i: number = 0; i < reference.positions.length; i += 3) bounds.push([reference.positions[i]!, reference.positions[i + 1]!, reference.positions[i + 2]!]);
    NodeCanvasRaster.initialize();
    const frames: { file: string; sha256: string }[] = [];
    for (const view of ["front", "back", "left", "right", "high-oblique", "low-oblique"]) {
      const camera: N.Camera = NodeCanvasCamera.fit(view, bounds, 900, 1500);
      for (const [stage, shown, lines] of [["reference", [reference], []], ["family-clay", meshes, []], ["family-knots", meshes, curves]] as [string, N.Mesh[], N.Curve[]][]) {
        const file: string = "body." + view + "." + stage + ".png";
        const png: Buffer = NodeCanvasRaster.render(camera, shown, lines, "depth", "f1 | " + stage + " | " + view).png;
        await fs.writeFile(path.join(out, file), png);
        frames.push({ file, sha256: createHash("sha256").update(png).digest("hex") });
      }
    }
    await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify({ schema: "f1-family-conic-body-v1", targetMm: TARGET_MM, parts: receipt, frames, milliseconds: performance.now() - started }, null, 2));
    log("family-body-complete", { out });
  }

  /** Round to a hundredth: the stored precision of a length in millimetres. */
  function round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /** Round to four decimals: the stored precision of a share. */
  function round4(value: number): number {
    return Math.round(value * 1e4) / 1e4;
  }
}
void FamilyConicBody.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
