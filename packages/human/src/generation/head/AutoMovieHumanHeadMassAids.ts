import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanHeadFrankfort } from "./AutoMovieHumanHeadFrankfort";
import type { AutoMovieHumanHeadMassCurves } from "./AutoMovieHumanHeadMassCurves";
import type { AutoMovieHumanHeadNeckCourse } from "./AutoMovieHumanHeadNeckCourse";
import type { AutoMovieHumanHeadThroat } from "./AutoMovieHumanHeadThroat";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type Label = AutoMovieHumanHeadMassCurves.Label;

/**
 * Construction aids of head.mass, drawn with its view curves and judged before
 * the reference, all in the head frame: the course (the drifting origin of
 * the level sections) with the port's plane, the head-owned throat contour
 * with its fillet's control polygon, FH, the side and front
 * bounding rectangles, the midline chords between the facial landmarks, the
 * landmark level ticks, the extremum lines across each declared extremum and
 * each outline span's quintic control polygon. A control polygon lives in the
 * outline's own (q, value) chart, where the chain is polynomial; it is drawn
 * mapped back through `s = L - q^2` and the course's plane at `s`, so its
 * vertices sit at their true stations and values while its edges are display
 * chords of that map.
 */
export namespace AutoMovieHumanHeadMassAids {
  /** Every aid in the head frame. */
  export function create(
    head: AutoMovieHumanHeadFrankfort.IOutput,
    course: AutoMovieHumanHeadNeckCourse.IOutput,
    throat: AutoMovieHumanHeadThroat.IOutput,
    outlines: Record<Label, AutoMovieHumanHeadMassCurves.IKnot[]>,
    goY: number,
    euryon: number,
  ): AutoMovieHumanArmCurveSpec.IAid[] {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const P: Record<AutoMovieHumanHeadFrankfort.Name, Vec3> = head.points;
    const L: number = course.length;
    const B: number = head.dims.breadth / 2;
    const place: (s: number, label: Label, value: number) => Vec3 = (s: number, label: Label, value: number): Vec3 => {
      const f: { origin: Vec3; u: Vec3; v: Vec3 } = course.frame(Math.min(L, Math.max(course.start, s)));
      const d: Vec3 = label === "anterior" ? f.u : label === "posterior" ? [-f.u[0], -f.u[1], -f.u[2]] : f.v;
      return [f.origin[0] + value * d[0], f.origin[1] + value * d[1], f.origin[2] + value * d[2]];
    };
    const out: AutoMovieHumanArmCurveSpec.IAid[] = [];
    out.push({ kind: "axis", name: "course: level sections, origin drifting from the neck port to the head axis", frame: "head", points: Array.from({ length: 61 }, (_: unknown, k: number): Vec3 => course.frame(course.start + ((L - course.start) * k) / 60).origin) });
    const port: Vec3 = course.base.centre;
    out.push({ kind: "plane", name: "level neck port (the trunk's S00 end)", frame: "head", points: [[port[0] - course.base.back, port[1], 0], [port[0] + course.base.front, port[1], 0]] });
    const y0: number = throat.ij[1];
    const y1: number = (throat.to[1] + throat.gn[1]) / 2;
    out.push({ kind: "tangent", name: "anterior throat contour (head-owned: throat line through IJ, conic fillet, submental line)", frame: "head", points: Array.from({ length: 81 }, (_: unknown, k: number): Vec3 => [throat.at(y0 + ((y1 - y0) * k) / 80)[0], y0 + ((y1 - y0) * k) / 80, 0]) });
    out.push({ kind: "polygon", name: "anterior throat fillet controls (ends and the cervical point C)", frame: "head", points: [throat.from, throat.corner, throat.to] });
    out.push({ kind: "plane", name: "Frankfort horizontal", frame: "head", points: [[P.op[0], 0, 0], [P.g[0] + 10, 0, 0]] });
    out.push({ kind: "rectangle", name: "side box g-op by me-v", frame: "head", points: [[P.op[0], P.me[1], 0], [P.g[0], P.me[1], 0], [P.g[0], P.v[1], 0], [P.op[0], P.v[1], 0], [P.op[0], P.me[1], 0]] });
    out.push({ kind: "rectangle", name: "front box eu-eu by me-v", frame: "head", points: [[0, P.me[1], -B], [0, P.me[1], B], [0, P.v[1], B], [0, P.v[1], -B], [0, P.me[1], -B]] });
    out.push({ kind: "chord", name: "anterior chords g-n-sn-me", frame: "head", points: [P.g, P.n, P.sn, P.me] });
    out.push({ kind: "chord", name: "nose chords n-prn-sn and ac", frame: "head", points: [P.n, P.prn, P.sn, P.ac] });
    const euY: number = course.frame(euryon).origin[1];
    for (const [name, y] of [["go", goY], ["t", 0], ["eu", euY], ["g", P.g[1]], ["n", P.n[1]], ["sn", P.sn[1]], ["me", P.me[1]]] as [string, number][])
      out.push({ kind: "tick", name: `level ${name}`, frame: "head", points: [[P.op[0] - 6, y, 0], [P.op[0], y, 0]] });
    for (const label of ["anterior", "posterior", "lateral"] as const)
      for (const k of outlines[label]) {
        if (k.sense === null) continue;
        out.push({ kind: "extremum", name: `${label} ${k.sense} at ${k.site}`, frame: "head", points: [place(k.station, label, k.value - 8), place(k.station, label, k.value + 8)] });
      }
    for (const label of ["anterior", "posterior", "lateral"] as const) {
      const ks: AutoMovieHumanHeadMassCurves.IKnot[] = outlines[label];
      for (let i: number = 0; i + 1 < ks.length; ++i) {
        const a: AutoMovieHumanArmCurveSpec.IHermiteKnot = { q: ks[i]!.q, position: [ks[i]!.q, ks[i]!.value, 0], first: [1, ks[i]!.first, 0], second: [0, ks[i]!.second, 0] };
        const b: AutoMovieHumanArmCurveSpec.IHermiteKnot = { q: ks[i + 1]!.q, position: [ks[i + 1]!.q, ks[i + 1]!.value, 0], first: [1, ks[i + 1]!.first, 0], second: [0, ks[i + 1]!.second, 0] };
        out.push({
          kind: "polygon",
          name: `${label} span ${ks[i]!.site}-${ks[i + 1]!.site} controls`,
          frame: "head",
          points: S.quinticControls(a, b).map((c: Vec3): Vec3 => place(L - c[0] * c[0], label, c[1])),
        });
      }
    }
    return out;
  }
}
