import { createHumanBodyBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * A pose is admitted only inside the joints and ranges the basis declares.
 *
 * Scenarios:
 * 1. The clinical limits hold on both sides of each mobile axis: 90 and -30
 *    flexion pass, 91 and -31 refuse; 10 abduction passes, 11 refuses.
 * 2. An immobile axis accepts null and zero but refuses a nonzero angle when
 *    the constraint holds it (the root hips has no constraint and is free).
 * 3. A bone the skeleton lacks, a bone posed twice, and a nonfinite angle
 *    refuse at the builder or the document boundary.
 * 4. The unconstrained root accepts any finite angle.
 * 5. A swing cone below the flexion range's reach from the rest (90) is
 *    refused at admission; a cone of exactly 90 is admitted and the pure
 *    flexion maximum then passes the engine's cone check.
 */
export const test_human_body_basis_pose = (): void => {
  const { basis, document } = humanBodyBasisFixture();
  basis.joints[1].constraint!.twist = null;
  basis.joints[1].signs.twist = null;
  const build = createHumanBodyBasisBuilder(basis);
  const spine = (
    flexion: number | null,
    abduction: number | null,
    twist: number | null,
  ) =>
    build({
      ...document,
      pose: [{ bone: "spine", flexion, abduction, twist }],
    });
  for (const [title, flexion, abduction, twist, refused] of [
    ["flexion max", 90, null, null, false],
    ["flexion over", 91, null, null, true],
    ["extension max", -30, null, null, false],
    ["extension over", -31, null, null, true],
    ["abduction max", null, 10, null, false],
    ["abduction over", null, 11, null, true],
    ["immobile twist null", null, null, null, false],
    ["immobile twist zero", null, null, 0, false],
    ["immobile twist nonzero", null, null, 1, true],
    ["nonfinite flexion", Number.NaN, null, null, true],
  ] as const) {
    TestValidator.equals(
      title,
      throwsError(() => spine(flexion, abduction, twist)),
      refused,
    );
  }
  TestValidator.predicate(
    "unknown bone refuses",
    throwsError(() =>
      build({
        ...document,
        pose: [{ bone: "chest", flexion: 1, abduction: null, twist: null }],
      }),
    ),
  );
  TestValidator.predicate(
    "duplicate bone refuses",
    throwsError(() =>
      build({
        ...document,
        pose: [
          { bone: "spine", flexion: 1, abduction: null, twist: null },
          { bone: "spine", flexion: 2, abduction: null, twist: null },
        ],
      }),
    ),
  );
  TestValidator.predicate(
    "unconstrained root accepts a large angle",
    build({
      ...document,
      pose: [{ bone: "hips", flexion: 170, abduction: 120, twist: -100 }],
    }).model.parts.length === 1,
  );
  const coned = (swingDeg: number) => {
    const fixture = humanBodyBasisFixture();
    fixture.basis.joints[1].constraint!.swingDeg = swingDeg;
    return fixture;
  };
  TestValidator.predicate(
    "swing cone below the pure flexion reach refuses",
    throwsError(() => createHumanBodyBasisBuilder(coned(89).basis)),
  );
  const cone = coned(90);
  TestValidator.predicate(
    "swing cone at the reach admits and its pure extreme poses",
    !throwsError(() =>
      createHumanBodyBasisBuilder(cone.basis)({
        ...cone.document,
        pose: [{ bone: "spine", flexion: 90, abduction: null, twist: null }],
      }),
    ),
  );
};
