import fs from "node:fs";
import path from "node:path";
import { AutoMovieLoftChain, AutoMovieViewSection, type IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanHeadBuild } from "../generation/head/AutoMovieHumanHeadBuild";
import { AutoMovieHumanHeadEarLoft } from "../generation/head/AutoMovieHumanHeadEarLoft";
import { AutoMovieHumanHeadF1Pose } from "../generation/head/AutoMovieHumanHeadF1Pose";
import type { AutoMovieHumanHeadFrankfort } from "../generation/head/AutoMovieHumanHeadFrankfort";
import { AutoMovieHumanHeadMassCurves } from "../generation/head/AutoMovieHumanHeadMassCurves";
import { AutoMovieHumanHeadMassLoft } from "../generation/head/AutoMovieHumanHeadMassLoft";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeArmDraw } from "./NodeArmDraw";
import { NodeHeadDeviation } from "./NodeHeadDeviation";
import { NodeHeadReference } from "./NodeHeadReference";
import { NodeHeadTrace } from "./NodeHeadTrace";

type V3 = [number, number, number];
type Label = AutoMovieHumanHeadMassCurves.Label;

/**
 * Direct Node images of the head/neck view-curve construction for f1, in the
 * Frankfort head frame, in four stages at front, left, top and two obliques:
 * 1. the 2D view curves (anterior and posterior midline profiles, the lateral
 *    half breadth, the course, and the fullness as its conic sections at the
 *    datum stations, each in its own plane) with their construction aids and
 *    landmarks, over the reference head registered into the head frame
 *    (diagnostic only);
 * 2. the actual loft curves of the engine view loft (layer rings, the four
 *    guide lines and the course);
 * 3. those curves over the default clay of the lofted surface;
 * 4. the clay alone.
 * Each view curve is also drawn alone over the reference, and each datum
 * station's section is drawn in its own plane against the reference's
 * vertices within 1 mm of that plane. A manifest keeps the inputs, landmarks,
 * gaps, stations, outlines, tapes (analytic and on the actual chain), checks,
 * the registration's measures and the constructor timings (cold, retained,
 * one-input edit).
 */
