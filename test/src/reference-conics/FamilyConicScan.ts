import path from "node:path";
import { AutoMovieLoftChain, AutoMovieMeshExtract as M, AutoMovieViewAxis, realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanF1 } from "@automovie/human";
import { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * Survey of candidate courses on the f1 reference: for each course, every
 * station's count of loops round the axis, the loop's area and its vertex
 * count, so each part's single-loop domain is read from the data before any
 * family is fitted.
 *
 * Its modes (the first argument) read one place each. Among them, `saddles`
 * reads the hand's dorsal hollows and the stations where its digits part,
 * along the hand family's own course, with the wall's standoff. `thumbweb`
 * reads where the thumb's skin ends toward the web, against the hand nets'
 * hold round the thumb.
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
    if (process.argv[2] === "lobule") {
      // Frontal planes through the +Z lobule, 4 mm apart: at each height every side distance where the plane's cut of the head crosses it.
      // Below the lobule's crease a height crosses the skull and then the lobule's underside and outer face; the crease is the height where the
      // underside's crossing meets the skull's.
      for (let x: number = 6; x <= 18; x += 4) {
        const pieces: C.P[][] = M.outline(source.head, { origin: [x, 0, 0], axes: [[1, 0, 0], [0, 0, 1], [0, 1, 0]] }, [0], 0, 0.5, 0)[0]!.loops.map((loop: M.ILoop): C.P[] => [...loop.points, ...(loop.closed ? [loop.points[0]!] : [])]);
        for (let y: number = 1538; y <= 1562; y += 1) {
          const hits: number[] = pieces.flatMap((piece: C.P[]): number[] => piece.slice(1).flatMap((b: C.P, i: number): number[] => {
            const a: C.P = piece[i]!;
            return a[1] > y !== b[1] > y ? [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1])] : [];
          })).filter((z: number): boolean => z > 50);
          process.stdout.write("x " + x + " y " + y + ": " + hits.sort((p: number, q: number): number => p - q).map((z: number): string => z.toFixed(1)).join(" ") + "\n");
        }
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
        // The arm's fan splits the hand's own family (`AutoMovieHumanF1Hand`), which the arm continues across the wrist.
        const family = { ...(which === "arm" ? AutoMovieHumanF1.BODY.hand : AutoMovieHumanF1.BODY.leg), tips: undefined };
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
          // Read out to 32 mm: a split's parent ends at its last star-shaped section (construction.md, Splits), up to 28 mm before the
          // saddles where its digits part (the hand ends at 576 mm with its middle and ring fingers parting at 604; the foot at 965 with
          // its middle and index toes parting at 993), so a seam runs out that far along the host before it turns across.
          const runOut = (from: R.V, sign: 1 | -1): [number, number][] => {
            const run: [number, number][] = [];
            for (let out: number = 1; out < 32; out += 1) {
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
    if (process.argv[2] === "band") {
      // `band [name] [columns]`: a port's band read in its own rows against the reference. The figure is realized as it stands; at every
      // `columns`-th share of its loop clock and at shares of its span from 0.1 to 0.9, the band's point and its inward unit normal, and
      // the reference skin's depth below the band along that normal (the nearest crossing of the line through the point along the normal
      // within 6 mm either way, in mm, positive inward; a dot where none), so a cross profile's knots are read off the skin it must reach.
      const name: string = process.argv[3] ?? "band.nose";
      const every: number = Number(process.argv[4] ?? 48);
      const declared = AutoMovieHumanF1.construction();
      const real = realizeAutoMovieConstruction({ name: "f1.body", root: declared.root }, { chord: 0.001, sources: declared.sources });
      const face = { surface: real.surfaces.find((s: { name: string }): boolean => s.name === name)! };
      const L: number | undefined = real.chains.find((c: { name: string }): boolean => c.name === name)?.layers.at(-1)?.y;
      if (face.surface === undefined || L === undefined) throw new Error("no band " + name);
      // The reference's triangles within 10 mm of the band's box, read on the band at 64 clocks and five shares, on the body and the head.
      const reach: number[][] = [];
      for (let k: number = 0; k < 64; ++k) for (const t of [0, 0.25, 0.5, 0.75, 1]) reach.push([...face.surface.jet(t * L, (2 * Math.PI * k) / 64).p]);
      const low: number[] = [0, 1, 2].map((c: number): number => Math.min(...reach.map((p: number[]): number => p[c]!)) - 10);
      const high: number[] = [0, 1, 2].map((c: number): number => Math.max(...reach.map((p: number[]): number => p[c]!)) + 10);
      const triangles: R.V[][] = [];
      for (const mesh of [source.body, source.head])
        for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) {
          const corners: R.V[] = [0, 1, 2].map((k: number): R.V => [mesh.positions[mesh.indices[t + k]! * 3]!, mesh.positions[mesh.indices[t + k]! * 3 + 1]!, mesh.positions[mesh.indices[t + k]! * 3 + 2]!]);
          if (corners.some((p: R.V): boolean => p.every((x: number, c: number): boolean => x >= low[c]! && x <= high[c]!))) triangles.push(corners);
        }
      const sub = (a: readonly number[], b: readonly number[]): R.V => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
      const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
      const cross = (a: readonly number[], b: readonly number[]): R.V => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
      // The signed distance along `d` from `p` to the nearest crossing with the reference (Moeller and Trumbore), within 6 mm.
      const along = (p: readonly number[], d: R.V): number | null => {
        let best: number | null = null;
        for (const [a, b, c] of triangles) {
          const e1: R.V = sub(b!, a!);
          const e2: R.V = sub(c!, a!);
          const h: R.V = cross(d, e2);
          const det: number = dot(e1, h);
          if (Math.abs(det) < 1e-12) continue;
          const s: R.V = sub(p, a!);
          const u: number = dot(s, h) / det;
          if (u < 0 || u > 1) continue;
          const q: R.V = cross(s, e1);
          const v: number = dot(d, q) / det;
          if (v < 0 || u + v > 1) continue;
          const t: number = dot(e2, q) / det;
          if (Math.abs(t) <= 6 && (best === null || Math.abs(t) < Math.abs(best))) best = t;
        }
        return best;
      };
      const shares: number[] = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
      process.stdout.write("band " + name + " span " + L.toFixed(2) + " mm; columns: clock rad, point at 0.5, depth mm at shares " + shares.join(" ") + "\n");
      for (let k: number = 0; k < every; ++k) {
        const c: number = (2 * Math.PI * k) / every;
        const cells: string[] = shares.map((t: number): string => {
          const jet = face.surface.jet(t * L, c);
          const n: R.V = cross(jet.u, jet.v);
          const m: number = Math.hypot(...n);
          const inward: R.V = n.map((x: number): number => (-x * face.surface.orientation) / m) as R.V;
          const hit: number | null = along(jet.p, inward);
          return hit === null ? "." : hit.toFixed(2);
        });
        const p = face.surface.jet(0.5 * L, c).p;
        process.stdout.write(c.toFixed(3).padStart(6) + "  [" + p.map((x: number): string => x.toFixed(1)).join(", ") + "]  " + cells.map((x: string): string => x.padStart(6)).join("") + "\n");
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
      // With `ridges`, the rays may leave from another middle (`ridges <x> <y>`): one in the concha sees the antihelix square across.
      const [cx, cy, x0, x1, y0, y1, h] = [Number(process.argv[6] ?? 7), Number(process.argv[7] ?? 1572), -14, 32, 1534, 1612, 0.25];
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
      // `helix [floor] [band] ridges`: along rays every 5 degrees, inside the scapha's floor, every ridge of the side-distance profile (a cell
      // higher than every cell within 1.5 mm either side and at least 0.8 mm above the lowest cell between it and the ridge outside it),
      // so the antihelix and its two crura are read as crests inside the rim: their courses and their heights over the hollows beside them.
      if (process.argv[5] === "ridges") {
        // The auricle stands off the head at an angle, so its ridges are crests over its own mean plane, not over the median plane: the
        // side distance less the least-squares plane through every cell past `floor`.
        const normal: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        const right: number[] = [0, 0, 0];
        for (let i: number = 0; i < nx; ++i)
          for (let j: number = 0; j < ny; ++j) {
            const value: number = z[i * ny + j]!;
            if (!(value > floor)) continue;
            const row: number[] = [1, x0 + i * h, y0 + j * h];
            for (let a: number = 0; a < 3; ++a) {
              right[a]! += row[a]! * value;
              for (let b: number = 0; b < 3; ++b) normal[a]![b]! += row[a]! * row[b]!;
            }
          }
        // Gaussian elimination of the 3 by 3 normal equations.
        for (let a: number = 0; a < 3; ++a)
          for (let b: number = a + 1; b < 3; ++b) {
            const f: number = normal[b]![a]! / normal[a]![a]!;
            for (let c: number = a; c < 3; ++c) normal[b]![c]! -= f * normal[a]![c]!;
            right[b]! -= f * right[a]!;
          }
        const plane: number[] = [0, 0, 0];
        for (let a: number = 2; a >= 0; --a) plane[a] = (right[a]! - [0, 1, 2].filter((c: number): boolean => c > a).reduce((s: number, c: number): number => s + normal[a]![c]! * plane[c]!, 0)) / normal[a]![a]!;
        process.stdout.write("plane z = " + plane.map((v: number): string => v.toFixed(4)).join(" + ") + " (1, x, y)\n");
        for (let deg: number = -180; deg < 180; deg += 5) {
          const [dx, dy]: number[] = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
          const raised = (r: number): number => at(cx + r * dx!, cy + r * dy!);
          const skin = (r: number): number => raised(r) - plane[0]! - plane[1]! * (cx + r * dx!) - plane[2]! * (cy + r * dy!);
          let edge: number = -1;
          for (let r: number = 0; r < 45; r += h) if (raised(r) > floor) edge = r;
          if (edge < 0) continue;
          const ridges: string[] = [];
          let low: number = Infinity;
          for (let r: number = edge; r > 0; r -= h) {
            const here: number = skin(r);
            if (!Number.isFinite(here)) continue;
            low = Math.min(low, here);
            let top: boolean = true;
            for (let q: number = r - 1.5; q <= r + 1.5 && top; q += h) if (Math.abs(q - r) > 1e-9 && skin(q) > here) top = false;
            if (top && here - low >= 0.8) {
              ridges.push("(" + (cx + r * dx!).toFixed(1) + "," + (cy + r * dy!).toFixed(1) + "," + raised(r).toFixed(1) + " +" + (here - low).toFixed(1) + ")");
              low = here;
            }
          }
          process.stdout.write(String(deg).padStart(4) + " edge " + edge.toFixed(1) + "  " + ridges.join(" ") + "\n");
        }
        return;
      }
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
    if (process.argv[2] === "saddles") {
      // `saddles [from] [to] [family]`: along the family's own course (`hand`, the default, `AutoMovieHumanF1Hand`; or `leg`,
      // `AutoMovieHumanF1Leg`, whose end the toes split), open at its last knot as the construction lofts
      // it), every millimetre: the reference's loops in the plane (count, chart centre, area), and on the loop nearest the course every
      // hollow under its hull deeper than 0.3 mm (polar phase range and deepest point, rad and mm), with the family wall's standoff from the
      // skin at that deepest phase where the family reaches the station. A saddle is where a hollow's floor opens into a second loop: the
      // station at which the plane first cuts two digits apart along that phase.
      // The foot's dorsal forks stand where the leg's end ring meets the toes' bands, so the same reading on the leg's course places each
      // dorsal saddle against that ring (975 mm) and its seam.
      const which: string = process.argv[5] ?? "hand";
      if (which !== "hand" && which !== "leg") throw new Error("saddles: family " + which + " is neither hand nor leg");
      const family: AutoMovieHumanConicLoft.IFamily = { ...(which === "leg" ? AutoMovieHumanF1.BODY.leg : AutoMovieHumanF1.BODY.hand), tips: [null, null] };
      const course: AutoMovieViewAxis.IAxis = AutoMovieHumanConicLoft.axis(family);
      const last: number = family.knots.at(-1)!;
      const chain = AutoMovieHumanConicLoft.create(family, family.knots).chain;
      const polar = (p: C.P): number => ((Math.atan2(p[1], p[0]) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const from: number = Number(process.argv[3] ?? (which === "leg" ? 940 : 556));
      const to: number = Number(process.argv[4] ?? (which === "leg" ? 995 : 610));
      for (let s: number = from; s <= to; s += 1) {
        const frame = course.at(s);
        const loops: C.P[][] = R.loops(source.body, frame).filter((loop: C.P[]): boolean => Math.hypot(...centre(loop)) < 90);
        const main: C.P[] | undefined = loops.reduce((best: C.P[] | undefined, loop: C.P[]): C.P[] => (best === undefined || Math.hypot(...centre(loop)) < Math.hypot(...centre(best)) ? loop : best), undefined);
        const cells: string[] = loops.map((loop: C.P[]): string => "(" + centre(loop).map((x: number): string => x.toFixed(0)).join(",") + " a" + (R.area(loop) / 100).toFixed(1) + ")");
        const hollows: string[] = [];
        if (main !== undefined) {
          const hull: C.P[] = R.hull(main);
          // Depth of a point under the hull: its least distance to the hull's edges, the point lying inside the hull.
          const depth = (p: C.P): number =>
            Math.min(
              ...hull.map((a: C.P, k: number): number => {
                const b: C.P = hull[(k + 1) % hull.length]!;
                const e: C.P = [b[0] - a[0], b[1] - a[1]];
                const t: number = Math.max(0, Math.min(1, ((p[0] - a[0]) * e[0] + (p[1] - a[1]) * e[1]) / (e[0] * e[0] + e[1] * e[1] || 1)));
                return Math.hypot(p[0] - a[0] - t * e[0], p[1] - a[1] - t * e[1]);
              }),
            );
          const depths: number[] = main.map(depth);
          // Runs of consecutive vertices deeper than 0.3 mm, round the closed loop from a vertex that is not.
          const start: number = Math.max(0, depths.findIndex((d: number): boolean => d <= 0.3));
          let run: number[] = [];
          const flush = (): void => {
            if (run.length === 0) return;
            const deepest: number = run.reduce((b: number, k: number): number => (depths[k]! > depths[b]! ? k : b), run[0]!);
            const t: number = polar(main[deepest]!);
            let standoff: string = "";
            if (chain !== null && s <= last) {
              // The wall's point at the chain sample whose polar angle is nearest the hollow's deepest phase.
              const gap = (x: C.P): number => Math.abs(Math.atan2(Math.sin(polar(x) - t), Math.cos(polar(x) - t)));
              let best: C.P | null = null;
              for (let j: number = 0; j < 720; ++j) {
                const q: number[] = AutoMovieLoftChain.point(chain, s, (2 * Math.PI * j) / 720);
                const d: number[] = [q[0]! - frame.origin[0], q[1]! - frame.origin[1], q[2]! - frame.origin[2]];
                const c: C.P = [d[0]! * frame.u[0] + d[1]! * frame.u[1] + d[2]! * frame.u[2], d[0]! * frame.v[0] + d[1]! * frame.v[1] + d[2]! * frame.v[2]];
                if (best === null || gap(c) < gap(best)) best = c;
              }
              standoff = " wall " + (Math.hypot(...best!) - Math.hypot(...main[deepest]!)).toFixed(2) + "mm";
            }
            hollows.push("[" + polar(main[run[0]!]!).toFixed(2) + ".." + polar(main[run.at(-1)!]!).toFixed(2) + " deepest " + depths[deepest]!.toFixed(2) + "mm@" + t.toFixed(2) + standoff + "]");
            run = [];
          };
          for (let i: number = 0; i < main.length; ++i) {
            const k: number = (start + i) % main.length;
            if (depths[k]! > 0.3) run.push(k);
            else flush();
          }
          flush();
        }
        process.stdout.write(s + ": loops " + loops.length + " " + cells.join(" ") + (hollows.length === 0 ? "" : "\n    hollows " + hollows.join(" ")) + "\n");
      }
      return;
    }
    if (process.argv[2] === "thumbweb") {
      // `thumbweb`: where the thumb's skin ends toward the web. In planes square to the line from the thumb's first joint to its third, every
      // 2 mm from 24 to 56 mm along it (`FamilyConicBody.ts` `thumbHold` holds the hand's nets inside 15 mm of that line from 30 mm on),
      // the crossings of the reference skin, mm from the line, along the ray toward the index finger's first joint (`web`) and along the
      // rays 45 and 90 degrees either side of it: the first is the thumb's skin on that side, and a gap before the next is the web's air.
      const a: R.V = joint("thumb_01_r");
      const b: R.V = joint("thumb_03_r");
      const length: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const k: R.V = [(b[0] - a[0]) / length, (b[1] - a[1]) / length, (b[2] - a[2]) / length];
      const index: R.V = joint("index_01_r");
      for (let along: number = 24; along <= 56; along += 2) {
        const o: R.V = [a[0] + along * k[0], a[1] + along * k[1], a[2] + along * k[2]];
        const w: R.V = [index[0] - o[0], index[1] - o[1], index[2] - o[2]];
        const dot: number = w[0] * k[0] + w[1] * k[1] + w[2] * k[2];
        const square: R.V = [w[0] - dot * k[0], w[1] - dot * k[1], w[2] - dot * k[2]];
        const l: number = Math.hypot(...square);
        const u: R.V = [square[0] / l, square[1] / l, square[2] / l];
        const v: R.V = [k[1] * u[2] - k[2] * u[1], k[2] * u[0] - k[0] * u[2], k[0] * u[1] - k[1] * u[0]];
        const loops: C.P[][] = R.loops(source.body, { origin: o, u, v });
        const cells: string[] = [-90, -45, 0, 45, 90].map((deg: number): string => {
          const r: C.P = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
          const hits: number[] = loops
            .flatMap((loop: C.P[]): number[] =>
              loop.flatMap((p: C.P, i: number): number[] => {
                const q: C.P = loop[(i + 1) % loop.length]!;
                const e: C.P = [q[0] - p[0], q[1] - p[1]];
                const den: number = r[0] * e[1] - r[1] * e[0];
                if (Math.abs(den) < 1e-12) return [];
                const t: number = (p[0] * e[1] - p[1] * e[0]) / den;
                const m: number = (p[0] * r[1] - p[1] * r[0]) / den;
                return t > 0 && m >= 0 && m <= 1 ? [t] : [];
              }),
            )
            .sort((x: number, y: number): number => x - y);
          return (deg === 0 ? "web" : deg + "deg") + " " + hits.slice(0, 4).map((t: number): string => t.toFixed(1)).join("/");
        });
        process.stdout.write("along " + along + ": " + cells.join("  ") + "\n");
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
