import { createHumanBodyBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  type HumanBodyBasisPatch,
  type HumanBodyCoupling,
  humanBodyCouplingFixture,
} from "../internal/humanBodyCouplingFixture";
import { throwsError } from "../internal/predicates";

/**
 * A coupling table is admitted only when every coupling can be evaluated
 * once, in order, into an axis the output joint articulates, and its whole
 * curve fits that axis's range.
 *
 * The fixture is the three-bone analytic box of `humanBodyCouplingFixture`
 * with `rhythm` (spine elevation into chest flexion) and `retraction` (into
 * chest abduction); the chest's flexion range is [-30, 90].
 *
 * Scenarios:
 * 1. Output axis: a twist coupling into a chest whose twist is held refuses
 *    and into an open twist passes; the root bone refuses as an output.
 * 2. Reach: an ordinate of 91 or -31 refuses and 90 or -30 passes; with the
 *    chest resting at flexion 20 the reach shrinks to 70, so 71 refuses and
 *    70 passes.
 * 3. Topology: an unknown source or output bone and a self coupling refuse;
 *    a coupling whose output is another coupling's source refuses in either
 *    declaration order while the backward coupling alone passes; a duplicate
 *    output axis refuses while two axes of one bone pass.
 * 4. Identity: a blank or duplicate id refuses.
 * 5. Curve: a single knot, a nonzero first ordinate, a negative first
 *    abscissa, a first abscissa below the source's rest elevation (19 when
 *    the spine rests at flexion 20), a repeated or decreasing abscissa and a
 *    nonfinite abscissa or ordinate refuse; a zero first abscissa, a first
 *    abscissa at the rest elevation and an empty table pass.
 */
export const test_human_body_basis_coupling_admission = (): void => {
  const { rhythm, retraction, curveFrom, withChest } = humanBodyCouplingFixture;
  const held: HumanBodyBasisPatch = (basis) => {
    basis.joints[2].constraint!.twist = null;
    basis.joints[2].signs.twist = null;
  };
  const chestOffset: HumanBodyBasisPatch = (basis) => {
    basis.joints[2].neutral.flexion = 20;
  };
  const spineOffset: HumanBodyBasisPatch = (basis) => {
    basis.joints[1].neutral.flexion = 20;
  };
  const curve = (...knots: [number, number][]): HumanBodyCoupling => ({
    ...rhythm,
    curve: knots,
  });
  const backward: HumanBodyCoupling = {
    ...rhythm,
    id: "backward",
    source: { bone: "chest", measure: "elevation" },
    output: { bone: "spine", axis: "flexion" },
  };
  const twist: HumanBodyCoupling = {
    ...rhythm,
    output: { bone: "chest", axis: "twist" },
    curve: [
      [30, 0],
      [90, 10],
    ],
  };
  const cases: [
    string,
    HumanBodyCoupling[],
    HumanBodyBasisPatch | undefined,
    boolean,
  ][] = [
    // 1. output axis
    ["held output axis", [twist], held, true],
    ["open output axis", [twist], undefined, false],
    [
      "root output",
      [{ ...rhythm, output: { bone: "hips", axis: "flexion" } }],
      undefined,
      true,
    ],
    // 2. reach
    [
      "ordinate past the positive range",
      [curve([30, 0], [90, 91])],
      undefined,
      true,
    ],
    [
      "ordinate on the positive range",
      [curve([30, 0], [90, 90])],
      undefined,
      false,
    ],
    [
      "ordinate past the negative range",
      [curve([30, 0], [90, -31])],
      undefined,
      true,
    ],
    [
      "ordinate on the negative range",
      [curve([30, 0], [90, -30])],
      undefined,
      false,
    ],
    [
      "reach shrinks with the rest offset",
      [curve([30, 0], [90, 71])],
      chestOffset,
      true,
    ],
    [
      "reach with the rest offset",
      [curve([30, 0], [90, 70])],
      chestOffset,
      false,
    ],
    // 3. topology
    [
      "unknown source",
      [{ ...rhythm, source: { bone: "leftUpperArm", measure: "elevation" } }],
      undefined,
      true,
    ],
    [
      "unknown output",
      [{ ...rhythm, output: { bone: "neck", axis: "flexion" } }],
      undefined,
      true,
    ],
    [
      "self coupling",
      [{ ...rhythm, output: { bone: "spine", axis: "flexion" } }],
      undefined,
      true,
    ],
    ["chain through the output", [rhythm, backward], undefined, true],
    ["chain declared first", [backward, rhythm], undefined, true],
    ["the backward coupling alone", [backward], undefined, false],
    [
      "duplicate output axis",
      [rhythm, { ...rhythm, id: "again" }],
      undefined,
      true,
    ],
    ["two output axes", [rhythm, retraction], undefined, false],
    // 4. identity
    ["blank id", [{ ...rhythm, id: " " }], undefined, true],
    [
      "duplicate id",
      [rhythm, { ...retraction, id: "rhythm" }],
      undefined,
      true,
    ],
    // 5. curve
    ["single knot", [curve([30, 0])], undefined, true],
    ["nonzero first ordinate", [curve([30, 1], [90, 50])], undefined, true],
    ["negative first abscissa", [curve([-1, 0], [90, 50])], undefined, true],
    ["zero first abscissa", [curve([0, 0], [90, 50])], undefined, false],
    [
      "first abscissa below the rest elevation",
      [curveFrom(19)],
      spineOffset,
      true,
    ],
    [
      "first abscissa at the rest elevation",
      [curveFrom(20)],
      spineOffset,
      false,
    ],
    ["repeated abscissa", [curve([30, 0], [30, 50])], undefined, true],
    [
      "decreasing abscissa",
      [curve([30, 0], [90, 50], [60, 20])],
      undefined,
      true,
    ],
    [
      "nonfinite abscissa",
      [curve([30, 0], [Number.POSITIVE_INFINITY, 50])],
      undefined,
      true,
    ],
    ["nonfinite ordinate", [curve([30, 0], [90, Number.NaN])], undefined, true],
    ["empty table", [], undefined, false],
  ];
  for (const [title, couplings, patch, refused] of cases) {
    const fixture = withChest(couplings, patch);
    TestValidator.equals(
      title,
      throwsError(() => createHumanBodyBasisBuilder(fixture.basis)),
      refused,
    );
  }
};
