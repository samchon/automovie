import {
  AutoMovieConstructionWidths,
  type AutoMovieLoftContract,
  AutoMovieSolidIntersection,
  AutoMovieSolidJoin,
  type AutoMovieSolidRail,
  type IAutoMovieSolidSurface,
} from "@automovie/engine";
import type { AutoMovieConstructionWidth } from "@automovie/interface";

type V3 = [number, number, number];

/**
 * A curvature width keeps each square-mode rail a regular offset of the contact: the chord stays under `share / kappa_g` wherever the contact curve
 * bends toward the rail inside its surface, so the rail never passes the contact's centre of geodesic curvature and runs backward.
 *
 * Made inputs: a circular cylinder of radius 10 mm along `+y` (the part) cut by the plane `y = z tan(alpha)` through its axis (the host), traced by
 * the arc parameter, so both rails offset square to the contact. Developed, the cylinder is the plane `(x, s) = (R phi, s)` and the contact the sine
 * `s = R tan(alpha) sin(phi)`, whose in-surface curvature toward `+s` is `-(tan(alpha) / R) sin(phi) / (1 + tan(alpha)^2 cos(phi)^2)^(3/2)`; the
 * cylinder's normal curvature in the direction square to it is `h'^2 / (R (1 + h'^2))`, `h' = tan(alpha) cos(phi)`. The host's contact is an ellipse
 * and its rail stands outside it, on its convex side.
 *
 * Scenarios:
 * 1. Steep cut, alpha 60 degrees, merge, both sides `curvature` share 0.5, cap 8 mm: the part's chord at every traced point is
 *    `min(cap, share / max(k_n, kappa_g))` from the closed forms (2.89 mm at the trough, where `kappa_g = tan(alpha) / R`), the host's stays at the
 *    cap, the join is admitted and the part rail travels forward with the contact at every traced point. Red before the bound: the cap's 8 mm at the
 *    trough passes the contact's 5.77 mm radius there and the join refuses the folded blend.
 * 2. The same cut with a constant 8 mm part chord: the rail passes that radius, and the join still refuses it as an unfolded blend.
 * 3. The same cut with a constant 5 mm part chord, under that radius: the join is admitted, so the fold check does not act on a regular offset.
 * 4. The same cut as a diff (keep inside): the part rail stands toward `-s`, so the bound acts at the crest instead, by the same closed form with
 *    its sign turned, and the join is admitted.
 * 5. Gentle cut, alpha 20 degrees: `share / kappa_g` stays above the cap everywhere, so every chord is the normal-curvature law alone.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Traces each contact with `AutoMovieSolidIntersection.trace`, builds the width laws with `AutoMovieConstructionWidths.create` and composes the join with `AutoMovieSolidJoin.create`, then reads the laws, the join's admission and its rails. It catches a law that ignores the contact's in-surface bend, reads it on the wrong side (merge versus diff, part versus host), bounds a convex side, or changes a law where the bound does not act.
 * @evidence contracts/development/testing.md#independent-expectations Expected chords come from the developed cylinder (an isometry, so the developed sine's plane curvature is the contact's geodesic curvature) and Euler's formula on the cylinder, evaluated at each traced point's own part phase, not from the kernel. Offset regularity (Farouki and Neff 1990) gives the admission expectations: a chord past the radius `R / tan(alpha)` = 5.77 mm reverses the rail at the trough, one under it does not. The trace meets its surfaces to its tolerance, so chords are compared to 1e-7 relative.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: the bounded steep merge and diff. Negative: the 8 mm constant chord that must still refuse. Adjacent: the 5 mm chord under the radius, admitted. Unchanged: the convex host side and the gentle cut, where the bound does not act. Chord tables, fold widths and the normal-curvature law on a post and beam belong to `test_construction_widths`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_widths_offset`; it builds closed-form surfaces in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation States the made surfaces, the closed forms and the five numbered scenarios with the behavior each pins.
 */
