import path from "node:path";
import { AutoMovieLoftChain, AutoMovieViewAxis } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanF1 } from "@automovie/human";
import { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * Survey of candidate courses on the f1 reference: for each course, every
 * station's count of loops round the axis, the loop's area and its vertex
 * count, so each part's single-loop domain is read from the data before any
 * family is fitted.
 */
namespace FamilyConicScan {
  /** Mean of a loop's vertices in its chart, mm. */
  function centre(loop: readonly C.P[]): C.P {
    return [loop.reduce((sum: number, p: C.P): number => sum + p[0], 0) / loop.length, loop.reduce((sum: number, p: C.P): number => sum + p[1], 0) / loop.length];
  }

  /** Print the survey. */
  export async function main(): Promise<void> {
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    const joint = (name: string): R.V => {
      const p: R.V | undefined = source.joints.get(name);
      if (p === undefined) throw new Error("No joint " + name);
      return p;
    };
    if (process.argv[2] === "crotch") {
      // Level planes through the crotch, 2 mm apart: how many loops each cuts, and on the loop round the axis how far the skin stands
      // forward and backward on the median line, so the height where the legs part is read and not assumed.
      const axis: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.jointed([[0, 780, 0], [0, 1480, 0]], [], [1, 0, 0]) as AutoMovieViewAxis.IAxis;
      for (let s: number = 10; s <= 50; s += 2) {
        const loops: C.P[][] = R.loops(source.body, axis.at(s));
        const loop: C.P[] | null = R.cut(source.body, axis.at(s)).loop;
        process.stdout.write("y " + (780 + s) + " loops " + loops.length + (loop === null ? " none round the axis" : " forward " + C.radius(loop, 0).toFixed(1) + " backward " + C.radius(loop, Math.PI).toFixed(1) + " side " + C.radius(loop, Math.PI / 2).toFixed(1)) + "\n");
      }
      // The crotch's midline: on the median plane, for each forward position 5 mm apart, the first skin a ray going straight up from below
      // meets between 700 and 900 mm high, which the split's curved seam follows from the front fork to the back one.
      const body: R.ISource["body"] = source.body;
      for (let x: number = -40; x <= 70; x += 5) {
        let lowest: number = Infinity;
        for (let t: number = 0; t + 2 < body.indices.length; t += 3) {
          const [a, b, c]: R.V[] = [0, 1, 2].map((k: number): R.V => [body.positions[body.indices[t + k]! * 3]!, body.positions[body.indices[t + k]! * 3 + 1]!, body.positions[body.indices[t + k]! * 3 + 2]!]);
          if (Math.max(a![1], b![1], c![1]) < 700 || Math.min(a![1], b![1], c![1]) > 900) continue;
          const d: number = (b![0] - a![0]) * (c![2] - a![2]) - (c![0] - a![0]) * (b![2] - a![2]);
          if (d === 0) continue;
          const u: number = ((x - a![0]) * (c![2] - a![2]) - (c![0] - a![0]) * (0 - a![2])) / d;
          const v: number = ((b![0] - a![0]) * (0 - a![2]) - (x - a![0]) * (b![2] - a![2])) / d;
          if (u >= 0 && v >= 0 && u + v <= 1) lowest = Math.min(lowest, a![1] + u * (b![1] - a![1]) + v * (c![1] - a![1]));
        }
        process.stdout.write("midline x " + x + " y " + (Number.isFinite(lowest) ? lowest.toFixed(1) : "none") + "\n");
      }
      return;
    }
    if (process.argv[2] === "nostril") {
      // Level planes up through the nose's underside, 1 mm apart: every closed loop on the +Z side within the nose's width by its centre
      // forward and across, its extents and its area, so a nostril's course and girth are read before a cutter is declared for it.
      for (let y: number = 1540; y <= 1560; y += 1) {
        const frame = { origin: [0, y, 0] as R.V, u: [1, 0, 0] as R.V, v: [0, 0, 1] as R.V } as Parameters<typeof R.loops>[1];
        const cells: string[] = R.loops(source.head, frame)
          .filter((loop: C.P[]): boolean => centre(loop)[0] > 100 && centre(loop)[1] > 1 && centre(loop)[1] < 22 && Math.abs(R.area(loop)) < 400)
          .map((loop: C.P[]): string => "(x " + Math.min(...loop.map((p: C.P): number => p[0])).toFixed(1) + ".." + Math.max(...loop.map((p: C.P): number => p[0])).toFixed(1) + " z " + Math.min(...loop.map((p: C.P): number => p[1])).toFixed(1) + ".." + Math.max(...loop.map((p: C.P): number => p[1])).toFixed(1) + " a" + R.area(loop).toFixed(0) + ")");
        process.stdout.write("y " + y + ": " + cells.join(" ") + "\n");
      }
      return;
    }
    if (process.argv[2] === "eye") {
      // Sagittal planes through the +Z eye, 2 mm apart: every closed loop in the eye's box by its extents forward and up and its area,
      // to tell an eyeball of its own (a round loop) from the lids' skin.
      for (let z: number = 16; z <= 46; z += 2) {
        const frame = { origin: [0, 0, z] as R.V, u: [1, 0, 0] as R.V, v: [0, 1, 0] as R.V } as Parameters<typeof R.loops>[1];
        const cells: string[] = R.loops(source.head, frame)
          .filter((loop: C.P[]): boolean => centre(loop)[0] > 60 && centre(loop)[1] > 1570 && centre(loop)[1] < 1615 && Math.abs(R.area(loop)) < 2000)
          .map((loop: C.P[]): string => "(x " + Math.min(...loop.map((p: C.P): number => p[0])).toFixed(1) + ".." + Math.max(...loop.map((p: C.P): number => p[0])).toFixed(1) + " y " + Math.min(...loop.map((p: C.P): number => p[1])).toFixed(1) + ".." + Math.max(...loop.map((p: C.P): number => p[1])).toFixed(1) + " a" + R.area(loop).toFixed(0) + " n" + loop.length + ")");
        process.stdout.write("z " + z + ": " + cells.join(" ") + "\n");
      }
      return;
    }
    if (process.argv[2] === "concha") {
      // Sagittal planes out through the ear, 2 mm apart: every closed loop inside the ear's box by its extents forward and up and its
      // area. The auricle's rim is the large loop; a loop inside it is a hollow the rim stands round, read before a cutter is declared.
      for (let z: number = 70; z <= 98; z += 2) {
        const frame = { origin: [0, 0, z] as R.V, u: [1, 0, 0] as R.V, v: [0, 1, 0] as R.V } as Parameters<typeof R.loops>[1];
        const cells: string[] = R.loops(source.head, frame)
          .filter((loop: C.P[]): boolean => centre(loop)[0] > -25 && centre(loop)[0] < 40 && centre(loop)[1] > 1530 && centre(loop)[1] < 1610)
          .sort((a: C.P[], b: C.P[]): number => Math.abs(R.area(b)) - Math.abs(R.area(a)))
          .map((loop: C.P[]): string => "(x " + Math.min(...loop.map((p: C.P): number => p[0])).toFixed(0) + ".." + Math.max(...loop.map((p: C.P): number => p[0])).toFixed(0) + " y " + Math.min(...loop.map((p: C.P): number => p[1])).toFixed(0) + ".." + Math.max(...loop.map((p: C.P): number => p[1])).toFixed(0) + " a" + R.area(loop).toFixed(0) + ")");
        process.stdout.write("z " + z + ": " + cells.join(" ") + "\n");

        // The pocket: the largest region between the auricle's loop and its hull, the hollow the rim stands round, open along one chord.
        const ear: C.P[] | undefined = R.loops(source.head, frame)
          .filter((loop: C.P[]): boolean => centre(loop)[0] > -10 && centre(loop)[0] < 25 && centre(loop)[1] > 1540 && centre(loop)[1] < 1605 && Math.abs(R.area(loop)) > 40 && Math.abs(R.area(loop)) < 1000)
          .sort((a: C.P[], b: C.P[]): number => Math.abs(R.area(b)) - Math.abs(R.area(a)))[0];
        if (ear === undefined) continue;
        const hull: C.P[] = R.hull(ear);
        const at = (p: C.P): number => ear.findIndex((q: C.P): boolean => q[0] === p[0] && q[1] === p[1]);
        let best: C.P[] = [];
        const pockets: C.P[][] = [];
        for (let h: number = 0; h < hull.length; ++h) {
          const [i, j]: [number, number] = [at(hull[h]!), at(hull[(h + 1) % hull.length]!)];
          if (i < 0 || j < 0) continue;
          for (const run of [((): C.P[] => { const out: C.P[] = []; for (let k: number = i; ; k = (k + 1) % ear.length) { out.push(ear[k]!); if (k === j) break; } return out; })(), ((): C.P[] => { const out: C.P[] = []; for (let k: number = i; ; k = (k - 1 + ear.length) % ear.length) { out.push(ear[k]!); if (k === j) break; } return out; })()])
            if (run.length >= 3 && !run.slice(1, -1).some((p: C.P): boolean => hull.some((q: C.P): boolean => q[0] === p[0] && q[1] === p[1]))) {
              if (Math.abs(R.area(run)) > 15) pockets.push(run);
              if (Math.abs(R.area(run)) > Math.abs(R.area(best.length < 3 ? [[0, 0], [0, 0], [0, 0]] : best))) best = run;
            }
        }
        if (pockets.length > 1) process.stdout.write("   all pockets: " + pockets.sort((a: C.P[], b: C.P[]): number => Math.abs(R.area(b)) - Math.abs(R.area(a))).map((run: C.P[]): string => "(" + centre(run).map((x: number): string => x.toFixed(0)).join(",") + " a" + Math.abs(R.area(run)).toFixed(0) + ")").join(" ") + "\n");
        if (best.length >= 3) process.stdout.write("   pocket centre " + centre(best).map((x: number): string => x.toFixed(1)).join(",") + " area " + Math.abs(R.area(best)).toFixed(0) + " chord " + best[0]!.map((x: number): string => x.toFixed(0)).join(",") + " -> " + best.at(-1)!.map((x: number): string => x.toFixed(0)).join(",") + " points " + best.length + "\n");
      }
      return;
    }
    if (process.argv[2] === "radii") {
      // `radii <fromMm> <toMm> [stepMm]`: the trunk's level sections between two stations, the skin's radius every 15 degrees over the +Z
      // half turn. A radius that jumps between two neighbouring stations is skin that lies level between them, which no section samples.
      const axis: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.jointed([[0, 780, 0], [0, 1705, 0]], [], [1, 0, 0]) as AutoMovieViewAxis.IAxis;
      const step: number = Number(process.argv[5] ?? 2);
      for (let s: number = Number(process.argv[3]); s <= Number(process.argv[4]); s += step) {
        const loop: C.P[] | null = R.cut(source.all, axis.at(s)).loop;
        if (loop === null) continue;
        const radii: string[] = [];
        for (let degree: number = 0; degree <= 180; degree += 15) radii.push(C.radius(loop, (degree * Math.PI) / 180).toFixed(0).padStart(4));
        process.stdout.write("y " + (780 + s) + " station " + s + " r(0..180/15):" + radii.join("") + "\n");
      }
      return;
    }
    if (process.argv[2] === "trunk") {
      // Trunk sections in polar form about the vertical axis through the origin: radius every 15 degrees over the half turn, to read crests and grooves before choosing a layout.
      const axis: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.jointed([[0, 780, 0], [0, 1480, 0]], [], [1, 0, 0]) as AutoMovieViewAxis.IAxis;
      for (let s: number = 40; s <= 492; s += 36) {
        const loop: C.P[] | null = R.cut(source.body, axis.at(s)).loop;
        if (loop === null) continue;
        const radii: string[] = [];
        for (let degree: number = 0; degree <= 180; degree += 15) radii.push(C.radius(loop, (degree * Math.PI) / 180).toFixed(0));
        const minU: C.P = loop.filter((p: C.P): boolean => p[1] > 0).reduce((a: C.P, b: C.P): C.P => (b[0] < a[0] ? b : a));
        const maxU: C.P = loop.filter((p: C.P): boolean => p[1] > 0).reduce((a: C.P, b: C.P): C.P => (b[0] > a[0] ? b : a));
        const maxV: C.P = loop.reduce((a: C.P, b: C.P): C.P => (b[1] > a[1] ? b : a));
        process.stdout.write("y " + (780 + s) + " r(0..180/15): " + radii.join(" ") + " | maxU " + maxU.map(Math.round) + " maxV " + maxV.map(Math.round) + " minU " + minU.map(Math.round) + " | u@0 " + C.radius(loop, 0).toFixed(1) + " u@180 " + (-C.radius(loop, Math.PI)).toFixed(1) + "\n");
      }
      return;
    }
    if (process.argv[2] === "shoulder") {
      // Where the arm leaves the trunk. Horizontal planes: every closed loop's side range, and the fore-and-aft thickness of the loop round the axis at
      // each side distance, whose valley is the armscye. Sagittal planes through the shoulder: the loop round the shoulder joint's height.
      const crossings = (loop: readonly C.P[], axisIndex: 0 | 1, at: number): number[] => {
        const out: number[] = [];
        for (let i: number = 0; i < loop.length; ++i) {
          const a: C.P = loop[i]!;
          const b: C.P = loop[(i + 1) % loop.length]!;
          if (a[axisIndex] > at !== b[axisIndex] > at) out.push(a[1 - axisIndex]! + ((b[1 - axisIndex]! - a[1 - axisIndex]!) * (at - a[axisIndex])) / (b[axisIndex] - a[axisIndex]));
        }
        return out.sort((p: number, q: number): number => p - q);
      };
      for (let y: number = 1240; y <= 1430; y += 10) {
        const loop: C.P[] | null = R.cut(source.all, { origin: [0, y, 0], u: [1, 0, 0], v: [0, 0, 1] }).loop;
        if (loop === null) continue;
        const cells: string[] = [];
        for (let z: number = 90; z <= 230; z += 10) {
          const x: number[] = crossings(loop, 1, z);
          cells.push(x.length === 0 ? "   ." : x.length === 2 ? (x[1]! - x[0]!).toFixed(0).padStart(4) : (x.at(-1)! - x[0]!).toFixed(0).padStart(3) + "*");
        }
        const side: C.P = loop.reduce((a: C.P, b: C.P): C.P => (b[1] > a[1] ? b : a));
        process.stdout.write("y " + y + " side " + side.map(Math.round) + " thickness z90..230/10: " + cells.join(" ") + "\n");
      }
      for (let z: number = 110; z <= 200; z += 6) {
        const cut: R.ICut = R.cut(source.all, { origin: [-16, 1353, z], u: [1, 0, 0], v: [0, 1, 0] });
        if (cut.loop === null) {
          process.stdout.write("z " + z + " no loop round the joint height, pieces " + cut.pieces + "\n");
          continue;
        }
        const us: number[] = cut.loop.map((p: C.P): number => p[0]);
        const vs: number[] = cut.loop.map((p: C.P): number => p[1]);
        const low: C.P = cut.loop.reduce((a: C.P, b: C.P): C.P => (b[1] < a[1] ? b : a));
        process.stdout.write("z " + z + " loops " + cut.around + "/" + cut.pieces + " x " + Math.round(-16 + Math.min(...us)) + ".." + Math.round(-16 + Math.max(...us)) + " y " + Math.round(1353 + Math.min(...vs)) + ".." + Math.round(1353 + Math.max(...vs)) + " lowest at x " + Math.round(-16 + low[0]) + " area " + (R.area(cut.loop) / 100).toFixed(0) + "\n");
      }
      return;
    }
    if (process.argv[2] === "nose") {
      // The nose: every closed loop of frontal planes through the front of the head that lies near the median line, by its extent across and
      // in height, so the plane the nose leaves the face at and its own extent are read.
      for (let x: number = 70; x <= 130; x += 3) {
        const cells: string[] = R.loops(source.head, { origin: [x, 1600, 0], u: [0, 0, 1], v: [0, 1, 0] })
          .filter((loop: C.P[]): boolean => loop.some((p: C.P): boolean => Math.abs(p[0]) < 12))
          .map((loop: C.P[]): string => {
            const zs: number[] = loop.map((p: C.P): number => p[0]);
            const ys: number[] = loop.map((p: C.P): number => p[1] + 1600);
            return "z " + Math.min(...zs).toFixed(0) + ".." + Math.max(...zs).toFixed(0) + " y " + Math.min(...ys).toFixed(0) + ".." + Math.max(...ys).toFixed(0) + " a" + (Math.abs(R.area(loop)) / 100).toFixed(1);
          });
        process.stdout.write("x " + x + ": " + cells.join(" | ") + "\n");
      }
      return;
    }
    if (process.argv[2] === "ear") {
      // The ear: every closed loop of sagittal planes through the side of the head, by its extent fore and aft and in height, so the plane the
      // auricle leaves the skull at and the auricle's own extent are read. Then the head's half width at heights round the ear, at four depths.
      for (let z: number = 60; z <= 98; z += 2) {
        const cells: string[] = R.loops(source.head, { origin: [0, 1600, z], u: [1, 0, 0], v: [0, 1, 0] }).map((loop: C.P[]): string => {
          const xs: number[] = loop.map((p: C.P): number => p[0]);
          const ys: number[] = loop.map((p: C.P): number => p[1] + 1600);
          return "x " + Math.min(...xs).toFixed(0) + ".." + Math.max(...xs).toFixed(0) + " y " + Math.min(...ys).toFixed(0) + ".." + Math.max(...ys).toFixed(0) + " a" + (R.area(loop) / 100).toFixed(1);
        });
        process.stdout.write("z " + z + ": " + cells.join(" | ") + "\n");
      }
      for (let y: number = 1560; y <= 1660; y += 10) {
        const loop: C.P[] | null = R.cut(source.head, { origin: [0, y, 0], u: [1, 0, 0], v: [0, 0, 1] }).loop;
        if (loop === null) continue;
        const widths: string[] = [-70, -50, -30, -10, 10, 30].map((x: number): string => {
          const hits: number[] = [];
          for (let i: number = 0; i < loop.length; ++i) {
            const a: C.P = loop[i]!;
            const b: C.P = loop[(i + 1) % loop.length]!;
            if (a[0] > x !== b[0] > x) hits.push(a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]));
          }
          return "x" + x + ":" + (hits.length === 0 ? "." : Math.max(...hits).toFixed(0));
        });
        process.stdout.write("y " + y + " half width " + widths.join(" ") + "\n");
      }
      return;
    }
    if (process.argv[2] === "webs") {
      // The web line between each two neighbouring digits, in the plane each seam of the limb's split stands in: from the seam's first fork
      // along its chord every 2 mm, how far a ray along the plane's second axis (the seam's heading square to the chord) runs from
      // the chord before it leaves the reference skin, mm. Where the chord point already lies outside the skin the depth is 0. These are the
      // seams' profile knots (`IAutoMovieConstructionSplit.IProfile`) for a split of the limb's end (`AutoMovieHumanF1.fanSeams`).
      for (const which of ["arm", "leg"] as const) {
        const { station, seams, headings, normal } = AutoMovieHumanF1.fanSeams(which);
        const family = { ...AutoMovieHumanF1.BODY[which], tips: undefined };
        const loft = AutoMovieHumanConicLoft.create(family, family.knots);
        const ring = (t: number): R.V => AutoMovieLoftChain.point(loft.chain!, station, t) as R.V;
        const mesh = source.body;
        const cast = (o: R.V, d: R.V): number[] => {
          const hits: number[] = [];
          for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) {
            const [a, b, c]: R.V[] = [0, 1, 2].map((k: number): R.V => [mesh.positions[mesh.indices[t + k]! * 3]!, mesh.positions[mesh.indices[t + k]! * 3 + 1]!, mesh.positions[mesh.indices[t + k]! * 3 + 2]!]);
            const e1: R.V = [b![0] - a![0], b![1] - a![1], b![2] - a![2]];
            const e2: R.V = [c![0] - a![0], c![1] - a![1], c![2] - a![2]];
            const p: R.V = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]];
            const det: number = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
            if (Math.abs(det) < 1e-12) continue;
            const s: R.V = [o[0] - a![0], o[1] - a![1], o[2] - a![2]];
            const u: number = (s[0] * p[0] + s[1] * p[1] + s[2] * p[2]) / det;
            if (u < 0 || u > 1) continue;
            const qv: R.V = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
            const v: number = (d[0] * qv[0] + d[1] * qv[1] + d[2] * qv[2]) / det;
            if (v < 0 || u + v > 1) continue;
            const l: number = (e2[0] * qv[0] + e2[1] * qv[1] + e2[2] * qv[2]) / det;
            // Signed by the triangle's facing: an exit where its outward normal runs along the ray.
            const facing: number = d[0] * (e1[1] * e2[2] - e1[2] * e2[1]) + d[1] * (e1[2] * e2[0] - e1[0] * e2[2]) + d[2] * (e1[0] * e2[1] - e1[1] * e2[0]);
            if (l > 0) hits.push(facing > 0 ? l : -l);
          }
          return hits.sort((x: number, y: number): number => Math.abs(x) - Math.abs(y));
        };
        seams.forEach(([a, b]: [number, number], j: number): void => {
          const A: R.V = ring(a);
          const B: R.V = ring(b);
          const length: number = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
          const e1: R.V = [(B[0] - A[0]) / length, (B[1] - A[1]) / length, (B[2] - A[2]) / length];
          const h: R.V = headings[j]!;
          const k: number = h[0] * e1[0] + h[1] * e1[1] + h[2] * e1[2];
          const raw: R.V = [h[0] - k * e1[0], h[1] - k * e1[1], h[2] - k * e1[2]];
          const rl: number = Math.hypot(...raw) * Math.sign(raw[0] * normal[0]! + raw[1] * normal[1]! + raw[2] * normal[2]!);
          const e2: R.V = [raw[0] / rl, raw[1] / rl, raw[2] / rl];
          const knots: string[] = [];
          // Beside the first fork the web may stand well out of the end, where the skin between the two digits runs on along the host
          // before it turns across: there the line is no graph over the chord. Rays along the chord from 4 mm before the fork, every
          // millimetre out along the plane's second axis, read where they first enter the skin, as `[along, depth]` knots that run out
          // first (`IAutoMovieConstructionSplit.IProfile`, parameterized by its own length); they stop where the ray no longer enters
          // within 2 mm of the fork, which is where the line turns across.
          // The same at the second fork, read back along the chord. Each run stops 0.5 mm short of the first or last web knot so no two
          // knots coincide.
          const runOut = (from: R.V, sign: 1 | -1): [number, number][] => {
            const run: [number, number][] = [];
            for (let out: number = 1; out < 20; out += 1) {
              const back: R.V = [from[0] + out * e2[0] - sign * 4 * e1[0], from[1] + out * e2[1] - sign * 4 * e1[1], from[2] + out * e2[2] - sign * 4 * e1[2]];
              const hits: number[] = cast(back, [sign * e1[0], sign * e1[1], sign * e1[2]]);
              const along: number = hits.length > 0 && hits[0]! < 0 ? -hits[0]! - 4 : Infinity;
              if (!(along < 1.5)) break;
              // At least 0.1 mm from the fork, so a mirrored knot stays inside the chord as the engine measures it.
              run.push([Math.max(0.1, along), out]);
            }
            return run;
          };
          for (const [along, out] of runOut(A, 1)) knots.push("[" + (along / 1000).toFixed(4) + ", " + (out / 1000).toFixed(4) + "]");
          let last: number = 2;
          while (last + 2 < length - 1) last += 2;
          const tail: string[] = runOut(B, -1)
            .filter(([along]: [number, number]): boolean => length - along > last + 0.5)
            .reverse()
            .map(([along, out]: [number, number]): string => "[" + (Math.floor((length - along) * 10) / 10 / 1000).toFixed(4) + ", " + (out / 1000).toFixed(4) + "]");
          process.stdout.write(which + " seam " + j + " last web knot at " + last + " mm, " + tail.length + " run-out knots at the second fork\n");
          for (let along: number = 2; along < length - 1; along += 2) {
            const o: R.V = [A[0] + along * e1[0], A[1] + along * e1[1], A[2] + along * e1[2]];
            const hits: number[] = cast(o, e2);
            // Inside the skin when the first crossing ahead is an exit; the depth is then that crossing.
            const depth: number = hits.length > 0 && hits[0]! > 0 ? hits[0]! : 0;
            knots.push("[" + (along / 1000).toFixed(4) + ", " + (depth / 1000).toFixed(4) + "]");
          }
          process.stdout.write(which + " seam " + j + " phases [" + a.toFixed(4) + ", " + b.toFixed(4) + "] chord " + length.toFixed(1) + " mm from " + A.map((x: number): string => x.toFixed(1)).join("/") + " to " + B.map((x: number): string => x.toFixed(1)).join("/") + "\n  knots " + [...knots, ...tail].join(", ") + "\n");
        });
      }
      return;
    }
    if (process.argv[2] === "alar") {
      // The nose's base in level planes 2 mm apart: the head's outer loop on the +Z side from the median line out to 34 mm, as `z:x` points
      // about 1.5 mm apart, so the alar groove (the corner where the wing's outer face meets the cheek), the alar base and the subnasale
      // are read; and every small loop there, a nostril's cavity.
      for (let y: number = 1538; y <= 1584; y += 2) {
        const loops: C.P[][] = R.loops(source.head, { origin: [0, y, 0], u: [1, 0, 0], v: [0, 0, 1] });
        const big: C.P[] = loops.reduce((a: C.P[], b: C.P[]): C.P[] => (Math.abs(R.area(b)) > Math.abs(R.area(a)) ? b : a));
        const near: C.P[] = big.filter((p: C.P): boolean => p[0] > 98 && p[1] > -1 && p[1] < 34);
        const start: number = big.indexOf(near.reduce((a: C.P, b: C.P): C.P => (Math.abs(b[1]) < 0.8 && b[0] > a[0] ? b : a), near[0]!));
        const sense: number = big[(start + 3) % big.length]![1] > big[start]![1] ? 1 : -1;
        const run: string[] = [];
        let last: C.P | null = null;
        for (let k: number = 0; k < big.length; ++k) {
          const p: C.P = big[(start + sense * k + 4 * big.length) % big.length]!;
          if (p[0] < 98 || p[1] > 34) break;
          if (last !== null && Math.hypot(p[0] - last[0], p[1] - last[1]) < 1.5) continue;
          run.push(p[1].toFixed(1) + ":" + p[0].toFixed(1));
          last = p;
        }
        const small: string[] = loops
          .filter((loop: C.P[]): boolean => loop !== big && Math.abs(R.area(loop)) < 600 && loop.some((p: C.P): boolean => p[0] > 100 && p[1] > 0 && p[1] < 30))
          .map((loop: C.P[]): string => "[x " + Math.min(...loop.map((p: C.P): number => p[0])).toFixed(1) + ".." + Math.max(...loop.map((p: C.P): number => p[0])).toFixed(1) + " z " + Math.min(...loop.map((p: C.P): number => p[1])).toFixed(1) + ".." + Math.max(...loop.map((p: C.P): number => p[1])).toFixed(1) + "]");
        process.stdout.write("y " + y + ": " + run.join(" ") + (small.length === 0 ? "" : "  small " + small.join(" ")) + "\n");
      }
      return;
    }
    if (process.argv[2] === "nose-rail") {
      // Where the nose's wall is skin: at 32 phases round it, the distance from its wall (no reliefs, no cap) to the reference head every
      // 0.5 mm of station, in tenths of a millimetre, and the first station from which it stays within 0.3 mm for 2 mm. Its first sections
      // are closed by its box's chords inside the flesh, which stand off the skin; the band must land past them.
      const family: AutoMovieHumanConicLoft.IFamily = { ...AutoMovieHumanF1.BODY.nose, tips: undefined, reliefs: undefined };
      const first: number = family.knots[0]!;
      const stations: number[] = Array.from({ length: 37 }, (_: unknown, i: number): number => first + i / 2);
      const chain = AutoMovieHumanConicLoft.create(family, stations).chain;
      if (chain === null) throw new Error("the nose does not loft");
      const head: R.ISource["head"] = source.head;
      const corners = (t: number): R.V[] => [0, 1, 2].map((k: number): R.V => [head.positions[head.indices[t + k]! * 3]!, head.positions[head.indices[t + k]! * 3 + 1]!, head.positions[head.indices[t + k]! * 3 + 2]!]);
      const triangles: R.V[][] = [];
      for (let t: number = 0; t + 2 < head.indices.length; t += 3) if (corners(t).some((p: R.V): boolean => p[0] > 105 && p[1] > 1530 && p[1] < 1595 && Math.abs(p[2]) < 28)) triangles.push(corners(t));
      // The distance from a point to a triangle: to its plane when the foot falls inside, else to the nearest of its edges.
      const toTriangle = (p: R.V, [a, b, c]: R.V[]): number => {
        const sub = (x: R.V, y: R.V): R.V => [x[0] - y[0], x[1] - y[1], x[2] - y[2]];
        const dot = (x: R.V, y: R.V): number => x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
        const cross = (x: R.V, y: R.V): R.V => [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]];
        const n: R.V = cross(sub(b!, a!), sub(c!, a!));
        const inside: boolean = [[a!, b!], [b!, c!], [c!, a!]].every(([e, f]: R.V[]): boolean => dot(cross(sub(f!, e!), sub(p, e!)), n) >= 0);
        if (inside) return Math.abs(dot(sub(p, a!), n)) / Math.hypot(...n);
        return Math.min(...[[a!, b!], [b!, c!], [c!, a!]].map(([e, f]: R.V[]): number => {
          const d: R.V = sub(f!, e!);
          const t: number = Math.max(0, Math.min(1, dot(sub(p, e!), d) / dot(d, d)));
          return Math.hypot(...sub(p, [e![0] + t * d[0], e![1] + t * d[1], e![2] + t * d[2]]));
        }));
      };
      for (let j: number = 0; j < 32; ++j) {
        const psi: number = (2 * Math.PI * j) / 32;
        const off: number[] = stations.map((s: number): number => {
          const p: R.V = AutoMovieLoftChain.point(chain, s, psi) as R.V;
          return Math.min(...triangles.map((t: R.V[]): number => toTriangle(p, t)));
        });
        const at: number = off.findIndex((_: number, i: number): boolean => i + 4 < off.length && off.slice(i, i + 5).every((d: number): boolean => d < 0.3));
        process.stdout.write(((psi * 180) / Math.PI).toFixed(0).padStart(4) + " skin from " + (at < 0 ? "none" : (stations[at]! - first).toFixed(1) + " mm in") + " | " + off.map((d: number): number => Math.min(99, Math.round(d * 10))).join(" ") + "\n");
      }
      return;
    }
    if (process.argv[2] === "helix") {
      // `helix [floor] [band]`: the helix's crest from the outermost skin over the ear, its side distance on a quarter-millimetre grid of
      // forward position and height. Along rays from the ear's middle (x 7, y 1572) every 10 degrees: the outline's edge (the last cell
      // whose skin stands past `floor`, 79 mm), the crest (the highest cell within `band`, 7 mm, inside the edge) and the scapha's floor
      // (the lowest cell within a further `band` inside the crest), so the rim's course and its width are read before a tube is declared.
      const floor: number = Number(process.argv[3] ?? 79);
      const band: number = Number(process.argv[4] ?? 7);
      const [cx, cy, x0, x1, y0, y1, h] = [7, 1572, -14, 32, 1534, 1612, 0.25];
      const nx: number = Math.round((x1 - x0) / h) + 1;
      const ny: number = Math.round((y1 - y0) / h) + 1;
      const z: Float64Array = new Float64Array(nx * ny).fill(-Infinity);
      const P: ArrayLike<number> = source.head.positions;
      const I: ArrayLike<number> = source.head.indices;
      for (let t: number = 0; t + 2 < I.length; t += 3) {
        const [a, b, c]: R.V[] = [0, 1, 2].map((k: number): R.V => [P[I[t + k]! * 3]!, P[I[t + k]! * 3 + 1]!, P[I[t + k]! * 3 + 2]!]);
        if (Math.max(a![2], b![2], c![2]) < 55) continue;
        const d: number = (b![0] - a![0]) * (c![1] - a![1]) - (b![1] - a![1]) * (c![0] - a![0]);
        if (d === 0) continue;
        for (let i: number = Math.max(0, Math.ceil((Math.min(a![0], b![0], c![0]) - x0) / h)); i < nx && x0 + i * h <= Math.max(a![0], b![0], c![0]); ++i)
          for (let j: number = Math.max(0, Math.ceil((Math.min(a![1], b![1], c![1]) - y0) / h)); j < ny && y0 + j * h <= Math.max(a![1], b![1], c![1]); ++j) {
            const [x, y]: number[] = [x0 + i * h, y0 + j * h];
            const u: number = ((x! - a![0]) * (c![1] - a![1]) - (y! - a![1]) * (c![0] - a![0])) / d;
            const v: number = ((b![0] - a![0]) * (y! - a![1]) - (b![1] - a![1]) * (x! - a![0])) / d;
            if (u < 0 || v < 0 || u + v > 1) continue;
            z[i * ny + j] = Math.max(z[i * ny + j]!, a![2] + u * (b![2] - a![2]) + v * (c![2] - a![2]));
          }
      }
      const at = (x: number, y: number): number => {
        const [i, j]: number[] = [Math.round((x - x0) / h), Math.round((y - y0) / h)];
        return i! < 0 || j! < 0 || i! >= nx || j! >= ny ? -Infinity : z[i! * ny + j!]!;
      };
      process.stdout.write("deg  edge (x,y,z)          crest (x,y,z)         in   scapha (x,y,z)        depth\n");
      for (let deg: number = -180; deg < 180; deg += 10) {
        const [dx, dy]: number[] = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
        const skin = (r: number): number => at(cx + r * dx!, cy + r * dy!);
        let edge: number = -1;
        for (let r: number = 0; r < 45; r += h) if (skin(r) > floor) edge = r;
        if (edge < 0) continue;
        let crest: number = edge;
        for (let r: number = edge; r > Math.max(0, edge - band); r -= h) if (skin(r) > skin(crest)) crest = r;
        let low: number = crest;
        for (let r: number = crest; r > Math.max(0, crest - band); r -= h) if (skin(r) < skin(low)) low = r;
        const f = (r: number): string => ("(" + (cx + r * dx!).toFixed(1) + "," + (cy + r * dy!).toFixed(1) + "," + skin(r).toFixed(1) + ")").padEnd(22);
        process.stdout.write(String(deg).padStart(4) + " " + f(edge) + f(crest) + (edge - crest).toFixed(1).padStart(4) + "  " + f(low) + (skin(crest) - skin(low)).toFixed(1) + "\n");
      }
      return;
    }
    if (process.argv[2] === "hand" || process.argv[2] === "foot") {
      // Where the digits leave: along the limb's own course, every closed loop of each plane near the limb's end by its centre and area, so the
      // order and the stations at which the digits part from the hand or the foot are read before any branch is declared.
      const hand: boolean = process.argv[2] === "hand";
      // Each course ends past the digit on the thumb or big-toe side, so its planes reach the webs one after another from the little side.
      const past = (a: R.V, b: R.V, length: number): R.V => {
        const d: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        return [b[0] + ((b[0] - a[0]) * length) / d, b[1] + ((b[1] - a[1]) * length) / d, b[2] + ((b[2] - a[2]) * length) / d];
      };
      const reach: number = Number(process.argv[3] ?? "20");

      // `square`: the course's last segment leaves its joint square to the row of first digit joints, so its planes lie along the webs.
      const square = (from: R.V, toward: R.V, a: R.V, b: R.V): R.V => {
        const k: number[] = [0, 1, 2].map((c: number): number => (b[c]! - a[c]!) / Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
        const m: number[] = [0, 1, 2].map((c: number): number => toward[c]! - from[c]!);
        const along: number = m[0]! * k[0]! + m[1]! * k[1]! + m[2]! * k[2]!;
        return [0, 1, 2].map((c: number): number => from[c]! + m[c]! - along * k[c]!) as R.V;
      };
      const made: AutoMovieViewAxis.IAxis | string =
        process.argv[4] === "square"
          ? hand
            ? AutoMovieViewAxis.jointed([joint("upperarm_r"), joint("lowerarm_r"), joint("hand_r"), square(joint("hand_r"), joint("middle_01_r"), joint("pinky_01_r"), joint("index_01_r"))], [30, 10], [1, 0, 0])
            : AutoMovieViewAxis.jointed([joint("thigh_r"), joint("calf_r"), joint("foot_r"), square(joint("foot_r"), [133, 20, 157], joint("littletoe_01_r"), joint("bigtoe_01_r"))], [40, 62], [1, 0, 0])
          : hand
            ? AutoMovieViewAxis.jointed([joint("upperarm_r"), joint("lowerarm_r"), joint("hand_r"), past(joint("middle_01_r"), joint("index_01_r"), reach)], [30, 10], [1, 0, 0])
            : AutoMovieViewAxis.jointed([joint("thigh_r"), joint("calf_r"), joint("foot_r"), past(joint("indextoe_01_r"), joint("bigtoe_01_r"), reach)], [40, 62], [1, 0, 0]);
      if (typeof made === "string") throw new Error(made);
      const axis: AutoMovieViewAxis.IAxis = made;
      const [from, to]: [number, number] = hand ? [556, 640] : [930, 1010];
      for (let s: number = from; s <= to; s += 2) {
        const cells: string[] = R.loops(source.body, axis.at(s))
          .filter((loop: C.P[]): boolean => Math.hypot(...centre(loop)) < 90)
          .sort((a: C.P[], b: C.P[]): number => centre(b)[1] - centre(a)[1])
          .map((loop: C.P[]): string => "(" + centre(loop).map((x: number): string => x.toFixed(0)).join(",") + " a" + (R.area(loop) / 100).toFixed(1) + ")");
        process.stdout.write(s + ": " + cells.join(" ") + "\n");
      }
      return;
    }
    const courses: { name: string; centres: R.V[]; halves: number[]; up: R.V; step: number }[] = [];
    courses.push({ name: "arm", centres: [joint("upperarm_r"), joint("lowerarm_r"), joint("hand_r"), joint("middle_01_r")], halves: [30, 10], up: [1, 0, 0], step: 6 });
    courses.push({ name: "leg", centres: [joint("thigh_r"), joint("calf_r"), joint("foot_r"), [133, 20, 157]], halves: [40, 62], up: [1, 0, 0], step: 6 });
    courses.push({ name: "trunk", centres: [[0, 780, 0], [0, 1705, 0]], halves: [], up: [1, 0, 0], step: 12 });
    for (const course of courses) {
      const axis: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(course.centres, course.halves, course.up);
      if (typeof axis === "string") throw new Error(course.name + ": " + axis);
      const runs: AutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(course.centres, course.halves);
      const length: number = typeof runs === "string" ? 0 : runs.at(-1)!.end;
      const cells: string[] = [];
      for (let s: number = -24; s <= length + 24; s += course.step) {
        const cut: R.ICut = R.cut(source.body, axis.at(s));
        cells.push(s.toFixed(0) + ":" + cut.around + "/" + cut.pieces + (cut.loop === null ? "" : " a" + (R.area(cut.loop) / 100).toFixed(0) + " n" + cut.loop.length));
      }
      process.stdout.write(course.name + " length " + length.toFixed(1) + " centres " + JSON.stringify(course.centres.map((c: R.V): number[] => c.map((x: number): number => Math.round(x)))) + "\n  " + cells.join(" | ") + "\n");
    }
  }
}
void FamilyConicScan.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
