import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanArmCollar as Collar } from "../../../../packages/human/src/generation/AutoMovieHumanArmCollar";
import { nclose } from "../internal/nclose";

/**
 * A shoulder collar inherits boundary jets while leaving its next tape intact.
 *
 * Scenarios:
 * 1. A cylindrical child with a known tangent mismatch meets a quadratic parent.
 * 2. Mirroring and translating the family retain the same physical constraints.
 * 3. Every point stays inside the displacement bound and distant rings stay put.
 *
 * @evidence contracts/testing.md#behavioral-verification Observes the corrected Cartesian surface and finite-differences its root tangent and curvature against a quadratic cone. The unchanged cylinder is the deliberately bad tangent fixture. It scans the complete collar and compares the inner ring and its two jets with that cylinder.
 * @evidence contracts/testing.md#independent-expectations A radius 20+0.25d+0.002d² has radial derivatives 0.25 and 0.004 at depth zero, whereas the cylinder has zero. Translation and reflection preserve those dimensions. The caller's 4 mm displacement bound and the unchanged 20 mm radius outside the collar are independent contracts rather than recovered coefficients.
 * @evidence contracts/testing.md#distinguishing-cases Uses opposite phase senses, two root offsets, the root and inner endpoint from both sides, and a dense depth/phase scan. It distinguishes preserving a shared position alone from preserving its tangent and curvature. Complete-person arm tests still own the actual shoulder correspondence and anatomy.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU test reached by --include human_arm_collar. Analytic local surfaces exercise the production collar; it starts no generator, process, browser or GPU.
 */
export function test_human_arm_collar(): void {
  for (const sign of [1, -1])
    for (const root of [100, 337]) {
      const surface: (q: number, t: number) => Collar.Vec3 = (q: number, t: number): Collar.Vec3 => [7 + 20 * Math.cos(t), q, sign * 20 * Math.sin(t)];
      const parent: (q: number, t: number) => Collar.Vec3 = (q: number, t: number): Collar.Vec3 => {
        const depth: number = root - q;
        const radius: number = 20 + 0.25 * depth + 0.002 * depth * depth;
        return [7 + radius * Math.cos(t), q, sign * radius * Math.sin(t)];
      };
      const collar: Collar.IOutput = Collar.create({ root, reach: 70, bulge: 4, phases: 32, surface, parent });
      const radius: (q: number, t: number) => number = (q: number, t: number): number => {
        const p: Collar.Vec3 = collar.point(q, t);
        return Math.hypot(p[0] - 7, p[2]);
      };
      const h: number = 0.001;
      TestValidator.predicate("unmatched cylinder is a real tangent defect", Math.abs((Math.hypot(surface(root - h, 0)[0] - 7, surface(root - h, 0)[2]) - 20) / h - 0.25) > 0.2);
      for (const t of [0, 0.37, 2.8, 5.9]) {
        TestValidator.predicate("shared root position", nclose(radius(root, t), 20, 1e-8));
        const slope: number = (radius(root - h, t) - radius(root + h, t)) / (2 * h);
        const curvature: number = (radius(root - h, t) - 2 * radius(root, t) + radius(root + h, t)) / (h * h);
        TestValidator.predicate("parent tangent inherited", nclose(slope, 0.25, 1e-6));
        TestValidator.predicate("parent curvature inherited", nclose(curvature, 0.004, 1e-6));
        const end: number = root - collar.reach;
        TestValidator.predicate("next tape unchanged", nclose(radius(end, t), 20, 1e-8));
        TestValidator.predicate("inner tangent unchanged", nclose((radius(end - h, t) - radius(end + h, t)) / (2 * h), 0, 1e-6));
        TestValidator.predicate("inner curvature unchanged", nclose((radius(end - h, t) - 2 * radius(end, t) + radius(end + h, t)) / (h * h), 0, 1e-6));
      }
      for (let i: number = 0; i <= 200; i++)
        for (let j: number = 0; j < 32; j++) {
          const q: number = root - (collar.reach * i) / 200;
          const t: number = (2 * Math.PI * j) / 32;
          const p: Collar.Vec3 = collar.point(q, t);
          const old: Collar.Vec3 = surface(q, t);
          TestValidator.predicate("bounded root correction", Math.hypot(p[0] - old[0], p[1] - old[1], p[2] - old[2]) <= 4 + 1e-8);
        }
    }
}
