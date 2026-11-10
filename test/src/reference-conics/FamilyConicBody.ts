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
import { FamilyConicRelief as H } from "./FamilyConicRelief";
import { AutoMovieViewChain as Q } from "../../../packages/engine/src/geometry/construction/AutoMovieViewChain";
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

  /** The limb layouts of 4 and 8 conics; the 16 conic layout fitted worse from the same start on the arm and is left out until that is understood. */
  const LIMB: { layout: C.ILayout; depth: number }[] = [0, 1].map((depth: number): { layout: C.ILayout; depth: number } => ({ layout: C.limb(depth), depth }));

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

    /** Fitted station interval, mm of course arclength; `auto` takes the longest run of single loops round the course whose area stays near the part's own. */
    domain: [number, number] | "auto";

    /** Spacing of the fitting sections, mm; absent, `STEP_MM`. */
    step?: number;

    /** Least distance between two station knots, mm; absent, `GAP_MM`. */
    gap?: number;

    /** Also emitted mirrored in the median plane `z = 0`. */
    mirrored: boolean;

    /** Limb layouts to try in order of median depth, each starting from the previous one's result. */
    layouts: { layout: C.ILayout; depth: number }[];

    /** Relief windows for what lies inside the tape wall, or `auto` to place one over every hollow deeper than the target. */
    reliefs: H.IWindow[] | "auto";
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
    const only: string[] = process.argv.slice(2).filter((argument: string): boolean => !argument.startsWith("--"));
    // A digit's course runs through its joints and on past the last one by the length of its distal segment.
    const beyond = (a: R.V, b: R.V, length: number): R.V => {
      const d: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      return [b[0] + ((b[0] - a[0]) * length) / d, b[1] + ((b[1] - a[1]) * length) / d, b[2] + ((b[2] - a[2]) * length) / d];
    };
    const digit = (name: string, joints: string[], tip: number, up: R.V): IPart => {
      const centres: R.V[] = joints.map(joint);
      centres.push(beyond(centres.at(-2)!, centres.at(-1)!, tip));
      return { name, centres, halves: centres.slice(1, -1).map((): number => 5), up, domain: "auto", step: 2, gap: 6, mirrored: true, layouts: LIMB, reliefs: [] };
    };
    const parts: IPart[] = (
      [
        ...["index", "middle", "ring", "pinky"].map((finger: string): IPart => digit("finger." + finger, [finger + "_01_r", finger + "_02_r", finger + "_03_r"], finger === "pinky" ? 22 : 26, [1, 0, 0])),
        digit("finger.thumb", ["thumb_01_r", "thumb_02_r", "thumb_03_r"], 30, [0, 1, 0]),
        ...["bigtoe", "indextoe", "middletoe", "ringtoe", "littletoe"].map((toe: string): IPart => digit("toe." + toe.replace("toe", ""), [toe + "_01_r", toe + "_02_r"], toe === "bigtoe" ? 28 : toe === "littletoe" ? 14 : 18, [0, 1, 0])),
        { name: "foot", centres: [[1, 45, 134], [133, 20, 157]], halves: [], up: [0, 1, 0], domain: "auto", step: 2, gap: 8, mirrored: true, layouts: LIMB, reliefs: "auto" },
        { name: "arm", centres: [joint("upperarm_r"), joint("lowerarm_r"), joint("hand_r")], halves: [30], up: [1, 0, 0], domain: [76, 500], mirrored: true, layouts: LIMB, reliefs: "auto" },
        { name: "leg", centres: [joint("thigh_r"), joint("calf_r"), joint("foot_r")], halves: [40], up: [1, 0, 0], domain: [124, 800], mirrored: true, layouts: LIMB, reliefs: "auto" },
        { name: "trunk", centres: [[0, 780, 0], [0, 1480, 0]], halves: [], up: [1, 0, 0], domain: [150, 492], mirrored: false, layouts: LIMB, reliefs: [
          { name: "trunk.back", stations: [60, 582], phases: [Math.PI - 1, Math.PI + 1], axis: [1, 0, 0], rows: 21, columns: 19, mirror: true },
          { name: "trunk.front", stations: [60, 582], phases: [-1, 1], axis: [-1, 0, 0], rows: 21, columns: 19, mirror: true },
        ] },
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
      const skins: C.P[][] = [];
      const step: number = part.step ?? STEP_MM;
      const gap: number = part.gap ?? GAP_MM;
      const domain: [number, number] = part.domain === "auto" ? span(source.body, axis, part.centres) : part.domain;
      log("family-body-domain", { part: part.name, domain });
      for (let s: number = domain[0], i: number = 0; s <= domain[1] + 1e-9; s += step / 2, ++i) {
        const cut: R.ICut = R.cut(source.body, axis.at(s));
        if (cut.loop === null) skipped.push(s);
        else {
          // The family is the tape wall: it reads the section's convex hull. How far the skin lies inside that hull is measured apart, as relief.
          const wall: C.P[] = R.hull(cut.loop);
          rows.push({ s, points: wall, heldout: i % 2 === 1 });
          skins.push(cut.loop);
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
      const attempt = (knots: number[], layout: C.ILayout, initial: number[][] | undefined, note: string, power: number = 4): F.IResult => {
        const result: F.IResult = F.fit(rows, knots, layout, power, initial);
        const row = { note, fields: result.layout.anchors.length === 0 ? 0 : C.units(layout).length, knots: knots.length, scalars: knots.length * (1 + C.units(layout).length), trainMaxMm: round(result.training.maximumMm), trainMeanMm: round(result.training.meanMm), heldMaxMm: round(result.heldout.maximumMm), heldMeanMm: round(result.heldout.meanMm), fault: result.fault, ms: Math.round(result.milliseconds) };
        trail.push(row);
        log("family-body-candidate", { part: part.name, ...row });
        return result;
      };
      for (const { layout, depth } of part.layouts) {
        // A deeper layout starts from the shallower one's final knots and values, cut exactly at every arc's median.
        const knots0: number[] = best === null ? [domain[0], (domain[0] + domain[1]) / 2, domain[1]] : [...best.knots];
        let result: F.IResult = attempt(knots0, layout, best === null ? undefined : F.refine(best.values, depth - 1), "depth " + depth);
        while (result.fault === null && result.training.maximumMm > 0.9 * TARGET_MM) {
          const open: F.IResult["rows"] = result.rows.filter((r: F.IResult["rows"][number]): boolean => !r.heldout && r.maximumMm > 0.9 * TARGET_MM && result.knots.every((k: number): boolean => Math.abs(k - r.s) >= gap)).sort((a, b) => b.maximumMm - a.maximumMm);
          const added: number[] = [];
          for (const r of open) if (added.length < 4 && added.every((s: number): boolean => Math.abs(s - r.s) >= 2 * gap)) added.push(r.s);
          if (added.length === 0) break;
          const next: number[] = [...result.knots, ...added].sort((a: number, b: number): number => a - b);
          const trial: F.IResult = attempt(next, layout, F.resample(result.values, result.knots, next), "grow");

          // More knots that move neither the mean nor the maximum by 3 % are not kept: what remains is not the station splines' to follow.
          if (trial.fault !== null || (trial.training.meanMm > 0.97 * result.training.meanMm && trial.training.maximumMm > 0.97 * result.training.maximumMm)) break;
          result = trial;
        }
        if (result.fault === null && (best === null || result.training.maximumMm < 0.97 * best.training.maximumMm || result.training.meanMm < 0.9 * best.training.meanMm)) best = result;
        if (best !== null && best.training.maximumMm <= 0.9 * TARGET_MM) break;
      }

      // Prune: drop every knot whose removal keeps the maximum and the mean within 3 % and 5 % of the grown family.
      if (best !== null) {
        const limitMax: number = Math.max(0.9 * TARGET_MM, 1.03 * best.training.maximumMm);
        const limitMean: number = 1.05 * best.training.meanMm;
        for (let k: number = best.knots.length - 2; k >= 1; --k) {
          const next: number[] = best.knots.filter((_: number, i: number): boolean => i !== k);
          // Trials run one plain least-squares pass; the kept family is refitted with the reweighted passes afterwards.
          const trial: F.IResult = attempt(next, best.layout, F.resample(best.values, best.knots, next), "prune", 2);
          if (trial.fault === null && trial.training.maximumMm <= limitMax && trial.training.meanMm <= limitMean) best = trial;
        }
        const polished: F.IResult = attempt(best.knots, best.layout, best.values, "polish");
        if (polished.fault === null && polished.training.maximumMm <= best.training.maximumMm) best = polished;
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

      // Reliefs: fitted on the stored wall, so they also absorb what the wall leaves inside their windows.
      {
        const read: (s: number) => number[] = K.reader(definition);
        const course: AutoMovieViewAxis.IAxis = K.axis(definition);
        const windows: H.IWindow[] = part.reliefs === "auto" ? hollowWindows(part.name, rows, skins, course) : part.reliefs;
        definition.reliefs = [];
        for (const window of windows) {
          const fitted: H.IResult = H.fit(window, rows.map((row: F.IRow, i: number): H.IRow => {
            const section: Q.ISection = C.chain(read(row.s), definition.layout);
            const frame: AutoMovieLoftFrame.IFrame = course.at(row.s);
            return { s: row.s, skin: skins[i]!, heldout: row.heldout, wall: (phi: number): C.P => { const r: number = Q.radius(section, phi); return [r * Math.cos(phi), r * Math.sin(phi)]; }, axis: [window.axis[0] * frame.u[0] + window.axis[1] * frame.u[1] + window.axis[2] * frame.u[2], window.axis[0] * frame.v[0] + window.axis[1] * frame.v[1] + window.axis[2] * frame.v[2]] };
          }));
          definition.reliefs.push(fitted.relief);
          log("family-body-relief", { part: part.name, relief: window.name, scalars: fitted.scalars, deepestMm: round(fitted.deepestMm), trainMaxMm: round(fitted.trainMaxMm), heldMaxMm: round(fitted.heldMaxMm) });
        }
        await fs.writeFile(path.join(out, part.name + ".family.json"), JSON.stringify(definition));
      }
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
      const worstRows: string[] = [];
      rows.forEach((row: F.IRow, i: number): void => {
        // The regenerated section as a dense chart polyline; every observed skin vertex is measured to it.
        const frame: AutoMovieLoftFrame.IFrame = stage.at(row.s);
        const ring: C.P[] = Array.from({ length: 512 }, (_: unknown, j: number): C.P => {
          const p: R.V = AutoMovieLoftChain.point(chain, row.s, (2 * Math.PI * j) / 512) as R.V;
          const d: R.V = [p[0] - frame.origin[0], p[1] - frame.origin[1], p[2] - frame.origin[2]];
          return [d[0] * frame.u[0] + d[1] * frame.u[1] + d[2] * frame.u[2], d[0] * frame.v[0] + d[1] * frame.v[1] + d[2] * frame.v[2]];
        });
        let rowMaximum: number = 0;
        let rowPhase: number = 0;
        for (const vertex of skins[i]!) {
          const e: number = distance(vertex, ring);
          if (e > rowMaximum) {
            rowMaximum = e;
            rowPhase = Math.atan2(vertex[1], vertex[0]);
          }
          sum += e;
          ++n;
        }
        maximum = Math.max(maximum, rowMaximum);
        if (rowMaximum > TARGET_MM && i % 4 === 0) worstRows.push(row.s.toFixed(0) + ":" + rowMaximum.toFixed(1) + "@" + ((rowPhase * 180) / Math.PI).toFixed(0));
      });
      log("family-body-skin", { part: part.name, over: worstRows.join(" ") });
      const engine = { storedBytes: Buffer.byteLength(stored), fields: best.values.length, knots: best.knots.length, scalars: best.knots.length * (1 + best.values.length), fitTrainMaxMm: round(best.training.maximumMm), fitHeldMaxMm: round(best.heldout.maximumMm), engineMaxMm: round(maximum), engineMeanMm: round(sum / n), loftMs: Math.round(loftMs), diagnostics: loft.diagnostics };
      log("family-body-engine", { part: part.name, ...engine });
      receipt.push({ part: part.name, domainMm: domain, sections: rows.length, skipped, trail, engine });

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

      // The authored module: the same definition as TypeScript, written beside the receipt and, with --emit, into the Human package.
      const moduleText: string = emit({ ...part, domain }, definition, C.units(definition.layout).length === C.units(C.limb(0)).length ? 0 : 1, engine, rows.length);
      await fs.writeFile(path.join(out, moduleName(part.name) + ".ts"), moduleText);
      if (process.argv.includes("--emit")) await fs.writeFile(path.join(root, "packages/human/src/generation/f1", moduleName(part.name) + ".ts"), moduleText);
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

  /**
   * Relief windows over every run of sections where the skin lies deeper
   * inside the stored wall than the target: the run's stations and the
   * phases of its deep vertices, each widened so the net's three zero rings
   * stand on skin that needs no height, with the axis the inward radial
   * direction at the run's middle.
   */
  function hollowWindows(name: string, rows: readonly F.IRow[], skins: readonly C.P[][], course: AutoMovieViewAxis.IAxis): H.IWindow[] {
    const deep: { s: number; phases: number[] }[] = rows.map((row: F.IRow, i: number): { s: number; phases: number[] } => {
      // Depth below the tape hull, not below the fitted wall: the wall's own misfit is not a hollow.
      return { s: row.s, phases: skins[i]!.map((p: C.P): number => Math.atan2(p[1], p[0])).filter((phi: number, k: number): boolean => C.radius(row.points, phi) - Math.hypot(skins[i]![k]![0], skins[i]![k]![1]) > 0.6 * TARGET_MM) };
    });
    const windows: H.IWindow[] = [];
    let run: { s: number; phases: number[] }[] = [];
    const close = (): void => {
      if (run.length >= 2) {
        const all: number[] = run.flatMap((r: { s: number; phases: number[] }): number[] => r.phases);
        const centre: number = Math.atan2(all.reduce((sum: number, phi: number): number => sum + Math.sin(phi), 0), all.reduce((sum: number, phi: number): number => sum + Math.cos(phi), 0));
        const offsets: number[] = all.map((phi: number): number => Math.atan2(Math.sin(phi - centre), Math.cos(phi - centre)));
        const from: number = centre + Math.min(...offsets) - 0.45;
        const to: number = centre + Math.max(...offsets) + 0.45;
        const stations: [number, number] = [run[0]!.s - 30, run.at(-1)!.s + 30];
        const frame: AutoMovieLoftFrame.IFrame = course.at((stations[0] + stations[1]) / 2);
        const axis: [number, number, number] = [0, 1, 2].map((c: number): number => -(Math.cos(centre) * frame.u[c]! + Math.sin(centre) * frame.v[c]!)) as [number, number, number];
        windows.push({ name: name + ".hollow." + windows.length, stations, phases: [from, to], axis, rows: Math.max(7, Math.ceil((stations[1] - stations[0]) / 10) + 3), columns: Math.max(7, Math.ceil((to - from) / 0.15) + 3), mirror: false });
      }
      run = [];
    };
    for (const row of deep) {
      if (row.phases.length === 0) {
        if (run.length > 0 && row.s - run.at(-1)!.s > 16) close();
        continue;
      }
      run.push(row);
    }
    close();
    return windows;
  }

  /** Module and constant name of a part's authored family. */
  function moduleName(part: string): string {
    return "AutoMovieHumanF1" + part.split(".").map((word: string): string => word[0]!.toUpperCase() + word.slice(1)).join("");
  }

  /**
   * The station interval a part can be fitted on: the longest run of stations, 1 mm apart along the course, whose cut is one
   * loop round the course with an area at most twice the median of the course's outer half. Where the part runs into its
   * parent the loop takes the parent in and its area jumps, which ends the run.
   */
  function span(mesh: R.ISource["body"], axis: AutoMovieViewAxis.IAxis, centres: readonly R.V[]): [number, number] {
    let length: number = 0;
    for (let i: number = 1; i < centres.length; ++i) length += Math.hypot(centres[i]![0] - centres[i - 1]![0], centres[i]![1] - centres[i - 1]![1], centres[i]![2] - centres[i - 1]![2]);
    const areas: (number | null)[] = [];
    for (let s: number = 0; s <= length; ++s) {
      const loop: C.P[] | null = R.cut(mesh, axis.at(s)).loop;
      areas.push(loop === null ? null : R.area(loop));
    }
    const outer: number[] = areas.slice(Math.floor(areas.length / 2)).filter((a: number | null): a is number => a !== null).sort((a: number, b: number): number => a - b);
    const limit: number = 2 * (outer[Math.floor(outer.length / 2)] ?? Infinity);
    let best: [number, number] = [0, 0];
    let from: number = -1;
    for (let s: number = 0; s <= areas.length; ++s) {
      const good: boolean = s < areas.length && areas[s] !== null && areas[s]! <= limit;
      if (good && from < 0) from = s;
      if (!good && from >= 0) {
        if (s - 1 - from > best[1] - best[0]) best = [from, s - 1];
        from = -1;
      }
    }

    // Stand off both ends: the parent's blend at the root and the vanishing loop at the tip are not the tube's.
    return [best[0] + 2, best[1] - 3];
  }

  /** What each field of a layout holds, in field order, for the authored table's row comments. */
  function labels(layout: C.ILayout): string[] {
    const out: string[] = [];
    const guides: string[] = ["front (+u)", "side (+v)", "back (-u)", "side (-v)"];
    let guide: number = 0;
    layout.anchors.forEach((anchor: C.IAnchor, k: number): void => {
      if (anchor.kind === "m") out.push("median fullness f of the arc pair around anchor " + k + ", share");
      else if (anchor.kind === "i") out.push("inflection place t on its chord, share", "inflection tangent turn from the chord, rad");
      else {
        const name: string = anchor.guide === true ? guides[guide++ % 4]! + " extreme" : "anchor " + k;
        out.push(name + ": u, mm");
        if (anchor.mid !== true) out.push(name + ": v, mm");
      }
    });
    const arcs: number = layout.mirror ? layout.anchors.length - 1 : layout.anchors.length;
    for (let k: number = 0; k < arcs; ++k) out.push("shoulder rho of the arc after anchor " + k + ", share");
    return out;
  }

  /** The authored TypeScript module of a fitted family, with its frame, units, source and measured receipt in its comment. */
  function emit(part: IPart & { domain: [number, number] }, family: K.IStored, depth: number, engine: { engineMaxMm: number; engineMeanMm: number; scalars: number }, sections: number): string {
    const name: string = moduleName(part.name);
    const names: string[] = labels(family.layout);
    const lines: string[] = [
      "import type { AutoMovieHumanConicLoft } from \"../conic/AutoMovieHumanConicLoft\";",
      "import { AutoMovieHumanConicSection } from \"../conic/AutoMovieHumanConicSection\";",
      "",
      "/**",
      " * f1's " + part.name + " tape wall" + (part.mirrored ? " on the +Z side; the other side is its mirror image in the median plane z = 0, which f1's reference satisfies exactly" : "") + ".",
      " *",
      " * Frame: the figure's absolute reference pose, millimetres, forward +X, up +Y, +Z the reference's left. The course runs",
      " * through `centres` with a turn of half length `halves` at each joint; stations are arclength from the first centre and each",
      " * section lies in the plane normal to the course, charted by `u` (carried from `up` by the course's rotations) and `v`.",
      " *",
      " * Every row of `values` is one section field of `AutoMovieHumanConicSection` at the shared `knots`, a natural cubic between",
      " * them: the section is a chain of conics through its four extremes" + (depth > 0 ? " and one median point per quarter" : "") + ", fitted to the convex hull of the reference skin",
      " * (the path of a taut tape).",
      " *",
      " * Source: the f1 reference body cut by this course's own planes over stations " + part.domain[0] + " to " + part.domain[1] + " mm, " + sections + " sections " + (part.step ?? STEP_MM) / 2 + " mm apart, every",
      " * second one withheld from the fit. Fitted offline by `test/src/reference-conics/FamilyConicBody.ts` (joint least squares over",
      " * all sections). Regenerated through the engine's view loft from these numbers alone, the reference skin's cut vertices lie",
      " * " + engine.engineMeanMm + " mm from it on average and at most " + engine.engineMaxMm + " mm. " + engine.scalars + " independent numbers.",
      " */",
      "export const " + name + ": AutoMovieHumanConicLoft.IFamily = {",
      "  name: " + JSON.stringify(family.name) + ",",
      "  centres: " + JSON.stringify(family.centres).replaceAll(",", ", ") + ",",
      "  halves: " + JSON.stringify(family.halves) + ",",
      "  up: " + JSON.stringify(family.up).replaceAll(",", ", ") + ",",
      "  layout: AutoMovieHumanConicSection.limb(" + depth + "),",
      "  knots: " + JSON.stringify(family.knots).replaceAll(",", ", ") + ",",
      "  values: [",
    ];
    family.values.forEach((field: number[], f: number): void => {
      lines.push("    // " + names[f], "    " + JSON.stringify(field).replaceAll(",", ", ") + ",");
    });
    lines.push("  ],");
    if (family.reliefs !== undefined && family.reliefs.length > 0) {
      lines.push("", "  // Reliefs: heights in mm of a uniform cubic B-spline net over a window of the wall's chart, moved along `axis`; they carry the skin that lies inside the tape wall.", "  reliefs: [");
      for (const relief of family.reliefs) lines.push("    " + JSON.stringify({ ...relief, phases: relief.phases.map(round4), axis: relief.axis.map((x: number): number => Math.round(x * 1e5) / 1e5) }).replaceAll(",", ", ") + ",");
      lines.push("  ],");
    }
    lines.push("};", "");
    return lines.join("\n");
  }

  /** Distance from a chart point to a closed polyline, mm. */
  function distance(p: C.P, ring: readonly C.P[]): number {
    let best: number = Infinity;
    for (let i: number = 0; i < ring.length; ++i) {
      const a: C.P = ring[i]!;
      const b: C.P = ring[(i + 1) % ring.length]!;
      const dx: number = b[0] - a[0];
      const dy: number = b[1] - a[1];
      const t: number = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
      best = Math.min(best, Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy));
    }
    return best;
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
