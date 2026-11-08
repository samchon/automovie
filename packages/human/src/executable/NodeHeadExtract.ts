import fs from "node:fs";
import path from "node:path";
import type { IAutoMovieModel } from "@automovie/interface";
import { AutoMovieHumanHeadF1Pose } from "../generation/head/AutoMovieHumanHeadF1Pose";
import { HumanReferenceExtract } from "../inspection/HumanReferenceExtract";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeArmDraw } from "./NodeArmDraw";
import { NodeHeadReference } from "./NodeHeadReference";

type V3 = [number, number, number];
type V2 = [number, number];

/**
 * Reverse extraction of f1's head lines from her reference in her own pose
 * (owner's approval, 2026-11-08 15:4x): her midsagittal profile, her front
 * silhouette and her level sections, read in her upright world frame about
 * the tragia (her loaded points less the receipt's origin, native axes:
 * `AutoMovieHumanHeadF1Pose`), reduced to the fewest knots within 0.5 mm
 * (Douglas-Peucker with her receipt's landmarks pinned), then re-based into
 * the head frame by the pose map's exact inverse. A reader for the modeler's
 * eye check, not a generation input: the knots it prints are copied into
 * `AutoMovieHumanHeadF1Lines` only after their overlay over her is checked.
 *
 * Her mesh is a lofted capture with hatching, holes and saw-toothed slices,
 * open at the mouth, nose and orbits. So every reading takes her outermost
 * point per bin (interiors fall inside it), skips empty bins (holes), and
 * takes the median over five neighbouring bins (the saw-tooth) before the
 * reduction.
 */
export namespace NodeHeadExtract {
  /** The reduction's tolerance, mm. */
  const TOLERANCE: number = 0.5;

  /** Her receipt's midsagittal landmarks in the head frame `[x, y]` (receipt `measure-2026-11-08T04-37-17-243Z`, landmarks; the cervical point from readings.cervical), the reduction's pinned knots. */
  const PINS: Record<string, V2> = {
    g: [105.45286389710866, 39.96726293714429],
    n: [100.63684737517936, 14.365917344722126],
    prn: [117.5415287621849, -24.853849066361587],
    sn: [100.11761458641418, -44.91258830613397],
    ls: [101.81941966356364, -50.57149931791409],
    sto: [93.75358744478332, -60.84748907753942],
    li: [96.11737339661859, -67.3492918073497],
    pg: [85.9933712585152, -80.9083318718205],
    gn: [84.52690227622897, -89.4204707181581],
    me: [72.54286526962228, -101.01668738059104],
    c: [35.1, -97.0],
  };

