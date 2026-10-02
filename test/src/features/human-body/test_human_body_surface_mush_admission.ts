import { assertHumanBodyBasis, createHumanBodyBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * Optional numerical filtering admits whole sweeps and bounded mask policy.
 * These are algorithm inputs, not clinical limits.
 *
 * Scenarios:
 * 1. Invalid sweep counts, mask widths, ring counts and decays refuse with
 *    the surface cause, each beside a valid boundary twin.
 * 2. Missing filtering remains admitted and keeps the existing body schema.
 * 3. Pure admission refuses unsafe counters and admits the exact safe upper
 *    boundary, without compiling or executing an enormous mask or smoothing loop.
 */
export const test_human_body_surface_mush_admission = (): void => {
  const base = { iterations: 1, blendWidth: 0.5, spreadRings: 0, spreadDecay: 0 };
  for (const [field, bad, good] of [
    ["iterations", 0, 1], ["iterations", 1.5, 2], ["iterations", Infinity, 1], ["iterations", NaN, 1],
    ["blendWidth", 0, 0.01], ["blendWidth", 1.1, 1], ["blendWidth", NaN, 1],
    ["spreadRings", -1, 0], ["spreadRings", 0.5, 1], ["spreadRings", Infinity, 0],
    ["spreadDecay", -0.1, 0], ["spreadDecay", 1, 0.99], ["spreadDecay", Infinity, 0], ["spreadDecay", NaN, 0],
  ] as const) {
    const rejected = humanBodyBasisFixture(); rejected.basis.surfaces[0].mush = { ...base, [field]: bad };
    TestValidator.predicate(`mush ${field} ${bad} refuses`, throwsError(() => createHumanBodyBasisBuilder(rejected.basis), "Body surface mush"));
    const admitted = humanBodyBasisFixture(); admitted.basis.surfaces[0].mush = { ...base, [field]: good };
    TestValidator.predicate(`mush ${field} ${good} twin admits`, !throwsError(() => createHumanBodyBasisBuilder(admitted.basis)));
  }
  TestValidator.predicate("mush omission admits", !throwsError(() => createHumanBodyBasisBuilder(humanBodyBasisFixture().basis)));
  const unsafe = (["iterations", "spreadRings"] as const).map((field) => {
    const fixture = humanBodyBasisFixture();
    fixture.basis.surfaces[0].mush = { ...base, [field]: Number.MAX_SAFE_INTEGER + 1 };
    // Admission alone is intentional: compiling a huge spread count or
    // evaluating a huge iteration count would not be a bounded unit test.
    return throwsError(() => assertHumanBodyBasis(fixture.basis), "Body surface mush");
  });
  TestValidator.predicate("unsafe count refusals", unsafe.every(Boolean));
  for (const field of ["iterations", "spreadRings"] as const) {
    const fixture = humanBodyBasisFixture();
    fixture.basis.surfaces[0].mush = { ...base, [field]: Number.MAX_SAFE_INTEGER };
    TestValidator.predicate(`exact safe ${field} boundary admits without compiling`, !throwsError(() => assertHumanBodyBasis(fixture.basis)));
  }
};
