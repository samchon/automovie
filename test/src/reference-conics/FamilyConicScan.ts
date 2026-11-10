import path from "node:path";
import { AutoMovieViewAxis } from "../../../packages/engine/src/geometry/construction/AutoMovieViewAxis";
import { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * Survey of candidate courses on the f1 reference: for each course, every
 * station's count of loops round the axis, the loop's area and its vertex
 * count, so each part's single-loop domain is read from the data before any
 * family is fitted.
 */
namespace FamilyConicScan {
  /** Print the survey. */
  export async function main(): Promise<void> {
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    const joint = (name: string): R.V => {
      const p: R.V | undefined = source.joints.get(name);
      if (p === undefined) throw new Error("No joint " + name);
      return p;
    };
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
    const courses: { name: string; centres: R.V[]; halves: number[]; up: R.V; step: number }[] = [];
    for (const side of ["l", "r"]) {
      courses.push({ name: "arm_" + side, centres: [joint("upperarm_" + side), joint("lowerarm_" + side), joint("hand_" + side)], halves: [30], up: [1, 0, 0], step: 8 });
      courses.push({ name: "leg_" + side, centres: [joint("thigh_" + side), joint("calf_" + side), joint("foot_" + side)], halves: [40], up: [1, 0, 0], step: 12 });
    }
    courses.push({ name: "trunk", centres: [[0, 780, 0], [0, 1480, 0]], halves: [], up: [1, 0, 0], step: 12 });
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
