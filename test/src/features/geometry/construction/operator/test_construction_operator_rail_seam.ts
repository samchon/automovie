import { AutoMovieSolidRailSolve, type IAutoMovieSolidAtlas, type IAutoMovieSolidSurface } from "@automovie/engine";

type Vec3 = [number, number, number];

/**
 * A host rail whose solution lies on one face near a tangent seam settles there, from either face: the rail solve's Newton steps are
 * clipped at the face's kept boundary instead of crossing on every overshoot.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieSolidRailSolve.atlas` on a host of two faces: an arc of radius 1 mm in the xz-plane (a quarter turn and less, `u` from -1.5) ending at the origin with tangent +x (`u` its arclength) and the plane z = 0, whose chart runs on behind the seam (`u` from -20, kept only at `u` of 0 or more). The section plane is y = 0 and the chord 0.25 mm, centred straight under the arc's point at arclength -a (a = 0.002, 0.01 and 0.05 mm), so that point is a solution; each is started from the arc (`u` -1 and -0.3) and from the plane (`u` 1 and 0.3).
 * @evidence contracts/development/testing.md#independent-expectations The expected rail is the arc's point at arclength -a, a closed form of the configuration: on the arc it meets the chord exactly, and the plane's own points within reach lie behind the seam, trimmed away. Limits: the published chart within 1e-9 mm of -a, on face 0.
 * @evidence contracts/development/testing.md#distinguishing-cases Red before the projected step: from the arc the solve crossed onto the plane and stopped there ("no Newton trial lowered the residual in twenty halvings", faces visited 0 then 1), and from the plane it never left it. Green: every start settles on the arc at -a.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_operator_rail_seam`; closed-form faces in process, no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (a host rail near a tangent seam settles on the face that holds it) as stated in this comment.
 */
export function test_construction_operator_rail_seam(): void {
  const failures: string[] = [];
  const R: number = 1;
  const arc: IAutoMovieSolidSurface = {
    name: "arc",
    orientation: 1,
    domain: [-1.5, 0],
    jet: (u: number, v: number) => {
      const t: number = u / R;
      return { p: [R * Math.sin(t), v, R * Math.cos(t) - R], u: [Math.cos(t), 0, -Math.sin(t)], v: [0, 1, 0], uu: [-Math.sin(t) / R, 0, -Math.cos(t) / R], uv: [0, 0, 0], vv: [0, 0, 0] };
    },
  };
  const flat: IAutoMovieSolidSurface = {
    name: "flat",
    orientation: 1,
    domain: [-20, 20],
    jet: (u: number, v: number) => ({ p: [u, v, 0], u: [1, 0, 0], v: [0, 1, 0], uu: [0, 0, 0], uv: [0, 0, 0], vv: [0, 0, 0] }),
  };
  const host: IAutoMovieSolidAtlas = {
    name: "seam",
    faces: [arc, flat],
    kept: (face: number, u: number): boolean => (face === 0 ? u <= 0 : u >= 0),
    across: (face: number, u: number, v: number) => (face === 0 && u > 0 ? { face: 1, u: 0, v } : face === 1 && u < 0 ? { face: 0, u: 0, v } : null),
  };
  const width: number = 0.25;
  for (const a of [0.002, 0.01, 0.05]) {
    const target: Vec3 = arc.jet(-a, 0).p as Vec3;
    const from: Vec3 = [target[0], 0, target[2] - width];
    for (const [face, u] of [[0, -1], [0, -0.3], [1, 1], [1, 0.3]] as const) {
      const report: { reason: string; numbers: Record<string, number> } = { reason: "", numbers: {} };
      const out = AutoMovieSolidRailSolve.atlas(host, face, [u, 0], from, [0, 1, 0], [1, 0, 0], width, 40, 1e-12, 4, report);
      const visits: string = Object.entries(report.numbers).filter(([key]) => key.startsWith("visit")).map(([, f]) => f).join(", ");
      if (out === null) failures.push(`a ${a}, from face ${face} at u ${u}: refused (${report.reason}; faces visited ${visits})`);
      else if (out.face !== 0 || !(Math.abs(out.chart[0] + a) <= 1e-9)) failures.push(`a ${a}, from face ${face} at u ${u}: settled on face ${out.face} at u ${out.chart[0]}, expected face 0 at ${-a}`);
    }
  }
  if (failures.length) throw new Error(`${failures.length} rail seam failures:\n${failures.join("\n")}`);
}