export namespace NodeHeadSpecs {
  /** Draws every stage and camera and writes PNGs plus a manifest under `.shots/f1_head/head-<stamp>/`. */
  export async function run(): Promise<void> {
    const started: number = performance.now();
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    const loaded: number = performance.now();

    // Constructor timings: cold, retained (same inputs again), one-input edit.
    const cold: IBuild = build(person.parameters);
    const retained: IBuild = build(person.parameters);
    const edited: IBuild = build(person.parameters, { length: cold.b.head.length + 5 });
    // The overlay in the measured reference's own FH frame when a node:head-measure receipt exists, else by translation.
    const headPoints: [number, number, number][] = NodeHeadReference.load(cold.b.measures.stature - 300);
    const reference: NodeHeadReference.IRegistered = NodeHeadReference.upright(headPoints) ?? NodeHeadReference.register(headPoints, cold.b.frame);

    const stamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_head/head-${stamp}`);
    fs.mkdirSync(out, { recursive: true });
    const files: string[] = [];
    // Traced heights (`--trace <y>`, head-frame mm): sections there, the chain's curvature shading with those heights marked, and the layer trace.
    const traced: number[] = process.argv.flatMap((a: string, i: number): number[] => (a === "--trace" && process.argv[i + 1] !== undefined ? [Number(process.argv[i + 1])] : []));
    const write: (name: string, view: NodeArmDraw.IView) => void = (name: string, view: NodeArmDraw.IView): void => {
      fs.writeFileSync(path.join(out, name), NodeArmDraw.png(view));
      files.push(name);
    };
    const drawStart: number = performance.now();
    const mesh: [V3, V3, V3][] = [...triangles(cold.chain), ...earTriangles(cold.ears)];
    const P: Record<AutoMovieHumanHeadFrankfort.Name, V3> = cold.b.frame.points;
    const bottom: number = cold.b.course.base.centre[1] - 40;
    const bounds: V3[] = [...reference.points.filter((p: V3, i: number): boolean => i % 7 === 0 && p[1] > bottom), P.v, P.op, P.g, cold.b.course.base.centre];
    for (const [camera, forward] of CAMERAS)
      for (const stage of [1, 2, 3, 4] as const) {
        const v: NodeArmDraw.IView = NodeArmDraw.open(forward, bounds);
        if (stage === 1 || stage === 2) NodeArmDraw.dots(v, every(reference.points, 3), "#cfcfcf", 1.6);
        if (stage >= 3) NodeArmDraw.clay(v, mesh);
        if (stage === 1) drawSpecs(v, cold, null);
        if (stage === 2 || stage === 3) drawLoft(v, cold);
        if (stage <= 3) drawPort(v, cold);
        // Each auricle's root loop, its port for the head's band (magenta).
        if (stage <= 3) for (const ear of cold.ears) if (ear.root.length > 0) NodeArmDraw.line(v, [...ear.root, ear.root[0]!], "#ff00ff", 1.6);
        drawJaw(v, cold);
        NodeArmDraw.caption(v, [`f1 head/neck, Frankfort frame, ${camera}, stage ${stage}: ${STAGES[stage - 1]}`, ...(stage === 1 ? tapeLines(cold) : cold.b.curves.diagnostics.filter((d: string): boolean => d.startsWith("front") || d.startsWith("jaw")))]);
        write(`head.${camera}.${stage}.png`, v);
      }
    for (const [curve, cameras] of INDIVIDUAL)
      for (const camera of cameras) {
        const forward: V3 = CAMERAS.find((c: [string, V3]): boolean => c[0] === camera)![1];
        const v: NodeArmDraw.IView = NodeArmDraw.open(forward, bounds);
        NodeArmDraw.dots(v, every(reference.points, 2), "#cfcfcf", 1.6);
        drawSpecs(v, cold, curve);
        NodeArmDraw.caption(v, [`f1 head/neck, ${camera}, stage 1 alone: ${curve} view curve + aids over registered reference`, ...tapeLines(cold)]);
        write(`head.1.${curve}.${camera}.png`, v);
      }

    // The nose-lip-chin midline profile over the registered reference's midsagittal vertices, side view, with the mass's anterior outline (the deep plane the reliefs stand on).
    {
      const pr: typeof cold.b.curves.profile = cold.b.curves.profile;
      const v: NodeArmDraw.IView = NodeArmDraw.open([0, 0, 1], [...pr.midline, P.n, P.gn, NodeArmDraw.add(P.n, [0, 15, 0]), NodeArmDraw.add(P.gn, [-30, -15, 0])]);
      NodeArmDraw.dots(v, reference.points.filter((p: V3): boolean => Math.abs(p[2]) < 1.5), "#d03030", 2.2);
      const deep: V3[] = [];
      for (let s: number = P.gn[1] - 10; s <= P.n[1] + 10; s += 1) deep.push(place(cold, s, "anterior", AutoMovieHumanHeadMassCurves.value(cold.b.curves.outlines.anterior, s, cold.b.curves.length)[0]));
      NodeArmDraw.line(v, deep, "#808080", 1.4, [4, 2]);
      NodeArmDraw.dots(v, pr.midline as V3[], "#e07000", 2.4);
      for (const [name, p] of Object.entries(pr.points)) {
        NodeArmDraw.dots(v, [p as V3], "#000000", 5);
        NodeArmDraw.text(v, p as V3, name, "#202020");
      }
      NodeArmDraw.caption(v, ["f1 head, nose-lip-chin midline profile (orange: each feature's X(y)) and its points over the registered reference's vertices within 1.5 mm of the midsagittal plane (red)", "grey dashed: head.mass's anterior outline, the deep plane the nose, lip and chin reliefs stand on"]);
      write("head.profile.left.png", v);
    }

    // Shape against the reference (owner's order, 2026-11-08), read by `NodeHeadDeviation` in two registrations: her Frankfort frame (the head) and her upright frame about her tragia (her neck by its own axes: her FH stands 5.5 degrees off her native horizontal, so the Frankfort registration reads her head's pitch as a rotation of her neck).
    // Her pose (owner, 15:2x): the head is built in her upright frame (`AutoMovieHumanHeadF1Pose`), so the primary comparison is against her upright points; the zero-frame view maps our midlines back through the pose's exact inverse onto her Frankfort-registered points.
    const zero: NodeHeadReference.IRegistered | null = NodeHeadReference.frankfort(headPoints);
    const deviation: NodeHeadDeviation.IReading[] = [];
    if (cold.chain !== null) {
      const chain: IAutoMovieLoftChain = cold.chain;
      const floor: number = cold.b.curves.start - 10;
      deviation.push(...NodeHeadDeviation.read(chain, "her pose (upright)", reference.points));
      write("head.overlay.side.png", NodeHeadDeviation.side(chain, "her pose (upright)", reference.points, deviation, floor));
      if (zero !== null) {
        const mids: V3[] = zero.points.filter((p: V3): boolean => Math.abs(p[2]) < 2 && p[1] > floor);
        const v: NodeArmDraw.IView = NodeArmDraw.open([0, 0, 1], mids);
        NodeArmDraw.dots(v, mids, "#d03030", 2);
        const ysz: number[] = [];
        for (let y: number = chain.layers[0]!.y; y <= chain.layers[chain.layers.length - 1]!.y; y += 0.5) ysz.push(y);
        NodeArmDraw.line(v, ysz.map((y: number): V3 => AutoMovieHumanHeadF1Pose.frankfort(AutoMovieLoftChain.point(chain, y, 0))), "#e07000", 2);
        NodeArmDraw.line(v, ysz.map((y: number): V3 => AutoMovieHumanHeadF1Pose.frankfort(AutoMovieLoftChain.point(chain, y, Math.PI))), "#8040c0", 2);
        NodeArmDraw.caption(v, ["f1 head, the zero frame: our realized midlines carried back by the pose's inverse (front orange, back violet) over her Frankfort-registered midsagittal points (red)", `pose round trip ${AutoMovieHumanHeadF1Pose.roundTrip(cold.b.frame.list.map((l: AutoMovieHumanHeadFrankfort.ILandmark): V3 => AutoMovieHumanHeadF1Pose.frankfort(l.point))).toExponential(2)} mm`]);
        write("head.overlay.side-zero.png", v);
      }
      // Front: our largest half breadth at every millimetre (teal) over her points; top: our sections every 20 mm (black) over her points within 1.5 mm of each height (red).
      const ys: number[] = [];
      for (let y: number = chain.layers[0]!.y; y <= chain.layers[chain.layers.length - 1]!.y; y += 1) ys.push(y);
      const phases: number[] = Array.from({ length: 181 }, (_: unknown, k: number): number => (Math.PI * k) / 180);
      const half: number[] = ys.map((y: number): number => Math.max(...phases.map((phi: number): number => Math.abs(AutoMovieLoftChain.point(chain, y, phi)[2]!))));
      const front: NodeArmDraw.IView = NodeArmDraw.open([-1, 0, 0], reference.points.filter((p: V3): boolean => p[1] > floor));
      NodeArmDraw.dots(front, reference.points.filter((_: V3, i: number): boolean => i % 3 === 0), "#e0b0b0", 1.4);
      for (const sign of [1, -1]) NodeArmDraw.line(front, ys.map((y: number, i: number): V3 => [0, y, sign * half[i]!]), "#008080", 2);
      const silhouette: NodeHeadDeviation.IReading | undefined = deviation.find((d: NodeHeadDeviation.IReading): boolean => d.curve === "front silhouette");
      NodeArmDraw.caption(front, ["f1 head, realized front silhouette (teal) over her points, Frankfort registration", `normal deviation max ${silhouette?.max.toFixed(1) ?? "-"} mean ${silhouette?.mean.toFixed(1) ?? "-"} mm (her ears are not built)`]);
      write("head.overlay.front.png", front);
      const topView: NodeArmDraw.IView = NodeArmDraw.open([0, -1, 0], reference.points.filter((p: V3): boolean => p[1] > floor));
      const turns: number[] = Array.from({ length: 145 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 144);
      for (let y: number = cold.b.curves.start + 2; y <= cold.b.curves.length - 3; y += 20) {
        NodeArmDraw.dots(topView, reference.points.filter((p: V3): boolean => Math.abs(p[1] - y) < 1.5), "#d03030", 1.6);
        NodeArmDraw.line(topView, AutoMovieLoftChain.ring(chain, y, turns) as V3[], "#000000", 1);
      }
      const sections: NodeHeadDeviation.IReading | undefined = deviation.find((d: NodeHeadDeviation.IReading): boolean => d.curve.startsWith("sections"));
      NodeArmDraw.caption(topView, ["f1 head, realized sections every 20 mm (black) over her points within 1.5 mm of each height (red), Frankfort registration", `outer-skin section deviation max ${sections?.max.toFixed(1) ?? "-"} mean ${sections?.mean.toFixed(1) ?? "-"} mm`]);
      write("head.overlay.top.png", topView);
    }

    // World match (owner's order, 2026-11-08: lines first in her own pose, absolute coordinates): every F1Lines knot carried by `AutoMovieHumanHeadF1Pose.toWorld` over her loaded mesh points (her world, no registration), side, front and top; the same lines in the head frame over her Frankfort-registered points; our clay carried into her world beside her points; and the round trip of every knot and of her points.
    const pose: { roundTrip: { knots: number; headMax: number; worldMax: number }; lines: { name: string; head: V3[]; world: V3[] }[] } = ((): { roundTrip: { knots: number; headMax: number; worldMax: number }; lines: { name: string; head: V3[]; world: V3[] }[] } => {
      const F: typeof AutoMovieHumanHeadF1Pose = AutoMovieHumanHeadF1Pose;
      const lines: AutoMovieHumanHeadF1Pose.ILine[] = F.lines({ sto: P.sto, tragion: cold.b.frame.dims.bitragion / 2, lateralX: (y: number): number => cold.b.course.frame(Math.max(y, cold.b.course.start)).origin[0] });
      const colour: (name: string) => string = (name: string): string =>
        name.startsWith("anterior") || name.startsWith("nose") || name.startsWith("lower") ? "#e07000" : name.startsWith("posterior") ? "#8040c0" : name.startsWith("lateral") ? "#008080" : name.startsWith("throat") || name.startsWith("submental") ? "#c00060" : name.startsWith("mouth") ? "#d00000" : name.startsWith("eye") ? "#0040ff" : "#008000";
      const diff: (a: V3, b: V3) => number = (a: V3, b: V3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      let headMax: number = 0;
      let knots: number = 0;
      const carried: { name: string; head: V3[]; world: V3[] }[] = lines.map((l: AutoMovieHumanHeadF1Pose.ILine): { name: string; head: V3[]; world: V3[] } => {
        const world: V3[] = l.knots.map((k: V3): V3 => F.toWorld(k) as V3);
        world.forEach((w: V3, i: number): void => {
          headMax = Math.max(headMax, diff(F.toHead(w) as V3, l.knots[i] as V3));
          ++knots;
        });
        return { name: l.name, head: l.knots as V3[], world };
      });
      const worldMax: number = headPoints.reduce((m: number, p: V3): number => Math.max(m, diff(F.toWorld(F.toHead(p)) as V3, p)), 0);
      const herFloor: number = F.toWorld([0, cold.b.course.start - 30, 0])[1];
      const her: V3[] = headPoints.filter((p: V3): boolean => p[1] > herFloor);
      const drawLines: (v: NodeArmDraw.IView, frame: "head" | "world") => void = (v: NodeArmDraw.IView, frame: "head" | "world"): void => {
        for (const l of carried) {
          const pts: V3[] = l[frame];
          if (pts.length > 1) NodeArmDraw.line(v, pts, colour(l.name), 1.8);
          NodeArmDraw.dots(v, pts, colour(l.name), 4);
        }
      };
      for (const [view, forward] of [["side", [0, 0, 1]], ["front", [-1, 0, 0]], ["top", [0, -1, 0]]] as [string, V3][]) {
        const w: NodeArmDraw.IView = NodeArmDraw.open(forward, her);
        NodeArmDraw.dots(w, every(her, 2), "#cfcfcf", 1.6);
        drawLines(w, "world");
        NodeArmDraw.caption(w, [`f1 head, every F1Lines knot carried into her world pose (AutoMovieHumanHeadF1Pose.toWorld) over her loaded mesh points, ${view}`, "orange anterior/nose/lip, violet posterior, teal lateral, magenta throat/submental, red mouth, blue eyes, green ears"]);
        write(`head.world.${view}.png`, w);
        const h: NodeArmDraw.IView = NodeArmDraw.open(forward, reference.points.filter((p: V3): boolean => p[1] > cold.b.course.start - 30));
        NodeArmDraw.dots(h, every(reference.points.filter((p: V3): boolean => p[1] > cold.b.course.start - 30), 2), "#cfcfcf", 1.6);
        drawLines(h, "head");
        NodeArmDraw.caption(h, [`f1 head, the same knots in the head frame (re-based, F1Lines' own values) over her points by the inverse map, ${view}`, `round trip: ${knots} knots, max |toHead(toWorld(h)) - h| ${headMax.toExponential(2)} mm; her points max |toWorld(toHead(w)) - w| ${worldMax.toExponential(2)} mm`]);
        write(`head.rebased.${view}.png`, h);
      }
      // Side-by-side clay in her world: ours (left, carried by the pose map) and her points (right, shifted 250 mm along -Z), the same camera.
      const shift: V3 = [0, 0, -250];
      const ours: [V3, V3, V3][] = mesh.map((t: [V3, V3, V3]): [V3, V3, V3] => t.map((p: V3): V3 => F.toWorld(p) as V3) as [V3, V3, V3]);
      for (const [view, forward] of [["side", [0, 0, 1]], ["front", [-1, 0, 0]]] as [string, V3][]) {
        const c: NodeArmDraw.IView = NodeArmDraw.open(forward, [...her, ...her.map((p: V3): V3 => NodeArmDraw.add(p, shift))]);
        NodeArmDraw.clay(c, ours);
        NodeArmDraw.dots(c, every(her, 1).map((p: V3): V3 => NodeArmDraw.add(p, shift)), "#909090", 1.4);
        NodeArmDraw.caption(c, [`f1 head, side by side in her world, ${view}: our clay carried by the pose map, and her mesh points shifted 250 mm along -Z`]);
        write(`head.world.clay.${view}.png`, c);
      }
      return { roundTrip: { knots, headMax, worldMax }, lines: carried };
    })();

    // The posterior midline against the reference's midsagittal points: the back of the head and the nape, side view, and its offsets at seven heights from the opisthocranion to the port (the most posterior reference point within 1 mm of each height and 1.5 mm of the midsagittal plane).
    const nape: { y: number; ours: number; reference: number | null; offset: number | null }[] = [];
    {
      const c: typeof cold.b.curves = cold.b.curves;
      const mid: V3[] = reference.points.filter((p: V3): boolean => Math.abs(p[2]) < 1.5 && p[0] < 0);
      const back: V3[] = [];
      for (let s: number = c.start; s <= c.length; s += 1) back.push(place(cold, s, "posterior", AutoMovieHumanHeadMassCurves.value(c.outlines.posterior, s, c.length)[0]));
      const top: number = c.stations.op!;
      for (let k: number = 0; k <= 6; ++k) {
        const y: number = top + ((c.start - top) * k) / 6;
        const ours: number = place(cold, y, "posterior", AutoMovieHumanHeadMassCurves.value(c.outlines.posterior, y, c.length)[0])[0];
        const near: V3[] = mid.filter((p: V3): boolean => Math.abs(p[1] - y) < 1);
        const ref: number | null = near.length === 0 ? null : Math.min(...near.map((p: V3): number => p[0]));
        nape.push({ y, ours, reference: ref, offset: ref === null ? null : ours - ref });
      }
      const v: NodeArmDraw.IView = NodeArmDraw.open([0, 0, 1], [...back, ...mid.filter((p: V3): boolean => p[1] > c.start - 20)]);
      NodeArmDraw.dots(v, mid, "#d03030", 2.2);
      NodeArmDraw.line(v, back, "#8040c0", 2.2);
      for (const n of nape) {
        NodeArmDraw.line(v, [[n.ours, n.y, 0], [n.reference ?? n.ours, n.y, 0]], "#008000", 1.6);
        NodeArmDraw.text(v, [n.ours, n.y, 0], n.offset === null ? "no reference" : `${n.offset.toFixed(1)} mm`, "#006000");
      }
      NodeArmDraw.caption(v, ["f1 head/neck posterior midline (violet) over the registered reference's midsagittal points (red), side view", "green: the offset ours - reference along X at seven heights from the opisthocranion to the port (negative: ours behind)"]);
      write("head.posterior.nape.png", v);
    }

    // Each datum station's section in its own plane against the reference's vertices within 1 mm of that plane, seen along the plane's normal.
    for (const [label, s] of [...Object.entries(cold.b.curves.stations).filter(([name]: [string, number]): boolean => name !== "vertex"), ...traced.map((y: number): [string, number] => [`trace${y.toFixed(1)}`, y])]) {
      const f: { origin: V3; u: V3; v: V3 } = cold.b.course.frame(s);
      const w: V3 = NodeArmDraw.cross(f.v, f.u);
      const band: V3[] = reference.points.filter((p: V3): boolean => Math.abs(NodeArmDraw.dot(NodeArmDraw.sub(p, f.origin), w)) < 1);
      const ring: V3[] = sectionRing(cold, s);
      const v: NodeArmDraw.IView = NodeArmDraw.open(NodeArmDraw.scale(w, -1), [...ring, ...band.filter((p: V3): boolean => Math.hypot(...NodeArmDraw.sub(p, f.origin)) < 160)]);
      NodeArmDraw.dots(v, band, "#d03030", 2.2);
      NodeArmDraw.line(v, ring, "#000000", 1.6);
      // The actual chain's ring there, reliefs included (blue).
      if (cold.chain !== null) NodeArmDraw.line(v, AutoMovieLoftChain.ring(cold.chain, s + cold.b.course.shift, Array.from({ length: 145 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 144)), "#1060ff", 1.4);
      const D: AutoMovieHumanHeadFrankfort.IDims = cold.b.frame.dims;
      for (const [half, colour] of [[D.bizygomatic / 2, "#d03030"], [D.frontal / 2, "#3050d0"], [D.bigonial / 2, "#30a030"], [D.bitragion / 2, "#202020"]] as [number, string][])
        for (const z of [half, -half]) NodeArmDraw.line(v, [NodeArmDraw.add(f.origin, NodeArmDraw.add(NodeArmDraw.scale(f.u, -30), NodeArmDraw.scale(f.v, z))), NodeArmDraw.add(f.origin, NodeArmDraw.add(NodeArmDraw.scale(f.u, 130), NodeArmDraw.scale(f.v, z)))], colour, 0.8, [4, 2]);
      NodeArmDraw.caption(v, [`f1 head/neck, section at ${label} (station ${s.toFixed(1)} mm, plane origin y ${f.origin[1].toFixed(1)} above FH), seen along its normal`, "black = analytic conic section, blue = the actual chain with its reliefs, red = reference vertices within 1 mm of the plane", "dashed half breadths: red zy-zy, blue ft-ft, green go-go, black t-t"]);
      write(`head.section.${label}.png`, v);
    }
    if (cold.chain !== null)
      for (const [camera, forward] of CAMERAS.filter(([name]: [string, V3]): boolean => name === "front" || name === "left" || name === "front-left-low")) {
        const v: NodeArmDraw.IView = NodeArmDraw.open(forward, bounds);
        NodeHeadTrace.curvature(v, cold.chain);
        for (const y of traced) NodeArmDraw.line(v, [[P.op[0], y, 0], [P.g[0] + 20, y, 0]], "#00a000", 1.2, [4, 3]);
        NodeArmDraw.caption(v, [`f1 head/neck, ${camera}, the chain's curvature along the station (second difference of 1 mm rings on the outward normal): blue concave, red convex, saturated at 0.05 /mm`, `traced heights (green): ${traced.map((y: number): string => y.toFixed(1)).join(", ") || "none"}`]);
        write(`head.${camera}.curvature.png`, v);
      }
    const drawn: number = performance.now();

    fs.writeFileSync(
      path.join(out, "manifest.json"),
      JSON.stringify(
        {
          person: "f1",
          head: cold.b.head,
          stature: cold.b.measures.stature,
          landmarks: cold.b.frame.list,
          dims: cold.b.frame.dims,
          arcs: cold.b.frame.arcs,
          gaps: cold.b.frame.gaps,
          placement: { forward: cold.b.placement.forward, tragion: cold.b.placement.tragion, relative: cold.b.placement.frame.relative },
          course: { base: cold.b.course.base, start: cold.b.course.start, length: cold.b.course.length },
          neckBase: { station: cold.b.neckBase.station, plane: cold.b.neckBase.plane, origin: cold.b.neckBase.origin, extents: cold.b.neckBase.extents, shoulder: cold.b.neckBase.shoulder },
          throat: { lean: cold.b.throat.lean, submental: cold.b.throat.submental, ij: cold.b.throat.ij, gn: cold.b.throat.gn, corner: cold.b.throat.corner, from: cold.b.throat.from, shoulder: cold.b.throat.shoulder, to: cold.b.throat.to, basis: cold.b.throat.basis },
          stations: cold.b.curves.stations,
          outlines: cold.b.curves.outlines,
          fullness: cold.b.curves.fullness,
          tapes: cold.b.curves.tapes,
          checks: cold.b.curves.checks,
          curveDiagnostics: cold.b.curves.diagnostics,
          chainTapes: chainTapes(cold),
          trace: cold.chain === null ? [] : NodeHeadTrace.layers(cold.chain, cold.b.curves, cold.b.course.shift, traced),
          jawStep: cold.chain === null ? [] : NodeHeadTrace.jawStep(cold.chain, cold.b.course.shift, P.me),
          upright: {
            pitchDegrees: (AutoMovieHumanHeadF1Pose.PITCH * 180) / Math.PI,
            roundTripMm: AutoMovieHumanHeadF1Pose.roundTrip(cold.b.frame.list.map((l: AutoMovieHumanHeadFrankfort.ILandmark): V3 => AutoMovieHumanHeadF1Pose.frankfort(l.point))),
            worldRoundTripMm: Math.max(...cold.b.frame.list.map((l: AutoMovieHumanHeadFrankfort.ILandmark): number => Math.max(...AutoMovieHumanHeadF1Pose.head(AutoMovieHumanHeadF1Pose.world(l.point)).map((c: number, i: number): number => Math.abs(c - l.point[i]!))))),
          },
          ripple: ((chain: IAutoMovieLoftChain | null): ReturnType<typeof NodeHeadTrace.ripple>[] => (chain === null ? [] : [90, 70, 20, -20, -40].map((y: number): ReturnType<typeof NodeHeadTrace.ripple> => NodeHeadTrace.ripple(chain, y))))(cold.chain),
          curvesMs: { cold: cold.b.curves.ms, retained: retained.b.curves.ms },
          nape,
          pose,
          deviation,
          loftDiagnostics: cold.loft.loft.diagnostics,
          ears: cold.ears.map((e: AutoMovieHumanHeadEarLoft.IEar): { side: string; surface: boolean; diagnostics: unknown } => ({ side: e.side, surface: e.loft.chain !== null, diagnostics: e.loft.diagnostics })),
          surface: cold.loft.loft.surface !== null,
          layers: { part: cold.loft.part.stations.length, chain: cold.chain?.layers.length ?? 0 },
          registration: reference.measures,
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
  const STAGES: string[] = ["2D view curves + aids over registered reference", "loft curves", "loft curves over clay", "clay"];

  /** Cameras: name and viewing direction (head frame: +X anterior, +Y up, +Z right). */
  const CAMERAS: [string, V3][] = [
    ["front", [-1, 0, 0]],
    ["left", [0, 0, 1]],
    ["top", [0, -1, 0]],
    ["front-left-high", [-1, -0.5, 1]],
    ["front-left-low", [-1, 0.6, 1]],
    ["back-right-low", [1, 0.35, -1]],
  ];

  /** The individual stage-1 frames. */
  const INDIVIDUAL: [Curve, string[]][] = [
    ["anterior", ["left"]],
    ["posterior", ["left"]],
    ["lateral", ["front"]],
    ["axis", ["left"]],
    ["fullness", ["top", "front-left-high"]],
  ];

  /** One kind of view curve shown alone. */
  type Curve = Label | "axis" | "fullness";

  /** One complete build with its stage timings. */
  interface IBuild {
    b: AutoMovieHumanHeadBuild.IOutput;
    loft: AutoMovieHumanHeadMassLoft.IOutput;
    chain: IAutoMovieLoftChain | null;
    ears: AutoMovieHumanHeadEarLoft.IEar[];
    ms: Record<string, number>;
  }

  function build(params: Awaited<ReturnType<typeof HumanNodeInput.of>>["parameters"], override?: { length: number }): IBuild {
    const b: AutoMovieHumanHeadBuild.IOutput = AutoMovieHumanHeadBuild.create(params, override);
    const t0: number = performance.now();
    const loft: AutoMovieHumanHeadMassLoft.IOutput = AutoMovieHumanHeadMassLoft.create({ curves: b.curves, axis: b.course.axis, shift: b.course.shift, order: 32, samples: 128, gap: 6 });
    const t1: number = performance.now();
    const ears: AutoMovieHumanHeadEarLoft.IEar[] = AutoMovieHumanHeadEarLoft.create(b.frame.dims.bitragion / 2);
    const ms: Record<string, number> = { ...b.ms, loft: t1 - t0, ears: performance.now() - t1 };
    ms.originals = b.ms.frame + b.ms.port + b.ms.course + b.ms.curves;
    return { b, loft, chain: loft.loft.chain, ears, ms };
  }

  /** The auricles' clay: each ear's chain on a station-phase grid in its own frame, carried into the head frame. */
  function earTriangles(ears: readonly AutoMovieHumanHeadEarLoft.IEar[]): [V3, V3, V3][] {
    const out: [V3, V3, V3][] = [];
    for (const ear of ears) {
      const chain: IAutoMovieLoftChain | null = ear.loft.chain;
      if (chain === null) continue;
      const phases: number[] = Array.from({ length: 96 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 96);
      const rows: V3[][] = sampleStations(chain, 0.5).map((y: number): V3[] => AutoMovieLoftChain.ring(chain, y, phases).map((p: number[]): V3 => ear.place(p)));
      for (let i: number = 0; i + 1 < rows.length; ++i)
        for (let k: number = 0; k < phases.length; ++k) {
          const k1: number = (k + 1) % phases.length;
          out.push([rows[i]![k]!, rows[i + 1]![k]!, rows[i + 1]![k1]!], [rows[i]![k]!, rows[i + 1]![k1]!, rows[i]![k1]!]);
        }
    }
    return out;
  }

  /** A point of an outline in the head frame. */
  function place(b: IBuild, s: number, label: Label, value: number, mirror: boolean = false): V3 {
    const f: { origin: V3; u: V3; v: V3 } = b.b.course.frame(s);
    const d: V3 = label === "anterior" ? f.u : label === "posterior" ? NodeArmDraw.scale(f.u, -1) : NodeArmDraw.scale(f.v, mirror ? -1 : 1);
    return NodeArmDraw.add(f.origin, NodeArmDraw.scale(d, value));
  }

  /** Stage 1: the view curves along the course (all, or one kind alone), with their aids and landmarks. */
  function drawSpecs(v: NodeArmDraw.IView, b: IBuild, only: Curve | null): void {
    const c: typeof b.b.curves = b.b.curves;
    for (const aid of c.aids) {
      if (only !== null && !aidBelongs(aid, only)) continue;
      const style: [string, number, number[]] = AID_STYLE[aid.kind] ?? ["#999999", 1, []];
      NodeArmDraw.line(v, aid.points, style[0], style[1], style[2]);
    }
    if (only === null || only === "fullness") drawRings(v, b);
    for (const label of AutoMovieHumanHeadMassCurves.LABELS) {
      if (only !== null && only !== label) continue;
      const n: number = 300;
      const at: (k: number, mirror: boolean) => V3 = (k: number, mirror: boolean): V3 => {
        const s: number = c.start + ((c.length - c.start) * k) / n;
        return place(b, s, label, AutoMovieHumanHeadMassCurves.value(c.outlines[label], s, c.length)[0], mirror);
      };
      NodeArmDraw.line(v, Array.from({ length: n + 1 }, (_: unknown, k: number): V3 => at(k, false)), LABEL_COLOUR[label], 2.2);
      if (label === "lateral") NodeArmDraw.line(v, Array.from({ length: n + 1 }, (_: unknown, k: number): V3 => at(k, true)), LABEL_COLOUR[label], 2.2, [6, 3]);
    }
    for (const l of b.b.frame.list) {
      NodeArmDraw.dots(v, [l.point as V3], "#000000", 5);
      if (only !== null) NodeArmDraw.text(v, l.point as V3, l.name, "#303030");
    }
  }

  /** The analytic conic section at a station, 145 points in its own plane, head frame. */
  function sectionRing(b: IBuild, s: number): V3[] {
    const c: typeof b.b.curves = b.b.curves;
    const at: (l: Label) => number = (l: Label): number => AutoMovieHumanHeadMassCurves.value(c.outlines[l], s, c.length)[0];
    const front: number = AutoMovieHumanHeadMassCurves.fullness(c.fullness.anterior, s);
    const back: number = AutoMovieHumanHeadMassCurves.fullness(c.fullness.posterior, s);
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of({ extents: [at("anterior"), at("lateral"), at("posterior"), at("lateral")] }, [front, back, back, front]);
    const f: { origin: V3; u: V3; v: V3 } = b.b.course.frame(s);
    return Array.from({ length: 145 }, (_: unknown, k: number): V3 => {
      const phi: number = (2 * Math.PI * k) / 144;
      const r: number = AutoMovieViewSection.radius(section, phi)[0];
      return NodeArmDraw.add(f.origin, NodeArmDraw.add(NodeArmDraw.scale(f.u, r * Math.cos(phi)), NodeArmDraw.scale(f.v, r * Math.sin(phi))));
    });
  }

  /** The top view: the analytic sections at every datum station. */
  function drawRings(v: NodeArmDraw.IView, b: IBuild): void {
    for (const [name, s] of Object.entries(b.b.curves.stations)) if (name !== "vertex") NodeArmDraw.line(v, sectionRing(b, s), "#000000", 1.2);
  }

  /** Caption lines: each closed tape with its target and reached length, the checks and the solver's notes. */
  function tapeLines(b: IBuild): string[] {
    const cva: number = (Math.atan2(b.b.placement.tragion - b.b.trunk.frames.heights.cervicale, b.b.placement.forward) * 180) / Math.PI;
    return [
      `CVA (C7 to tragion above the horizontal) ${cva.toFixed(2)} deg; the level course keeps every section level and drifts its origin from the neck port to the head axis`,
      ...b.b.curves.tapes.map((t: AutoMovieHumanHeadMassCurves.ITape): string => `${t.name}: ${t.reached.toFixed(2)} / ${t.target.toFixed(2)} mm (solves ${t.solves})`),
      ...b.b.curves.checks.map((c: { name: string; value: number }): string => `check ${c.name}: ${c.value.toFixed(1)} mm`),
      ...b.b.curves.diagnostics,
    ];
  }

  /** Whether an aid belongs to one curve's own drawing. */
  function aidBelongs(aid: AutoMovieHumanArmCurveSpec.IAid, only: Curve): boolean {
    if (only === "axis") return aid.kind === "axis" || aid.kind === "plane" || aid.kind === "tick";
    if (only === "fullness") return aid.kind === "rectangle";
    return aid.name.startsWith(only) || aid.kind === "tick" || (only !== "lateral" && aid.kind === "chord") || aid.kind === "plane";
  }

  /** Stages 2 and 3: the actual loft's layer rings, its four guides and its course. */
  function drawLoft(v: NodeArmDraw.IView, b: IBuild): void {
    if (b.chain === null) {
      NodeArmDraw.caption(v, ["", "", `NO CHAIN: ${b.loft.loft.diagnostics.map((d: { detail: string }): string => d.detail).join(" | ").slice(0, 160)}`]);
      return;
    }
    const chain: IAutoMovieLoftChain = b.chain;
    const ring: number[] = Array.from({ length: 65 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 64);
    for (const layer of chain.layers) NodeArmDraw.line(v, AutoMovieLoftChain.ring(chain, layer.y, ring), "#505050", 0.7);
    const ys: number[] = sampleStations(chain, 1);
    const guideColour: string[] = [LABEL_COLOUR.anterior, LABEL_COLOUR.lateral, LABEL_COLOUR.posterior, LABEL_COLOUR.lateral];
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((phase: number, k: number): void => {
      NodeArmDraw.line(v, ys.map((y: number): V3 => AutoMovieLoftChain.point(chain, y, phase)), guideColour[k]!, 2);
    });
    NodeArmDraw.line(v, chain.layers.map((l: IAutoMovieLoftChain.ILayer): V3 => AutoMovieLoftChain.axis(chain, l.y)), "#888888", 1, [4, 3]);
    const port: V3[] = AutoMovieLoftChain.ring(chain, chain.layers[0]!.y, ring);
    NodeArmDraw.line(v, port, "#ff7a00", 3, [8, 4]);
    NodeArmDraw.text(v, port[0]!, "port: the trunk's S00 end", "#c05a00");
  }

  /** Ticks across the lateral outline at the gonion (go-go/2) and at the menton's height (the neck's half breadth), both sides, in each station's plane. */
  function drawJaw(v: NodeArmDraw.IView, b: IBuild): void {
    const c: typeof b.b.curves = b.b.curves;
    for (const [name, colour] of [["go", "#ff00aa"], ["me", "#00a0ff"]] as [string, string][]) {
      const s: number | undefined = c.stations[name];
      if (s === undefined) continue;
      const half: number = AutoMovieHumanHeadMassCurves.value(c.outlines.lateral, s, c.length)[0];
      for (const sign of [1, -1]) {
        NodeArmDraw.line(v, [place(b, s, "lateral", half - 12, sign < 0), place(b, s, "lateral", half + 12, sign < 0)], colour, 2.4);
        if (sign > 0) NodeArmDraw.text(v, place(b, s, "lateral", half + 14, false), `${name} ${half.toFixed(1)}`, colour);
      }
    }
  }

  /** The trunk's S00 end ring (its spec's conic section, carried into the head frame) and the front step between S00's front extent and the head's throat contour at the port. */
  function drawPort(v: NodeArmDraw.IView, b: IBuild): void {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const back: AutoMovieHumanArmCurveSpec.ITransform = S.inverse(b.b.world);
    const ring: V3[] = b.b.neckBase.ring(96).map((p: V3): V3 => S.apply(back, p) as V3);
    NodeArmDraw.line(v, [...ring, ring[0]!], "#0060ff", 2.4, [3, 3]);
    const c: V3 = b.b.course.base.centre as V3;
    const trunk: V3 = [c[0] + b.b.neckBase.extents[0][0], c[1], 0];
    const head: V3 = [b.b.throat.at(c[1])[0], c[1], 0];
    NodeArmDraw.line(v, [trunk, head], "#ff0000", 3);
    NodeArmDraw.dots(v, [trunk], "#0060ff", 6);
    NodeArmDraw.dots(v, [head], "#ff0000", 6);
    NodeArmDraw.text(v, head, `front step ${(head[0] - trunk[0]).toFixed(1)} mm (red head contour, blue S00 end)`, "#c00000");
  }

  /** Stations from the first to the last layer at about the given step. */
  function sampleStations(chain: IAutoMovieLoftChain, step: number): number[] {
    const a: number = chain.layers[0]!.y;
    const z: number = chain.layers[chain.layers.length - 1]!.y;
    const n: number = Math.max(2, Math.ceil((z - a) / step));
    return Array.from({ length: n + 1 }, (_: unknown, k: number): number => a + ((z - a) * k) / n);
  }

  /**
   * Clay triangles: a station-phase grid of the actual chain, fanned to its
   * pole. 512 phases: the face's vertical streaks were this grid's flat
   * facets at 128 phases (4.9 mm wide at the face), not the chain (traced
   * 2026-11-08 13:36, `ripple` in the manifest: the chain's curvature along
   * the station varies with phase by 0.0003 /mm rms on the forehead, with no
   * period at 11.25 or 2.8 degrees).
   */
  function triangles(chain: IAutoMovieLoftChain | null): [V3, V3, V3][] {
    if (chain === null) return [];
    const phases: number[] = Array.from({ length: 512 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 512);
    const rows: V3[][] = sampleStations(chain, 1).map((y: number): V3[] => AutoMovieLoftChain.ring(chain, y, phases));
    const out: [V3, V3, V3][] = [];
    for (let i: number = 0; i + 1 < rows.length; ++i)
      for (let k: number = 0; k < phases.length; ++k) {
        const k1: number = (k + 1) % phases.length;
        out.push([rows[i]![k]!, rows[i + 1]![k]!, rows[i + 1]![k1]!], [rows[i]![k]!, rows[i + 1]![k1]!, rows[i]![k1]!]);
      }
    // Each pole fans to the ring nearest it (the vertex to the top row): a
    // fan from the vertex to the bottom row crossed the head and stood out of
    // the concave nape and the crown (renders 2026-11-08 06:34-07:21).
    const first: V3[] = rows[0]!;
    const last: V3[] = rows[rows.length - 1]!;
    for (const pole of [chain.pole?.point, chain.opposite?.point]) {
      if (pole === undefined) continue;
      const p: V3 = pole as V3;
      const row: V3[] = Math.hypot(...NodeArmDraw.sub(p, first[0]!)) < Math.hypot(...NodeArmDraw.sub(p, last[0]!)) ? first : last;
      for (let k: number = 0; k < phases.length; ++k) out.push([p, row[k]!, row[(k + 1) % phases.length]!]);
    }
    return out;
  }

  /**
   * The tapes read again on the actual loft chain: the head circumference as
   * the 1440-gon ring at the glabella station, and each bitragion arc as the
   * chain's cut by the plane through the tragia and its midline point, with
   * the analytic arcs' sampling (each sample's station located on the course,
   * then the anterior-right ring phase whose offset along `u` matches,
   * by bisection on [0, pi/2]; 64 and 32 even steps, Richardson).
   */
  function chainTapes(b: IBuild): { name: string; target: number; analytic: number; chain: number }[] {
    if (b.chain === null) return [];
    const chain: IAutoMovieLoftChain = b.chain;
    const P: Record<AutoMovieHumanHeadFrankfort.Name, V3> = b.b.frame.points;
    const phases: number[] = Array.from({ length: 1440 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 1440);
    const ring: V3[] = AutoMovieLoftChain.ring(chain, b.b.curves.stations.g!, phases);
    let circumference: number = 0;
    for (let k: number = 0; k < ring.length; ++k) circumference += Math.hypot(...NodeArmDraw.sub(ring[(k + 1) % ring.length]!, ring[k]!));
    const arc: (p: V3) => number = (p: V3): number => {
      const pts: V3[] = [];
      for (let k: number = 0; k <= 64; ++k) {
        const s: number = 1 - (1 - k / 64) ** 2;
        const located: { station: number; offset: number } = b.b.course.locate([s * p[0], s * p[1], 0]);
        const f: { origin: V3; u: V3 } = b.b.course.frame(located.station);
        let lo: number = 0;
        let hi: number = Math.PI / 2;
        for (let i: number = 0; i < 50; ++i) {
          const mid: number = (lo + hi) / 2;
          if (NodeArmDraw.dot(NodeArmDraw.sub(AutoMovieLoftChain.point(chain, located.station, mid), f.origin), f.u) > located.offset) lo = mid;
          else hi = mid;
        }
        pts.push(AutoMovieLoftChain.point(chain, located.station, (lo + hi) / 2));
      }
      const chords: (step: number) => number = (step: number): number => {
        let length: number = 0;
        for (let k: number = step; k <= 64; k += step) length += Math.hypot(...NodeArmDraw.sub(pts[k]!, pts[k - step]!));
        return length;
      };
      return 2 * ((4 * chords(1) - chords(2)) / 3);
    };
    const by: (name: string) => AutoMovieHumanHeadMassCurves.ITape = (name: string): AutoMovieHumanHeadMassCurves.ITape => b.b.curves.tapes.find((t: AutoMovieHumanHeadMassCurves.ITape): boolean => t.name === name)!;
    return [
      { name: "head circumference", target: by("head circumference").target, analytic: by("head circumference").reached, chain: circumference },
      { name: "bitragion menton arc", target: by("bitragion menton arc").target, analytic: by("bitragion menton arc").reached, chain: arc(P.me) },
      { name: "bitragion subnasale arc", target: by("bitragion subnasale arc").target, analytic: by("bitragion subnasale arc").reached, chain: arc(P.sn) },
      { name: "bitragion minimum frontal arc", target: by("bitragion minimum frontal arc").target, analytic: by("bitragion minimum frontal arc").reached, chain: arc(P.g) },
    ];
  }

  function every(points: V3[], k: number): V3[] {
    return points.filter((_: V3, i: number): boolean => i % k === 0);
  }

  /** Outline colours. */
  const LABEL_COLOUR: Record<Label, string> = { anterior: "#e07000", posterior: "#8040c0", lateral: "#008080" };

  /** Aid styles: colour, width, dash. */
  const AID_STYLE: Record<string, [string, number, number[]]> = {
    axis: ["#7a7a7a", 1, [6, 3]],
    rectangle: ["#9fa8ff", 0.8, [3, 3]],
    chord: ["#b4b4b4", 0.8, [2, 2]],
    tick: ["#202020", 1.2, []],
    division: ["#8a8a8a", 1, []],
    tangent: ["#1a9fff", 1, []],
    extremum: ["#ff2bd6", 1, [2, 2]],
    plane: ["#ff8a00", 1.4, [5, 2]],
    polygon: ["#3cba3c", 0.8, [1, 2]],
  };
}

void NodeHeadSpecs.run().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
