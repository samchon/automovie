import type { AutoMovieHumanLoftContract } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftContract";
import { AutoMovieHumanSolidBlendChain } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidBlendChain";
import { AutoMovieHumanSolidIntersection } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidIntersection";
import type { AutoMovieHumanSolidJoin } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidJoin";
import { AutoMovieHumanSolidMerge } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidMerge";
import type { AutoMovieHumanSolidRail } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidRail";
import type { AutoMovieHumanSolidVector } from "../../../../../packages/human/src/lofting/AutoMovieHumanSolidVector";
import type { IAutoMovieHumanSolidSurface } from "../../../../../packages/human/src/lofting/IAutoMovieHumanSolidSurface";
import { HumanSeamAudit } from "../../internal/audit/HumanSeamAudit";
import { HumanAnatomyAudit } from "../../internal/HumanAnatomyAudit";
import { HumanSolidShapes } from "../../internal/HumanSolidShapes";

type Vec3 = AutoMovieHumanSolidVector.Vec3;

/**
 * A part lying along its host merges when its curve is traced by the angle
 * about the footprint's axis: a sphere whose polar axis lies flat, merged onto
 * a plane it crosses, gives the circle where they meet, both rails where the
 * chords put them and a G2 blend, where the part's own phase cannot trace it.
 *
 * Scenarios:
 * 1. A 20 mm sphere with its polar axis along `x`, centre 8 mm above the plane `z = 0`: traced by the part's phase (each station line crosses the plane twice), the trace yields no clean curve.
 * 2. Traced by the angle about the vertical axis through the origin: the curve closes with winding 0 on both surfaces, and at its traced points and off-sample angles its point, tangent and second derivative are the circle's `rho (cos t, sin t, 0)` of radius `sqrt(R^2 - h^2)`.
 * 3. Merged with chords of 6 mm on the plane and 5 mm on the sphere: the host rail is the circle of radius `rho + 6` in the plane; the part rail is on the sphere in the vertical plane through the centre and the curve point, 5 mm of chord above the curve; the published blend's part loop is a hole; both rails read G2 through `HumanSeamAudit.join`. The same rail reader against a centre 1 mm higher must fail.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `AutoMovieHumanSolidIntersection.trace` with the phase and the angle parameter, `AutoMovieHumanSolidMerge.create` with the angle parameter and `AutoMovieHumanSolidBlendChain.of`, and reads `ICurve.at`, `IJoin.rail` and the blend's seams. It catches a trace that follows the part's phase where its station lines cross the host twice, a curve off the circle or with a wrong tangent or curvature, a rail off its chord, and a blend that does not meet both surfaces G2; any operator that traces the true circle by angle and rails it by its chords passes.
 * @evidence contracts/testing.md#independent-expectations The closed forms the kernel worker published with the angle parameter (7551ad58f): the curve `rho (cos t, sin t, 0)`, `rho = sqrt(R^2 - h^2)`, tangent `rho (-sin t, cos t, 0)`, second `-rho (cos t, sin t, 0)`; the host rail the circle of radius `rho + w_host`; the part rail at `alpha1 = alpha0 + 2 asin(w_part / 2R)` from `alpha0 = atan2(-h, rho)` in the vertical plane through the centre, `c + R (cos alpha1 (cos t, sin t, 0) + sin alpha1 (0, 0, 1))`, because a chord `w` on a great circle of radius `R` subtends `2 asin(w / 2R)`. Limits: 1e-9 mm on points and 1e-8 of the radius on derivatives, as the intersection test; the seams under `HumanSeamAudit`'s rendered-skin limits at a 2 mm spacing. Oracle limit: one sphere and one plane; other contacts along a host are the subtrees' joins, read by the seam audit.
 * @evidence contracts/testing.md#distinguishing-cases Positive: the angle trace and its merge. Negative: the phase trace of the same pair, and the rail reader against a shifted centre. The phase-parameter cases (Steinmetz, cylinder on plane) belong to `test_human_solid_intersection` and `test_human_solid_merge`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_solid_merge_angle`; it builds closed-form surfaces in process, generates no person and starts no host, browser or GPU.
 */
