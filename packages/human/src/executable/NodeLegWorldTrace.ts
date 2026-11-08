import fs from "node:fs";
import path from "node:path";
import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanLegF1Lines } from "../generation/leg/AutoMovieHumanLegF1Lines";
import { AutoMovieHumanLegF1Rebase } from "../generation/leg/AutoMovieHumanLegF1Rebase";
import { AutoMovieHumanLegF1World } from "../generation/leg/AutoMovieHumanLegF1World";
import { AutoMovieHumanLegLandmarks } from "../generation/leg/AutoMovieHumanLegLandmarks";
import { AutoMovieHumanLegSegmentFrames } from "../generation/leg/AutoMovieHumanLegSegmentFrames";
import { AutoMovieHumanLegViewCurves } from "../generation/leg/AutoMovieHumanLegViewCurves";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeArmDraw } from "./NodeArmDraw";
import { NodeLegBuild } from "./NodeLegBuild";
import { NodeLegReference } from "./NodeLegReference";
import { NodeLegWhole } from "./NodeLegWhole";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;
type Label = AutoMovieHumanLegF1Rebase.Label;
type FootLabel = "lateral" | "medial" | "dorsal" | "heel";

/**
 * The world-match step for f1's leg (`ttsx src/executable/NodeLegWorldTrace.ts`):
 * her leg and foot 2D lines placed as absolute world points on her reference
 * in her own stance, the overlay frames that show them on it, the
 * `AutoMovieHumanLegF1World` source those points are written into, and the
 * re-base round trip (`AutoMovieHumanLegF1Rebase`) in her stance's frames.
 *
 * Every line point is a silhouette point of her surface in its view: in the
 * front view the most lateral and most medial point of the horizontal
 * section at the level, in the side view the most anterior and most
 * posterior; on the foot the most lateral, most medial and highest point of
 * the vertical section across the foot, and the heel's most posterior point
 * by height. Leg levels: the sites' own (the leg's landmarks) and every
 * 30 mm between them. Foot lines: sampled every 4 mm, each sample's free
 * coordinate the median of itself and its two neighbours (her mesh's
 * saw-toothed slices and hatching are single-sample steps), then reduced to
 * the fewest knots whose natural cubic passes every sample within 0.5 mm.
 * The front-ankle juncture: where her surface crosses the ray from IM in the
 * bisection plane of her shank and her foot course, toward the bend's inner
 * side (the talus' front).
 */
