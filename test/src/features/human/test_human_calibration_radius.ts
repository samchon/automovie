import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanHeadRadius } from "../../../../packages/human/src/generation/AutoMovieHumanHeadRadius";
import { AutoMovieHumanHeadVault } from "../../../../packages/human/src/generation/AutoMovieHumanHeadVault";
import type { IAutoMovieHumanHeadSection } from "../../../../packages/human/src/generation/IAutoMovieHumanHeadSection";
import { nclose } from "../internal/predicates";

/**
 * Radial calibration closes on independently specified circular and elliptic skin.
 *
 * Scenarios:
 *
 * 1. Circular and eccentric elliptic sections keep their analytic ray lengths
 * at both axes and between them, in either lateral direction.
 * 2. Zero, near-zero and oversized starting guesses converge to that same
 * outline at millimetre and whole-head scales.
 * 3. An offset ellipse retains its forward intersection when the ray origin
 * differs from the ellipse centre, exercising the bounded fallback.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public head radius and field operations and checks finite physical radius and unit field value, catching changed root convergence or a wrong phase while permitting any implementation that reaches the same skin.
 * @evidence contracts/testing.md#independent-expectations The quadratic intersection of a ray with x-squared/a-squared plus z-squared/b-squared equals one supplies each expected radius, independently of the construction's iteration. The fixture removes the face shield and jaw so it is exactly an ellipse; this does not certify the full jaw blend.
 * @evidence contracts/testing.md#distinguishing-cases Covers circle versus eccentric ellipse, centred versus offset origin, both lateral signs, axis and oblique phases, three scales and three starting guesses. The mouth and whole calibration tests own dental dimensions and assembled input response.
 * @evidence contracts/testing.md#execution-ownership A discoverable portable synchronous unit imports the numerical producer directly and starts no body generator, renderer, process or GPU.
 */
export function test_human_calibration_radius(): void {
  const defects: string[] = [];
  for (const scale of [0.1, 1, 10])
    for (const breadth of [30, 80])
      for (const offset of [0, 25])
        for (const theta of [0, 0.37, Math.PI / 2, 2.2, Math.PI, -0.37, -2.2]) {
          const a: number = 80 * scale;
          const b: number = breadth * scale;
          const ox: number = offset * scale;
          const c: number = Math.cos(theta);
          const s: number = Math.sin(theta);
          const A: number = (c / a) ** 2 + (s / b) ** 2;
          const B: number = (2 * ox * c) / (a * a);
          const C: number = (ox / a) ** 2 - 1;
          const expected: number =
            (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
          const section: IAutoMovieHumanHeadSection = {
            t: 0,
            tilt: 0,
            axis: 0,
            front: a,
            crown: a,
            back: -a,
            width: b,
            waist: 0,
            face: 0,
            taper: 0,
            brow: 0,
            tube: 0,
            union: 0,
            powerBack: 2,
            powerFace: 2,
            station: 0,
          };
          for (const guess of [0, a * 1e-4, a * 20]) {
            const actual: number = AutoMovieHumanHeadRadius.radius(
              section,
              ox,
              theta,
              guess,
            );
            const label: string = `${scale}/${breadth}/${offset}/${theta}/${guess}`;
            if (!nclose(actual, expected, 2e-6))
              defects.push(`${label}: analytic radius`);
            if (
              !nclose(
                AutoMovieHumanHeadVault.gauge(
                  section,
                  ox + actual * c,
                  actual * s,
                ),
                1,
                1e-7,
              )
            )
              defects.push(`${label}: surface closure`);
          }
        }
  TestValidator.equals("analytic head radial convergence", defects, []);
}