export function test_human_solid_merge_angle(): void {
  const failures: string[] = [];
  const R: number = 20;
  const h: number = 8;
  const rho: number = Math.sqrt(R * R - h * h);
  const centre: Vec3 = [0, 0, h];
  const part: IAutoMovieHumanSolidSurface = HumanSolidShapes.sphere("ball", centre, [0, 1, 0], [0, 0, 1], [1, 0, 0], R);
  const host: IAutoMovieHumanSolidSurface = HumanSolidShapes.plane("floor", [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);

  // The curve point at t = 0 is (rho, 0, 0): on the sphere, cos s = rho / R and phase 3 pi / 2.
  const seed: AutoMovieHumanSolidIntersection.IInput["seed"] = { phi: (3 * Math.PI) / 2, s: Math.acos(rho / R) + 0.02, y: rho + 0.3, theta: 0.2 };
  const angle: AutoMovieHumanSolidIntersection.Parameter = { kind: "angle", centre: [0, 0, 0], normal: [0, 0, 1], reference: [1, 0, 0] };
  const details: (d: AutoMovieHumanLoftContract.IDiagnostic[]) => string = (d: AutoMovieHumanLoftContract.IDiagnostic[]): string => d.map((x: AutoMovieHumanLoftContract.IDiagnostic): string => x.detail).join("; ");
  const near: (label: string, got: Readonly<Vec3>, want: Readonly<Vec3>, limit: number) => void = (label: string, got: Readonly<Vec3>, want: Readonly<Vec3>, limit: number): void => {
    const d: number = HumanSolidShapes.distance(got, want);
    if (!(d <= limit)) failures.push(`${label}: [${got.join(", ")}] is ${d} from [${want.join(", ")}] (limit ${limit})`);
  };

  // 1. The part's phase cannot trace it.
  const phased: AutoMovieHumanSolidIntersection.IResult = AutoMovieHumanSolidIntersection.trace({ part, host, seed, count: 48, tolerance: 1e-12, grazing: 0.05 });
  if (phased.curve !== null && phased.diagnostics.length === 0) failures.push("phase trace: a clean curve where every station line crosses the plane twice");

  // 2. The angle traces the circle.
  const traced: AutoMovieHumanSolidIntersection.IResult = AutoMovieHumanSolidIntersection.trace({ part, host, seed, count: 48, tolerance: 1e-12, grazing: 0.05, parameter: angle });
  if (traced.curve === null || traced.diagnostics.length !== 0) failures.push(`angle trace: no clean curve (${details(traced.diagnostics)})`);
  else {
    const curve: AutoMovieHumanSolidIntersection.ICurve = traced.curve;
    if (curve.winding !== 0 || curve.partWinding !== 0) failures.push(`angle trace: winding ${curve.winding}, part winding ${curve.partWinding}, expected 0 and 0`);
    for (const t of [...curve.points.map((p: AutoMovieHumanSolidIntersection.IPoint): number => p.t), 0.123, 2.5, 4.71238898]) {
      const p: AutoMovieHumanSolidIntersection.IPoint | null = curve.at(t);
      if (p === null) {
        failures.push(`angle trace: no point at t ${t}`);
        continue;
      }
      near(`circle point at ${t}`, p.point, [rho * Math.cos(t), rho * Math.sin(t), 0], 1e-9);
      near(`circle tangent at ${t}`, p.tangent, [-rho * Math.sin(t), rho * Math.cos(t), 0], 1e-8 * R);
      near(`circle second derivative at ${t}`, p.second, [-rho * Math.cos(t), -rho * Math.sin(t), 0], 1e-8 * R);
    }
  }

  // 3. The merge: rails at their chords, a hole on the part, G2 at both rails.
  const merged: AutoMovieHumanSolidJoin.IResult = AutoMovieHumanSolidMerge.create({
    part,
    host,
    seed,
    count: 48,
    tolerance: 1e-12,
    grazing: 0.05,
    width: { part: (): number => 5, host: (): number => 6 },
    parameter: angle,
  });
  if (merged.join === null) failures.push(`merge: no join (${details(merged.diagnostics)})`);
  else {
    const join: AutoMovieHumanSolidJoin.IJoin = merged.join;
    for (const t of [0, 0.7, 2.5, 4.0]) {
      const r: AutoMovieHumanSolidRail.IRail | null = join.rail(t);
      if (r === null) {
        failures.push(`merge: no rail at t ${t}`);
        continue;
      }
      near(`host rail at ${t}`, r.hostPoint, [(rho + 6) * Math.cos(t), (rho + 6) * Math.sin(t), 0], 1e-9);
      near(`part rail at ${t}`, r.partPoint, rail(centre, R, h, rho, 5, t), 1e-9);
    }
    const shifted: AutoMovieHumanSolidRail.IRail | null = join.rail(0.7);
    if (shifted !== null && HumanSolidShapes.distance(shifted.partPoint, rail([0, 0, h + 1], R, h + 1, Math.sqrt(R * R - (h + 1) ** 2), 5, 0.7)) <= 1e-9) failures.push("proof: the part rail reads the same against a centre 1 mm higher");
    // Between its columns the blend chain is the B-spline of its columns' data,
    // whose interpolated ribbon leaves the sphere's tangent plane by about
    // (spacing / R)^2 / 8 (AutoMovieHumanSolidBlendChain): 192 columns put the
    // spacing near 0.5 mm on this rail and that angle under 1e-4 rad.
    const blend: AutoMovieHumanSolidBlendChain.IBlend | null = AutoMovieHumanSolidBlendChain.of("blend.ball", join, 192);
    if (blend === null) failures.push("merge: no blend chain");
    else {
      if (blend.part.kind !== "hole") failures.push(`merge: the part loop is a ${blend.part.kind}, expected a hole`);
      const rows: HumanAnatomyAudit.IRow[] = HumanSeamAudit.rows("made", HumanSeamAudit.join("blend.ball", join, blend, host, part, 0.01), { k: 1, stature: 1000, spacing: 2 });
      for (const x of rows.filter((y: HumanAnatomyAudit.IRow): boolean => !HumanAnatomyAudit.passes(y))) failures.push(`merge: ${x.site} reads ${x.value} ${x.unit}`);
    }
  }

  if (failures.length !== 0) throw new Error(`${failures.length} angle merge failures:\n${failures.join("\n")}`);
}

/**
 * The part rail's closed form: on the sphere, in the vertical plane through
 * the centre and the curve point at angle `t`, the point a chord `w` above
 * the curve point; the curve point sits at `alpha0 = atan2(-h, rho)` about
 * the centre in that plane, and a chord `w` turns it by `2 asin(w / 2R)`.
 */
function rail(centre: Vec3, R: number, h: number, rho: number, w: number, t: number): Vec3 {
  const alpha: number = Math.atan2(-h, rho) + 2 * Math.asin(w / (2 * R));
  return [centre[0] + R * Math.cos(alpha) * Math.cos(t), centre[1] + R * Math.cos(alpha) * Math.sin(t), centre[2] + R * Math.sin(alpha)];
}