  /** Runs the extraction and writes its overlays, `extract.json` and the knots as TypeScript under `.shots/f1_head/extract-<stamp>/`. */
  export function run(): void {
    const F: typeof AutoMovieHumanHeadF1Pose = AutoMovieHumanHeadF1Pose;
    const O: V3 = F.ORIGIN;
    // Her loaded world points (Z to her right, native Z negated) in her upright frame: the native point less the receipt's origin.
    const world: V3[] = NodeHeadReference.load(1350);
    const up: V3[] = world.map((w: V3): V3 => [w[0] - O[0], w[1] - O[1], -w[2] - O[2]]);
    const toWorld: (u: V3) => V3 = (u: V3): V3 => [u[0] + O[0], u[1] + O[1], -(u[2] + O[2])];
    const head: (u: V3) => V3 = (u: V3): V3 => F.frankfort(u) as V3;
    const upright: (h: V3) => V3 = (h: V3): V3 => F.upright(h) as V3;

    // Her mesh's triangles near the head in her upright frame, for exact plane cuts: a vertex band (the first reading, `extract-2026-11-08T06-45-14-617Z`) was too sparse under the chin, where the loop fell into her open mouth's interior, and drew her slices' saw teeth.
    const mesh: HumanReferenceExtract.IMesh = HumanReferenceExtract.triangles(JSON.parse(fs.readFileSync(HumanNodePaths.resolve("test/.shots/f1/reference-model.json"), "utf8")) as IAutoMovieModel);
    const tris: [V3, V3, V3][] = [];
    const vertex: (i: number) => V3 = (i: number): V3 => [mesh.positions[3 * i]! - O[0], mesh.positions[3 * i + 1]! - O[1], mesh.positions[3 * i + 2]! - O[2]];
    for (let t: number = 0; 3 * t + 2 < mesh.indices.length; ++t) {
      const tri: [V3, V3, V3] = [vertex(mesh.indices[3 * t]!), vertex(mesh.indices[3 * t + 1]!), vertex(mesh.indices[3 * t + 2]!)];
      if (tri.some((u: V3): boolean => u[1] > -170 && Math.abs(u[2]) < 150)) tris.push(tri);
    }
    // The exact crossings of her triangles' edges with the plane `dot(u, n) = c`.
    const cut: (n: V3, c: number) => V3[] = (n: V3, c: number): V3[] => {
      const out: V3[] = [];
      for (const tri of tris)
        for (let k: number = 0; k < 3; ++k) {
          const p: V3 = tri[k]!;
          const q: V3 = tri[(k + 1) % 3]!;
          const dp: number = p[0] * n[0] + p[1] * n[1] + p[2] * n[2] - c;
          const dq: number = q[0] * n[0] + q[1] * n[1] + q[2] * n[2] - c;
          if (dp >= 0 === dq >= 0) continue;
          const w: number = dp / (dp - dq);
          out.push([p[0] + w * (q[0] - p[0]), p[1] + w * (q[1] - p[1]), p[2] + w * (q[2] - p[2])]);
        }
      return out;
    };

    // 1. The midsagittal loop: her mesh cut exactly by her midsagittal plane (head Z = 0, `dot(AXES[2], u) = 0`), outermost per 0.5 degree about a centre 20 mm above the tragia on the head axis, median of seven bins.
    const centre: V3 = upright([0, 20, 0]);
    // Her open mouth's interior (head frame 10 < x < 80, y -96..-35, inside the lips, the chin and the submental skin) is left out: where her submental cut has gaps, the outermost point of a bin fell on it (`extract-2026-11-08T06-52-43-181Z`, the submental knots jogging 2.5 mm).
    const band: V3[] = cut(F.AXES[2], 0).filter((u: V3): boolean => head(u)[1] > -140 && !(head(u)[0] > 10 && head(u)[0] < 80 && head(u)[1] > -96 && head(u)[1] < -35));
    const loop: V3[] = polar(band, 0.5, (u: V3): V2 => [u[0] - centre[0], u[1] - centre[1]]).map((p: V2): V3 => [centre[0] + p[0], centre[1] + p[1], 0]);
    const loopHead: V3[] = loop.map(head);

    // 2. The front silhouette: her largest half breadth on each side of an exact level cut every 1 mm of upright height, the auricles excluded (the head frame's box y -34..35, her lobule's lowest rim to her helix's top,, x -40..12 beyond 55 mm, where the ear stands outside the cranium); the two sides averaged (the outline is symmetric), median of five.
    const ear: (h: V3) => boolean = (h: V3): boolean => h[1] > -34 && h[1] < 35 && h[0] > -40 && h[0] < 12 && Math.abs(h[2]) > 55;
    const lateralRaw: { y: number; right: number; left: number }[] = [];
    for (let y: number = -140; y <= 128; y += 1) {
      const row: V3[] = cut([0, 1, 0], y).filter((u: V3): boolean => !ear(head(u)));
      const right: number = Math.max(...row.filter((u: V3): boolean => u[2] > 0).map((u: V3): number => u[2]));
      const left: number = Math.max(...row.filter((u: V3): boolean => u[2] < 0).map((u: V3): number => -u[2]));
      if (Number.isFinite(right) && Number.isFinite(left)) lateralRaw.push({ y, right, left });
    }
    const lateralHalf: number[] = median(lateralRaw.map((r: { right: number; left: number }): number => (r.right + r.left) / 2), 2);
    // The posed reading (`AutoMovieHumanHeadMassCurves.posed`) puts a lateral knot's head height y at upright height y * upright([0, 1, 0])[1]: the inverse.
    const rise: number = upright([0, 1, 0])[1];
    const lateral: V2[] = lateralRaw.map((r: { y: number }, i: number): V2 => [r.y / rise, lateralHalf[i]!]);

    // 3. Level sections in her upright frame every 30 mm (display and check; no section family consumes them yet).
    const sections: { y: number; ring: V3[]; knots: V3[] }[] = [];
    for (let y: number = -110; y <= 110; y += 30) {
      const slab: V3[] = cut([0, 1, 0], y);
      if (slab.length < 50) continue;
      const cx: number = slab.reduce((s: number, u: V3): number => s + u[0], 0) / slab.length;
      const ring: V3[] = polar(slab, 2, (u: V3): V2 => [u[0] - cx, u[2]]).map((p: V2): V3 => [cx + p[0], y, p[1]]);
      const kept: number[] = reduce(ring.map((u: V3): V2 => [u[0], u[2]]), [0, ring.length - 1]);
      sections.push({ y, ring, knots: kept.map((k: number): V3 => ring[k]!) });
    }

    // The reduction of each F1Lines segment on the loop (head frame), its ends and landmarks pinned.
    const segment: (name: string, keep: (h: V3) => boolean, order: (h: V3) => number) => V2[] = (name: string, keep: (h: V3) => boolean, order: (h: V3) => number): V2[] => {
      const run: V3[] = loopHead.filter(keep).sort((a: V3, b: V3): number => order(a) - order(b));
      if (run.length < 2) throw new Error(`extract: segment ${name} is empty`);
      const xy: V2[] = run.map((h: V3): V2 => [h[0], h[1]]);
      const pins: number[] = [0, xy.length - 1];
      for (const p of Object.values(PINS)) {
        if (!(p[1] > Math.min(...xy.map((q: V2): number => q[1])) && p[1] < Math.max(...xy.map((q: V2): number => q[1])))) continue;
        let best: number = 0;
        xy.forEach((q: V2, i: number): void => {
          if (Math.hypot(q[0] - p[0], q[1] - p[1]) < Math.hypot(xy[best]![0] - p[0], xy[best]![1] - p[1])) best = i;
        });
        if (Math.hypot(xy[best]![0] - p[0], xy[best]![1] - p[1]) < 3) pins.push(best);
      }
      return reduce(xy, pins).map((k: number): V2 => xy[k]!);
    };
    const anterior: V2[] = segment("anterior", (h: V3): boolean => h[0] > 0 && h[1] >= 55 && h[1] <= 118, (h: V3): number => h[1]);
    const posterior: V2[] = segment("posterior", (h: V3): boolean => h[0] < 0 && h[1] >= -82 && h[1] <= 113, (h: V3): number => h[1]);
    const nose: V2[] = segment("nose", (h: V3): boolean => h[0] > 100 && h[1] >= -34 && h[1] <= -3, (h: V3): number => h[1]);
    const throat: V2[] = segment("throat", (h: V3): boolean => h[0] > 10 && h[0] < 36 && h[1] >= -131 && h[1] <= -96.5, (h: V3): number => h[1]);
    const submental: V2[] = segment("submental", (h: V3): boolean => h[0] >= 35 && h[0] <= 73 && h[1] < -94, (h: V3): number => h[0]);
    const lateralRange: V2[] = lateral.filter((p: V2): boolean => p[0] >= -96 && p[0] <= 117);
    const euryon: number = lateralRange.reduce((b: number, p: V2, i: number): number => (p[1] > lateralRange[b]![1] ? i : b), 0);
    const lateralKnots: V2[] = reduce(lateralRange.map((p: V2): V2 => [p[1], p[0]]), [0, lateralRange.length - 1, euryon]).map((k: number): V2 => lateralRange[k]!);

    // Overlays in her world: her points grey, the raw readings thin, the knots as dots.
    const stamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_head/extract-${stamp}`);
    fs.mkdirSync(out, { recursive: true });
    const mid: (p: V2) => V3 = (p: V2): V3 => toWorld(upright([p[0], p[1], 0]));
    const lat: (p: V2, sign: number) => V3 = (p: V2, sign: number): V3 => toWorld([0, upright([0, p[0], 0])[1], sign * p[1]]);
    const her: V3[] = world.filter((w: V3): boolean => w[1] > O[1] - 150);
    const midBand: V3[] = band.map(toWorld);
    const draw: (name: string, forward: V3, bounds: V3[], body: (v: NodeArmDraw.IView) => void, caption: string) => void = (name: string, forward: V3, bounds: V3[], body: (v: NodeArmDraw.IView) => void, caption: string): void => {
      const v: NodeArmDraw.IView = NodeArmDraw.open(forward, bounds);
      body(v);
      NodeArmDraw.caption(v, [caption, "her loaded mesh points in her world (grey or red), the raw reading (thin), the reduced knots within 0.5 mm (dots)"]);
      fs.writeFileSync(path.join(out, name), NodeArmDraw.png(v));
    };
    const midlines: [string, V2[], string][] = [
      ["anterior", anterior, "#e07000"],
      ["posterior", posterior, "#8040c0"],
      ["nose", nose, "#c06000"],
      ["throat", throat, "#c00060"],
      ["submental", submental, "#c00060"],
    ];
    const sideBody: (v: NodeArmDraw.IView) => void = (v: NodeArmDraw.IView): void => {
      NodeArmDraw.dots(v, midBand, "#d08080", 1.6);
      NodeArmDraw.line(v, loop.map(toWorld), "#404040", 0.8);
      for (const [, knots, colour] of midlines) {
        NodeArmDraw.line(v, knots.map(mid), colour, 1.6);
        NodeArmDraw.dots(v, knots.map(mid), colour, 4.5);
      }
      for (const [name, p] of Object.entries(PINS)) NodeArmDraw.text(v, mid(p), name, "#003000");
    };
    draw("extract.side.png", [0, 0, 1], midBand, sideBody, "f1 head, her midsagittal profile extracted in her world (band |z| < 1.5 mm), side");
    const zoom: (name: string, lo: V2, hi: V2) => void = (name: string, lo: V2, hi: V2): void =>
      draw(`extract.side.${name}.png`, [0, 0, 1], [mid(lo), mid(hi)], sideBody, `f1 head, her midsagittal profile, ${name} (head frame x ${lo[0]}..${hi[0]}, y ${lo[1]}..${hi[1]})`);
    zoom("face", [40, -110], [125, 50]);
    zoom("crown", [-90, 40], [110, 135]);
    zoom("nape", [-95, -140], [0, 20]);
    zoom("throat", [10, -135], [80, -85]);
    draw(
      "extract.front.png",
      [-1, 0, 0],
      her,
      (v: NodeArmDraw.IView): void => {
        NodeArmDraw.dots(v, her.filter((_: V3, i: number): boolean => i % 2 === 0), "#cfcfcf", 1.4);
        for (const sign of [1, -1]) {
          NodeArmDraw.line(v, lateralRaw.map((r: { y: number; right: number; left: number }): V3 => toWorld([0, r.y, sign > 0 ? r.right : -r.left])), "#404040", 0.8);
          NodeArmDraw.line(v, lateralKnots.map((p: V2): V3 => lat(p, sign)), "#008080", 1.6);
          NodeArmDraw.dots(v, lateralKnots.map((p: V2): V3 => lat(p, sign)), "#008080", 4.5);
        }
      },
      "f1 head, her front silhouette extracted in her world (auricles excluded), front",
    );
    draw(
      "extract.top.png",
      [0, -1, 0],
      her,
      (v: NodeArmDraw.IView): void => {
        for (const s of sections) {
          NodeArmDraw.dots(v, up.filter((u: V3): boolean => Math.abs(u[1] - s.y) < 1).map(toWorld), "#e0a0a0", 1.4);
          NodeArmDraw.line(v, [...s.ring, s.ring[0]!].map(toWorld), "#404040", 0.8);
          NodeArmDraw.dots(v, s.knots.map(toWorld), "#1060ff", 3.5);
        }
      },
      "f1 head, her level sections every 30 mm extracted in her world (upright heights -110..110), top",
    );

    // 4. Her feature lines (the asset's crv_* curves on her skin, read in FH by `node:head-measure`, receipt `measure-2026-11-08T04-37-17-243Z`, features[].fh) carried into her world by the pose map and reduced in 3D within 0.5 mm, ends kept.
    // That receipt carries no `features` field (run of 16:52 threw here), so the feature lines are read only when a receipt holds them.
    const receipt: { features?: { name: string; fh: V3[] }[] } = JSON.parse(fs.readFileSync(HumanNodePaths.resolve("packages/human/.shots/f1_head/measure-2026-11-08T04-37-17-243Z/head.json"), "utf8"));
    const features: { name: string; dense: V3[]; knots: V3[] }[] = (receipt.features ?? [])
      .filter((f: { name: string; fh: V3[] }): boolean => f.name.startsWith("crv_") && f.fh.length > 1)
      .map((f: { name: string; fh: V3[] }): { name: string; dense: V3[]; knots: V3[] } => {
        const dense: V3[] = f.fh.map((h: V3): V3 => F.toWorld(h) as V3);
        return { name: f.name, dense, knots: reduce3(dense).map((k: number): V3 => dense[k]!) };
      });
    const face: V3[] = features.flatMap((f: { dense: V3[] }): V3[] => f.dense);
    for (const [name, forward] of [["front", [-1, 0, 0]], ["side", [0, 0, 1]]] as [string, V3][])
      draw(
        `extract.features.${name}.png`,
        forward,
        face,
        (v: NodeArmDraw.IView): void => {
          NodeArmDraw.dots(v, her.filter((w: V3): boolean => (name === "side" ? w[2] < 0 : true)), "#d8d8d8", 1.2);
          for (const f of features) {
            NodeArmDraw.line(v, f.dense, "#404040", 0.8);
            const colour: string = f.name.includes("ear") ? "#008000" : f.name.includes("lip") ? "#d00000" : f.name.includes("nostril") ? "#c06000" : "#0040ff";
            NodeArmDraw.line(v, f.knots, colour, 1.4);
            NodeArmDraw.dots(v, f.knots, colour, 3.5);
          }
        },
        `f1 head, her feature lines (asset crv_* on her skin) in her world, reduced within 0.5 mm, ${name}${name === "side" ? " (her right half's points)" : ""}`,
      );

    // The world knots for `AutoMovieHumanHeadF1World` (her loaded world, mm: +X forward, +Y up, +Z to her right).
    const w3: (p: V3) => string = (p: V3): string => `[${p.map((c: number): string => (Math.round(c * 100) / 100).toString()).join(", ")}]`;
    const worldTs: string[] = [
      ...midlines.map(([name, knots]: [string, V2[], string]): string => `// ${name}\n${knots.map((p: V2): string => `${w3(mid(p))},`).join("\n")}`),
      `// lateral [world y, half breadth]\n${lateralKnots.map((p: V2): string => `[${(Math.round(lat(p, 1)[1] * 100) / 100).toString()}, ${(Math.round(p[1] * 100) / 100).toString()}],`).join("\n")}`,
      ...features.map((f: { name: string; knots: V3[] }): string => `// ${f.name}\n${f.knots.map((p: V3): string => `${w3(p)},`).join("\n")}`),
    ];
    fs.writeFileSync(path.join(out, "world.ts.txt"), worldTs.join("\n"));