export function test_construction_widths_offset(): void {
  const failures: string[] = [];
  const R: number = 10;
  const share: number = 0.5;
  const cap: number = 8;
  const curvature: AutoMovieConstructionWidth = { type: "curvature", share, cap: cap / 1000, end: null };

  // 1. The steep merge: bounded at the trough, admitted, its part rail forward everywhere.
  const steep: number = Math.PI / 3;
  const bounded: ICase = compose(R, steep, "outside", curvature, curvature);
  failures.push(
    ...expect(bounded, "steep merge", (phi: number): number => law(R, steep, phi, share, cap, 1)),
    ...hostAtCap(bounded, "steep merge", cap),
    ...admitted(bounded, "steep merge"),
    ...forward(bounded, "steep merge"),
  );

  // 2. A constant chord past the contact's radius at the trough: still the folded blend's refusal.
  const folded: ICase = compose(R, steep, "outside", { type: "chord", value: 0.008 }, curvature);
  if (folded.join.join !== null || !folded.join.diagnostics.some((d: AutoMovieLoftContract.IDiagnostic): boolean => d.contract === "unfolded blend"))
    failures.push(`8 mm chord: expected the unfolded-blend refusal, got ${describe(folded)}`);

  // 3. A constant chord under that radius: admitted.
  const regular: ICase = compose(R, steep, "outside", { type: "chord", value: 0.005 }, curvature);
  failures.push(...admitted(regular, "5 mm chord"), ...forward(regular, "5 mm chord"));

  // 4. The diff: the part rail toward -s, bounded at the crest.
  const cut: ICase = compose(R, steep, "inside", curvature, curvature);
  failures.push(
    ...expect(cut, "steep diff", (phi: number): number => law(R, steep, phi, share, cap, -1)),
    ...hostAtCap(cut, "steep diff", cap),
    ...admitted(cut, "steep diff"),
    ...forward(cut, "steep diff"),
  );

  // 5. The gentle cut: the normal-curvature law alone.
  const gentle: number = Math.PI / 9;
  const plain: ICase = compose(R, gentle, "outside", curvature, curvature);
  failures.push(
    ...expect(plain, "gentle merge", (phi: number): number => law(R, gentle, phi, share, cap, 0)),
    ...hostAtCap(plain, "gentle merge", cap),
    ...admitted(plain, "gentle merge"),
  );
  if (failures.length !== 0) throw new Error(`${failures.length} offset width failures:\n${failures.join("\n")}`);
}

/** One composed case: its traced curve, its laws (or why they were refused) and the join's result. */
interface ICase {
  /** The traced contact. */
  curve: AutoMovieSolidIntersection.ICurve;

  /** The width laws, or the refused premise. */
  width: AutoMovieSolidJoin.IInput["width"] | string;

  /** The join's result. */
  join: AutoMovieSolidJoin.IResult;
}

/**
 * Trace the cylinder's meeting with the oblique plane and compose its join.
 *
 * @param R The cylinder's radius, mm.
 * @param alpha The plane's tilt, radians: `y = z tan(alpha)`.
 * @param keep `outside` for a merge, `inside` for a diff.
 * @param part The part's width record.
 * @param host The host's width record.
 * @returns The case.
 */
function compose(
  R: number,
  alpha: number,
  keep: AutoMovieSolidRail.Keep,
  part: AutoMovieConstructionWidth,
  host: AutoMovieConstructionWidth,
): ICase {
  const zero: V3 = [0, 0, 0];

  // The part: S(s, phi) = (R cos phi, s, R sin phi), outward normal radial.
  const cylinder: IAutoMovieSolidSurface = {
    name: "cylinder",
    orientation: 1,
    period: 2 * Math.PI,
    domain: [-60, 60],
    jet: (s: number, phi: number): IAutoMovieSolidSurface.IJet => ({
      p: [R * Math.cos(phi), s, R * Math.sin(phi)],
      u: [0, 1, 0],
      v: [-R * Math.sin(phi), 0, R * Math.cos(phi)],
      uu: [...zero],
      uv: [...zero],
      vv: [-R * Math.cos(phi), 0, -R * Math.sin(phi)],
    }),
  };

  // The host: H(a, b) = a (0, sin alpha, cos alpha) + b (1, 0, 0), outward normal (0, cos alpha, -sin alpha).
  const plane: IAutoMovieSolidSurface = {
    name: "plane",
    orientation: 1,
    domain: [-60, 60],
    jet: (a: number, b: number): IAutoMovieSolidSurface.IJet => ({
      p: [b, a * Math.sin(alpha), a * Math.cos(alpha)],
      u: [0, Math.sin(alpha), Math.cos(alpha)],
      v: [1, 0, 0],
      uu: [...zero],
      uv: [...zero],
      vv: [...zero],
    }),
  };

  // Seeded at phase 0, the point (R, 0, 0) of both.
  const input: Omit<AutoMovieSolidJoin.IInput, "width"> = {
    part: cylinder,
    host: plane,
    seed: { phi: 0, s: 0, y: 0, theta: R },
    parameter: { kind: "arc" },
    count: 64,
    tolerance: 1e-9,
    grazing: 0.05,
  };
  const traced: AutoMovieSolidIntersection.IResult = AutoMovieSolidIntersection.trace(input);
  if (traced.curve === null)
    throw new Error(`the cylinder and the plane at ${alpha} rad did not trace: ${traced.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => d.detail).join("; ")}`);
  const curve: AutoMovieSolidIntersection.ICurve = traced.curve;
  const width: AutoMovieSolidJoin.IInput["width"] | string = AutoMovieConstructionWidths.create(part, host, false, {
    curve,
    part: cylinder,
    host: AutoMovieSolidIntersection.atlas(plane),
    diff: keep === "inside",
  });
  const join: AutoMovieSolidJoin.IResult =
    typeof width === "string"
      ? { join: null, diagnostics: [{ producer: "test", level: 6, contract: "width", detail: width }] }
      : AutoMovieSolidJoin.create({ ...input, curve, width }, keep);
  return { curve, width, join };
}

