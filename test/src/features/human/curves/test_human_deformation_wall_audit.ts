import { AutoMovieHumanConicLoft as H, AutoMovieHumanConicSection as S } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";
import { FamilyConicWallDeformationAudit as A } from "../../../reference-conics/FamilyConicWallDeformationAudit";
import { nclose } from "../../internal/nclose";

/**
 * Authored wall correspondence on made elliptical cylinders, without generating a person or a skin.
 *
 * Scenarios:
 * 1. Doubling both ellipse radii under (x,y,z) -> (2x,y,2z) has zero transport discrepancy across every sampled rational arc.
 * 2. Moving the candidate's course 4 mm along its Y normal, under identity, reports 4 mm total/normal discrepancy and zero in-plane discrepancy.
 * 3. A different layout is refused instead of inventing arc correspondence; a nonpositive grid is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the three made cases, their closed-form answers, sample coverage and refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Calls section on tiny two-knot families; catches world-angle pairing, dropped frame origins and silently changed topology.
 * @evidence contracts/development/testing.md#independent-expectations An ellipse is preserved by uniform in-plane scaling, and parallel planes 4 mm apart have constant normal separation. The distance tolerance is 256 binary64 epsilons times the largest radius, 80 mm; the angle allowance is 256 epsilons in radians converted to degrees.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises an exact affine image, an independent frame error, changed layout and malformed grid; point arithmetic and degenerate columns are owned by human_deformation_audit.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit reached by --include human_deformation_wall_audit, using only made conic fields; it reads no reference body and realizes no surface.
 */
export function test_human_deformation_wall_audit(): void {
  const rho: number = Math.SQRT2 - 1;
  const reference: H.IFamily = {
    name: "made-ellipse", centres: [[0, 0, 0], [0, 100, 0]], halves: [], up: [1, 0, 0], layout: S.limb(0), knots: [0, 100],
    values: [40, 0, 0, 25, -40, 0, 0, -25, rho, rho, rho, rho].map((value: number): number[] => [value, value]),
  };
  const enlarged: H.IFamily = { ...reference, values: reference.values.map((field: number[], i: number): number[] => field.map((v: number): number => i < 8 ? 2 * v : v)) };
  const mapped: A.IReading = A.section(reference, enlarged, 50, 50, (p: H.V3): H.V3 => [2 * p[0], p[1], 2 * p[2]], 16);
  const moved: H.IFamily = { ...reference, centres: [[0, 4, 0], [0, 104, 0]] };
  const shifted: A.IReading = A.section(reference, moved, 50, 50, (p: H.V3): H.V3 => p, 16);
  const distanceTolerance: number = 256 * Number.EPSILON * 80;
  const angleTolerance: number = (256 * Number.EPSILON * 180) / Math.PI;
  const readings: [string, number, number, number][] = [
    ["affine image", mapped.maximumMm, 0, distanceTolerance],
    ["affine chord", mapped.maximumChordDegrees ?? NaN, 0, angleTolerance],
    ["translated chord", shifted.maximumChordDegrees ?? NaN, 0, angleTolerance],
    ["plane separation", shifted.maximumMm, 4, distanceTolerance],
    ["normal separation", shifted.normalMm, 4, distanceTolerance],
    ["in-plane separation", shifted.inPlaneMm, 0, distanceTolerance],
  ];
  const failures: string[] = [];
  for (const [label, actual, expected, tolerance] of readings)
    if (!nclose(actual, expected, tolerance)) failures.push(`${label}: ${actual} against ${expected}`);
  TestValidator.predicate(failures.join("; ") || "exact wall correspondences", (): boolean => failures.length === 0);
  TestValidator.predicate("actual finite grid includes arc midpoints", (): boolean => mapped.samples === 16 && shifted.samples === 16 && mapped.unavailableChords === 0 && shifted.unavailableChords === 0);

  /** A changed chart or unavailable sampling is not a successful zero-error observation. */
  const refuses: (label: string, read: () => unknown) => void = (label: string, read: () => unknown): void => {
    let refused: boolean = false;
    try { read(); } catch { refused = true; }
    TestValidator.predicate(label, (): boolean => refused);
  };
  refuses("changed authored layout", (): A.IReading => A.section(reference, { ...reference, layout: S.limb(1) }, 50, 50, (p: H.V3): H.V3 => p, 16));
  refuses("invalid sample count", (): A.IReading => A.section(reference, reference, 50, 50, (p: H.V3): H.V3 => p, 0));
}
