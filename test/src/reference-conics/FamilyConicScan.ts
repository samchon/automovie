import { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { AutoMovieLoftChain, AutoMovieMeshExtract as M, AutoMovieViewAxis, AutoMovieEngineConstruction } from "@automovie/engine";
import {
  AutoMovieHumanConicLoft,
  AutoMovieHumanConicSection,
  AutoMovieHumanF1,
  AutoMovieHumanF1Frames,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicSection,
  IAutoMovieHumanF1,
  IAutoMovieHumanF1Frames,
  IAutoMovieMeshSectionChain,
  IAutoMovieViewAxis,
} from "@automovie/interface";
import path from "node:path";

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
 * hold round the thumb. `shoulders` lists every stored shoulder the section
 * model cannot draw as stored, `nets` every relief whose controls alternate,
 * `strips` the gap and the turn each realized band spans and each join's
 * column spacing, `roots` the digits' root sections against their limb's end
 * ring, `turns` every course turn against the turn rule, `tips` every digit's
 * closed end against the reference, and `ala` the star-shape of a candidate
 * course for the nose's wing. `star` reads the star-shape of any candidate
 * course on the body and head skin, and `mound` reads the breast as one mound
 * over the bare thoracic wall interpolated under it: the wall's sections, the
 * footprint, the fold and the cone that cuts the footprint.
 */
namespace FamilyConicScan {
  /** Mean of a loop's vertices in its chart, mm. */
  function centre(loop: readonly C.P[]): C.P {
    return [
      loop.reduce((sum: number, p: C.P): number => sum + p[0], 0) / loop.length,
      loop.reduce((sum: number, p: C.P): number => sum + p[1], 0) / loop.length,
    ];
  }

  /**
   * Every crossing of a ray from the chart origin with a set of chart polylines, as distances along the ray, mm, nearest first. A closed
   * piece is given with its first point repeated at its end; an edge is half open, so a vertex on the ray counts once.
   */
  function cast(pieces: readonly (readonly C.P[])[], angle: number): number[] {
    const d: C.P = [Math.cos(angle), Math.sin(angle)];
    const hits: number[] = [];
    for (const piece of pieces)
      for (let i: number = 0; i + 1 < piece.length; ++i) {
        const p: C.P = piece[i]!;
        const q: C.P = piece[i + 1]!;
        const e: C.P = [q[0] - p[0], q[1] - p[1]];
        const den: number = d[0] * e[1] - d[1] * e[0];
        if (Math.abs(den) < 1e-12) continue;
        const t: number = (p[0] * e[1] - p[1] * e[0]) / den;
        const m: number = (p[0] * d[1] - p[1] * d[0]) / den;
        if (t > 0 && m >= 0 && m < 1) hits.push(t);
      }
    return hits.sort((a: number, b: number): number => a - b);
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
      const axis: IAutoMovieViewAxis.IAxis = AutoMovieViewAxis.jointed([[0, 780, 0], [0, 1480, 0]], [], [1, 0, 0]) as IAutoMovieViewAxis.IAxis;
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
      const axis: IAutoMovieViewAxis.IAxis = AutoMovieViewAxis.jointed([[0, 780, 0], [0, 1705, 0]], [], [1, 0, 0]) as IAutoMovieViewAxis.IAxis;
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
      const axis: IAutoMovieViewAxis.IAxis = AutoMovieViewAxis.jointed([[0, 780, 0], [0, 1480, 0]], [], [1, 0, 0]) as IAutoMovieViewAxis.IAxis;
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
        const pieces: C.P[][] = M.outline(source.head, { origin: [x, 0, 0], axes: [[1, 0, 0], [0, 0, 1], [0, 1, 0]] }, [0], 0, 0.5, 0)[0]!.loops.map((loop: IAutoMovieMeshSectionChain): C.P[] => [...loop.points, ...(loop.closed ? [loop.points[0]!] : [])]);
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
          // The web by rule beside the web read (`packages/human/docs/techniques/joint-logic.md`, Metacarpophalangeal row and finger webs,
          // step 3): its dorsal fork at the two digits' joint centres' level (their first joints' midpoint) and its palmar or plantar
          // edge at the middle of the shorter proximal phalanx (the midpoint of the two points that far along each digit's first
          // segment), each as `[along, depth]` in this seam's plane with its distance off the plane, mm.
          const digits: string[] = which === "arm" ? ["pinky", "ring", "middle", "index"] : ["littletoe", "ringtoe", "middletoe", "indextoe", "bigtoe"];
          const bones: [R.V, R.V][] = [digits[j]!, digits[j + 1]!].map((digit: string): [R.V, R.V] => [joint(digit + "_01_r"), joint(digit + "_02_r")]);
          const lengths: number[] = bones.map(([p, q]: [R.V, R.V]): number => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]));
          const shorter: number = Math.min(...lengths);
          const middle = (points: R.V[]): R.V => [(points[0]![0] + points[1]![0]) / 2, (points[0]![1] + points[1]![1]) / 2, (points[0]![2] + points[1]![2]) / 2];
          const fork: R.V = middle(bones.map(([p]: [R.V, R.V]): R.V => p));
          const edge: R.V = middle(bones.map(([p, q]: [R.V, R.V], k: number): R.V => [0, 1, 2].map((c: number): number => p[c]! + ((q[c]! - p[c]!) * shorter) / 2 / lengths[k]!) as R.V));
          const planeNormal: R.V = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
          const placed = (p: R.V): string => {
            const d: R.V = [p[0] - A[0], p[1] - A[1], p[2] - A[2]];
            return "[" + (d[0] * e1[0] + d[1] * e1[1] + d[2] * e1[2]).toFixed(1) + ", " + (d[0] * e2[0] + d[1] * e2[1] + d[2] * e2[2]).toFixed(1) + "] off " + (d[0] * planeNormal[0] + d[1] * planeNormal[1] + d[2] * planeNormal[2]).toFixed(1);
          };
          process.stdout.write(which + " seam " + j + " by rule: fork at the joint centres " + placed(fork) + ", edge at half the shorter first segment (" + (shorter / 2).toFixed(1) + " mm) " + placed(edge) + "\n");
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
      const real = AutoMovieEngineConstruction.realize({ name: "f1.body", root: declared.root }, { chord: 0.001, sources: declared.sources });
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
      const family: IAutoMovieHumanConicLoft.IFamily = { ...AutoMovieHumanF1.BODY.nose, tips: undefined, reliefs: undefined };
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
      const family: IAutoMovieHumanConicLoft.IFamily = { ...(which === "leg" ? AutoMovieHumanF1.BODY.leg : AutoMovieHumanF1.BODY.hand), tips: [null, null] };
      const course: IAutoMovieViewAxis.IAxis = AutoMovieHumanConicLoft.axis(family);
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
      const made: IAutoMovieViewAxis.IAxis | string =
        process.argv[4] === "square"
          ? hand
            ? AutoMovieViewAxis.jointed([joint("upperarm_r"), joint("lowerarm_r"), joint("hand_r"), square(joint("hand_r"), joint("middle_01_r"), joint("pinky_01_r"), joint("index_01_r"))], [30, 10], [1, 0, 0])
            : AutoMovieViewAxis.jointed([joint("thigh_r"), joint("calf_r"), joint("foot_r"), square(joint("foot_r"), [133, 20, 157], joint("littletoe_01_r"), joint("bigtoe_01_r"))], [40, 62], [1, 0, 0])
          : hand
            ? AutoMovieViewAxis.jointed([joint("upperarm_r"), joint("lowerarm_r"), joint("hand_r"), past(joint("middle_01_r"), joint("index_01_r"), reach)], [30, 10], [1, 0, 0])
            : AutoMovieViewAxis.jointed([joint("thigh_r"), joint("calf_r"), joint("foot_r"), past(joint("indextoe_01_r"), joint("bigtoe_01_r"), reach)], [40, 62], [1, 0, 0]);
      if (typeof made === "string") throw new Error(made);
      const axis: IAutoMovieViewAxis.IAxis = made;
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
    if (process.argv[2] === "shoulders") {
      // Every stored family's and cutter's shoulder fields, read for the values the section model cannot draw as stored: a shoulder at or
      // past the model's cap, 0.85 (`AutoMovieHumanConicSection`, `FAIR`), is drawn at the cap, and one under 0.1 lies within a tenth of
      // its chord, an arc that turns only at its ends. Each is listed by the anchor its arc follows and its knot's station, mm.
      const members: { family: IAutoMovieHumanConicLoft.IFamily; kind: string }[] = [
        ...AutoMovieHumanF1.FAMILIES.map((member: IAutoMovieHumanF1.IMember): { family: IAutoMovieHumanConicLoft.IFamily; kind: string } => ({ family: member.family, kind: "family" })),
        ...AutoMovieHumanF1.CUTTERS.map((cutter: { family: IAutoMovieHumanConicLoft.IFamily }): { family: IAutoMovieHumanConicLoft.IFamily; kind: string } => ({ family: cutter.family, kind: "cutter" })),
      ];
      for (const { family, kind } of members) {
        const first: number = AutoMovieHumanConicSection.offsets(family.layout).shoulders;
        const rows: string[] = [];
        let capped: number = 0;
        let chordal: number = 0;
        family.values.slice(first).forEach((field: number[], arc: number): void => {
          const cells: string[] = [];
          field.forEach((x: number, k: number): void => {
            if (x >= 0.85) ++capped;
            else if (x < 0.1) ++chordal;
            else return;
            cells.push(x.toFixed(4) + "@" + family.knots[k]!);
          });
          if (cells.length > 0) rows.push("  after anchor " + arc + ": " + cells.join(", "));
        });
        process.stdout.write(kind + " " + family.name + ": " + (family.values.length - first) + " shoulder rows by " + family.knots.length + " knots, " + capped + " at or past 0.85, " + chordal + " under 0.1" + (family.layout.least === undefined ? "" : ", least " + JSON.stringify(family.layout.least)) + "\n" + rows.map((row: string): string => row + "\n").join(""));
      }
      return;
    }
    if (process.argv[2] === "nets") {
      // `nets [limit]`: every stored relief's net read for heights that alternate from one control to the next, which a net carries
      // where its casts graze the skin or see none of it (lofting.md, Composition before lofting). Four neighbouring controls alternate
      // when their three steps turn back twice and each is at least `limit` mm (1.5 by default). Read three ways: whole rows by their
      // means over the free columns, single controls along the station, and single controls round the phase; for each the count and the
      // largest, placed by its second control's Greville station, mm, and phase, radians.
      const limit: number = Number(process.argv[3] ?? 1.5);
      for (const member of AutoMovieHumanF1.FAMILIES)
        for (const relief of member.family.reliefs ?? []) {
          const rows: number = relief.rows;
          const columns: number = relief.columns;
          const periodic: boolean = relief.phases.end - relief.phases.start >= 2 * Math.PI - 1e-9;
          const free: number[] = Array.from({ length: columns }, (_: unknown, c: number): number => c).filter((c: number): boolean => periodic || (c >= 3 && c < columns - 3));
          const pitch: number = (relief.stations.end - relief.stations.start) / (rows - 3);
          const round: number = (relief.phases.end - relief.phases.start) / (columns - 3);
          const height = (r: number, c: number): number => relief.heights[r * columns + c]!;
          const station = (r: number): number => relief.stations.start + (r - 1) * pitch;
          const phase = (c: number): number => relief.phases.start + (c - 1) * round;
          const means: number[] = Array.from({ length: rows }, (_: unknown, r: number): number => free.reduce((sum: number, c: number): number => sum + height(r, c), 0) / free.length);
          // The least of three steps that turn back twice, or 0 where they do not: one turn is a crest or a hollow, two are a zigzag.
          const alternates = (q: readonly number[]): number => {
            const steps: number[] = [q[1]! - q[0]!, q[2]! - q[1]!, q[3]! - q[2]!];
            return steps[0]! * steps[1]! < 0 && steps[1]! * steps[2]! < 0 ? Math.min(...steps.map((x: number): number => Math.abs(x))) : 0;
          };
          const whole: string[] = [];
          for (let r: number = 3; r + 2 < rows - 2; ++r) {
            const q: number[] = [means[r - 1]!, means[r]!, means[r + 1]!, means[r + 2]!];
            if (alternates(q) >= limit) whole.push("rows " + (r - 1) + ".." + (r + 2) + " @" + station(r).toFixed(0) + " means " + q.map((x: number): string => x.toFixed(2)).join("/"));
          }
          let along: number = 0;
          let across: number = 0;
          let worstAlong: { size: number; text: string } = { size: 0, text: "" };
          let worstAcross: { size: number; text: string } = { size: 0, text: "" };
          const wrap = (c: number): number => (periodic ? ((c % (columns - 3)) + (columns - 3)) % (columns - 3) : c);
          for (let r: number = 3; r < rows - 3; ++r)
            for (const c of free) {
              const place: string = " at row " + r + " column " + c + " (" + station(r).toFixed(0) + " mm, " + phase(c).toFixed(2) + " rad)";
              if (r + 2 < rows - 2) {
                const q: number[] = [height(r - 1, c), height(r, c), height(r + 1, c), height(r + 2, c)];
                const a: number = alternates(q);
                if (a >= limit) ++along;
                if (a > worstAlong.size) worstAlong = { size: a, text: q.join("/") + place };
              }
              if (periodic || c + 2 < columns - 2) {
                const q: number[] = [height(r, wrap(c - 1)), height(r, c), height(r, wrap(c + 1)), height(r, wrap(c + 2))];
                const b: number = alternates(q);
                if (b >= limit) ++across;
                if (b > worstAcross.size) worstAcross = { size: b, text: q.join("/") + place };
              }
            }
          process.stdout.write(relief.name + ": " + rows + " by " + columns + ", " + pitch.toFixed(2) + " mm a row, " + round.toFixed(3) + " rad a column; whole rows alternating " + whole.length + (whole.length === 0 ? "" : " [" + whole.join("; ") + "]") + "; controls alternating along the station " + along + (worstAlong.size === 0 ? "" : ", most " + worstAlong.text) + "; round the phase " + across + (worstAcross.size === 0 ? "" : ", most " + worstAcross.text) + "\n");
        }
      return;
    }
    if (process.argv[2] === "strips") {
      // `strips [pattern] [columns]`: every band and blend of the realized figure whose name matches the pattern (a regular expression;
      // `^band\.` by default), read across its span at 720 clocks: the chord from its first rail to its last, the radial gap it spans (the
      // last rail's point off the first rail's tangent plane, and the first's off the last's, mm, outward positive), the turn between the
      // two rails' normals, degrees, and the length of each rail's loop. A band that spans a radial gap or turns through a steep angle
      // shows that the two sides' lines were not shared (construction.md, Connections). With `columns`, each loop's length a column, mm,
      // against the roll rule (lofting.md: every sampling across an edge with a roll is at most a quarter of the roll).
      const pattern: RegExp = new RegExp(process.argv[3] ?? "^band\\.");
      const columns: number | undefined = process.argv[4] === undefined ? undefined : Number(process.argv[4]);
      const declared = AutoMovieHumanF1.construction();
      const real = AutoMovieEngineConstruction.realize({ name: "f1.body", root: declared.root, fills: declared.fills }, { chord: 0.001, sources: declared.sources });
      process.stdout.write("diagnostics " + real.diagnostics.length + real.diagnostics.map((d: { node: string; contract: string; detail: string }): string => "\n  " + d.node + " (" + d.contract + "): " + d.detail.slice(0, 200)).join("") + "\nsurfaces " + real.surfaces.map((s: { name: string }): string => s.name).join(", ") + "\n");
      const sub = (a: readonly number[], b: readonly number[]): R.V => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
      const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
      const cross = (a: readonly number[], b: readonly number[]): R.V => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
      for (const surface of real.surfaces.filter((s: { name: string }): boolean => pattern.test(s.name))) {
        const span: number | undefined = real.chains.find((c: { name: string }): boolean => c.name === surface.name)?.layers.at(-1)?.y;
        if (span === undefined) {
          process.stdout.write(surface.name + ": no chain of its own\n");
          continue;
        }
        const period: number = surface.period ?? 2 * Math.PI;
        const clocks: number = 720;
        const read = (t: number, k: number): { p: R.V; n: R.V } => {
          const jet = surface.jet(t, (period * k) / clocks);
          const normal: R.V = cross(jet.u, jet.v);
          const length: number = Math.hypot(...normal) || 1;
          return { p: [jet.p[0]!, jet.p[1]!, jet.p[2]!], n: normal.map((x: number): number => (x * surface.orientation) / length) as R.V };
        };
        const lengths: number[] = [0, 0];
        const chords: number[] = [];
        const table: string[] = [];
        let gap: { size: number; text: string } = { size: 0, text: "none" };
        let turn: { size: number; text: string } = { size: 0, text: "none" };
        const start: [R.V, R.V] = [read(0, 0).p, read(span, 0).p];
        for (let k: number = 0; k < clocks; ++k) {
          const a = read(0, k);
          const b = read(span, k);
          const off: number[] = [dot(sub(b.p, a.p), a.n), dot(sub(a.p, b.p), b.n)];
          const size: number = Math.max(Math.abs(off[0]!), Math.abs(off[1]!));
          const angle: number = (Math.acos(Math.max(-1, Math.min(1, dot(a.n, b.n)))) * 180) / Math.PI;
          const where: string = " at clock " + ((period * k) / clocks).toFixed(3) + " [" + a.p.map((x: number): string => x.toFixed(1)).join(", ") + "]";
          if (size > gap.size) gap = { size, text: off.map((x: number): string => x.toFixed(2)).join(" and ") + " mm" + where };
          if (angle > turn.size) turn = { size: angle, text: angle.toFixed(1) + " deg" + where };
          chords.push(Math.hypot(...sub(b.p, a.p)));
          // Every fifteenth clock, 48 round the loop: the clock, the chord, the two gaps and the turn, so the stretches where a band
          // continues its host are told from its seams.
          if (k % 15 === 0) table.push(((period * k) / clocks).toFixed(2) + ":" + chords.at(-1)!.toFixed(1) + "/" + off[0]!.toFixed(1) + "/" + off[1]!.toFixed(1) + "/" + angle.toFixed(0));
          const next: [R.V, R.V] = k + 1 < clocks ? [read(0, k + 1).p, read(span, k + 1).p] : start;
          lengths[0]! += Math.hypot(...sub(next[0], a.p));
          lengths[1]! += Math.hypot(...sub(next[1], b.p));
        }
        process.stdout.write(
          surface.name + ": chart span " + span.toFixed(2) + ", chord " + Math.min(...chords).toFixed(2) + " to " + Math.max(...chords).toFixed(2) + " mm, loops " + lengths.map((x: number): string => x.toFixed(1)).join(" and ") + " mm" +
            (columns === undefined ? "" : ", " + lengths.map((x: number): string => (x / columns).toFixed(2)).join(" and ") + " mm a column on " + columns) +
            "; largest gap " + gap.text + "; largest turn " + turn.text + "\n    clock:chord/gap/gap/turn " + table.join(" ") + "\n",
        );
      }
      // Each join of that name: its traced curve's points at its columns (`AutoMovieSolidBlendChain.IBlend.curve`), the curve's length and
      // the least, mean and largest distance between two neighbouring columns, with the blend's declared chords either side.
      for (const join of real.joins.filter((j: { name: string }): boolean => pattern.test(j.name))) {
        const curve: [number, number, number][] = join.blend.curve;
        const steps: number[] = curve.map((p: [number, number, number], k: number): number => Math.hypot(...sub(curve[(k + 1) % curve.length]!, p)));
        const total: number = steps.reduce((sum: number, x: number): number => sum + x, 0);
        const widths: number[] = [...join.blend.widths.host, ...join.blend.widths.part.filter((x: number | null): x is number => x !== null)];
        process.stdout.write("join " + join.name + ": " + curve.length + " columns on a curve " + total.toFixed(1) + " mm long, " + Math.min(...steps).toFixed(2) + " to " + Math.max(...steps).toFixed(2) + " mm apart (mean " + (total / curve.length).toFixed(2) + "); chords " + Math.min(...widths).toFixed(2) + " to " + Math.max(...widths).toFixed(2) + " mm; blend span " + join.blend.length.toFixed(2) + "\n");
      }
      return;
    }
    if (process.argv[2] === "roots") {
      // The hand's and the foot's end rings overlaid on their digits' root sections in the end's own plane
      // (`AutoMovieHumanF1.fanRoots`): each digit's root centre and extents in the plane's chart, and at sixteen points round its root
      // section how far that point stands outside the end ring along the ray from the limb's course point (mm; negative inside). Where a
      // digit continues the limb's back or its palm or sole the two lines are one and the gap is nothing; a gap there is what the
      // digit's band spans (construction.md, Connections).
      for (const which of ["arm", "leg"] as const) {
        const parent: IAutoMovieHumanConicLoft.IFamily = { ...(which === "arm" ? AutoMovieHumanF1.BODY.hand : AutoMovieHumanF1.BODY.leg), tips: undefined };
        const station: number = parent.knots.at(-1)!;
        const chain = AutoMovieHumanConicLoft.create(parent, parent.knots).chain;
        if (chain === null) throw new Error("roots: the " + which + " does not loft");
        const roots = AutoMovieHumanF1.fanRoots(which);
        const plane = roots[0]!.root.plane;
        const ring: C.P[] = Array.from({ length: 720 }, (_: unknown, k: number): C.P => {
          const p: number[] = AutoMovieLoftChain.point(chain, station, (2 * Math.PI * k) / 720);
          const d: number[] = [p[0]! - plane.origin[0], p[1]! - plane.origin[1], p[2]! - plane.origin[2]];
          return [d[0]! * plane.u[0] + d[1]! * plane.u[1] + d[2]! * plane.u[2], d[0]! * plane.v[0] + d[1]! * plane.v[1] + d[2]! * plane.v[2]];
        });
        process.stdout.write(which + " end at " + station + " mm: ring u " + Math.min(...ring.map((p: C.P): number => p[0])).toFixed(1) + ".." + Math.max(...ring.map((p: C.P): number => p[0])).toFixed(1) + " v " + Math.min(...ring.map((p: C.P): number => p[1])).toFixed(1) + ".." + Math.max(...ring.map((p: C.P): number => p[1])).toFixed(1) + "\n");
        for (const { name, root } of roots) {
          const gaps: string[] = root.loop
            .filter((_: [number, number], k: number): boolean => k % 4 === 0)
            .map((p: [number, number]): string => {
              const hit: number | null = Math.hypot(p[0], p[1]) < 1e-9 ? null : ((): number | null => {
                const r: number = Math.hypot(p[0], p[1]);
                const d: C.P = [p[0] / r, p[1] / r];
                let best: number | null = null;
                ring.forEach((a: C.P, i: number): void => {
                  const b: C.P = ring[(i + 1) % ring.length]!;
                  const e: C.P = [b[0] - a[0], b[1] - a[1]];
                  const den: number = d[0] * e[1] - d[1] * e[0];
                  if (Math.abs(den) < 1e-12) return;
                  const t: number = (a[0] * e[1] - a[1] * e[0]) / den;
                  const m: number = (a[0] * d[1] - a[1] * d[0]) / den;
                  if (t > 0 && m >= 0 && m < 1 && (best === null || t > best)) best = t;
                });
                return best === null ? null : r - best;
              })();
              return "[" + p[0].toFixed(1) + "," + p[1].toFixed(1) + "]" + (hit === null ? "." : hit.toFixed(1));
            });
          process.stdout.write("  " + name + ": centre [" + root.centre.map((x: number): string => x.toFixed(1)).join(", ") + "], u " + Math.min(...root.loop.map((p: [number, number]): number => p[0])).toFixed(1) + ".." + Math.max(...root.loop.map((p: [number, number]): number => p[0])).toFixed(1) + " v " + Math.min(...root.loop.map((p: [number, number]): number => p[1])).toFixed(1) + ".." + Math.max(...root.loop.map((p: [number, number]): number => p[1])).toFixed(1) + "\n    point and gap: " + gaps.join(" ") + "\n");
        }
      }
      return;
    }
    if (process.argv[2] === "turns") {
      // Every stored family's and cutter's course turns against the turn rule (`packages/human/docs/techniques/joint-logic.md`, Turn half
      // length): a `jointed` turn of angle `theta` over the half length `h` has a greatest curvature of `15 theta / (16 h)`, and sections
      // square to the course stay apart on the turn's concave side only while the reach `r` there is under the radius of curvature, so
      // `h > (15 / 16) theta r`. For each interior centre: the angle, the stored half length, the wall's reach toward the centre of
      // curvature at the turn's middle station (the farthest point of its section along the inward normal, reliefs off) and the half
      // length the rule asks.
      const members: IAutoMovieHumanConicLoft.IFamily[] = [...AutoMovieHumanF1.FAMILIES.map((member: IAutoMovieHumanF1.IMember): IAutoMovieHumanConicLoft.IFamily => member.family), ...AutoMovieHumanF1.CUTTERS.map((cutter: { family: IAutoMovieHumanConicLoft.IFamily }): IAutoMovieHumanConicLoft.IFamily => cutter.family)];
      for (const stored of members) {
        if (stored.centres.length < 3) continue;
        const family: IAutoMovieHumanConicLoft.IFamily = { ...stored, tips: undefined, reliefs: undefined };
        const runs: IAutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(family.centres, family.halves);
        if (typeof runs === "string") throw new Error(family.name + ": " + runs);
        const course: IAutoMovieViewAxis.IAxis = AutoMovieHumanConicLoft.axis(family);
        const unit = (a: readonly number[], b: readonly number[]): number[] => {
          const d: number[] = [b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!];
          const length: number = Math.hypot(...d);
          return d.map((x: number): number => x / length);
        };
        for (let i: number = 1; i + 1 < family.centres.length; ++i) {
          const before: number[] = unit(family.centres[i - 1]!, family.centres[i]!);
          const after: number[] = unit(family.centres[i]!, family.centres[i + 1]!);
          const theta: number = Math.acos(Math.max(-1, Math.min(1, before[0]! * after[0]! + before[1]! * after[1]! + before[2]! * after[2]!)));
          const half: number = family.halves[i - 1]!;
          // The turn's middle station: where the run before it ends plus its half length.
          const middle: number = runs[i - 1]!.end + half;
          const inward: number[] = [after[0]! - before[0]!, after[1]! - before[1]!, after[2]! - before[2]!];
          const size: number = Math.hypot(...inward);
          let reach: string = "outside its knots";
          let asked: string = "";
          if (size > 1e-9 && middle >= family.knots[0]! && middle <= family.knots.at(-1)!) {
            const chain = AutoMovieHumanConicLoft.create(family, [...new Set([family.knots[0]!, middle, family.knots.at(-1)!])].sort((a: number, b: number): number => a - b)).chain;
            if (chain !== null) {
              const origin = course.at(middle).origin;
              let far: number = 0;
              for (let j: number = 0; j < 360; ++j) {
                const p: number[] = AutoMovieLoftChain.point(chain, middle, (2 * Math.PI * j) / 360);
                far = Math.max(far, ((p[0]! - origin[0]) * inward[0]! + (p[1]! - origin[1]) * inward[1]! + (p[2]! - origin[2]) * inward[2]!) / size);
              }
              reach = far.toFixed(1) + " mm";
              asked = ", the rule asks more than " + ((15 / 16) * theta * far).toFixed(1) + " mm: " + (half > (15 / 16) * theta * far ? "holds" : "VIOLATED");
            }
          }
          process.stdout.write(family.name + " centre " + i + " at station " + middle.toFixed(1) + ": turn " + ((theta * 180) / Math.PI).toFixed(1) + " deg, half " + half + " mm, reach on the concave side " + reach + asked + "\n");
        }
      }
      return;
    }
    if (process.argv[2] === "tips") {
      // `tips [name]`: every digit's closed end read against the reference (or the one digit named). For each: its cap's first station
      // and its tip, the four extremes of its stored section at its last two knots with each extreme's own coordinate's taper over the
      // cap's length as a share of that coordinate (`AutoMovieHumanConicLoft.ITip.own`; the mean extent's beside it), and along its own
      // course every half millimetre from 2 mm before the cap to its tip the reference loop nearest the course by its extents in the
      // chart, mm. The cap closes on the course point, so where the reference's loop closes away from it the dome's pole stands off the
      // skin's.
      for (const digit of AutoMovieHumanF1.DIGITS) {
        const family: IAutoMovieHumanConicLoft.IFamily = digit.family;
        if (process.argv[3] !== undefined && family.name !== process.argv[3]) continue;
        const end: IAutoMovieHumanConicLoft.ITip | null | undefined = family.tips?.[1];
        if (end === null || end === undefined) continue;
        const course: IAutoMovieViewAxis.IAxis = AutoMovieHumanConicLoft.axis(family);
        const last: number = family.knots.length - 1;
        const span: number = family.knots[last]! - family.knots[last - 1]!;
        const at: number[] = AutoMovieHumanConicSection.offsets(family.layout).at;
        // The four extremes are the layout's anchors that hold a `(u, v)` pair, in the order front, side, back, side.
        const pairs: number[] = family.layout.anchors.flatMap((anchor: IAutoMovieHumanConicSection.IAnchor, k: number): number[] => ((anchor.kind === "u" || anchor.kind === "v") && anchor.mid !== true ? [at[k]!] : []));
        const own: number[] = pairs.map((f: number, q: number): number => family.values[f + (q % 2)]![last]!);
        const before: number[] = pairs.map((f: number, q: number): number => family.values[f + (q % 2)]![last - 1]!);
        const length: number = end.tip - end.from;
        const tapers: string[] = own.map((x: number, q: number): string => ["front u", "side v", "back u", "side v"][q % 4]! + " " + before[q]!.toFixed(2) + " to " + x.toFixed(2) + " (" + ((((before[q]! - x) / span) * length) / x).toFixed(2) + ")");
        const mean = (list: number[]): number => list.reduce((sum: number, x: number): number => sum + Math.abs(x), 0) / list.length;
        process.stdout.write(family.name + ": cap from " + end.from + " to " + end.tip + " mm" + (end.own === true ? ", own" : "") + "; last knots " + family.knots[last - 1] + " and " + family.knots[last] + "; " + tapers.join(", ") + "; mean extent " + mean(before).toFixed(2) + " to " + mean(own).toFixed(2) + " (" + ((((mean(before) - mean(own)) / span) * length) / mean(own)).toFixed(2) + ")\n");
        for (let s: number = end.from - 2; s <= end.tip + 0.5; s += 0.5) {
          const loops: C.P[][] = R.loops(source.body, course.at(s)).filter((loop: C.P[]): boolean => Math.hypot(...centre(loop)) < 12);
          const near: C.P[] | undefined = loops.reduce((best: C.P[] | undefined, loop: C.P[]): C.P[] => (best === undefined || Math.hypot(...centre(loop)) < Math.hypot(...centre(best)) ? loop : best), undefined);
          process.stdout.write("  " + s.toFixed(1) + ": " + (near === undefined ? "no loop" : "u " + Math.min(...near.map((p: C.P): number => p[0])).toFixed(2) + ".." + Math.max(...near.map((p: C.P): number => p[0])).toFixed(2) + " v " + Math.min(...near.map((p: C.P): number => p[1])).toFixed(2) + ".." + Math.max(...near.map((p: C.P): number => p[1])).toFixed(2)) + "\n");
        }
      }
      return;
    }
    if (process.argv[2] === "ala") {
      // `ala [centres] [halves] [reach]`: a candidate course for the nose's wing (JSON lists, mm, on the +Z side), read before any family
      // is fitted on it (lofting.md, One section family: each section is star-shaped about the course). In the plane square to the course
      // every millimetre, from the course point along 360 rays: whether the point lies in the flesh (an odd count of crossings), and how
      // many rays meet the skin never, once or more than once within `reach` mm (9 by default). A ray that meets it more than once has
      // left the flesh and entered it again: each run of such rays is listed by its angles (0 along the chart's `u`, up; a quarter turn
      // along `v`) with the first crossing's distance and where the second lies in the reference frame, so the wing's own fold is told
      // from a neighbour (the columella across the nostril, the lip, the cheek).
      const centres: R.V[] = JSON.parse(process.argv[3] ?? "[[112,1551,16.5],[119,1552,15.2],[125,1553,12.5],[129,1553.5,8]]") as R.V[];
      const halves: number[] = JSON.parse(process.argv[4] ?? "[2.5,2.5]") as number[];
      const reach: number = Number(process.argv[5] ?? 9);
      const made: IAutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(centres, halves, [0, 1, 0]);
      if (typeof made === "string") throw new Error(made);
      const runs: IAutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(centres, halves);
      if (typeof runs === "string") throw new Error(runs);
      const length: number = runs.at(-1)!.end;
      process.stdout.write("course " + JSON.stringify(centres) + " halves " + JSON.stringify(halves) + " length " + length.toFixed(1) + " mm, reach " + reach + " mm\n");
      for (let s: number = 0; s <= length; s += 1) {
        const frame = made.at(s);
        const loops: C.P[][] = R.loops(source.head, frame);
        const world = (t: number, angle: number): R.V => [0, 1, 2].map((c: number): number => frame.origin[c]! + t * (Math.cos(angle) * frame.u[c]! + Math.sin(angle) * frame.v[c]!)) as R.V;
        const rays: { angle: number; hits: number[] }[] = [];
        for (let j: number = 0; j < 360; ++j) {
          const angle: number = (2 * Math.PI * j) / 360;
          const d: C.P = [Math.cos(angle), Math.sin(angle)];
          const hits: number[] = [];
          for (const loop of loops)
            loop.forEach((p: C.P, i: number): void => {
              const q: C.P = loop[(i + 1) % loop.length]!;
              const e: C.P = [q[0] - p[0], q[1] - p[1]];
              const den: number = d[0] * e[1] - d[1] * e[0];
              if (Math.abs(den) < 1e-12) return;
              const t: number = (p[0] * e[1] - p[1] * e[0]) / den;
              const m: number = (p[0] * d[1] - p[1] * d[0]) / den;
              if (t > 0 && m >= 0 && m < 1) hits.push(t);
            });
          rays.push({ angle, hits: hits.sort((a: number, b: number): number => a - b) });
        }
        const inside: number = rays.filter((ray): boolean => ray.hits.length % 2 === 1).length;
        const near = (ray: { hits: number[] }): number[] => ray.hits.filter((t: number): boolean => t <= reach);
        const none: number = rays.filter((ray): boolean => near(ray).length === 0).length;
        const once: { angle: number; hits: number[] }[] = rays.filter((ray): boolean => near(ray).length === 1);
        const folded: string[] = [];
        let run: { angle: number; hits: number[] }[] = [];
        const flush = (): void => {
          if (run.length === 0) return;
          const seconds: R.V[] = run.map((ray): R.V => world(ray.hits[1]!, ray.angle));
          const range = (c: number): string => Math.min(...seconds.map((p: R.V): number => p[c]!)).toFixed(1) + ".." + Math.max(...seconds.map((p: R.V): number => p[c]!)).toFixed(1);
          folded.push("[" + ((run[0]!.angle * 180) / Math.PI).toFixed(0) + ".." + ((run.at(-1)!.angle * 180) / Math.PI).toFixed(0) + " deg, first " + Math.min(...run.map((ray): number => ray.hits[0]!)).toFixed(1) + ".." + Math.max(...run.map((ray): number => ray.hits[0]!)).toFixed(1) + " mm, second at x " + range(0) + " y " + range(1) + " z " + range(2) + "]");
          run = [];
        };
        for (const ray of rays)
          if (near(ray).length >= 2) run.push(ray);
          else flush();
        flush();
        const firsts: number[] = once.map((ray): number => ray.hits[0]!);
        process.stdout.write(
          s.toFixed(0).padStart(3) + " at [" + frame.origin.map((x: number): string => x.toFixed(1)).join(", ") + "] " + (inside > 180 ? "in the flesh" : "in the air") + " (" + inside + " of 360 rays odd); rays none " + none + " once " + once.length + (firsts.length === 0 ? "" : " (" + Math.min(...firsts).toFixed(1) + ".." + Math.max(...firsts).toFixed(1) + " mm)") + " more " + (360 - none - once.length) +
            (folded.length === 0 ? "" : "\n      " + folded.join(" ")) + "\n",
        );
      }
      return;
    }
    if (process.argv[2] === "star") {
      // `star [centres] [halves] [up] [reach] [side] [from] [to] [step]`: the star-shape of a candidate course on the body and head skin
      // (lofting.md, One section family: every ray from the course point meets the section once), read before any family is fitted on
      // it, as `ala` reads the nose's wing. The course is `jointed` centres, turn half lengths and an up vector (JSON lists, mm, written
      // for the +Z side; `side` -1 reflects them in z = 0). In the plane square to the course every `step` mm from `to` back to `from`
      // (stations from the first centre; they may run before it and past the last), from the course point along 360 rays: whether the
      // point lies in the flesh (an odd count of crossings on most rays); how many rays meet the skin never, once or more than once
      // within `reach` mm; each run of rays that never meet it, the arc where the section is open into its host; each run of refused
      // rays, which have left the flesh and entered it again, by its angles (0 along the chart's `u`, a quarter turn along `v`, both
      // printed in the reference frame) with the first crossing's distance and where the second lies; the first crossing's radius every
      // 15 degrees; and whether the section closes, by the closed loop round the course point of least reach against `reach`.
      const side: number = Number(process.argv[7] ?? 1) < 0 ? -1 : 1;
      const centres: R.V[] = (JSON.parse(process.argv[3] ?? "[[97.4,1258.41,65.14],[134.64,1261.94,71.8]]") as R.V[]).map((p: R.V): R.V => [p[0], p[1], side * p[2]]);
      const halves: number[] = JSON.parse(process.argv[4] ?? "[]") as number[];
      const up: R.V = ((v: R.V): R.V => [v[0], v[1], side * v[2]])(JSON.parse(process.argv[5] ?? "[0,1,0]") as R.V);
      const reach: number = Number(process.argv[6] ?? 90);
      const made: IAutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(centres, halves, up);
      if (typeof made === "string") throw new Error(made);
      const runs: IAutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(centres, halves);
      if (typeof runs === "string") throw new Error(runs);
      const length: number = runs.at(-1)!.end;
      const from: number = Number(process.argv[8] ?? -30);
      const to: number = Number(process.argv[9] ?? Math.ceil(length) + 4);
      const step: number = Number(process.argv[10] ?? 1);
      const first = made.at(0);
      process.stdout.write("course " + JSON.stringify(centres) + " halves " + JSON.stringify(halves) + " length " + length.toFixed(2) + " mm, reach " + reach + " mm; chart u [" + first.u.map((x: number): string => x.toFixed(4)).join(", ") + "] v [" + first.v.map((x: number): string => x.toFixed(4)).join(", ") + "]\n");
      for (let s: number = to; s >= from - 1e-9; s -= step) {
        const frame = made.at(s);
        const n: R.V = [frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1], frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2], frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0]];

        // Every piece of the cut, closed or open, so a ray's count misses no skin; a closed piece repeats its first point.
        const pieces: C.P[][] = M.outline(source.all, { origin: [...frame.origin] as R.V, axes: [n, [...frame.u] as R.V, [...frame.v] as R.V] }, [0], 0, 0.5, 0)[0]!.loops.map((loop: IAutoMovieMeshSectionChain): C.P[] => [...loop.points, ...(loop.closed ? [loop.points[0]!] : [])]);
        const world = (t: number, angle: number): R.V => [0, 1, 2].map((c: number): number => frame.origin[c]! + t * (Math.cos(angle) * frame.u[c]! + Math.sin(angle) * frame.v[c]!)) as R.V;
        const rays: { angle: number; hits: number[] }[] = Array.from({ length: 360 }, (_: unknown, j: number): { angle: number; hits: number[] } => ({ angle: (2 * Math.PI * j) / 360, hits: cast(pieces, (2 * Math.PI * j) / 360) }));
        const inside: number = rays.filter((ray): boolean => ray.hits.length % 2 === 1).length;
        const near = (ray: { hits: number[] }): number[] => ray.hits.filter((t: number): boolean => t <= reach);
        const count = (k: number): number => rays.filter((ray): boolean => Math.min(2, near(ray).length) === k).length;

        // Runs of neighbouring rays of one kind, by their angles; a run through 0 degrees prints as two.
        const collect = (kind: number, describe: (run: { angle: number; hits: number[] }[]) => string): string[] => {
          const out: string[] = [];
          let run: { angle: number; hits: number[] }[] = [];
          const flush = (): void => {
            if (run.length > 0) out.push("[" + ((run[0]!.angle * 180) / Math.PI).toFixed(0) + ".." + ((run.at(-1)!.angle * 180) / Math.PI).toFixed(0) + " deg" + describe(run) + "]");
            run = [];
          };
          for (const ray of rays)
            if (Math.min(2, near(ray).length) === kind) run.push(ray);
            else flush();
          flush();
          return out;
        };
        const open: string[] = collect(0, (): string => "");
        const refused: string[] = collect(2, (run: { angle: number; hits: number[] }[]): string => {
          const seconds: R.V[] = run.map((ray): R.V => world(ray.hits[1]!, ray.angle));
          const range = (c: number): string => Math.min(...seconds.map((p: R.V): number => p[c]!)).toFixed(1) + ".." + Math.max(...seconds.map((p: R.V): number => p[c]!)).toFixed(1);
          return ", first " + Math.min(...run.map((ray): number => ray.hits[0]!)).toFixed(1) + ".." + Math.max(...run.map((ray): number => ray.hits[0]!)).toFixed(1) + " mm, second at x " + range(0) + " y " + range(1) + " z " + range(2);
        });

        // The closed loop round the course point of least reach: the section closes when it lies within the reach.
        const round: number[] = pieces
          .filter((piece: C.P[]): boolean => piece.length > 3 && piece[0] === piece.at(-1) && cast([piece], 0.1234).length % 2 === 1)
          .map((piece: C.P[]): number => Math.max(...piece.map((p: C.P): number => Math.hypot(p[0], p[1]))));
        const least: number = Math.min(...round);
        const radii: string[] = Array.from({ length: 24 }, (_: unknown, j: number): string => {
          const hit: number | undefined = rays[j * 15]!.hits[0];
          return hit === undefined || hit > reach ? "." : hit.toFixed(1);
        });
        process.stdout.write(
          s.toFixed(1).padStart(6) + " at [" + frame.origin.map((x: number): string => x.toFixed(1)).join(", ") + "] " + (inside > 180 ? "in the flesh" : "in the air") + " (" + inside + " of 360 rays odd); rays none " + count(0) + " once " + count(1) + " refused " + count(2) +
            "; " + (round.length === 0 ? "no closed loop round the course" : least <= reach ? "closes within " + least.toFixed(1) + " mm" : "its loop reaches " + least.toFixed(1) + " mm, past the reach") +
            "\n        r/15deg " + radii.join(" ") + (open.length === 0 ? "" : "\n        open " + open.join(" ")) + (refused.length === 0 ? "" : "\n        refused " + refused.join(" ")) + "\n",
        );
      }
      return;
    }
    if (process.argv[2] === "mound") {
      // `mound [yLow] [yHigh] [phaseLow] [phaseHigh] [limit]`: the breast as one mound over the bare thoracic wall, read once and whole
      // (joint-logic.md, Breast-chest wall: a mound with a fold on a footprint the wall's skin is cut to by a cone about the course).
      //
      // The skin is read as level sections 2 mm apart from y 1100 to 1460, the first crossing's radius about the vertical line through
      // the origin every degree over 0 to 120 (0 forward, 90 to +Z). That chart is only where the reading is taken; every result is a
      // point of the reference frame. OBSERVATION is the skin outside the declared mask (`phaseLow`..`phaseHigh` degrees, 4 to 76, by
      // `yLow`..`yHigh`, 1196 to 1384): the abdomen below the fold, the chest above the run-out, the sternum strip and the ribs behind
      // the anterior axillary line. INTERPOLATION is the wall inside the mask, by three declared choices:
      //   Q, the wall delivered: along each meridian a quintic Hermite span across the mask that takes position, slope and second
      //      derivative at both borders from a least-squares parabola through the 24 mm of skin just outside (C2 to the faired skin);
      //   H, the same borders' positions and slopes only, a cubic Hermite span (C1);
      //   L, round each level a quintic Hermite span between the sternum strip (mirrored about the median plane) and the ribs, taken
      //      only where the 12 degrees past `phaseHigh` are the trunk's own skin (radius under 180 mm: above the armpit they are the arm's).
      // The spreads |Q - H| and |Q - L| are the wall's uncertainty. The mound's height is the skin's radius less Q's, times the cosine
      // between the radial line and Q's normal; the footprint is the region higher than `limit` (2 mm) joined to the highest point.
      //
      // The root centre is the footprint's centroid carried onto Q. Two bust points give two courses from it: the foremost skin of the
      // footprint (ISO 8559-1 5.3.4 as `AutoMovieHumanF1NativeSites` reads it) and the highest point over the wall. About each: the
      // skin's and the wall's profiles in 72 half-planes (clock 0 up, 90 toward +Z, heights along the course); the footprint's radius
      // at three limits; the fold as the profile's sharpest concave bend with its turn, the wall's turn there and its radius by three
      // readings; the inflection inside it; the mound's bulge off its chord; the two surfaces' principal curvatures; the sections
      // square to the course with the phases that are mound and wall; and the cone about the course that cuts the footprint.
      const yLo: number = Number(process.argv[3] ?? 1196);
      const yHi: number = Number(process.argv[4] ?? 1384);
      const tLo: number = Number(process.argv[5] ?? 4);
      const tHi: number = Number(process.argv[6] ?? 76);
      const limit: number = Number(process.argv[7] ?? 2);
      const Y0: number = 1100;
      const DY: number = 2;
      const NY: number = 181;
      const NT: number = 121;
      const WINDOW: number = 24;
      const ARM: number = 180;
      const rad: number = Math.PI / 180;
      const add = (a: R.V, b: R.V, s: number = 1): R.V => [a[0] + s * b[0], a[1] + s * b[1], a[2] + s * b[2]];
      const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
      const cross = (a: R.V, b: R.V): R.V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const unit = (a: R.V): R.V => add([0, 0, 0], a, 1 / Math.hypot(a[0], a[1], a[2]));
      const show = (x: number, digits: number = 1): string => (Number.isFinite(x) ? x.toFixed(digits) : ".");
      const at = (p: readonly number[], digits: number = 1): string => "[" + p.map((x: number): string => show(x, digits)).join(", ") + "]";
      const say = (text: string): void => {
        process.stdout.write(text + "\n");
      };
      const yOf = (iy: number): number => Y0 + iy * DY;
      const iyOf = (y: number): number => Math.round((y - Y0) / DY);

      // Least squares by the normal equations and Gaussian elimination with partial pivoting; null where the samples do not determine it.
      const fit = (rows: readonly number[][], values: readonly number[]): number[] | null => {
        const n: number = rows[0]!.length;
        const a: number[][] = Array.from({ length: n }, (): number[] => new Array<number>(n + 1).fill(0));
        rows.forEach((row: number[], i: number): void => {
          for (let p: number = 0; p < n; ++p) {
            a[p]![n]! += row[p]! * values[i]!;
            for (let q: number = 0; q < n; ++q) a[p]![q]! += row[p]! * row[q]!;
          }
        });
        for (let c: number = 0; c < n; ++c) {
          let pivot: number = c;
          for (let r: number = c + 1; r < n; ++r) if (Math.abs(a[r]![c]!) > Math.abs(a[pivot]![c]!)) pivot = r;
          if (Math.abs(a[pivot]![c]!) < 1e-12) return null;
          [a[c], a[pivot]] = [a[pivot]!, a[c]!];
          for (let r: number = 0; r < n; ++r) {
            if (r === c) continue;
            const f: number = a[r]![c]! / a[c]![c]!;
            for (let q: number = c; q <= n; ++q) a[r]![q]! -= f * a[c]![q]!;
          }
        }
        return a.map((row: number[], i: number): number => row[n]! / row[i]!);
      };

      // A border's position, slope and second derivative from the least-squares parabola through the skin beside it.
      const jet = (xs: readonly number[], values: readonly number[], where: number): number[] | null => {
        if (values.some((v: number): boolean => !Number.isFinite(v))) return null;
        const c: number[] | null = fit(xs.map((x: number): number[] => [1, x - where, (x - where) ** 2]), values);
        return c === null ? null : [c[0]!, c[1]!, 2 * c[2]!];
      };

      // The Hermite span between two borders' jets: quintic on position, slope and second derivative, or cubic on the first two.
      const hermite = (x0: number, j0: number[], x1: number, j1: number[], x: number, quintic: boolean): number => {
        const L: number = x1 - x0;
        const t: number = (x - x0) / L;
        if (!quintic) return j0[0]! * (2 * t ** 3 - 3 * t ** 2 + 1) + j0[1]! * L * (t ** 3 - 2 * t ** 2 + t) + j1[0]! * (-2 * t ** 3 + 3 * t ** 2) + j1[1]! * L * (t ** 3 - t ** 2);
        return (
          j0[0]! * (1 - 10 * t ** 3 + 15 * t ** 4 - 6 * t ** 5) + j0[1]! * L * (t - 6 * t ** 3 + 8 * t ** 4 - 3 * t ** 5) + j0[2]! * L * L * 0.5 * (t ** 2 - 3 * t ** 3 + 3 * t ** 4 - t ** 5) +
          j1[0]! * (10 * t ** 3 - 15 * t ** 4 + 6 * t ** 5) + j1[1]! * L * (-4 * t ** 3 + 7 * t ** 4 - 3 * t ** 5) + j1[2]! * L * L * 0.5 * (t ** 3 - 2 * t ** 4 + t ** 5)
        );
      };

      // OBSERVATION: the skin's first crossing on every ray, and the rays inside the mask that cross it again (an overhang a level
      // section cannot hold).
      const skin: number[][] = [];
      const folded: string[] = [];
      let spacing: string = "unread";
      for (let iy: number = 0; iy < NY; ++iy) {
        const loop: C.P[] | null = R.cut(source.all, { origin: [0, yOf(iy), 0], u: [1, 0, 0], v: [0, 0, 1] }).loop;
        const piece: C.P[] = loop === null ? [] : [...loop, loop[0]!];
        const row: number[] = [];
        for (let it: number = 0; it < NT; ++it) {
          const hits: number[] = cast([piece], it * rad);
          row.push(hits[0] ?? NaN);
          if (hits.length > 1 && it >= tLo && it <= tHi && yOf(iy) > yLo && yOf(iy) < yHi) folded.push(yOf(iy) + "/" + it);
        }
        skin.push(row);
        if (yOf(iy) === 1260 && loop !== null) {
          const steps: number[] = loop.flatMap((p: C.P, i: number): number[] => {
            const q: C.P = loop[(i + 1) % loop.length]!;
            const phase: number = Math.atan2(p[1], p[0]) / rad;
            return phase > 10 && phase < 60 ? [Math.hypot(q[0] - p[0], q[1] - p[1])] : [];
          });
          spacing = steps.length + " edges, mean " + (steps.reduce((sum: number, x: number): number => sum + x, 0) / steps.length).toFixed(2) + " mm, longest " + Math.max(...steps).toFixed(2) + " mm";
        }
      }
      say("== reading: levels y " + Y0 + ".." + yOf(NY - 1) + " every " + DY + " mm, phases 0.." + (NT - 1) + " deg every degree; mask y " + yLo + ".." + yHi + " phases " + tLo + ".." + tHi + " deg; footprint limit " + limit + " mm; border window " + WINDOW + " mm");
      say("the reference's section at y 1260 between 10 and 60 deg: " + spacing);
      say("rays inside the mask that cross the skin more than once (y/phase): " + (folded.length === 0 ? "none" : folded.length + ": " + folded.slice(0, 40).join(" ")));

      // INTERPOLATION: the three walls. Outside the mask each is the skin itself.
      const wall: number[][] = skin.map((row: number[]): number[] => [...row]);
      const cubic: number[][] = skin.map((row: number[]): number[] => [...row]);
      const level: number[][] = skin.map((row: number[]): number[] => [...row]);
      const unbridged: number[] = [];
      for (let it: number = tLo; it <= tHi; ++it) {
        const below: number[] = Array.from({ length: iyOf(yLo) - iyOf(yLo - WINDOW) + 1 }, (_: unknown, k: number): number => iyOf(yLo - WINDOW) + k);
        const above: number[] = Array.from({ length: iyOf(yHi + WINDOW) - iyOf(yHi) + 1 }, (_: unknown, k: number): number => iyOf(yHi) + k);
        const j0: number[] | null = jet(below.map(yOf), below.map((iy: number): number => skin[iy]![it]!), yLo);
        const j1: number[] | null = jet(above.map(yOf), above.map((iy: number): number => skin[iy]![it]!), yHi);
        if (j0 === null || j1 === null) {
          unbridged.push(it);
          continue;
        }
        for (let iy: number = iyOf(yLo) + 1; iy < iyOf(yHi); ++iy) {
          wall[iy]![it] = hermite(yLo, j0, yHi, j1, yOf(iy), true);
          cubic[iy]![it] = hermite(yLo, j0, yHi, j1, yOf(iy), false);
        }
      }
      let levelled: number = 0;
      for (let iy: number = iyOf(yLo) + 1; iy < iyOf(yHi); ++iy) {
        const medial: number[] = Array.from({ length: 2 * tLo + 1 }, (_: unknown, k: number): number => k - tLo);
        const lateral: number[] = Array.from({ length: 13 }, (_: unknown, k: number): number => tHi + k);
        const ribs: number[] = lateral.map((t: number): number => skin[iy]![t]!);
        const j0: number[] | null = jet(medial, medial.map((t: number): number => skin[iy]![Math.abs(t)]!), tLo);
        const j1: number[] | null = ribs.some((r: number): boolean => !(r < ARM)) ? null : jet(lateral, ribs, tHi);
        if (j0 !== null && j1 !== null) ++levelled;
        for (let it: number = tLo + 1; it < tHi; ++it) level[iy]![it] = j0 === null || j1 === null ? NaN : hermite(tLo, j0, tHi, j1, it, true);
      }
      say("meridians left unbridged (skin unread beside the mask): " + (unbridged.length === 0 ? "none" : unbridged.join(" ")) + "; levels where L is read: " + levelled + " of " + (iyOf(yHi) - iyOf(yLo) - 1));

      // A grid's value at any phase (degrees, mirrored about the median plane) and height, bilinear; NaN outside the reading.
      const sample = (grid: number[][], phase: number, y: number): number => {
        const t: number = Math.abs(phase);
        const v: number = (y - Y0) / DY;
        if (!(t <= NT - 1 && v >= 0 && v <= NY - 1)) return NaN;
        const i: number = Math.min(NT - 2, Math.floor(t));
        const j: number = Math.min(NY - 2, Math.floor(v));
        const [a, b]: [number, number] = [t - i, v - j];
        return (1 - b) * ((1 - a) * grid[j]![i]! + a * grid[j]![i + 1]!) + b * ((1 - a) * grid[j + 1]![i]! + a * grid[j + 1]![i + 1]!);
      };
      const point = (grid: number[][], phase: number, y: number): R.V => {
        const r: number = sample(grid, phase, y);
        return [r * Math.cos(phase * rad), y, r * Math.sin(phase * rad)];
      };

      // The mound's height over Q along Q's normal: with `r(phase, y)` the wall, its outward normal is `(r' sin + r cos, -r r_y,
      // r sin - r' cos)` of length `hypot(r, r', r r_y)`, and its cosine to the radial line is `r` over that length.
      const height: number[][] = skin.map((row: number[], iy: number): number[] =>
        row.map((r: number, it: number): number => {
          if (iy === 0 || iy === NY - 1 || it === NT - 1) return NaN;
          const w: number = wall[iy]![it]!;
          const round: number = it === 0 ? 0 : (wall[iy]![it + 1]! - wall[iy]![it - 1]!) / (2 * rad);
          const along: number = (wall[iy + 1]![it]! - wall[iy - 1]![it]!) / (2 * DY);
          return ((r - w) * w) / Math.hypot(w, round, w * along);
        }),
      );

      // The wall's sections, in the reference frame: every 4 mm from station 400 to 620 (y less 780), every 3 degrees to 90.
      say("== WALL sections (Q), station = y - 780; cells phase:x,z flag |Q-H|/|Q-L| mm; flag o observed skin, i interpolated, a the arm's skin past " + ARM + " mm");
      for (let station: number = 400; station <= 620; station += 4) {
        const iy: number = iyOf(780 + station);
        const cells: string[] = [];
        for (let it: number = 0; it <= 90; it += 3) {
          const r: number = wall[iy]![it]!;
          const inside: boolean = it >= tLo && it <= tHi && yOf(iy) > yLo && yOf(iy) < yHi && !unbridged.includes(it);
          cells.push(it + ":" + show(r * Math.cos(it * rad)) + "," + show(r * Math.sin(it * rad)) + (inside ? "i" + show(Math.abs(r - cubic[iy]![it]!)) + "/" + show(Math.abs(r - level[iy]![it]!)) : r > ARM ? "a" : "o"));
        }
        say("WALL " + station + " y " + yOf(iy) + ": " + cells.join(" "));
      }

      // The wall's control curves along the station: the front outline (phase 0), the side outline (the section's greatest z), the
      // oblique radii and the fullness at 45 degrees, the wall's radius there over the radius of the ellipse through the front and
      // the 90 degree radii.
      say("== WALL control curves: station, front x, side z (at its x), radius at 30/45/60/90 deg, fullness at 45 deg; * where the side is the arm's skin");
      for (let station: number = 400; station <= 620; station += 4) {
        const iy: number = iyOf(780 + station);
        const row: number[] = wall[iy]!;
        let widest: number = 0;
        for (let it: number = 0; it < NT; ++it) if (row[it]! * Math.sin(it * rad) > row[widest]! * Math.sin(widest * rad)) widest = it;
        const ellipse: number = (row[0]! * row[90]!) / Math.sqrt((row[0]! ** 2 + row[90]! ** 2) / 2);
        say("CONTROL " + station + ": front " + show(row[0]!) + " side " + show(row[widest]! * Math.sin(widest * rad)) + " (x " + show(row[widest]! * Math.cos(widest * rad)) + ")" + (row[widest]! > ARM ? "*" : "") + " r30 " + show(row[30]!) + " r45 " + show(row[45]!) + " r60 " + show(row[60]!) + " r90 " + show(row[90]!) + (row[90]! > ARM ? "*" : "") + " fullness45 " + show(row[45]! / ellipse, 3));
      }

      // The height's map, the interpolation's own check: outside the mound the wall should return the skin, so heights there near 0.
      say("== height of the skin over Q along Q's normal, mm; rows y, columns phase 0..80 every 4 deg");
      for (let y: number = yLo - 8; y <= yHi + 8; y += 8) say("HEIGHT y " + y + ": " + Array.from({ length: 21 }, (_: unknown, k: number): string => show(height[iyOf(y)]![4 * k]!).padStart(6)).join(""));

      // The footprint: the cells higher than the limit that join the highest one.
      let top: [number, number] = [iyOf(yLo) + 1, tLo];
      for (let iy: number = iyOf(yLo) + 1; iy < iyOf(yHi); ++iy) for (let it: number = tLo; it <= tHi; ++it) if (height[iy]![it]! > height[top[0]]![top[1]]!) top = [iy, it];
      const inside: boolean[][] = skin.map((row: number[]): boolean[] => row.map((): boolean => false));
      const queue: [number, number][] = [top];
      inside[top[0]]![top[1]] = true;
      while (queue.length > 0) {
        const [iy, it]: [number, number] = queue.pop()!;
        for (const [jy, jt] of [[iy + 1, it], [iy - 1, it], [iy, it + 1], [iy, it - 1]] as [number, number][]) {
          if (jy < 1 || jy >= NY - 1 || jt < 0 || jt >= NT - 1 || inside[jy]![jt]! || !(height[jy]![jt]! > limit)) continue;
          inside[jy]![jt] = true;
          queue.push([jy, jt]);
        }
      }
      const cells: [number, number][] = inside.flatMap((row: boolean[], iy: number): [number, number][] => row.flatMap((value: boolean, it: number): [number, number][] => (value ? [[iy, it]] : [])));
      const low: number[] = [];
      let negative: number = 0;
      for (let iy: number = iyOf(yLo) + 1; iy < iyOf(yHi); ++iy)
        for (let it: number = tLo; it <= tHi; ++it) {
          if (!inside[iy]![it]!) low.push(height[iy]![it]!);
          negative = Math.min(negative, height[iy]![it]!);
        }
      say("== FOOTPRINT (height over " + limit + " mm, joined to the highest cell): " + cells.length + " cells");
      say("inside the mask but outside the footprint: " + low.length + " cells, height rms " + show(Math.sqrt(low.reduce((sum: number, x: number): number => sum + x * x, 0) / Math.max(1, low.length)), 2) + " mm, lowest " + show(negative, 2) + " mm (the skin below the interpolated wall)");
      const ys: number[] = cells.map(([iy]: [number, number]): number => yOf(iy));
      const ts: number[] = cells.map(([, it]: [number, number]): number => it);
      say("levels y " + Math.min(...ys) + ".." + Math.max(...ys) + " (height " + (Math.max(...ys) - Math.min(...ys)) + " mm; mask borders " + (Math.min(...ys) - yLo) + " mm below and " + (yHi - Math.max(...ys)) + " mm above it), phases " + Math.min(...ts) + ".." + Math.max(...ts) + " deg (mask borders " + (Math.min(...ts) - tLo) + " and " + (tHi - Math.max(...ts)) + " deg away)");
      let widest: { chord: number; arc: number; y: number; from: R.V; to: R.V } = { chord: 0, arc: 0, y: 0, from: [0, 0, 0], to: [0, 0, 0] };
      say("FOOTPRINT rows: y, phase range, the wall's points at its two ends, chord and arc along the wall, mm");
      for (let iy: number = 0; iy < NY; ++iy) {
        const row: number[] = inside[iy]!.flatMap((value: boolean, it: number): number[] => (value ? [it] : []));
        if (row.length === 0) continue;
        const [a, b]: [number, number] = [Math.min(...row), Math.max(...row)];
        const [from, to]: [R.V, R.V] = [point(wall, a, yOf(iy)), point(wall, b, yOf(iy))];
        let arc: number = 0;
        for (let it: number = a; it < b; ++it) arc += Math.hypot(...add(point(wall, it + 1, yOf(iy)), point(wall, it, yOf(iy)), -1));
        const chord: number = Math.hypot(...add(to, from, -1));
        if (chord > widest.chord) widest = { chord, arc, y: yOf(iy), from, to };
        if (iy % 2 === 0) say("  y " + yOf(iy) + " phases " + a + ".." + b + " " + at(from) + " " + at(to) + " chord " + show(chord) + " arc " + show(arc));
      }
      say("base width: widest chord " + show(widest.chord) + " mm (arc " + show(widest.arc) + ") at y " + widest.y + " from " + at(widest.from) + " to " + at(widest.to));

      // The root centre: the footprint's centroid, weighted by the wall's radius (a cell's area), carried onto the wall along its ray.
      const weight: number = cells.reduce((sum: number, [iy, it]: [number, number]): number => sum + wall[iy]![it]!, 0);
      const mean: R.V = cells.reduce((sum: R.V, [iy, it]: [number, number]): R.V => add(sum, point(wall, it, yOf(iy)), wall[iy]![it]! / weight), [0, 0, 0]);
      const C: R.V = point(wall, Math.atan2(mean[2], mean[0]) / rad, mean[1]);
      const foremost: [number, number] = cells.reduce((best: [number, number], cell: [number, number]): [number, number] => (skin[cell[0]]![cell[1]]! * Math.cos(cell[1] * rad) > skin[best[0]]![best[1]]! * Math.cos(best[1] * rad) ? cell : best));
      const bust: R.V = point(skin, foremost[1], yOf(foremost[0]));
      const apex: R.V = point(skin, top[1], yOf(top[0]));
      const segments: IAutoMovieHumanF1Frames.ISegment[] = AutoMovieHumanF1Frames.segments();
      const local = (name: string, p: R.V, direction: boolean = false): R.V => {
        const frame = segments.find((segment: IAutoMovieHumanF1Frames.ISegment): boolean => segment.name === name)!.frame;
        const d: R.V = direction ? p : add(p, frame.origin as R.V, -1);
        return frame.axes.map((axis: readonly number[]): number => dot(d, axis)) as R.V;
      };
      say("== CENTRES");
      say("root centre on the wall " + at(C, 2) + " (thorax frame " + at(local("thorax", C), 2) + "; phase " + show(Math.atan2(C[2], C[0]) / rad) + " deg, station " + show(C[1] - 780) + ")");
      say("bust point, the footprint's foremost skin " + at(bust, 2) + " (thorax " + at(local("thorax", bust), 2) + "; phase " + foremost[1] + " deg): height over the wall along its normal " + show(height[foremost[0]]![foremost[1]]!, 2) + " mm, radial " + show(skin[foremost[0]]![foremost[1]]! - wall[foremost[0]]![foremost[1]]!, 2) + " (H " + show(skin[foremost[0]]![foremost[1]]! - cubic[foremost[0]]![foremost[1]]!, 2) + ", L " + show(skin[foremost[0]]![foremost[1]]! - level[foremost[0]]![foremost[1]]!, 2) + ")");
      say("apex, the highest skin over the wall " + at(apex, 2) + " (thorax " + at(local("thorax", apex), 2) + "; phase " + top[1] + " deg): height " + show(height[top[0]]![top[1]]!, 2) + " mm, radial " + show(skin[top[0]]![top[1]]! - wall[top[0]]![top[1]]!, 2) + " (H " + show(skin[top[0]]![top[1]]! - cubic[top[0]]![top[1]]!, 2) + ", L " + show(skin[top[0]]![top[1]]! - level[top[0]]![top[1]]!, 2) + "); " + show(Math.hypot(...add(apex, bust, -1))) + " mm from the bust point");
      say("thorax origin " + at(segments.find((segment: IAutoMovieHumanF1Frames.ISegment): boolean => segment.name === "thorax")!.frame.origin, 2) + "; stored breast frame origin " + at(segments.find((segment: IAutoMovieHumanF1Frames.ISegment): boolean => segment.name === "breast")!.frame.origin, 2) + " X " + at(segments.find((segment: IAutoMovieHumanF1Frames.ISegment): boolean => segment.name === "breast")!.frame.axes[0], 4));

      // The meridians through the bust point and the apex: skin, the three walls and the height every 4 mm, for the poles' fullness.
      for (const [name, it] of [["bust", foremost[1]], ["apex", top[1]]] as [string, number][]) {
        say("== MERIDIAN through the " + name + " point, phase " + it + " deg: y, skin r, Q, H, L, height along the normal");
        for (let y: number = yLo - 8; y <= yHi + 8; y += 4) say("MERIDIAN " + name + " y " + y + ": " + [skin, wall, cubic, level, height].map((grid: number[][]): string => show(grid[iyOf(y)]![it]!, 2).padStart(8)).join(""));
      }

      // Everything about one course from the root centre to a bust point.
      const analyse = (label: string, B: R.V): void => {
        const k: R.V = unit(add(B, C, -1));
        const length: number = Math.hypot(...add(B, C, -1));
        const e0: R.V = unit([-k[1] * k[0], 1 - k[1] * k[1], -k[1] * k[2]]);
        const e1: R.V = cross(k, e0);
        const place = (p: number, q: number, a: number): R.V => add(add(add(C, e0, p), e1, q), k, a);

        // A surface's height along the course over a point of the plane square to it through the root centre: the first crossing met
        // coming in from 80 mm ahead, by bisection of the grid's radius.
        const surface = (grid: number[][]): ((p: number, q: number) => number) => (p: number, q: number): number => {
          const g = (a: number): number => {
            const P: R.V = place(p, q, a);
            return Math.hypot(P[0], P[2]) - sample(grid, Math.atan2(Math.abs(P[2]), P[0]) / rad, P[1]);
          };
          let high: number = 80;
          if (!(g(high) > 0)) return NaN;
          for (let lower: number = high - 1; lower >= -80; --lower) {
            const value: number = g(lower);
            if (Number.isNaN(value)) return NaN;
            if (value <= 0) {
              let [a, b]: [number, number] = [lower, high];
              for (let i: number = 0; i < 40; ++i) {
                const m: number = (a + b) / 2;
                if (g(m) <= 0) a = m;
                else b = m;
              }
              return (a + b) / 2;
            }
            high = lower;
          }
          return NaN;
        };
        const skinAt: (p: number, q: number) => number = surface(skin);
        const wallAt: (p: number, q: number) => number = surface(wall);
        const CLOCKS: number = 72;
        const REACH: number = 120;
        const BACK: number = 20;
        const clock = (c: number): number => (2 * Math.PI * c) / CLOCKS;
        const profile = (read: (p: number, q: number) => number): number[][] => Array.from({ length: CLOCKS }, (_: unknown, c: number): number[] => Array.from({ length: REACH + 1 }, (_: unknown, r: number): number => read(r * Math.cos(clock(c)), r * Math.sin(clock(c)))));
        const S: number[][] = profile(skinAt);
        const W: number[][] = profile(wallAt);

        // A profile carried through the pole into the opposite half-plane, index `rho + BACK`, and faired by a Gaussian of `sigma` mm.
        const through = (P: number[][], c: number): number[] => [...P[(c + CLOCKS / 2) % CLOCKS]!.slice(1, BACK + 1).reverse(), ...P[c]!];
        const fair = (values: number[], sigma: number): number[] =>
          values.map((_: number, i: number): number => {
            let [sum, total]: [number, number] = [0, 0];
            for (let j: number = Math.max(0, i - Math.ceil(4 * sigma)); j <= Math.min(values.length - 1, i + Math.ceil(4 * sigma)); ++j) {
              if (!Number.isFinite(values[j]!)) continue;
              const g: number = Math.exp(-((j - i) ** 2) / (2 * sigma * sigma));
              sum += g * values[j]!;
              total += g;
            }
            return total > 0 && Number.isFinite(values[i]!) ? sum / total : NaN;
          });
        const slope = (v: number[], i: number): number => (v[i + 1]! - v[i - 1]!) / 2;

        // Positive where the profile is concave to the outside (a valley), 1/mm.
        const bend = (v: number[], i: number): number => (v[i + 1]! - 2 * v[i]! + v[i - 1]!) / (1 + slope(v, i) ** 2) ** 1.5;
        const lerp = (v: number[], x: number): number => {
          const i: number = Math.floor(x);
          return i < 0 || i + 1 >= v.length ? NaN : v[i]! + (x - i) * (v[i + 1]! - v[i]!);
        };
        const worldAt = (c: number, rho: number, a: number): R.V => place(rho * Math.cos(clock(c)), rho * Math.sin(clock(c)), a);

        say("");
        say("==== COURSE " + label + ": from the root centre " + at(C, 2) + " to " + at(B, 2) + ", direction " + at(k, 4) + " (thorax " + at(local("thorax", k, true), 4) + "; stored breast frame " + at(local("breast", k, true), 4) + ", " + show(Math.acos(Math.min(1, local("breast", k, true)[0])) / rad, 2) + " deg off its X), length " + show(length, 2) + " mm; clock 0 along " + at(e0, 4) + ", 90 along " + at(e1, 4));
        say("root centre and bust point in the stored breast frame: " + at(local("breast", C), 2) + " and " + at(local("breast", B), 2));
        let pole: { a: number; c: number; r: number } = { a: S[0]![0]!, c: 0, r: 0 };
        for (let c: number = 0; c < CLOCKS; ++c) for (let r: number = 0; r <= 40; ++r) if (S[c]![r]! > pole.a) pole = { a: S[c]![r]!, c, r };
        say("skin on the course " + show(S[0]![0]!, 2) + " mm along it, wall " + show(W[0]![0]!, 2) + "; the skin's farthest point along the course " + show(pole.a, 2) + " mm, " + pole.r + " mm off the course at clock " + (pole.c * 360) / CLOCKS + " deg " + at(worldAt(pole.c, pole.r, pole.a)));

        // Per clock: the footprint, the fold, the inflection and the bulge.
        interface IClock { foot: number[]; fold: number; turn: number; wallTurn: number; full: number; wallFull: number; sharp: number; sharper: number; mean: number; inflection: number; kind: string }
        const rows: IClock[] = [];
        say("CLOCK table: clock deg | footprint radius at limits 1/" + limit + "/4 mm | footprint point on the wall | fold radius from the course, point | turn of the fillet (run over 15% of the peak bend) skin/wall, deg | turn between inflections skin/wall, deg | fillet radius: 1/peak bend faired 3 mm, faired 1.5 mm, arc/turn | inflection radius | height " + "5/10/15/20 mm inside the footprint | bulge off the chord / chord");
        for (let c: number = 0; c < CLOCKS; ++c) {
          const s3: number[] = fair(through(S, c), 3);
          const s15: number[] = fair(through(S, c), 1.5);
          const w3: number[] = fair(through(W, c), 3);
          const h: number[] = Array.from({ length: REACH }, (_: unknown, r: number): number => (S[c]![r]! - W[c]![r]!) / Math.hypot(1, slope(w3, r + BACK)));
          const foot = (T: number): number => {
            if (!(h[0]! >= T)) return NaN;
            for (let r: number = 1; r < REACH; ++r) {
              if (Number.isNaN(h[r]!)) return NaN;
              if (h[r]! < T) return r - 1 + (h[r - 1]! - T) / (h[r - 1]! - h[r]!);
            }
            return NaN;
          };
          const feet: number[] = [foot(1), foot(limit), foot(4)];
          const from: number = Math.max(5, Math.round((Number.isFinite(feet[2]!) ? feet[2]! : 20) - 20));
          const to: number = Math.min(REACH - 5, Math.round((Number.isFinite(feet[0]!) ? feet[0]! : 100) + 12));
          let peak: number = -1;
          for (let r: number = from; r <= to; ++r) if (Number.isFinite(bend(s3, r + BACK)) && (peak < 0 || bend(s3, r + BACK) > bend(s3, peak + BACK))) peak = r;
          const row: IClock = { foot: feet, fold: NaN, turn: NaN, wallTurn: NaN, full: NaN, wallFull: NaN, sharp: NaN, sharper: NaN, mean: NaN, inflection: NaN, kind: "." };
          if (peak >= 0 && bend(s3, peak + BACK) > 0) {
            const most: number = bend(s3, peak + BACK);
            let [i1, i2]: [number, number] = [peak + BACK, peak + BACK];
            while (i1 - 1 > BACK && bend(s3, i1 - 1) > 0.15 * most) --i1;
            while (i2 + 1 < BACK + REACH - 2 && bend(s3, i2 + 1) > 0.15 * most) ++i2;
            let [i0, i3]: [number, number] = [i1, i2];
            while (i0 - 1 > BACK && bend(s3, i0 - 1) > 0) --i0;
            while (i3 + 1 < BACK + REACH - 2 && bend(s3, i3 + 1) > 0) ++i3;
            const turn = (v: number[], a: number, b: number): number => (Math.atan(slope(v, b)) - Math.atan(slope(v, a))) / rad;
            let arc: number = 0;
            for (let i: number = i1; i < i2; ++i) arc += Math.hypot(1, s3[i + 1]! - s3[i]!);
            let sharper: number = 0;
            for (let i: number = peak + BACK - 3; i <= peak + BACK + 3; ++i) sharper = Math.max(sharper, bend(s15, i));
            row.fold = peak;
            row.turn = turn(s3, i1, i2);
            row.wallTurn = turn(w3, i1, i2);
            row.full = turn(s3, i0, i3);
            row.wallFull = turn(w3, i0, i3);
            row.sharp = 1 / most;
            row.sharper = 1 / sharper;
            row.mean = arc / (row.turn * rad);
            row.inflection = i0 - BACK;
            row.kind = row.mean < 25 && row.turn - row.wallTurn >= 15 ? "fold" : row.turn - row.wallTurn < 10 || row.mean > 60 ? "tangent" : "run-out";
          }
          rows.push(row);

          // The mound's bulge off the chord from its pole to its footprint, over the chord: 0 a cone, about 0.2 a circular arc of a
          // quarter turn.
          let bulge: number = NaN;
          const edge: number = feet[1]!;
          if (Number.isFinite(edge)) {
            const [a0, a1]: [number, number] = [S[c]![0]!, lerp(S[c]!, edge)];
            const chord: number = Math.hypot(edge, a1 - a0);
            bulge = 0;
            for (let r: number = 1; r < edge; ++r) bulge = Math.max(bulge, ((S[c]![r]! - a0) * edge - (a1 - a0) * r) / chord / chord);
          }
          say(
            "CLOCK " + String((c * 360) / CLOCKS).padStart(3) + " | " + feet.map((x: number): string => show(x)).join("/") + " | " + (Number.isFinite(edge) ? at(worldAt(c, edge, lerp(W[c]!, edge))) : ".") +
              " | " + show(row.fold, 0) + " " + (Number.isFinite(row.fold) ? at(worldAt(c, row.fold, S[c]![row.fold]!)) : ".") + " | " + show(row.turn) + "/" + show(row.wallTurn) + " | " + show(row.full) + "/" + show(row.wallFull) +
              " | " + show(row.sharp) + " " + show(row.sharper) + " " + show(row.mean) + " | " + show(row.inflection, 0) + " | " + [5, 10, 15, 20].map((d: number): string => show(lerp(h, edge - d))).join("/") + " | " + show(bulge, 3) + " | " + row.kind,
          );
        }

        // The arcs by kind: a fold where the fillet's mean radius is under 25 mm and it turns 15 degrees more than the wall; tangent
        // where it turns under 10 degrees more than the wall or its mean radius is over 60 mm; a run-out between.
        const arcs: string[] = [];
        for (let c: number = 0; c < CLOCKS; ++c) if (rows[c]!.kind !== rows[(c + CLOCKS - 1) % CLOCKS]!.kind) arcs.push(rows[c]!.kind + " from " + (c * 360) / CLOCKS);
        say("ARCS round the clock: " + (arcs.length === 0 ? "all " + rows[0]!.kind : arcs.join(", ")));
        say("base about the course at the " + limit + " mm limit: up " + show(rows[0]!.foot[1]!) + " down " + show(rows[CLOCKS / 2]!.foot[1]!) + " lateral " + show(rows[CLOCKS / 4]!.foot[1]!) + " medial " + show(rows[(3 * CLOCKS) / 4]!.foot[1]!) + " mm");

        // The two surfaces' principal curvatures (convex positive, 1/mm, with their radii) from the least-squares quadric through the
        // heights within 10 mm, and the normal curvature along the radial line: at the pole, and every 15 degrees on the wall at the
        // footprint, on the skin there and on the skin 15 mm inside it.
        const curvature = (read: (p: number, q: number) => number, p: number, q: number): string => {
          const samples: number[][] = [];
          const values: number[] = [];
          for (let x: number = -10; x <= 10; x += 2.5)
            for (let y: number = -10; y <= 10; y += 2.5) {
              if (x * x + y * y > 100.01) continue;
              const a: number = read(p + x, q + y);
              if (!Number.isFinite(a)) return ".";
              samples.push([1, x, y, x * x, x * y, y * y]);
              values.push(a);
            }
          const c: number[] | null = fit(samples, values);
          if (c === null) return ".";
          const w: number = Math.hypot(1, c[1]!, c[2]!);
          const [E, F, G]: number[] = [1 + c[1]! ** 2, c[1]! * c[2]!, 1 + c[2]! ** 2];
          const [L, M, N]: number[] = [(2 * c[3]!) / w, c[4]! / w, (2 * c[5]!) / w];
          const H: number = (E! * N! - 2 * F! * M! + G! * L!) / (2 * (E! * G! - F! * F!));
          const K: number = (L! * N! - M! * M!) / (E! * G! - F! * F!);
          const root: number = Math.sqrt(Math.max(0, H * H - K));
          const r: number = Math.hypot(p, q);
          const d: [number, number] = r === 0 ? [1, 0] : [p / r, q / r];
          const radial: number = -(L! * d[0] * d[0] + 2 * M! * d[0] * d[1] + N! * d[1] * d[1]) / (E! * d[0] * d[0] + 2 * F! * d[0] * d[1] + G! * d[1] * d[1]);
          const cell = (x: number): string => show(x, 4) + " (R " + show(1 / x, 0) + ")";
          return "k1 " + cell(-(H - root)) + " k2 " + cell(-(H + root)) + " radial " + cell(radial);
        };
        say("CURVATURE at the pole, skin: " + curvature(skinAt, pole.r * Math.cos(clock(pole.c)), pole.r * Math.sin(clock(pole.c))));
        for (let c: number = 0; c < CLOCKS; c += 3) {
          const edge: number = rows[c]!.foot[1]!;
          if (!Number.isFinite(edge)) continue;
          const [x, y]: [number, number] = [Math.cos(clock(c)), Math.sin(clock(c))];
          say("CURVATURE " + String((c * 360) / CLOCKS).padStart(3) + " | wall at the footprint " + curvature(wallAt, edge * x, edge * y) + " | skin at the footprint " + curvature(skinAt, edge * x, edge * y) + " | skin 15 mm inside " + curvature(skinAt, (edge - 15) * x, (edge - 15) * y));
        }

        // The sections square to the course from the pole back: where the skin stands at that height in each half-plane, and whether
        // that is the mound's skin (inside the footprint) or the wall's. The section is a loop of the mound alone while every phase is.
        say("SECTION table: station along the course | phases on the mound of " + CLOCKS + " | the wall's phases, clock deg | radius every 15 deg (m mound, w wall, . none within " + REACH + " mm)");
        const sections: string[] = [];
        for (let s: number = Math.floor(pole.a); s >= -24; s -= 3) {
          const radii: number[] = S.map((line: number[]): number => {
            if (!(line[0]! >= s)) return 0;
            for (let r: number = 1; r <= REACH; ++r) {
              if (Number.isNaN(line[r]!)) return NaN;
              if (line[r]! < s) return r - 1 + (line[r - 1]! - s) / (line[r - 1]! - line[r]!);
            }
            return NaN;
          });
          const mound: boolean[] = radii.map((r: number, c: number): boolean => Number.isFinite(r) && Number.isFinite(rows[c]!.foot[1]!) && r <= rows[c]!.foot[1]!);
          const walls: number[] = mound.flatMap((value: boolean, c: number): number[] => (value ? [] : [(c * 360) / CLOCKS]));
          say("SECTION " + String(s).padStart(4) + " | " + mound.filter((value: boolean): boolean => value).length + " | " + (walls.length === 0 ? "none" : walls.length > 12 ? walls[0] + ".." + walls.at(-1) + " (" + walls.length + ")" : walls.join(" ")) + " | " + radii.filter((_: number, c: number): boolean => c % 3 === 0).map((r: number, j: number): string => show(r) + (mound[3 * j]! ? "m" : Number.isFinite(r) ? "w" : "")).join(" "));
          sections.push("POINTS " + s + ": " + radii.flatMap((r: number, c: number): string[] => (mound[c]! ? [worldAt(c, r, s).map((x: number): string => x.toFixed(1)).join(",")] : [])).join(" "));
        }
        say("section point sets, the mound's skin only (x,y,z in the reference frame, clocks in order):");
        for (const line of sections) say(line);

        // The cone about the course that cuts the footprint out of the wall: for each apex along the course the half angle is the
        // footprint points' mean angle from the course, and a point's miss is its angle's difference times its distance from the
        // apex (square to the cone), or that over the sine between the cone's generator and the wall's profile (along the wall).
        for (const [k3, T] of [1, limit, 4].entries()) {
          const points: { rho: number; a: number; slope: number }[] = rows.flatMap((row: IClock, c: number): { rho: number; a: number; slope: number }[] => {
            const rho: number = row.foot[k3]!;
            return Number.isFinite(rho) ? [{ rho, a: lerp(W[c]!, rho), slope: slope(fair(through(W, c), 3), Math.round(rho) + BACK) }] : [];
          });
          const cone = (t: number): { alpha: number; rms: number; most: number; along: number; alongMost: number } | null => {
            if (points.some((p: { rho: number; a: number }): boolean => Math.hypot(p.rho, p.a - t) < 5)) return null;
            const angles: number[] = points.map((p: { rho: number; a: number }): number => Math.atan2(p.rho, p.a - t));
            const alpha: number = angles.reduce((sum: number, x: number): number => sum + x, 0) / angles.length;
            const miss: number[] = points.map((p: { rho: number; a: number }, i: number): number => (angles[i]! - alpha) * Math.hypot(p.rho, p.a - t));
            const along: number[] = points.map((p: { rho: number; a: number; slope: number }, i: number): number => Math.abs(miss[i]!) / Math.max(0.2, Math.abs(Math.sin(alpha) * p.slope - Math.cos(alpha)) / Math.hypot(1, p.slope)));
            return { alpha: alpha / rad, rms: Math.sqrt(miss.reduce((sum: number, x: number): number => sum + x * x, 0) / miss.length), most: Math.max(...miss.map(Math.abs)), along: along.reduce((sum: number, x: number): number => sum + x, 0) / along.length, alongMost: Math.max(...along) };
          };
          let best: number = NaN;
          for (let t: number = -600; t <= 600; ++t) {
            const made = cone(t);
            if (made !== null && (Number.isNaN(best) || made.rms < cone(best)!.rms)) best = t;
          }
          const line = (t: number): string => {
            const made = cone(t);
            return made === null ? "apex " + t + ": too near the footprint" : "apex " + t + " mm along the course " + at(add(C, k, t)) + " (thorax " + at(local("thorax", add(C, k, t))) + ") half angle " + show(made.alpha, 2) + " deg: miss square to the cone rms " + show(made.rms, 2) + " most " + show(made.most, 2) + ", along the wall mean " + show(made.along, 2) + " most " + show(made.alongMost, 2) + " mm";
          };
          say("CONE for the footprint at " + T + " mm (" + points.length + " of " + CLOCKS + " clocks; radius from the course " + show(Math.min(...points.map((p: { rho: number }): number => p.rho))) + ".." + show(Math.max(...points.map((p: { rho: number }): number => p.rho))) + " mm): best " + (Number.isNaN(best) ? "none" : line(best)));
          for (const t of [-600, -300, -150, -100, -60, -40, -30, -20, -10, 60, 100, 150, 300, 600]) say("  " + line(t));
        }
      };
      analyse("to the bust point", bust);
      analyse("to the apex", apex);
      return;
    }
    const courses: { name: string; centres: R.V[]; halves: number[]; up: R.V; step: number }[] = [];
    courses.push({ name: "arm", centres: [joint("upperarm_r"), joint("lowerarm_r"), joint("hand_r"), joint("middle_01_r")], halves: [30, 10], up: [1, 0, 0], step: 6 });
    courses.push({ name: "leg", centres: [joint("thigh_r"), joint("calf_r"), joint("foot_r"), [133, 20, 157]], halves: [40, 62], up: [1, 0, 0], step: 6 });
    courses.push({ name: "trunk", centres: [[0, 780, 0], [0, 1705, 0]], halves: [], up: [1, 0, 0], step: 12 });
    for (const course of courses) {
      const axis: IAutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(course.centres, course.halves, course.up);
      if (typeof axis === "string") throw new Error(course.name + ": " + axis);
      const runs: IAutoMovieViewAxis.IRun[] | string = AutoMovieViewAxis.runs(course.centres, course.halves);
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
  process.stderr.write(
    (error instanceof Error ? (error.stack ?? error.message) : String(error)) +
      "\n",
  );
  process.exitCode = 1;
});
