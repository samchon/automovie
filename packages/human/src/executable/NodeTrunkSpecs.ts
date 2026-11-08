import { AutoMovieLoftJet, AutoMovieLoftRelief, type IAutoMovieLoftRelief } from "@automovie/engine";
import fs from "node:fs";
import path from "node:path";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import type { IAutoMovieHumanBodyMeasures } from "../generation/IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanTrunkComposedSection } from "../generation/trunk/AutoMovieHumanTrunkComposedSection";
import { AutoMovieHumanTrunkGlutealContour } from "../generation/trunk/AutoMovieHumanTrunkGlutealContour";
import type { AutoMovieHumanTrunkMound } from "../generation/trunk/AutoMovieHumanTrunkMound";
import { AutoMovieHumanTrunkNeckBase } from "../generation/trunk/AutoMovieHumanTrunkNeckBase";
import { AutoMovieHumanTrunkPelvisSplit } from "../generation/trunk/AutoMovieHumanTrunkPelvisSplit";
import { AutoMovieHumanTrunkPorts } from "../generation/trunk/AutoMovieHumanTrunkPorts";
import { AutoMovieHumanTrunkS00 } from "../generation/trunk/AutoMovieHumanTrunkS00";
import { AutoMovieHumanTrunkSpecLandmarks } from "../generation/trunk/AutoMovieHumanTrunkSpecLandmarks";
import type { AutoMovieHumanTrunkViewCurves } from "../generation/trunk/AutoMovieHumanTrunkViewCurves";
import type { AutoMovieHumanTrunkViewLoft } from "../generation/trunk/AutoMovieHumanTrunkViewLoft";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeArmDraw } from "./NodeArmDraw";
import { NodeTrunkDraw } from "./NodeTrunkDraw";
import { NodeTrunkReference } from "./NodeTrunkReference";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * Direct Node images of the trunk (S00) for f1, following the arm
 * renderer's pattern (`node:arm-specs`), in four stages: (1) the frames,
 * landmarks and 2D view curves with their construction aids over the
 * reference trunk registered by its own jugular notch (diagnostic only),
 * each view curve also alone; (2) the engine loft's curves (layer rings,
 * guides); (3) those curves over the default clay; (4) the clay alone; at
 * front, left, back, top and oblique cameras. A manifest keeps the measures,
 * landmarks, gaps, sites, outlines, the registration's measures and the
 * constructor timings (cold, retained, one-input edit).
 */
