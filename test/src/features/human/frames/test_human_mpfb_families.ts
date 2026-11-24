import type { IAutoMovieHumanConicLoft } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { FamilyConicMpfbFamilies as Families } from "../../../reference-conics/FamilyConicMpfbFamilies";
import type { FamilyConicMpfbSource as Mpfb } from "../../../reference-conics/FamilyConicMpfbSource";

/**
 * A constant elliptical tube with one independent marking segment introduced
 * subsequently.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Publishes a wall through the production loft and checks withheld skin planes.
 * @evidence contracts/development/testing.md#independent-expectations Ellipse extrema and the inscribed polygon's sagitta follow from the made tube's radii.
 * @evidence contracts/development/testing.md#distinguishing-cases An otherwise identical skin loses all observations shared by the foreign segment.
 * @evidence contracts/development/testing.md#execution-ownership The fixture owns its geometry and has no source reads, contact model or authored figure.
 */
export function test_human_mpfb_families(): void {
  const length: number = 100;
  const radius: number = 20;
  const lateral: number = 10;
  const sides: number = 64;
  const positions: number[] = [];
  const indices: number[] = [];
  for (const y of [0, length])
    for (let i: number = 0; i < sides; ++i) {
      const angle: number = (2 * Math.PI * i) / sides;
      positions.push(radius * Math.cos(angle), y, lateral * Math.sin(angle));
    }
  for (let i: number = 0; i < sides; ++i) {
    const next: number = (i + 1) % sides;
    indices.push(i, sides + i, sides + next, i, sides + next, next);
  }
  const joints = new Map<string, Mpfb.Point>([
    ["joint-pelvis", [0, 0, 0]],
    ["joint-neck", [0, length, 0]],
  ]);
  const source: Mpfb.IGeometry = { body: { positions, indices }, joints };
  const wall: Families.ICandidate = Families.extract(source, ["trunk"])[0]!;
  const { values, origin }: IAutoMovieHumanConicLoft.IFamily = wall.family;
  const sagitta: number = radius * (1 - Math.cos(Math.PI / sides));
  // A floating-point section meets each tessellated ellipse at computed intersections.
  const roundoff: number = radius * sides * Number.EPSILON;

  joints.set("joint-l-shoulder", [0, length, lateral / 2]);
  joints.set("joint-l-elbow", [0, length / 2, lateral / 2]);
  const isolated: Families.ICandidate = Families.extract(source, ["trunk"])[0]!;
  const findings: string[] = [];
  if (wall.excluded.length !== 0)
    findings.push("the isolated wall has refused sections");
  if (
    !values[0]!.every((r): boolean => Math.abs(r - radius) < roundoff) ||
    !values[3]!.every((r): boolean => Math.abs(r + radius) < roundoff)
  )
    findings.push(
      `the recovered extrema miss the radii: ${JSON.stringify([values[0], values[3]])}`,
    );
  if (
    ![...origin!.u, ...origin!.v].every((x): boolean => Math.abs(x) < roundoff)
  )
    findings.push("the recovered radius line misses the source axis");
  if (
    wall.heldout.length === 0 ||
    !wall.heldout.every(({ max }): boolean => max < 2 * sagitta)
  )
    findings.push(
      `withheld outline errors exceed twice the polygon sagitta: ${Math.max(...wall.heldout.map(({ max }): number => max))}`,
    );
  if (!isolated.observed.every((s): boolean => s < length / 2))
    findings.push("retained cuts span the foreign segment");
  if (
    isolated.excluded.length === 0 ||
    !isolated.excluded.every(
      ({ station, reason }): boolean =>
        station >= length / 2 && reason.includes("another part"),
    )
  )
    findings.push("shared measurements were not explicitly rejected");
  TestValidator.equals("independent conic wall and ownership", findings, []);
}
