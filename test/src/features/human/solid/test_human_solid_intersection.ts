import type { AutoMovieHumanLoftContract } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftContract";
import { AutoMovieHumanSolidIntersection } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidIntersection";
import type { AutoMovieHumanSolidVector } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidVector";
import type { IAutoMovieHumanSolidSurface } from "../../../../../packages/human/src/lofting/IAutoMovieHumanSolidSurface";
import { HumanSolidShapes } from "../../internal/HumanSolidShapes";

type Vec3 = AutoMovieHumanSolidVector.Vec3;
const { cylinder, distance, plane, sphere } = HumanSolidShapes;

/**
 * The solid intersection traces the closed curve where two surfaces meet, with
 * both preimages and the curve's exact tangent and curvature, and reports a
 * tangential contact or a miss instead of a curve.
 *
 * @evidence contracts/testing.md#behavioral-verification Traces with `AutoMovieHumanSolidIntersection.trace` and reads `ICurve.points` and `ICurve.at` for four closed-form pairs: a 6 mm cylinder along z through a 10 mm cylinder along x (the Steinmetz curve), a 5 mm cylinder at 40 degrees to a plane (an ellipse), two spheres of 10 and 8 mm with centres 12 mm apart (a circle), and two spheres 30 mm apart (no meeting), plus the two cylinders of equal radius (a tangential contact). It catches a curve off either surface, wrong preimages, a tangent or curvature that is not the curve's own, a loop that is not closed, a contact reported as transversal, and a curve invented where none exists. Any tracer passes that finds the true curve at every phase.
 * @evidence contracts/testing.md#independent-expectations Expectations are the pairs' closed forms: the Steinmetz curve `(r cos t, r sin t, sqrt(R^2 - r^2 sin^2 t))` with `z' = -r^2 sin 2t / 2z` and `z'' = (-r^2 cos 2t - z'^2) / z`, the host preimage `y = r cos t`, `theta = atan2(z, r sin t)`; the plane's ellipse `x = -r cos t / sin a`, `y = r sin t` with semi-axes `r / sin a` and `r`; the spheres' circle in the plane `z = (R1^2 - R2^2 + c^2) / 2c` of radius `sqrt(R1^2 - z^2)`. Limits are 1e-9 mm on points and 1e-8 relative on derivatives, a thousand times the 1e-12 mm solve tolerance on 10 mm magnitudes. Oracle limit: the closed forms hold only on the traced branch (the Steinmetz curve's upper loop, `z > 0`), which the seed selects.
 * @evidence contracts/testing.md#distinguishing-cases Green: three transversal pairs at every traced point and at off-sample phases through `at`. Red: the equal-radius cylinders, whose two loops touch where the tangent planes coincide, must yield a diagnostic; the far spheres must yield no curve and a diagnostic; a trace asked for fewer than 8 points is refused. Rails, blends and trims own their tests (`test_human_solid_merge`, `test_human_solid_diff`, `test_human_solid_trim`).
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_solid_intersection`; it builds closed-form surfaces in process and starts no host, browser or GPU.
 */
