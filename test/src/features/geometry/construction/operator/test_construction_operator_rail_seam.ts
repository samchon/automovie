import { AutoMovieSolidRailSolve, type IAutoMovieSolidAtlas, type IAutoMovieSolidSurface } from "@automovie/engine";

type Vec3 = [number, number, number];

/**
 * A host rail whose solution lies on one face near a tangent seam settles there, from either face: the rail solve's Newton steps are
 * clipped at the face's kept boundary instead of crossing on every overshoot.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieSolidRailSolve.atlas` on a host of two faces: an arc of radius 1 mm in the xz-plane (`u` its arclength from -1.5 to 0) ending at the origin with tangent +x, and the plane z = 0, whose chart runs on behind the seam (`u` from -20, kept only at `u` of 0 or more). The section plane is y = 0 and the chord 0.25 mm. The rail circle passes through the arc's point at arclength -a (a = 0.002, 0.01 and 0.05 mm) in two layouts: "under", centred straight under that point, so the circle never reaches z = 0; and "along", centred a chord back along the arc's tangent there, so the circle also crosses the plane's chart twice at negative `u` (its trimmed part) and nowhere on its kept part. Each is started from the arc (`u` -1, -0.3 and -0.1) and from the plane (`u` 1 and 0.3). A third host, "overstep", puts a kept root a hair (epsilon = 1e-4 and 3e-4 mm) inside a band's domain end: band and sheet both lie in z = 0 and meet along x = 0, the band's phase standing at y = v + 0.02 sin(2 pi v) and the sheet's at y = v, with the crossing map carrying v unchanged, so a mapped foot stands off the section plane y = phi(1/4) by phi(v) - v; started on the band at `u` -0.05, -0.1 and -0.2, v 1/4. A fourth, "foot", is the same host with the kept root on the sheet a hair (delta = 2e-3 and 5e-3 mm) past the seam, started on the band at `u` -0.05 and -0.1.
 * @evidence contracts/development/testing.md#independent-expectations The rail circle and the arc's circle meet at two points, closed forms of the layout: the arc's point at -a and its reflection about the line through the two centres, at arclength 2 s + a where s = atan2(x, z + 1) of the circle's centre. Both lie on the arc's kept chart, in the plane and on the chord, and the solve is local, certifying no branch, so neither root is preferred: the start decides. The plane holds no kept root in either layout (its crossings, Fx -+ sqrt(w^2 - Fz^2), are both negative in "along" and absent in "under"; the test checks this premise). In "overstep" the circle (centre -w - epsilon on x, radius w) meets the band at u = -epsilon and u = -2 w - epsilon, both at v = 1/4. In "foot" the circle (centre delta - w) meets the sheet at (delta, phi(1/4)) and the band at (delta - 2 w, 1/4). Limits: a published chart within 1e-9 mm of one of the two roots, on face 0 (and v within 1e-9 of 1/4 in "overstep"); in "foot" either root on its own face, both coordinates within 1e-9.
 * @evidence contracts/development/testing.md#distinguishing-cases Red before the projected step: in "under", every start from the plane was refused ("no Newton trial lowered the residual in twenty halvings", faces visited 1, stopped at `u` near -a on the plane's trimmed part with all four switches left), since a step there stayed in the plane's chart and never crossed. "along" passed before too (faces visited 0, 1, 0 from the arc's `u` -0.1 and 1, 0 from the plane): it guards the crossing paths, not an alternation, which a convex residual on the arc (chord 0.25 mm against radius 1 mm) cannot produce from the seam. In "overstep" every start was refused ("no Newton trial lowered the residual in twenty halvings" at the band's end, u 0, v 0.27, faces visited 0, 1, 0, 1, 0, no switch left): the first full step overshot the end, the sheet converged on its trimmed part, and the mapped foot, off the plane by 0.02, sent each later step past the end again. In "foot", with the projected step but the crossing judged on its raw foot, every start was refused at the band's end ("no Newton trial lowered the residual in twenty halvings", u about -1e-18, v 0.25, faces visited 0, four switches left): the foot's residual, 0.02 off the plane, exceeded the band end's. Green: every start settles on its face at one of its roots.
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
  for (const layout of ["under", "along"] as const)
    for (const a of [0.002, 0.01, 0.05]) {
      const target: Vec3 = arc.jet(-a, 0).p as Vec3;
      // The rail circle's centre: under the arc's point, or a chord back along its tangent (cos a, 0, sin a) there.
      const from: Vec3 = layout === "under" ? [target[0], 0, target[2] - width] : [target[0] - width * Math.cos(a), 0, target[2] - width * Math.sin(a)];
      const roots: number[] = [-a, 2 * Math.atan2(from[0], from[2] + R) + a];
      // The plane's own crossings must all lie behind the seam (or not exist): no kept root on face 1.
      const reach: number = width * width - from[2] * from[2];
      const plane: number[] = reach >= 0 ? [from[0] - Math.sqrt(reach), from[0] + Math.sqrt(reach)] : [];
      if (plane.some((u: number): boolean => u >= 0)) failures.push(`${layout} a ${a}: the plane has a kept root at u ${plane.join(", ")}`);
      for (const [face, u] of [[0, -1], [0, -0.3], [0, -0.1], [1, 1], [1, 0.3]] as const) {
        const report: { reason: string; numbers: Record<string, number> } = { reason: "", numbers: {} };
        const out = AutoMovieSolidRailSolve.atlas(host, face, [u, 0], from, [0, 1, 0], [1, 0, 0], width, 40, 1e-12, 4, report);
        const visits: string = Object.entries(report.numbers).filter(([key]) => key.startsWith("visit")).map(([, f]) => f).join(", ");
        const label: string = `${layout} a ${a} (roots ${roots.join(", ")}; plane crossings ${plane.length ? plane.join(", ") : "none"}), from face ${face} at u ${u}`;
        if (out === null) failures.push(`${label}: refused (${report.reason}; at face ${report.numbers.face} u ${report.numbers.u}, switches left ${report.numbers.switchesLeft}; faces visited ${visits})`);
        else if (out.face !== 0 || !roots.some((root: number): boolean => Math.abs(out.chart[0] - root) <= 1e-9))
          failures.push(`${label}: settled on face ${out.face} at u ${out.chart[0]} (faces visited ${visits}), expected face 0 at one of the roots`);
      }
    }

  // "overstep": a kept root a hair inside a face's domain end, as on f1's mirrored armpit band (0.00018 mm inside its end). Both faces lie
  // in the plane z = 0 and meet along x = 0, but parametrize it differently: the band's phase v stands at y = phi(v) = v + k sin(2 pi v),
  // the other face's at y = v, and the crossing map carries v across unchanged (as an atlas's chord share does between two columns), so
  // the foot it maps to on the other side is off the section plane by phi(v) - v.
  const kappa: number = 0.02;
  const phi = (v: number): number => v + kappa * Math.sin(2 * Math.PI * v);
  const band: IAutoMovieSolidSurface = {
    name: "band",
    orientation: 1,
    domain: [-20, 0],
    jet: (u: number, v: number) => ({
      p: [u, phi(v), 0],
      u: [1, 0, 0],
      v: [0, 1 + 2 * Math.PI * kappa * Math.cos(2 * Math.PI * v), 0],
      uu: [0, 0, 0],
      uv: [0, 0, 0],
      vv: [0, -4 * Math.PI * Math.PI * kappa * Math.sin(2 * Math.PI * v), 0],
    }),
  };
  const sheet: IAutoMovieSolidSurface = { ...flat, name: "sheet" };
  const overlap: IAutoMovieSolidAtlas = {
    name: "overstep",
    faces: [band, sheet],
    kept: (face: number, u: number): boolean => face === 0 || u >= 0,
    across: (face: number, u: number, v: number) => (face === 0 && u > 0 ? { face: 1, u: 0, v } : face === 1 && u < 0 ? { face: 0, u: 0, v } : null),
  };
  for (const epsilon of [1e-4, 3e-4]) {
    // The section plane y = phi(1/4); the circle's centre a chord and epsilon behind the band's end, so its roots on the band are
    // u = -epsilon and u = -2 w - epsilon, both at v = 1/4.
    const y: number = phi(0.25);
    const from: Vec3 = [-width - epsilon, y, 0];
    const roots: number[] = [-epsilon, -2 * width - epsilon];
    for (const u of [-0.05, -0.1, -0.2]) {
      const report: { reason: string; numbers: Record<string, number> } = { reason: "", numbers: {} };
      const out = AutoMovieSolidRailSolve.atlas(overlap, 0, [u, 0.25], from, [0, 1, 0], [1, 0, 0], width, 40, 1e-12, 4, report);
      const visits: string = Object.entries(report.numbers).filter(([key]) => key.startsWith("visit")).map(([, f]) => f).join(", ");
      const label: string = `overstep epsilon ${epsilon} (roots ${roots.join(", ")} at v 0.25), from face 0 at u ${u}`;
      if (out === null) failures.push(`${label}: refused (${report.reason}; at face ${report.numbers.face} u ${report.numbers.u} v ${report.numbers.v}, switches left ${report.numbers.switchesLeft}; faces visited ${visits})`);
      else if (out.face !== 0 || !roots.some((root: number): boolean => Math.abs(out.chart[0] - root) <= 1e-9) || !(Math.abs(out.chart[1] - 0.25) <= 1e-9))
        failures.push(`${label}: settled on face ${out.face} at (${out.chart[0]}, ${out.chart[1]}) (faces visited ${visits}), expected face 0 at one of the roots, v 0.25`);
    }
  }

  // "foot": the same two faces, with the kept root on the sheet a hair (delta = 2e-3 and 5e-3 mm) past the seam, as on f1's arm past its
  // armpit band. From the band's end the crossing map's foot on the sheet is off the section plane by phi(1/4) - 1/4 = 0.02, so the foot
  // itself stands farther from the rail circle than the band's end does, though one Newton step on the sheet comes nearer.
  for (const delta of [2e-3, 5e-3]) {
    const y: number = phi(0.25);
    const from: Vec3 = [delta - width, y, 0];
    const roots: { face: number; u: number; v: number }[] = [
      { face: 1, u: delta, v: y },
      { face: 0, u: delta - 2 * width, v: 0.25 },
    ];
    for (const u of [-0.05, -0.1]) {
      const report: { reason: string; numbers: Record<string, number> } = { reason: "", numbers: {} };
      const out = AutoMovieSolidRailSolve.atlas(overlap, 0, [u, 0.25], from, [0, 1, 0], [1, 0, 0], width, 40, 1e-12, 4, report);
      const visits: string = Object.entries(report.numbers).filter(([key]) => key.startsWith("visit")).map(([, f]) => f).join(", ");
      const label: string = `foot delta ${delta} (roots: sheet (${delta}, ${y}), band (${delta - 2 * width}, 0.25)), from face 0 at u ${u}`;
      if (out === null) failures.push(`${label}: refused (${report.reason}; at face ${report.numbers.face} u ${report.numbers.u} v ${report.numbers.v}, switches left ${report.numbers.switchesLeft}; faces visited ${visits})`);
      else if (!roots.some((r): boolean => r.face === out.face && Math.abs(out.chart[0] - r.u) <= 1e-9 && Math.abs(out.chart[1] - r.v) <= 1e-9))
        failures.push(`${label}: settled on face ${out.face} at (${out.chart[0]}, ${out.chart[1]}) (faces visited ${visits}), expected a root`);
    }
  }
  if (failures.length) throw new Error(`${failures.length} rail seam failures:\n${failures.join("\n")}`);
}