/**
 * The curvature law's chord on the cylinder at a part phase, from the closed forms.
 *
 * @param R The radius, mm.
 * @param alpha The plane's tilt, radians.
 * @param phi The part phase.
 * @param share The law's share.
 * @param cap The law's cap, mm.
 * @param side `1` for a rail toward `+s`, `-1` toward `-s`, `0` for the normal-curvature law alone.
 * @returns The chord, mm.
 */
function law(R: number, alpha: number, phi: number, share: number, cap: number, side: 1 | -1 | 0): number {
  const tangent: number = Math.tan(alpha);
  const slope: number = tangent * Math.cos(phi);
  const normal: number = (slope * slope) / (R * (1 + slope * slope));
  const geodesic: number = (side * -(tangent / R) * Math.sin(phi)) / (1 + slope * slope) ** 1.5;
  const bend: number = Math.max(normal, geodesic);
  return bend > 0 ? Math.min(cap, share / bend) : cap;
}

/** The part law at every traced point against its closed form, 1e-7 relative. */
function expect(c: ICase, label: string, want: (phi: number) => number): string[] {
  if (typeof c.width === "string") return [`${label}: width refused: ${c.width}`];
  const part: AutoMovieSolidJoin.IInput["width"]["part"] = c.width.part;
  if (typeof part !== "function") return [`${label}: the part law is a station`];
  return c.curve.points.flatMap((p: AutoMovieSolidIntersection.IPoint): string[] => {
    const got: number = part(p.t);
    const expected: number = want(p.phi);
    return Math.abs(got - expected) <= 1e-7 * expected ? [] : [`${label}: part chord at phase ${p.phi}: ${got} mm against ${expected} mm`];
  });
}

/** The host law stays at its cap on the ellipse's convex side. */
function hostAtCap(c: ICase, label: string, cap: number): string[] {
  if (typeof c.width === "string") return [];
  const host: (t: number) => number = c.width.host;
  return c.curve.points.flatMap((p: AutoMovieSolidIntersection.IPoint): string[] =>
    Math.abs(host(p.t) - cap) <= 1e-9 * cap ? [] : [`${label}: host chord at phase ${p.phi}: ${host(p.t)} mm against the cap ${cap}`],
  );
}

/** The join is admitted with no diagnostic. */
function admitted(c: ICase, label: string): string[] {
  return c.join.join !== null && c.join.diagnostics.length === 0 ? [] : [`${label}: not admitted: ${describe(c)}`];
}

/** At every traced point the part rail's travel along the contact's tangent is positive: the rail does not run backward. */
function forward(c: ICase, label: string): string[] {
  const join: AutoMovieSolidJoin.IJoin | null = c.join.join;
  if (join === null) return [];
  const h: number = 1e-4;
  return c.curve.points.flatMap((p: AutoMovieSolidIntersection.IPoint): string[] => {
    const before: AutoMovieSolidRail.IRail | null = join.rail(p.t - h);
    const after: AutoMovieSolidRail.IRail | null = join.rail(p.t + h);
    if (before === null || after === null) return [`${label}: no rail beside t ${p.t}`];
    const travel: number =
      (after.partPoint[0] - before.partPoint[0]) * p.tangent[0] +
      (after.partPoint[1] - before.partPoint[1]) * p.tangent[1] +
      (after.partPoint[2] - before.partPoint[2]) * p.tangent[2];
    return travel > 0 ? [] : [`${label}: the part rail runs backward at phase ${p.phi} (travel ${travel})`];
  });
}

/** A join result's diagnostics, for a failure message. */
function describe(c: ICase): string {
  return c.join.join === null
    ? `refused: ${c.join.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => `${d.contract}: ${d.detail.slice(0, 160)}`).join("; ")}`
    : `admitted with ${c.join.diagnostics.length} diagnostics`;
}