export function test_human_solid_intersection(): void {
  const failures: string[] = [];
  const tolerance: number = 1e-12;
  const near = (label: string, got: number, want: number, limit: number): void => {
    if (!(Math.abs(got - want) <= limit)) failures.push(`${label}: ${got}, expected ${want} (limit ${limit})`);
  };
  const nearVec = (label: string, got: Readonly<Vec3>, want: Readonly<Vec3>, limit: number): void => {
    const d: number = distance(got, want);
    if (!(d <= limit)) failures.push(`${label}: [${got.join(", ")}] is ${d} from [${want.join(", ")}] (limit ${limit})`);
  };

  // 1. Steinmetz: a 6 mm cylinder along z through a 10 mm cylinder along x.
  const r: number = 6;
  const R: number = 10;
  const part: IAutoMovieHumanSolidSurface = cylinder("small", [0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0], r);
  const host: IAutoMovieHumanSolidSurface = cylinder("large", [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], R);
  const steinmetz: AutoMovieHumanSolidIntersection.IResult = AutoMovieHumanSolidIntersection.trace({
    part,
    host,
    seed: { phi: 0, s: R + 0.5, y: r - 0.3, theta: Math.PI / 2 + 0.02 },
    count: 64,
    tolerance,
    grazing: 0.05,
  });
  if (steinmetz.curve === null || steinmetz.diagnostics.length !== 0)
    failures.push(`Steinmetz: no clean curve (${steinmetz.diagnostics.map((d: AutoMovieHumanLoftContract.IDiagnostic): string => d.detail).join("; ")})`);
  else {
    const curve: AutoMovieHumanSolidIntersection.ICurve = steinmetz.curve;
    near("Steinmetz winding", curve.winding, 0, 0);
    const phases: number[] = [...curve.points.map((p: AutoMovieHumanSolidIntersection.IPoint): number => p.phi), 0.123, 2.5, 4.71238898, 7.1];
    for (const t of phases) {
      const p: AutoMovieHumanSolidIntersection.IPoint | null = curve.at(t);
      if (p === null) {
        failures.push(`Steinmetz: no point at phi ${t}`);
        continue;
      }
      const z: number = Math.sqrt(R * R - r * r * Math.sin(t) ** 2);
      const dz: number = (-r * r * Math.sin(2 * t)) / (2 * z);
      const ddz: number = (-r * r * Math.cos(2 * t) - dz * dz) / z;
      nearVec(`Steinmetz point at ${t}`, p.point, [r * Math.cos(t), r * Math.sin(t), z], 1e-9);
      near(`Steinmetz part station at ${t}`, p.s, z, 1e-9);
      near(`Steinmetz host station at ${t}`, p.y, r * Math.cos(t), 1e-9);
      const theta: number = Math.atan2(z, r * Math.sin(t));
      near(`Steinmetz host phase at ${t}`, Math.cos(p.theta - theta), 1, 1e-15);
      nearVec(`Steinmetz host point at ${t}`, host.jet(p.y, p.theta).p, p.point, 1e-9);
      nearVec(`Steinmetz tangent at ${t}`, p.tangent, [-r * Math.sin(t), r * Math.cos(t), dz], 1e-8 * R);
      nearVec(`Steinmetz curvature at ${t}`, p.second, [-r * Math.cos(t), -r * Math.sin(t), ddz], 1e-8 * R);
    }
  }

  // 2. Equal radii: the two loops touch with coincident tangent planes.
  const equal: AutoMovieHumanSolidIntersection.IResult = AutoMovieHumanSolidIntersection.trace({
    part: cylinder("equal", [0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0], R),
    host,
    seed: { phi: 0, s: R, y: R, theta: Math.PI / 2 },
    count: 64,
    tolerance,
    grazing: 0.05,
  });
  if (equal.diagnostics.length === 0) failures.push("equal cylinders: the tangential contact is not reported");

  // 3. A 5 mm cylinder at 40 degrees to the plane z = 0: an ellipse.
  const a: number = (40 * Math.PI) / 180;
  const tilted: AutoMovieHumanSolidIntersection.IResult = AutoMovieHumanSolidIntersection.trace({
    part: cylinder("tilted", [0, 0, 0], [Math.cos(a), 0, Math.sin(a)], [-Math.sin(a), 0, Math.cos(a)], [0, 1, 0], 5),
    host: plane("floor", [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]),
    seed: { phi: 0, s: -5 / Math.tan(a) + 0.4, y: -5 / Math.sin(a) + 0.2, theta: 0.3 },
    count: 48,
    tolerance,
    grazing: 0.05,
  });
  if (tilted.curve === null || tilted.diagnostics.length !== 0) failures.push(`tilted cylinder: no clean curve (${tilted.diagnostics.map((d: AutoMovieHumanLoftContract.IDiagnostic): string => d.detail).join("; ")})`);
  else
    for (const p of tilted.curve.points) {
      nearVec(`ellipse at ${p.phi}`, p.point, [(-5 * Math.cos(p.phi)) / Math.sin(a), 5 * Math.sin(p.phi), 0], 1e-9);
      near(`ellipse equation at ${p.phi}`, ((p.point[0] * Math.sin(a)) / 5) ** 2 + (p.point[1] / 5) ** 2, 1, 1e-10);
    }

  // 4. Spheres of 10 and 8 mm, centres 12 mm apart along z: a circle.
  const axes: [Vec3, Vec3, Vec3] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const height: number = (100 - 64 + 144) / 24;
  const circle: AutoMovieHumanSolidIntersection.IResult = AutoMovieHumanSolidIntersection.trace({
    part: sphere("one", [0, 0, 0], ...axes, 10),
    host: sphere("two", [0, 0, 12], ...axes, 8),
    seed: { phi: 0, s: Math.acos(height / 10) + 0.01, y: Math.acos((height - 12) / 8) - 0.01, theta: 0.02 },
    count: 32,
    tolerance,
    grazing: 0.05,
  });
  if (circle.curve === null || circle.diagnostics.length !== 0) failures.push(`spheres: no clean curve (${circle.diagnostics.map((d: AutoMovieHumanLoftContract.IDiagnostic): string => d.detail).join("; ")})`);
  else {
    near("circle winding", circle.curve.winding, 1, 0);
    const radius: number = Math.sqrt(100 - height * height);
    for (const p of circle.curve.points)
      nearVec(`circle at ${p.phi}`, p.point, [radius * Math.cos(p.phi), radius * Math.sin(p.phi), height], 1e-9);
  }

  // 5. Spheres 30 mm apart: no meeting, no curve.
  const apart: AutoMovieHumanSolidIntersection.IResult = AutoMovieHumanSolidIntersection.trace({
    part: sphere("one", [0, 0, 0], ...axes, 10),
    host: sphere("far", [0, 0, 30], ...axes, 8),
    seed: { phi: 0, s: 0.2, y: Math.PI - 0.2, theta: 0 },
    count: 32,
    tolerance,
    grazing: 0.05,
  });
  if (apart.curve !== null || apart.diagnostics.length === 0) failures.push("far spheres: a curve, or no diagnostic, where the surfaces do not meet");

  // 6. Too few points per turn.
  const sparse: AutoMovieHumanSolidIntersection.IResult = AutoMovieHumanSolidIntersection.trace({
    part,
    host,
    seed: { phi: 0, s: R, y: r, theta: Math.PI / 2 },
    count: 4,
    tolerance,
    grazing: 0.05,
  });
  if (sparse.curve !== null) failures.push("a trace of 4 points per turn is not refused");

  if (failures.length) throw new Error(`${failures.length} solid intersection failures:\n${failures.join("\n")}`);
}