export namespace NodeTrunkSpecs {
  /** Draws every stage and camera and writes PNGs plus a manifest under `.shots/f1_trunk/trunk-<stamp>/`. */
  export async function run(): Promise<void> {
    const started: number = performance.now();
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    const measures: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(person.parameters);
    const feet: { left: { ankleHeight: number } } | undefined = person.parameters.extremities?.feet;
    const ankle: number = feet?.left.ankleHeight ?? 0.0385 * measures.stature;
    const crotch: number = measures.inseam + ankle;
    const loaded: number = performance.now();

    const cold: IBuild = build(person.parameters, measures);

    // The constructor's own readings first, so a failed drawing still leaves them.
    const gluteal: AutoMovieHumanTrunkGlutealContour.IOutput = AutoMovieHumanTrunkGlutealContour.of(cold.curves, measures);
    const contour: { y: number; right: V3; lateral: number }[] = [];
    for (let y: number = gluteal.fold; y <= gluteal.buttock + 1e-9; y += 10) contour.push({ y, right: gluteal.right.at(y), lateral: gluteal.lateral(y) });
    // The ISO neck-base tape taut (bridging) and held on the skin, with the
    // least tape the four points allow: the end's level back half plus the
    // two straight SNP-IJ chords.
    const ijY: number = AutoMovieHumanArmCurveSpec.apply(cold.frames.world("thorax"), [0, 0, 0])[1];
    const tape: AutoMovieHumanTrunkNeckBase.ITape = AutoMovieHumanTrunkNeckBase.tape(cold.curves.source, cold.curves.axis.xs, cold.curves.top, ijY);
    const skin: AutoMovieHumanTrunkNeckBase.ITape = AutoMovieHumanTrunkNeckBase.tape(cold.curves.source, cold.curves.axis.xs, cold.curves.top, ijY, false);
    const endRing: V3[] = AutoMovieHumanTrunkNeckBase.of(cold.frames, cold.curves, measures.neckBaseCircumference, AutoMovieHumanArmCurveSpec.apply(cold.frames.world("thorax"), [0, 0, 0])).ring(256);
    let backHalf: number = 0;
    for (let k: number = 64; k < 192; ++k) backHalf += Math.hypot(...([0, 1, 2].map((i: number): number => endRing[k + 1]![i]! - endRing[k]![i]!) as [number, number, number]));
    const span: number = tape.points.length / 4;
    const chord: number = Math.hypot(...([0, 1, 2].map((i: number): number => tape.points[span]![i]! - tape.points[2 * span]![i]!) as [number, number, number]));
    console.log(JSON.stringify({ carries: cold.chain === null ? null : AutoMovieLoftJet.carries(cold.chain), gluteal: contour, tape: { taut: tape.girth, legs: tape.legs, lift: tape.lift, sweeps: tape.sweeps, skin: skin.girth, skinLegs: skin.legs, skinSweeps: skin.sweeps, input: measures.neckBaseCircumference, bound: { backHalf, chord, least: backHalf + 2 * chord } }, path: tape.points.filter((_: V3, k: number): boolean => k % 8 === 0) }));
    // The breast's undercut traced down the right breast's meridian (its apex phase), every 4 mm from
    // 20 mm above the apex to 40 mm below the fold: the wall alone (radius and world X) and the relief.
    const breastSpec: AutoMovieHumanTrunkMound.ISpec | undefined = cold.curves.mounds.find((m: AutoMovieHumanTrunkMound.ISpec): boolean => m.name === "breast.right");
    const breastRelief: IAutoMovieLoftRelief | undefined = cold.curves.source.reliefs.find((r: IAutoMovieLoftRelief): boolean => r.name === "breast.right");
    if (breastSpec !== undefined && breastRelief !== undefined) {
      const rows: number[][] = [];
      const round: (x: number) => number = (x: number): number => Math.round(x * 10) / 10;
      for (let y: number = breastSpec.station + 20; y >= breastSpec.station - breastSpec.extents.down - 40; y -= 4) {
        const wall: number = AutoMovieHumanTrunkComposedSection.radius(cold.curves.source, y, breastSpec.phase);
        const h: number = AutoMovieLoftRelief.height(breastRelief, y, breastSpec.phase)[0];
        const axis: number = cold.curves.source.axis?.(y) ?? cold.curves.axis.xs;
        rows.push([round(y - breastSpec.station), round(wall), round(axis + wall * Math.cos(breastSpec.phase)), round(h)]);
      }
      console.log(JSON.stringify({ breast: { phase: breastSpec.phase, down: breastSpec.extents.down, columns: ["dy from apex", "wall radius", "wall X", "relief"], rows } }));
    }
    console.log(JSON.stringify({ neck: cold.curves.neck, back:{ ...cold.curves.back, published: undefined }, sites: cold.curves.sites, mounds:cold.curves.mounds.map((m: { name: string; station: number; projection: number; extents: unknown }): unknown => ({ name: m.name, station: m.station, projection: m.projection, extents: m.extents })), diagnostics: cold.curves.diagnostics, iterations: cold.curves.iterations, ms: cold.ms }));
    const retained: IBuild = build(person.parameters, measures);
    const edited: IBuild = build(person.parameters, { ...measures, waistCircumference: measures.waistCircumference + 10 });
    const at: (n: string) => V3 = (n: string): V3 => {
      const l: AutoMovieHumanTrunkSpecLandmarks.ILandmark = AutoMovieHumanTrunkSpecLandmarks.get(cold.landmarks, n);
      return AutoMovieHumanArmCurveSpec.apply(cold.frames.world(l.frame), l.point);
    };
    const reference: NodeTrunkReference.IRegistered = NodeTrunkReference.register(NodeTrunkReference.load(1), { ij: at("IJ"), c7: at("C7") });

    const stamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_trunk/trunk-${stamp}`);
    fs.mkdirSync(out, { recursive: true });
    const files: string[] = [];
    const write: (name: string, v: NodeArmDraw.IView) => void = (name: string, v: NodeArmDraw.IView): void => {
      fs.writeFileSync(path.join(out, name), NodeArmDraw.png(v));
      files.push(name);
    };
    const drawStart: number = performance.now();
    // A chain that cannot be read draws no clay; its error stays in the manifest.
    const drawErrors: string[] = [];
    let mesh: [V3, V3, V3][] = [];
    try {
      mesh = NodeTrunkDraw.triangles(cold.chain);
    } catch (error: unknown) {
      drawErrors.push(`clay: ${error instanceof Error ? error.message : String(error)}`);
      cold.chain = null;
    }
    // The acromia against S00 (f1_arm's finding 2026-11-08): the source's lateral extent and course X at
    // each acromion's height, and the clay's widest point within 1 mm of that height with its X.
    const acromia: Record<string, number[]> = {};
    for (const side of ["left", "right"] as const) {
      const a: V3 = at(`acromion.${side}`);
      let widest: V3 = [NaN, NaN, 0];
      for (const tri of mesh) for (const p of tri) if (Math.abs(p[1] - a[1]) <= 1 && Math.sign(p[2]) === Math.sign(a[2]) && Math.abs(p[2]) > Math.abs(widest[2])) widest = p;
      const round: (x: number) => number = (x: number): number => Math.round(x * 100) / 100;
      acromia[side] = [a[0], a[1], a[2], cold.curves.source.axis?.(a[1]) ?? cold.curves.axis.xs, AutoMovieHumanTrunkComposedSection.read(cold.curves.source.lateral, a[1]), widest[0], widest[2]].map(round);
    }
    console.log(JSON.stringify({ acromia: { columns: ["landmark x", "y", "z", "course x", "source lateral", "clay widest x", "clay widest z"], ...acromia } }));
    // The shoulder ports on the S00 chart (parent sides of the bands) and the
    // pelvis split (each leg's half of S00's open bottom plus the seam).
    let ports: AutoMovieHumanTrunkPorts.IPort[] = [];
    let split: AutoMovieHumanTrunkPelvisSplit.IOutput | null = null;
    const portStart: number = performance.now();
    try {
      const s00: AutoMovieHumanTrunkS00.IOutput = AutoMovieHumanTrunkS00.of(person.parameters, measures);
      const built: AutoMovieHumanTrunkPorts.IOutput | null = AutoMovieHumanTrunkPorts.create(s00);
      if (built === null) drawErrors.push("ports: S00 has no solid surface");
      else {
        ports = [built.shoulders.left, built.shoulders.right];
        split = AutoMovieHumanTrunkPelvisSplit.of(s00, built.field);
      }
    } catch (error: unknown) {
      drawErrors.push(`ports: ${error instanceof Error ? error.message : String(error)}`);
    }
    const portMs: number = performance.now() - portStart;
    const neckBase: AutoMovieHumanTrunkNeckBase.IOutput = AutoMovieHumanTrunkNeckBase.of(cold.frames, cold.curves, measures.neckBaseCircumference, at("IJ"));
    const neckLoop: V3[] = neckBase.loop(256);
    const drawPorts: (v: NodeArmDraw.IView) => void = (v: NodeArmDraw.IView): void => {
      for (const p of ports) {
        const ring: V3[] = Array.from({ length: 129 }, (_: unknown, k: number): V3 => p.curve((2 * Math.PI * k) / 128));
        NodeArmDraw.line(v, ring, "#ff6a00", 3);
        NodeArmDraw.dots(v, [ring[0]!], "#000000", 6);
        NodeArmDraw.text(v, ring[32]!, `${p.name} c=pi/2`, "#a04000");
      }
      if (split !== null) {
        for (const [half, colour] of [[split.left, "#0070c0"], [split.right, "#c00070"]] as const) {
          const points: V3[] = Array.from({ length: 97 }, (_: unknown, k: number): V3 => half.curve(half.interval[0] + ((half.interval[1] - half.interval[0]) * k) / 96));
          NodeArmDraw.line(v, points, colour, 3);
          NodeArmDraw.text(v, points[48]!, `${half.side} leg root (S00 bottom half)`, colour);
        }
        NodeArmDraw.line(v, [split.seam.front, split.seam.back], "#202020", 2.5, [6, 3]);
        NodeArmDraw.dots(v, [split.seam.crotch], "#000000", 7);
      }
      NodeArmDraw.line(v, [...neckLoop, neckLoop[0]!], "#00a050", 2.5);
      NodeArmDraw.text(v, neckLoop[0]!, `ISO neck-base loop ${neckBase.girth.loop.toFixed(1)} / ${neckBase.girth.input.toFixed(1)} mm`, "#00703a");
    };
    const bounds: V3[] = [...reference.trunk.filter((_: V3, i: number): boolean => i % 5 === 0), [0, cold.curves.bottom, 0], [0, cold.curves.top, 0]];
    for (const p of ports) {
      const centre: V3 = p.curve(0).map((_: number, k: number): number => (p.curve(0)[k]! + p.curve(Math.PI)[k]!) / 2) as V3;
      const out: V3 = [Math.cos(p.centre[1]), 0, Math.sin(p.centre[1])];
      const views: [string, V3][] = [["side", [-out[0], 0, -out[2]]], ["high", [-out[0], -0.8, -out[2]]]];
      for (const [label, forward] of views)
        for (const stage of [3, 4] as const) {
          const r: number = 160;
          const v: NodeArmDraw.IView = NodeArmDraw.open(forward, [NodeArmDraw.add(centre, [-r, -r, -r]), NodeArmDraw.add(centre, [r, r, r])]);
          NodeArmDraw.clay(v, mesh);
          if (stage === 3) NodeTrunkDraw.loft(v, cold);
          drawPorts(v);
          NodeArmDraw.caption(v, [`f1 trunk S00 port ${p.name}, ${label}, stage ${stage}: ${stage === 3 ? "loft curves" : "clay"} + port curve (orange; dot at c = 0, the top)`]);
          write(`port.${p.name}.${label}.${stage}.png`, v);
        }
    }
    for (const [camera, forward] of CAMERAS)
      for (const stage of [1, 2, 3, 4] as const) {
        const v: NodeArmDraw.IView = NodeArmDraw.open(forward, bounds);
        if (stage <= 2) NodeArmDraw.dots(v, every(reference.trunk, 2), "#d4d4d4", 1.6);
        if (stage <= 2 && camera === "top") for (const site of cold.curves.sites) NodeTrunkDraw.referenceCut(v, reference, site.y);
        if (stage === 1 && camera !== "top") drawMidline(v, reference);
        if (stage >= 3) NodeArmDraw.clay(v, mesh);
        if (stage >= 3) drawPorts(v);
        if (stage === 1) {
          drawFrames(v, cold);
          NodeTrunkDraw.specs(v, cold, "all");
        }
        if (stage === 2 || stage === 3) NodeTrunkDraw.loft(v, cold);
        NodeArmDraw.caption(v, [`f1 trunk S00, ${camera}, stage ${stage}: ${STAGES[stage - 1]}`]);
        write(`s00.${camera}.${stage}.png`, v);
      }
    for (const [curve, cameras] of INDIVIDUAL)
      for (const camera of cameras) {
        const v: NodeArmDraw.IView = NodeArmDraw.open(CAMERAS.find((c: [string, V3]): boolean => c[0] === camera)![1], bounds);
        NodeArmDraw.dots(v, every(reference.trunk, 2), "#d4d4d4", 1.6);
        if (camera === "top") for (const site of cold.curves.sites) NodeTrunkDraw.referenceCut(v, reference, site.y);
        else drawMidline(v, reference);
        NodeTrunkDraw.specs(v, cold, curve);
        NodeArmDraw.caption(v, [`f1 trunk S00, ${camera}, stage 1 alone: ${curve} view curve + aids over the registered reference (grey; dark grey its midline cut, mid grey its level cuts)`]);
        write(`s00.1.${curve}.${camera}.png`, v);
      }
    // S00's clay (left of each frame) beside the registered reference's trunk clay (right, shifted 420 mm
    // along the camera's right axis), same camera and light, from seven directions: the volumes compared
    // by eye (owner, 2026-11-08).
    const refTriangles: [V3, V3, V3][] = NodeTrunkReference.trunkTriangles(reference);
    for (const [camera, forward] of PAIRS) {
      const f: V3 = NodeArmDraw.scale(forward, 1 / Math.hypot(...forward));
      const up0: V3 = Math.abs(f[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
      const r0: V3 = NodeArmDraw.cross(f, up0);
      const right: V3 = NodeArmDraw.scale(r0, 1 / Math.hypot(...r0));
      const shift: V3 = NodeArmDraw.scale(right, 420);
      const shifted: [V3, V3, V3][] = refTriangles.map((t: [V3, V3, V3]): [V3, V3, V3] => [NodeArmDraw.add(t[0], shift), NodeArmDraw.add(t[1], shift), NodeArmDraw.add(t[2], shift)]);
      const box: V3[] = [...mesh.filter((_: [V3, V3, V3], i: number): boolean => i % 7 === 0).map((t: [V3, V3, V3]): V3 => t[0]), ...shifted.filter((_: [V3, V3, V3], i: number): boolean => i % 7 === 0).map((t: [V3, V3, V3]): V3 => t[0])];
      const v: NodeArmDraw.IView = NodeArmDraw.open(forward, box);
      NodeArmDraw.clay(v, mesh);
      NodeArmDraw.clay(v, shifted);
      NodeArmDraw.caption(v, [`f1 trunk S00 clay (left) beside the registered reference trunk (right), ${camera}`]);
      write(`pair.${camera}.png`, v);
    }
    const drawn: number = performance.now();

    fs.writeFileSync(
      path.join(out, "manifest.json"),
      JSON.stringify(
        {
          person: "f1",
          measures,
          ankle,
          crotch,
          frames: { pelvis: cold.frames.pelvis, thorax: cold.frames.thorax, hips: cold.frames.hips, heights: cold.frames.heights, gaps: cold.frames.gaps },
          landmarks: cold.landmarks.list.map((l: AutoMovieHumanTrunkSpecLandmarks.ILandmark): { name: string; world: V3 } => ({ name: l.name, world: AutoMovieHumanArmCurveSpec.apply(cold.frames.world(l.frame), l.point) })),
          gaps: cold.landmarks.gaps,
          sites: cold.curves.sites,
          mounds: cold.curves.mounds,
          outlines: cold.curves.outlines,
          fullness: cold.curves.fullness,
          departures: cold.curves.departures[0],
          neck: cold.curves.neck,
          backLine: cold.curves.back,
          iterations: cold.curves.iterations,
          lengths: { ...cold.curves.lengths, crotchInput: measures.crotchLength, posteriorInput: measures.posteriorCrotchLength },
          axis: { xs: cold.curves.axis.xs, turnStart: cold.curves.axis.turn.start, turnLength: cold.curves.axis.turn.length, top: cold.curves.axis.turn.top, theta: cold.curves.axis.turn.theta, centre: cold.curves.axis.turn.centre },
          neckBase: ((n: AutoMovieHumanTrunkNeckBase.IOutput): Omit<AutoMovieHumanTrunkNeckBase.IOutput, "ring" | "loop"> => ({ station: n.station, plane: n.plane, normal: n.normal, origin: n.origin, extents: n.extents, shoulder: n.shoulder, girth: n.girth, basis: n.basis }))(neckBase),
          split: split === null ? null : { seam: split.seam, left: { interval: split.left.interval, station: split.left.station }, right: { interval: split.right.interval, station: split.right.station }, basis: split.basis },
          diagnostics: { curves: cold.curves.diagnostics, loft: cold.loft.loft.diagnostics, draw: drawErrors },
          ports: { milliseconds: portMs, list: ports.map((p: AutoMovieHumanTrunkPorts.IPort): Record<string, unknown> => ({ name: p.name, centre: p.centre, semi: p.semi, sense: p.sense, girth: p.girth, perimeter: p.perimeter, top: p.curve(0), front: p.curve(Math.PI / 2), bottom: p.curve(Math.PI), back: p.curve((3 * Math.PI) / 2), basis: p.basis })) },
          registration: reference.measures,
          comparison: compare(cold, reference),
          referenceMidline: { front: reference.midline.front.filter((r: [number, number]): boolean => r[0] % 10 === 0), back: reference.midline.back.filter((r: [number, number]): boolean => r[0] % 10 === 0) },
          timings: { loadMs: loaded - started, cold: cold.ms, retained: retained.ms, edit: edited.ms, drawMs: drawn - drawStart, totalMs: performance.now() - started },
          files,
        },
        null,
        2,
      ),
    );
    console.log(out);
  }

  /** Stage names. */
  const STAGES: string[] = ["frames, landmarks, view curves + aids over the registered reference", "engine loft curves", "loft curves over clay", "clay"];

  /** Cameras: name and viewing direction (world: +X anterior, +Y up, +Z subject's right). */
  const CAMERAS: [string, V3][] = [
    ["front", [-1, 0, 0]],
    ["left", [0, 0, 1]],
    ["back", [1, 0, 0]],
    ["top", [0, -1, 0]],
    ["oblique", [-1, -0.35, 0.8]],
    ["back-oblique", [1, 0.3, 0.8]],
    ["below", [0, 1, 0]],
  ];

  /** Side-by-side clay cameras (world: +X anterior, +Y up, +Z the subject's right; the subject's left is -Z). */
  const PAIRS: [string, V3][] = [
    ["front", [-1, 0, 0]],
    ["left", [0, 0, 1]],
    ["back", [1, 0, 0]],
    ["top", [0, -1, 0]],
    ["front-left-high", [-1, -0.6, 1]],
    ["front-left-low", [-1, 0.5, 1]],
    ["back-left", [1, 0, 1]],
    // From below, in front and to her left: the open bottom, its forks and the thigh lobes.
    ["bottom-oblique", [-0.6, 0.8, 0.6]],
  ];

  /** The individual stage-1 frames: each view curve kind at the cameras that see it. */
  const INDIVIDUAL: [NodeTrunkDraw.Curve, string[]][] = [
    ["lateral", ["front"]],
    ["anterior", ["left"]],
    ["posterior", ["left"]],
    ["fullness", ["top", "oblique"]],
    ["mounds", ["front", "left", "back"]],
  ];

  /** One build with its stage timings. */
  interface IBuild extends NodeTrunkDraw.IBuild {
    loft: AutoMovieHumanTrunkViewLoft.IOutput;
    ms: { datums: number; curves: number; loft: number; total: number };
  }

  /** One S00 build through the constructor every consumer calls (`AutoMovieHumanTrunkS00.of`), with its stage times. */
  function build(params: IAutoMovieHumanParameters, measures: IAutoMovieHumanBodyMeasures): IBuild {
    const s: AutoMovieHumanTrunkS00.IOutput = AutoMovieHumanTrunkS00.of(params, measures);
    return { frames: s.datums.frames, landmarks: s.datums.landmarks, curves: s.curves, loft: s.loft, chain: s.chain, ms: { datums: s.ms.datums, curves: s.ms.curves, loft: s.ms.loft, total: s.ms.total } };
  }

  /**
   * Ours against the registered reference at the girth sites and every 25 mm:
   * midline front and back, the extreme X, the half-width and the taut-tape
   * hull of the composed source section and of the reference's exact cut.
   */
  function compare(b: IBuild, r: NodeTrunkReference.IRegistered): { y: number; ours: Record<string, number>; reference: Record<string, number> }[] {
    const ys: number[] = [...b.curves.sites.map((s: AutoMovieHumanTrunkViewCurves.ISite): number => s.y)];
    for (let y: number = b.curves.bottom + 10; y < b.curves.axis.turn.start; y += 25) ys.push(y);
    ys.sort((x: number, y: number): number => x - y);
    const refs: NodeTrunkReference.ILevel[] = NodeTrunkReference.levels(r, ys, (p: readonly [number, number][]): number => AutoMovieHumanTrunkComposedSection.hull(p)[0]);
    return ys.map((y: number, i: number): { y: number; ours: Record<string, number>; reference: Record<string, number> } => {
      // A height whose source section is unreadable keeps NaN readings.
      let ring: [number, number][] = [[NaN, NaN]];
      try {
        ring = AutoMovieHumanTrunkComposedSection.ring(b.curves.source, y, 720);
      } catch {
        ring = [[NaN, NaN]];
      }
      const ref: NodeTrunkReference.ILevel = refs[i]!;
      const round: (x: number) => number = (x: number): number => Math.round(x * 10) / 10;
      return {
        y: round(y),
        ours: {
          front: round((b.curves.source.axis?.(y) ?? b.curves.axis.xs) + AutoMovieHumanTrunkComposedSection.read(b.curves.source.anterior, y)),
          back: round((b.curves.source.axis?.(y) ?? b.curves.axis.xs) + AutoMovieHumanTrunkComposedSection.read(b.curves.source.posterior, y)),
          maxX: round(Math.max(...ring.map((p: [number, number]): number => p[0]))),
          minX: round(Math.min(...ring.map((p: [number, number]): number => p[0]))),
          half: round(Math.max(...ring.map((p: [number, number]): number => Math.abs(p[1])))),
          hull: round(AutoMovieHumanTrunkComposedSection.hull(ring)[0]),
        },
        reference: { front: round(ref.front), back: round(ref.back), maxX: round(ref.maxX), minX: round(ref.minX), half: round(ref.half), hull: round(ref.hull) },
      };
    });
  }

  /** The reference's own mid-sagittal front and back cuts. */
  function drawMidline(v: NodeArmDraw.IView, r: NodeTrunkReference.IRegistered): void {
    const keep: (rows: [number, number][]) => V3[] = (rows: [number, number][]): V3[] => rows.filter(([y]: [number, number]): boolean => y > 650 && y < 1560).map(([y, x]: [number, number]): V3 => [x, y, 0]);
    NodeArmDraw.dots(v, keep(r.midline.front), "#606060", 2);
    NodeArmDraw.dots(v, keep(r.midline.back), "#606060", 2);
  }

  /** Frames as RGB axes, landmarks as ticks with names, and the bony chords. */
  function drawFrames(v: NodeArmDraw.IView, b: IBuild): void {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    for (const name of ["pelvis", "thorax"]) {
      const t: AutoMovieHumanArmCurveSpec.ITransform = b.frames.world(name);
      (["#d03030", "#30a030", "#3050d0"] as const).forEach((colour: string, k: number): void => {
        NodeArmDraw.line(v, [t.origin, NodeArmDraw.add(t.origin, NodeArmDraw.scale(t.axes[k]!, 60))], colour, 2.5);
      });
    }
    for (const l of b.landmarks.list) {
      if (l.kind !== "point") continue;
      const p: V3 = S.apply(b.frames.world(l.frame), l.point);
      NodeArmDraw.dots(v, [p], "#202020", 5);
      NodeArmDraw.text(v, p, l.name, "#505050");
    }
  }

  function every(points: V3[], k: number): V3[] {
    return points.filter((_: V3, i: number): boolean => i % k === 0);
  }
}

void NodeTrunkSpecs.run().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
