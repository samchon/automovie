import path from "node:path";
import { AutoMovieViewAxis } from "@automovie/engine";
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