    const fmt: (n: number) => string = (n: number): string => (Math.round(n * 10) / 10).toString();
    const ts: string[] = [
      `// ANTERIOR (head frame {y, at}):`,
      anterior.map((p: V2): string => `{ site: "", y: ${fmt(p[1])}, at: ${fmt(p[0])}, sense: null },`).join("\n"),
      `// POSTERIOR:`,
      posterior.map((p: V2): string => `{ site: "", y: ${fmt(p[1])}, at: ${fmt(p[0])}, sense: null },`).join("\n"),
      `// LATERAL:`,
      lateralKnots.map((p: V2, i: number): string => `{ site: "", y: ${fmt(p[0])}, at: ${fmt(p[1])}, sense: ${lateralKnots[i] === lateralRange[euryon] ? `"max"` : "null"} },`).join("\n"),
      `// NOSE {y, x}:`,
      nose.map((p: V2): string => `{ y: ${fmt(p[1])}, x: ${fmt(p[0])}, slope: null },`).join("\n"),
      `// THROAT [y, x]:`,
      throat.map((p: V2): string => `[${fmt(p[1])}, ${fmt(p[0])}],`).join("\n"),
      `// SUBMENTAL [x, y]:`,
      submental.map((p: V2): string => `[${fmt(p[0])}, ${fmt(p[1])}],`).join("\n"),
    ];
    fs.writeFileSync(path.join(out, "knots.ts.txt"), ts.join("\n"));
    fs.writeFileSync(path.join(out, "extract.json"), JSON.stringify({ tolerance: TOLERANCE, rise, anterior, posterior, nose, throat, submental, lateral: lateralKnots, sections: sections.map((s: { y: number; knots: V3[] }): { y: number; knots: V3[] } => ({ y: s.y, knots: s.knots })), raw: { loop: loopHead, lateral: lateralRaw } }, null, 1));
    console.log(out);
  }

  /** The outermost point per angular bin about a centre in a 2D projection, empty bins skipped, then the radius's median over seven neighbouring bins; returns the 2D offsets in angular order. */
  function polar(points: readonly V3[], degrees: number, project: (u: V3) => V2): V2[] {
    const n: number = Math.round(360 / degrees);
    const best: (number | null)[] = Array.from({ length: n }, (): null => null);
    for (const u of points) {
      const p: V2 = project(u);
      const k: number = Math.floor(((Math.atan2(p[1], p[0]) + 2 * Math.PI) % (2 * Math.PI)) / ((2 * Math.PI) / n)) % n;
      const r: number = Math.hypot(p[0], p[1]);
      if (best[k] === null || r > best[k]!) best[k] = r;
    }
    const filled: { a: number; r: number }[] = best.flatMap((r: number | null, k: number): { a: number; r: number }[] => (r === null ? [] : [{ a: ((k + 0.5) * 2 * Math.PI) / n, r }]));
    const radii: number[] = median(filled.map((f: { r: number }): number => f.r), 3);
    return filled.map((f: { a: number }, i: number): V2 => [radii[i]! * Math.cos(f.a), radii[i]! * Math.sin(f.a)]);
  }

  /** Douglas-Peucker in 3D within `TOLERANCE`, ends kept; returns the kept indices in order. */
  function reduce3(points: readonly V3[]): number[] {
    const kept: Set<number> = new Set<number>([0, points.length - 1]);
    const split: (a: number, b: number) => void = (a: number, b: number): void => {
      if (b - a < 2) return;
      const A: V3 = points[a]!;
      const d: V3 = NodeArmDraw.sub(points[b]!, A);
      const len2: number = NodeArmDraw.dot(d, d) || 1;
      let worst: number = -1;
      let at: number = -1;
      for (let i: number = a + 1; i < b; ++i) {
        const r: V3 = NodeArmDraw.sub(points[i]!, A);
        const t: number = Math.max(0, Math.min(1, NodeArmDraw.dot(r, d) / len2));
        const e: number = Math.hypot(...NodeArmDraw.sub(r, NodeArmDraw.scale(d, t)));
        if (e > worst) {
          worst = e;
          at = i;
        }
      }
      if (worst > TOLERANCE) {
        kept.add(at);
        split(a, at);
        split(at, b);
      }
    };
    split(0, points.length - 1);
    return [...kept].sort((a: number, b: number): number => a - b);
  }

  /** Median over a window of `2 h + 1` neighbours (shortened at the ends). */
  function median(values: readonly number[], h: number): number[] {
    return values.map((_: number, i: number): number => {
      const w: number[] = values.slice(Math.max(0, i - h), i + h + 1).slice().sort((a: number, b: number): number => a - b);
      return w[Math.floor(w.length / 2)]!;
    });
  }

  /** Douglas-Peucker within `TOLERANCE` with the pinned indices kept; returns the kept indices in order. */
  function reduce(points: readonly V2[], pins: readonly number[]): number[] {
    const kept: Set<number> = new Set<number>(pins);
    const split: (a: number, b: number) => void = (a: number, b: number): void => {
      if (b - a < 2) return;
      const [ax, ay] = points[a]!;
      const [bx, by] = points[b]!;
      const len: number = Math.hypot(bx - ax, by - ay) || 1;
      let worst: number = -1;
      let at: number = -1;
      for (let i: number = a + 1; i < b; ++i) {
        const d: number = Math.abs((bx - ax) * (ay - points[i]![1]) - (ax - points[i]![0]) * (by - ay)) / len;
        if (d > worst) {
          worst = d;
          at = i;
        }
      }
      if (worst > TOLERANCE) {
        kept.add(at);
        split(a, at);
        split(at, b);
      }
    };
    const order: number[] = [...kept].sort((a: number, b: number): number => a - b);
    for (let i: number = 0; i + 1 < order.length; ++i) split(order[i]!, order[i + 1]!);
    return [...kept].sort((a: number, b: number): number => a - b);
  }
}

NodeHeadExtract.run();
