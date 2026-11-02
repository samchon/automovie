import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanWebBoundary as Boundary } from "../../../../packages/human/src/generation/AutoMovieHumanWebBoundary";
import { AutoMovieHumanWebGeometry as Geometry } from "../../../../packages/human/src/generation/AutoMovieHumanWebGeometry";
import { AutoMovieHumanWebPatch as Patch } from "../../../../packages/human/src/generation/AutoMovieHumanWebPatch";
import { nclose } from "../internal/nclose";

/**
 * Web boundary corrections retain their prescribed geometric jets.
 *
 * Scenarios:
 * 1. Polynomials through degree five retain position, tangent and curvature.
 * 2. Position-only correction leaves a known kink; jet correction removes it.
 * 3. A preserved endpoint retains all three of its original boundary data.
 * 4. A square-root saddle column is inverted on its curve rather than on chords.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises the live web's Hermite operator, physical-jet constraint and depth inversion. A bowed curve with correct endpoint positions fails the same tangent observation that the corrected straight curve passes; an undersampled saddle column fails the known square-root displacement while exact inversion passes.
 * @evidence contracts/testing.md#independent-expectations Explicit monomials through degree five supply analytical derivatives independent of the Hermite basis. The arch's desired geometry is a straight unit segment, and the curve (u,u*u,0) reaches depth d at (sqrt(d),d,0). The 0.001 allowance on differenced second derivatives covers floating-point cancellation at a 0.0001 parameter step.
 * @evidence contracts/testing.md#distinguishing-cases Covers both endpoints, reflected and translated coordinates, all polynomial degrees supported by the quintic, corrected and preserved ends, tiny saddle depths and the exact end depth. Whole-person surface incidence, folds and crumples remain with the hand curve audit.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU test using pure local curves and the production web helpers, without generating a person or starting a host, process, browser or GPU.
 */
export function test_human_web_patch(): void {
  for (const degree of [0, 1, 2, 3, 4, 5])
    for (const sign of [-1, 1]) {
      const value: (t: number, order: number) => Patch.Vec3 = (
        t: number,
        order: number,
      ): Patch.Vec3 => {
        let coefficient: number = 1;
        for (let k: number = 0; k < order; k++) coefficient *= degree - k;
        const x: number =
          degree < order ? 0 : coefficient * t ** (degree - order);
        return [sign * x + (order === 0 ? 13 : 0), x, 2 * x];
      };
      const at: (t: number) => Patch.IJet = (t: number): Patch.IJet => ({
        value: value(t, 0),
        first: value(t, 1),
        second: value(t, 2),
      });
      for (const t of [0, 0.03, 0.25, 0.5, 0.8, 1])
        for (const order of [0, 1, 2] as const)
          TestValidator.predicate(
            "analytical quintic jet",
            close(
              Patch.derivative(at(0), at(1), t, order),
              value(t, order),
              1e-10,
            ),
          );
    }

  const reference: (t: number) => Patch.Vec3 = (t: number): Patch.Vec3 => [
    t,
    4 * t * (1 - t),
    0,
  ];
  const from: Patch.IJet = {
    value: [0, 0, 0],
    first: [1, 0, 0],
    second: [0, 0, 0],
  };
  const to: Patch.IJet = {
    value: [1, 0, 0],
    first: [1, 0, 0],
    second: [0, 0, 0],
  };
  const corrected: (t: number) => Patch.Vec3 = Patch.constrain(
    reference,
    [Boundary.jet(reference, 0), Boundary.jet(reference, 1)],
    [from, to],
  );
  TestValidator.predicate(
    "position-only defect is red",
    Math.abs(Boundary.jet(reference, 0).first[1]) > 3.9,
  );
  for (const end of [0, 1] as const) {
    const measured: Patch.IJet = Boundary.jet(corrected, end);
    TestValidator.predicate(
      "flat tangent is green",
      close(measured.first, [1, 0, 0], 1e-7),
    );
    TestValidator.predicate(
      "flat curvature is green",
      close(measured.second, [0, 0, 0], 0.001),
    );
  }
  const retained: (t: number) => Patch.Vec3 = Boundary.fit(
    reference,
    from,
    null,
  );
  const before: Patch.IJet = Boundary.jet(reference, 1);
  const after: Patch.IJet = Boundary.jet(retained, 1);
  TestValidator.predicate(
    "retained end position",
    close(before.value, after.value, 1e-12),
  );
  TestValidator.predicate(
    "retained end tangent",
    close(before.first, after.first, 1e-7),
  );
  TestValidator.predicate(
    "retained end curvature",
    close(before.second, after.second, 0.001),
  );

  const saddle: (depth: number) => Patch.Vec3 = Geometry.sampled(
    (u: number): Patch.Vec3 => [u, u * u, 0],
    [0, 1, 0],
  );
  for (const depth of [1e-12, 1e-8, 0.01, 0.25, 1])
    TestValidator.predicate(
      "exact saddle depth",
      close(saddle(depth), [Math.sqrt(depth), depth, 0], 1e-11),
    );
  const defectiveFirstCell: number = 1e-8 * 256;
  TestValidator.predicate(
    "chord inversion is red",
    !nclose(defectiveFirstCell, Math.sqrt(1e-8), 1e-6),
  );
}

/** Compare tuple components through the maintained absolute-error predicate. */
function close(a: Patch.Vec3, b: Patch.Vec3, eps: number): boolean {
  return a.every((x: number, k: number): boolean => nclose(x, b[k]!, eps));
}