export namespace NodeLegWorldTrace {
  /** Trace, draw and write under `.shots/f1_leg/world-<stamp>/`. */
  export async function run(): Promise<void> {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    const inputs: NodeLegBuild.IInputs = NodeLegBuild.inputs(person.parameters);
    const frames: AutoMovieHumanLegSegmentFrames.IOutput = AutoMovieHumanLegSegmentFrames.create(inputs.frames);
    const landmarks: AutoMovieHumanLegLandmarks.IOutput = AutoMovieHumanLegLandmarks.create(frames, inputs.landmarks);
    const hip: V3 = [inputs.root.origin[0], inputs.root.origin[1], inputs.root.origin[2]];
    const side: 1 | -1 = hip[2] > 0 ? 1 : -1;
    // A level's height over the floor: its axis point's, the walk running down the femur axis to the knee centre, then down the shank (AutoMovieHumanLegSegmentFrames.IOutput.walk, whose inverse this is).
    const height: (name: string) => number = (name: string): number => {
      const walk: number = AutoMovieHumanLegLandmarks.get(landmarks, name).walk;
      const K: V3 = frames.points.knee;
      const femur: number = Math.hypot(K[0], K[1], K[2]);
      const shank: V3 = S.unit([frames.points.im[0] - K[0], frames.points.im[1] - K[1], frames.points.im[2] - K[2]]);
      return walk <= femur ? hip[1] + (K[1] / femur) * walk : hip[1] + K[1] + shank[1] * (walk - femur);
    };
    const mesh: { points: V3[]; indices: number[] } = NodeLegReference.loadMesh(inputs.scale, inputs.landmarks.crotch + 40, "left");
    const P: V3[] = mesh.points;
    const I: number[] = mesh.indices;

    // Her bone landmarks in her stance: the knee centre between the knee band's most lateral and most medial skin points (the epicondyles), IM between the malleoli's tips (ISB 2002).
    const band: (y: number) => V3[] = (y: number): V3[] => P.filter((p: V3): boolean => Math.abs(p[1] - y) < 3);
    const extreme: (list: V3[], key: (p: V3) => number) => V3 = (list: V3[], key: (p: V3) => number): V3 => list.reduce((a: V3, b: V3): V3 => (key(b) > key(a) ? b : a));
    const mid: (a: V3, b: V3) => V3 = (a: V3, b: V3): V3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const kneeBand: V3[] = band(frames.heights.knee);
    const knee: V3 = mid(extreme(kneeBand, (p: V3): number => p[2] * side), extreme(kneeBand, (p: V3): number => -p[2] * side));
    const im: V3 = mid(extreme(band(frames.heights.lateralMalleolus), (p: V3): number => p[2] * side), extreme(band(frames.heights.medialMalleolus), (p: V3): number => -p[2] * side));
    const stance: Record<"hip" | "knee" | "im", V3> = { hip, knee, im };

    // Leg levels: the sites' own and every 30 mm between them, none within 10 mm of a site.
    const SITES: string[] = ["gluteal furrow", "suprapatella", "midpatella", "calf maximum", "ankle minimum"];
    const siteY: number[] = SITES.map(height);
    const levels: { y: number; name: string }[] = SITES.map((name: string, k: number): { y: number; name: string } => ({ y: siteY[k]!, name }));
    for (let y: number = siteY[0]! - 30; y > siteY[4]! + 10; y -= 30) if (siteY.every((s: number): boolean => Math.abs(s - y) >= 10)) levels.push({ y, name: "" });
    levels.sort((a: { y: number }, b: { y: number }): number => b.y - a.y);

    // Silhouette points of the horizontal section at each level.
    const ends: (segments: [number, number, number, number][]) => [number, number][] = (segments: [number, number, number, number][]): [number, number][] => segments.flatMap((s: [number, number, number, number]): [number, number][] => [[s[0], s[1]], [s[2], s[3]]]);
    const pick: (e: [number, number][], key: (q: [number, number]) => number) => [number, number] = (e: [number, number][], key: (q: [number, number]) => number): [number, number] => e.reduce((a: [number, number], b: [number, number]): [number, number] => (key(b) > key(a) ? b : a));
    const leg: Record<Label, V3[]> = { lateral: [], medial: [], anterior: [], posterior: [] };
    for (const { y, name } of levels) {
      const e: [number, number][] = ends(NodeLegReference.section(P, I, [0, y, 0], [1, 0, 0], [0, 0, 1]));
      const at: (q: [number, number]) => V3 = (q: [number, number]): V3 => [q[0], y, q[1]];
      leg.lateral.push(at(pick(e, (q: [number, number]): number => q[1] * side)));
      leg.medial.push(at(pick(e, (q: [number, number]): number => -q[1] * side)));
      leg.anterior.push(at(pick(e, (q: [number, number]): number => q[0])));
      // Corrected by eye (render world-2026-11-08T06-47-36-724Z, zoom.thigh.left): at the gluteal furrow's own level the section still cuts the buttock's underside over the fold, so the posterior knot sat on the buttock's edge, not the thigh; it is read 8 mm under the fold, on the thigh's back.
      const under: number = name === "gluteal furrow" ? y - 8 : y;
      const back: [number, number][] = under === y ? e : ends(NodeLegReference.section(P, I, [0, under, 0], [1, 0, 0], [0, 0, 1]));
      const q: [number, number] = pick(back, (r: [number, number]): number => -r[0]);
      leg.posterior.push([q[0], under, q[1]]);
    }

    // Foot lines, dense: vertical sections across the foot every 4 mm from the heel to the ball (the heads' skin points plus 10 mm; the toes are their own lines), below IM + 15 mm; the dorsal profile in front of the ankle; the heel's back by height every 4 mm.
    const footTop: number = frames.heights.im + 15;
    const sole: V3[] = P.filter((p: V3): boolean => p[1] < 30);
    const heelX: number = Math.min(...sole.map((p: V3): number => p[0]));
    // The ball: her forefoot's most medial and most lateral skin points under 45 mm (heads I and V), the farther plus 10 mm.
    const fore: V3[] = P.filter((p: V3): boolean => p[1] < 45 && p[0] > im[0] + 40);
    const ballX: number = Math.max(extreme(fore, (p: V3): number => -p[2] * side)[0], extreme(fore, (p: V3): number => p[2] * side)[0]) + 10;
    const dense: Record<FootLabel, V3[]> = { lateral: [], medial: [], dorsal: [], heel: [] };
    for (let x: number = heelX + 4; x < ballX; x += 4) {
      const e: [number, number][] = ends(NodeLegReference.section(P, I, [x, 0, 0], [0, 1, 0], [0, 0, 1])).filter((q: [number, number]): boolean => q[0] < footTop);
      if (e.length === 0) continue;
      const at: (q: [number, number]) => V3 = (q: [number, number]): V3 => [x, q[0], q[1]];
      dense.lateral.push(at(pick(e, (q: [number, number]): number => q[1] * side)));
      dense.medial.push(at(pick(e, (q: [number, number]): number => -q[1] * side)));
      // Corrected by eye (render world-2026-11-08T06-42-01-614Z, foot side): the first dorsal knots in front of the ankle followed the IM + 15 mm cap of the cut, not her surface; a point on the cap is no dorsal point.
      const top: [number, number] = pick(e, (q: [number, number]): number => q[0]);
      if (x > im[0] + 15 && top[0] < footTop - 1) dense.dorsal.push(at(top));
    }
    for (let y: number = 4; y < frames.heights.im; y += 4) {
      const e: [number, number][] = ends(NodeLegReference.section(P, I, [0, y, 0], [1, 0, 0], [0, 0, 1])).filter((q: [number, number]): boolean => q[0] < im[0]);
      if (e.length === 0) continue;
      const q: [number, number] = pick(e, (r: [number, number]): number => -r[0]);
      dense.heel.push([q[0], y, q[1]]);
    }
    const foot: Record<FootLabel, V3[]> = {
      lateral: reduce(median(dense.lateral, 2), 0, 2),
      medial: reduce(median(dense.medial, 2), 0, 2),
      dorsal: reduce(median(dense.dorsal, 1), 0, 1),
      heel: reduce(median(dense.heel, 0), 1, 0),
    };

    // Her foot's course: her sole's principal heading (points under 15 mm), pitched as the leg's own course from IM to the toe-web pole.
    const low: V3[] = P.filter((p: V3): boolean => p[1] < 15);
    const cx: number = low.reduce((s: number, p: V3): number => s + p[0], 0) / low.length;
    const cz: number = low.reduce((s: number, p: V3): number => s + p[2], 0) / low.length;
    const [sxx, sxz, szz]: number[] = low.reduce((s: number[], p: V3): number[] => [s[0]! + (p[0] - cx) ** 2, s[1]! + (p[0] - cx) * (p[2] - cz), s[2]! + (p[2] - cz) ** 2], [0, 0, 0]);
    const yaw: number = 0.5 * Math.atan2(2 * sxz!, sxx! - szz!);
    const webW: V3 = S.apply(inputs.root, landmarks.points.web);
    const imW: V3 = S.apply(inputs.root, frames.points.im);
    const reach: number = Math.hypot(webW[0] - imW[0], webW[2] - imW[2]);
    const course: V3 = [Math.cos(yaw) * reach, webW[1] - imW[1], Math.sin(yaw) * reach];
    const f: { femur: AutoMovieHumanLegF1Rebase.IFrame; tibia: AutoMovieHumanLegF1Rebase.IFrame } = AutoMovieHumanLegF1Rebase.frames(stance, side);
    const footFrame: AutoMovieHumanLegF1Rebase.IFrame = AutoMovieHumanLegF1Rebase.foot(im, course, side);
    const ray: V3 = AutoMovieHumanLegF1Rebase.junctureRay(f.tibia, footFrame);
    const J: number = NodeLegReference.radius(NodeLegReference.section(P, I, im, footFrame.lateral, ray), Math.PI / 2) ?? NaN;
    const juncture: V3 = [im[0] + ray[0] * J, im[1] + ray[1] * J, im[2] + ray[2] * J];

    // Re-base round trips in her stance's frames.
    const names: string[] = levels.map((l: { name: string }): string => l.name);
    const restored: V3[] = [];
    const residual: Record<string, number> = {};
    for (const label of ["lateral", "medial", "anterior", "posterior"] as Label[])
      AutoMovieHumanLegF1Rebase.convert(leg[label], names, label, f).forEach((k: AutoMovieHumanLegF1Rebase.IKnot, i: number): void => {
        const back: V3 = AutoMovieHumanLegF1Rebase.restore(k, label, f);
        restored.push(back);
        residual[label] = Math.max(residual[label] ?? 0, distance(back, leg[label][i]!));
      });
    const footLabels: [FootLabel, Label][] = [["lateral", "lateral"], ["medial", "medial"], ["dorsal", "anterior"], ["heel", "posterior"]];
    for (const [name, label] of footLabels)
      AutoMovieHumanLegF1Rebase.convertFoot(foot[name], label, footFrame).forEach((k: AutoMovieHumanLegF1Rebase.IKnot, i: number): void => {
        const back: V3 = AutoMovieHumanLegF1Rebase.place(k, label, footFrame);
        restored.push(back);
        residual[`foot ${name}`] = Math.max(residual[`foot ${name}`] ?? 0, distance(back, foot[name][i]!));
      });
    let committed: number = 0;
    for (const label of ["lateral", "medial", "anterior", "posterior"] as Label[])
      AutoMovieHumanLegF1Lines.LINES[label].forEach((k: AutoMovieHumanLegF1Rebase.IKnot, i: number): void => {
        committed = Math.max(committed, distance(AutoMovieHumanLegF1Rebase.restore(k, label, AutoMovieHumanLegF1Lines.FRAMES), [...AutoMovieHumanLegF1World.LEG[label][i]!] as V3));
      });
    // The reduced foot knots against every dense sample: the natural cubic through the knots at each sample's station.
    const fit: Record<string, number> = {};
    for (const [name, s, v] of [["lateral", 0, 2], ["medial", 0, 2], ["dorsal", 0, 1], ["heel", 1, 0]] as [FootLabel, number, number][]) {
      const g: (t: number) => number = natural(foot[name].map((p: V3): number => p[s]!), foot[name].map((p: V3): number => p[v]!));
      fit[name] = Math.max(...median(dense[name], v as 0 | 1 | 2).map((p: V3): number => Math.abs(g(p[s]!) - p[v]!)));
    }

    const stamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_leg/world-${stamp}`);
    fs.mkdirSync(out, { recursive: true });
    const tris: [V3, V3, V3][] = [];
    for (let i: number = 0; i + 2 < I.length; i += 3) tris.push([P[I[i]!]!, P[I[i + 1]!]!, P[I[i + 2]!]!]);
    const colours: Record<string, string> = { lateral: "#d62728", medial: "#1f77b4", anterior: "#2ca02c", posterior: "#ff7f0e", dorsal: "#9467bd", heel: "#8c564b" };
    const draw: (name: string, forward: V3, bounds: V3[], lines: [string, V3[]][], caption: string, raw?: V3[]) => void =(name: string, forward: V3, bounds: V3[], lines: [string, V3[]][], caption: string, raw: V3[] = []): void => {
      const v: NodeArmDraw.IView = NodeArmDraw.open(forward, bounds);
      const top: number = Math.max(...bounds.map((p: V3): number => p[1]));
      NodeArmDraw.clay(v, tris.filter((t: [V3, V3, V3]): boolean => t.every((p: V3): boolean => p[1] <= top)));
      NodeArmDraw.dots(v, raw, "#ffffff", 2);
      for (const [label, points] of lines) {
        NodeArmDraw.line(v, points, colours[label] ?? "#000000", 1.6);
        NodeArmDraw.dots(v, points, colours[label] ?? "#000000", 5);
      }
      NodeArmDraw.dots(v, restored.filter((p: V3): boolean => p[1] <= top), "#000000", 2);
      NodeArmDraw.dots(v, [hip, knee, im, juncture], "#000000", 7);
      NodeArmDraw.line(v, [im, juncture], "#000000", 1);
      NodeArmDraw.caption(v, [caption, "red lateral, blue medial, green anterior, orange posterior, purple dorsal, brown heel; white: the dense samples; black dots: re-based and restored; squares: hip, knee, IM, front-ankle juncture"]);
      fs.writeFileSync(path.join(out, name), NodeArmDraw.png(v));
    };
    const all: V3[] = [...P, hip];
    const footPoints: V3[] = P.filter((p: V3): boolean => p[1] < footTop + 40);
    const denseAll: V3[] = [...dense.lateral, ...dense.medial, ...dense.dorsal, ...dense.heel];
    draw("world.front.png", [-1, 0, 0], all, [["lateral", leg.lateral], ["medial", leg.medial], ["lateral", foot.lateral], ["medial", foot.medial]], "f1 reference, her stance, front: world leg lines (lateral, medial) on her clay");
    draw("world.left.png", [0, 0, -side], all, [["anterior", leg.anterior], ["posterior", leg.posterior], ["dorsal", foot.dorsal], ["heel", foot.heel]], "f1 reference, her stance, lateral side: world leg lines (anterior, posterior), foot dorsal and heel on her clay");
    draw("world.back.png", [1, 0, 0], all, [["lateral", leg.lateral], ["medial", leg.medial]], "f1 reference, her stance, back: world leg lines (lateral, medial) on her clay");
    draw("world.foot-top.png", [0, -1, 0], footPoints, [["lateral", foot.lateral], ["medial", foot.medial]], "f1 reference, her stance, foot from above: reduced foot knots (lateral, medial) over the dense samples", denseAll);
    draw("world.foot-side.png", [0, 0, -side], footPoints, [["dorsal", foot.dorsal], ["heel", foot.heel]], "f1 reference, her stance, foot from the lateral side: reduced dorsal and heel knots, the front-ankle juncture on the bisection ray", denseAll);

    // Pairs at the same cameras: the leg built through the re-based lines (the body's left leg on S00's split, neutral frames, world), over her lines.
    const whole: NodeLegWhole.IOutput = NodeLegWhole.build(person.parameters);
    const ours: NodeLegBuild.IBuild = NodeLegBuild.build(whole.sides.left.inputs ?? inputs, { knee: 0, ankle: 0 }, inputs.root);
    const ourTris: [V3, V3, V3][] = legTriangles(ours.chain);
    if (ours.chain === null) console.log(JSON.stringify({ chain: null, posterior: ours.curves.outlines.posterior.filter((k: { walk: number }): boolean => k.walk > 700).map((k: { site: string; walk: number; value: number; first: number; rule: string }): string => `${k.site}@${k.walk.toFixed(1)}=${k.value.toFixed(1)}/${k.first.toFixed(2)} ${k.rule.slice(0, 40)}`), kneeWalk: ours.landmarks.course.knee, near: (["anterior", "posterior"] as const).map((l: "anterior" | "posterior"): string => `${l} ${ours.curves.outlines[l].filter((k: { walk: number }): boolean => Math.abs(k.walk - ours.landmarks.course.knee) < 60).map((k: { walk: number; value: number; q: number }): string => `${k.walk.toFixed(2)}:${k.value.toFixed(1)}:${k.q.toFixed(3)}`).join(" ")}`), at: (["anterior", "posterior"] as const).map((l: "anterior" | "posterior"): number => AutoMovieHumanLegViewCurves.value(ours.curves.outlines[l], ours.landmarks.course.knee, ours.curves.end)[0]), points: ours.frames.points, angles: ours.curves.course.angles, halves: ours.curves.course.halves, centres: ours.curves.centres, sites: ours.curves.sites.map((s: { name: string; box: number[] }): string => `${s.name} ${s.box.map((x: number): string => x.toFixed(1)).join(" ")}`), curves: ours.curves.diagnostics.slice(0, 2), loft: ours.loft.diagnostics.slice(0, 6), engine: (ours.loft.loft?.diagnostics ?? []).slice(0, 6).map((d: { detail: string }): string => d.detail) }));
    const pair: (name: string, forward: V3, bounds: V3[], lines: [string, V3[]][], caption: string) => void = (name: string, forward: V3, bounds: V3[], lines: [string, V3[]][], caption: string): void => {
      const v: NodeArmDraw.IView = NodeArmDraw.open(forward, bounds);
      const top: number = Math.max(...bounds.map((p: V3): number => p[1]));
      NodeArmDraw.clay(v, ourTris.filter((t: [V3, V3, V3]): boolean => t.every((p: V3): boolean => p[1] <= top)), [182, 190, 204]);
      for (const [label, points] of lines) NodeArmDraw.line(v, points, colours[label] ?? "#000000", 1.2, [4, 3]);
      NodeArmDraw.caption(v, [caption, "blue-grey clay: the leg built through the re-based lines in its neutral frames; dashed: her world lines at the same camera"]);
      fs.writeFileSync(path.join(out, name), NodeArmDraw.png(v));
    };
    pair("model.front.png", [-1, 0, 0], all, [["lateral", leg.lateral], ["medial", leg.medial]], "the model's left leg, front, the camera of world.front");
    pair("model.left.png", [0, 0, -side], all, [["anterior", leg.anterior], ["posterior", leg.posterior], ["dorsal", foot.dorsal], ["heel", foot.heel]], "the model's left leg, lateral side, the camera of world.left");
    pair("model.back.png", [1, 0, 0], all, [["lateral", leg.lateral], ["medial", leg.medial]], "the model's left leg, back, the camera of world.back");
    pair("model.foot-top.png", [0, -1, 0], footPoints, [["lateral", foot.lateral], ["medial", foot.medial]], "the model's left foot from above, the camera of world.foot-top");
    pair("model.foot-side.png", [0, 0, -side], footPoints, [["dorsal", foot.dorsal], ["heel", foot.heel]], "the model's left foot, lateral side, the camera of world.foot-side");

    // Close views for the by-eye check of every leg line against her mesh's slices: thigh top, knee, calf, ankle, front and lateral side.
    for (const [zone, y0, y1] of [["thigh", siteY[0]! - 140, siteY[0]! + 20], ["knee", knee[1] - 90, knee[1] + 90], ["calf", siteY[3]! - 90, siteY[3]! + 90], ["ankle", im[1] + 10, siteY[4]! + 80]] as [string, number, number][]) {
      const box: V3[] = P.filter((p: V3): boolean => p[1] >= y0 && p[1] <= y1);
      const inside: (list: V3[]) => V3[] = (list: V3[]): V3[] => list.filter((p: V3): boolean => p[1] >= y0 - 15 && p[1] <= y1 + 15);
      draw(`zoom.${zone}.front.png`, [-1, 0, 0], box, [["lateral", inside(leg.lateral)], ["medial", inside(leg.medial)]], `f1 reference, her stance, ${zone}, front: leg lines over her slices`);
      draw(`zoom.${zone}.left.png`, [0, 0, -side], box, [["anterior", inside(leg.anterior)], ["posterior", inside(leg.posterior)]], `f1 reference, her stance, ${zone}, lateral side: leg lines over her slices`);
    }

    const r: (p: readonly number[]) => string =(p: readonly number[]): string => `[${p.map((x: number): string => (Math.round(x * 10) / 10).toFixed(1)).join(", ")}]`;
    const list: (points: V3[]) => string = (points: V3[]): string => `[\n${points.map((p: V3): string => `      ${r(p)},`).join("\n")}\n    ]`;
    const source: string = [
      "type V3 = [number, number, number];",
      "",
      "/**",
      " * f1's leg and foot 2D lines as absolute world points on her reference in",
      " * her own stance (the shank abducted, the feet as placed), world",
      " * calibration mm with +X forward, +Y up and Z negative on her left: the",
      " * owner's world-match step (2026-11-08). Each point is a silhouette point of",
      " * her surface in its view, placed by `NodeLegWorldTrace` and checked on her",
      " * clay in every view: the leg's at its levels (the sites' own and every",
      " * 30 mm between); the foot's sampled every 4 mm, each sample's free",
      " * coordinate the median of its neighbourhood (her mesh's saw-toothed slices",
      " * and hatching are single-sample steps), reduced to the fewest knots whose",
      " * natural cubic passes every sample within 0.5 mm. The leg's zero frames",
      " * take them through `AutoMovieHumanLegF1Rebase`.",
      " */",
      "export namespace AutoMovieHumanLegF1World {",
      "  /** Her bone landmarks in that stance: the hip centre (the trunk's hip port), the knee centre between the epicondyles' skin points, IM between the malleoli's tips. */",
      `  export const LANDMARKS: Readonly<Record<"hip" | "knee" | "im", V3>> = { hip: ${r(hip)}, knee: ${r(knee)}, im: ${r(im)} };`,
      "",
      "  /** Her foot's course direction from IM: her sole's principal heading, pitched as the leg's course from IM to the toe-web pole. */",
      `  export const COURSE: V3 = ${r(course)};`,
      "",
      "  /** Her front-ankle juncture: her surface on the ray from IM in the bisection plane of her shank and foot course, toward the bend's inner side (the talus' front). */",
      `  export const JUNCTURE: V3 = ${r(juncture)};`,
      "",
      "  /** The leg's levels top down: a site's name, or an empty string between sites. */",
      `  export const LEVELS: readonly string[] = [${names.map((n: string): string => JSON.stringify(n)).join(", ")}];`,
      "",
      "  /** The leg's four lines, one point per level: front view lateral and medial, side view anterior and posterior. */",
      `  export const LEG: Readonly<Record<"lateral" | "medial" | "anterior" | "posterior", readonly V3[]>> = {`,
      ...(["lateral", "medial", "anterior", "posterior"] as Label[]).map((label: Label): string => `    ${label}: ${list(leg[label])},`),
      "  };",
      "",
      "  /** The foot's lines from the heel to the ball: from above the lateral and medial outlines and from the side the dorsal profile by station along +X; the heel's back by height. */",
      `  export const FOOT: Readonly<Record<"lateral" | "medial" | "dorsal" | "heel", readonly V3[]>> = {`,
      ...(["lateral", "medial", "dorsal", "heel"] as FootLabel[]).map((label: FootLabel): string => `    ${label}: ${list(foot[label])},`),
      "  };",
      "}",
      "",
    ].join("\n");
    fs.writeFileSync(path.join(out, "AutoMovieHumanLegF1World.ts.txt"), source);
    const report: object = { stance, course, juncture, J, ankleAnterior: AutoMovieHumanLegF1Rebase.ankleAnterior(juncture, f.tibia, footFrame), residual, committed, fit, knots: { lateral: foot.lateral.length, medial: foot.medial.length, dorsal: foot.dorsal.length, heel: foot.heel.length }, samples: { lateral: dense.lateral.length, dorsal: dense.dorsal.length, heel: dense.heel.length } };
    fs.writeFileSync(path.join(out, "equivalence.json"), JSON.stringify(report, null, 2));
    console.log(out);
    console.log(JSON.stringify(report));
  }

  /** Each point's coordinate `k` replaced by the median of itself and its two neighbours; the ends kept. */
  function median(points: V3[], k: 0 | 1 | 2): V3[] {
    return points.map((p: V3, i: number): V3 => {
      if (i === 0 || i === points.length - 1) return p;
      const q: V3 = [p[0], p[1], p[2]];
      q[k] = [points[i - 1]![k], p[k], points[i + 1]![k]].sort((a: number, b: number): number => a - b)[1]!;
      return q;
    });
  }

  /** The fewest knots (the ends kept, the worst sample inserted each round) whose natural cubic in coordinate `s` passes every point's coordinate `v` within 0.5 mm. */
  function reduce(points: V3[], s: number, v: number): V3[] {
    if (points.length < 3) return points;
    const chosen: number[] = [0, points.length - 1];
    for (;;) {
      const ks: number[] = [...chosen].sort((a: number, b: number): number => a - b);
      const g: (t: number) => number = natural(ks.map((i: number): number => points[i]![s]!), ks.map((i: number): number => points[i]![v]!));
      let worst: number = -1;
      let error: number = 0.5;
      points.forEach((p: V3, i: number): void => {
        const e: number = Math.abs(g(p[s]!) - p[v]!);
        if (e > error) [error, worst] = [e, i];
      });
      if (worst < 0) return ks.map((i: number): V3 => points[i]!);
      chosen.push(worst);
    }
  }

  /** The natural cubic spline through (xs, ys), xs ascending. */
  function natural(xs: number[], ys: number[]): (t: number) => number {
    const n: number = xs.length;
    const m: number[] = new Array<number>(n).fill(0);
    if (n > 2) {
      const h: number[] = xs.slice(1).map((x: number, i: number): number => x - xs[i]!);
      const a: number[] = new Array<number>(n).fill(0);
      const b: number[] = new Array<number>(n).fill(1);
      const c: number[] = new Array<number>(n).fill(0);
      const d: number[] = new Array<number>(n).fill(0);
      for (let i: number = 1; i < n - 1; ++i) {
        a[i] = h[i - 1]!;
        b[i] = 2 * (h[i - 1]! + h[i]!);
        c[i] = h[i]!;
        d[i] = 6 * ((ys[i + 1]! - ys[i]!) / h[i]! - (ys[i]! - ys[i - 1]!) / h[i - 1]!);
      }
      for (let i: number = 1; i < n; ++i) {
        const w: number = a[i]! / b[i - 1]!;
        b[i] = b[i]! - w * c[i - 1]!;
        d[i] = d[i]! - w * d[i - 1]!;
      }
      m[n - 1] = d[n - 1]! / b[n - 1]!;
      for (let i: number = n - 2; i >= 0; --i) m[i] = (d[i]! - c[i]! * m[i + 1]!) / b[i]!;
    }
    return (t: number): number => {
      let j: number = 0;
      while (j < n - 2 && t > xs[j + 1]!) ++j;
      const h: number = xs[j + 1]! - xs[j]!;
      const u: number = (xs[j + 1]! - t) / h;
      const w: number = (t - xs[j]!) / h;
      return u * ys[j]! + w * ys[j + 1]! + ((u * u * u - u) * m[j]! + (w * w * w - w) * m[j + 1]!) * ((h * h) / 6);
    };
  }

  /** Clay triangles of the leg's chain: a station-phase grid, the toe-web pole fanned to the end row nearest it (the port end stays open), as `NodeLegSpecs` draws it. */
  function legTriangles(chain: IAutoMovieLoftChain | null): [V3, V3, V3][] {
    if (chain === null) return [];
    const phases: number[] = Array.from({ length: 72 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 72);
    const a: number = chain.layers[0]!.y;
    const z: number = chain.layers[chain.layers.length - 1]!.y;
    const n: number = Math.max(2, Math.ceil((z - a) / 1.5));
    const rows: V3[][] = Array.from({ length: n + 1 }, (_: unknown, k: number): V3[] => AutoMovieLoftChain.ring(chain, a + ((z - a) * k) / n, phases) as V3[]);
    const out: [V3, V3, V3][] = [];
    for (let i: number = 0; i + 1 < rows.length; ++i)
      for (let k: number = 0; k < phases.length; ++k) {
        const k1: number = (k + 1) % phases.length;
        out.push([rows[i]![k]!, rows[i + 1]![k]!, rows[i + 1]![k1]!], [rows[i]![k]!, rows[i + 1]![k1]!, rows[i]![k1]!]);
      }
    const gap: (pole: V3, row: V3[]) => number = (pole: V3, row: V3[]): number => Math.min(...row.map((p: V3): number => distance(p, pole)));
    for (const pole of [chain.pole?.point, chain.opposite?.point]) {
      if (pole === undefined) continue;
      const row: V3[] = gap(pole as V3, rows[0]!) < gap(pole as V3, rows[rows.length - 1]!) ? rows[0]! : rows[rows.length - 1]!;
      for (let k: number = 0; k < phases.length; ++k) out.push([pole as V3, row[k]!, row[(k + 1) % phases.length]!]);
    }
    return out;
  }

  function distance(a: V3, b: V3): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }
}

void NodeLegWorldTrace.run().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
