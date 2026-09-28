import {
  type IAutoMovieHumanBodyBuild,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  type HumanBodyBasisPatch,
  humanBodyCouplingFixture,
} from "../internal/humanBodyCouplingFixture";
import { nclose, qclose, throwsError } from "../internal/predicates";

/**
 * A declared coupling adds a bounded angle to another joint before the pose
 * is validated, and a corrective ramp reads the sum.
 *
 * The fixture is the three-bone analytic box of `humanBodyCouplingFixture`:
 * every rest frame is the identity, a spine flexion `s` plus a chest flexion
 * `c` leaves the chest's world rotation at `s + c` degrees about +X, and the
 * coupling `rhythm` reads the spine's elevation and adds to the chest's
 * flexion along `[[30, 0], [60, 20], [90, 50]]`. Admission of the table is
 * its own scenario (`test_human_body_basis_coupling_admission`).
 *
 * Scenarios:
 * 1. The curve: spine flexion 20 and 30 add nothing, 45 adds 10 (first
 *    segment), 60 adds 20 (a knot), 75 adds 35 (second segment), 90 adds 50
 *    (the last knot), and the empty document leaves the chest at rest.
 * 2. The measure is the swing cone of the clinical angles: with the spine's
 *    abduction widened to 90, flexion 60 with abduction 60 has elevation
 *    `2 acos(cos 30 cos 30) = 2 acos 0.75` and adds `20 + (that - 60)`,
 *    flexion 90 with abduction 90 has elevation 120 and holds the last
 *    ordinate 50, and abduction 60 alone adds 20. With the spine resting at
 *    flexion 20 the rest elevation is 20: the empty document and a flexion
 *    of 10 below the rest add nothing, a curve whose first knot sits exactly
 *    at that rest elevation adds no entry at rest (the cone formula's float
 *    error at 20 degrees is absorbed), and a flexion of 50 adds 40/3 (its
 *    clinical elevation, not its 30 degrees of travel).
 * 3. The ordinate adds to what the document wrote: chest flexion 30 with
 *    spine 45 gives 40; a chest entry with only abduction 5 keeps it and
 *    gains flexion 10; a second coupling into the chest's abduction
 *    (`[[30, 0], [90, -6]]`) finds the entry the first added, so spine 90
 *    gives chest flexion 50 and abduction -6; each equals the same explicit
 *    pose on a coupling-free basis.
 * 4. The sum is validated, never clamped: spine 90 with chest 41 (sum 91)
 *    refuses and chest 40 (sum 90) passes; on the abduction coupling,
 *    chest -5 (sum -11) refuses and -4 (sum -10) passes; the document's pose
 *    is unchanged by a build. A knot's ordinate is the curve's value at that
 *    knot exactly: `[[0.1, 0], [90, -6], [120, -6]]` into a chest abduction
 *    range of [-6, 10] at spine 90 lands on -6 and passes, where the interpolation
 *    `y0 + (y1 - y0)(x - x0)/(x1 - x0)` rounds to -6.000000000000001 and
 *    would refuse the range's own end.
 * 5. A corrective ramp on chest flexion (onset 30, full 60, `fold` moving
 *    the hips-bound vertex 0 by +0.02 in Z) fires on the coupled angle:
 *    spine 90 (chest 50) gives two thirds, spine 45 (chest 10) nothing,
 *    chest 40 with spine 45 (chest 50) two thirds, and the same spine 90 on
 *    a coupling-free basis nothing.
 * 6. A basis without couplings and one with an empty table pose the chest
 *    exactly as the spine alone does.
 */
export const test_human_body_basis_coupling = (): void => {
  const { rhythm, retraction, curveFrom, withChest, chestOf, aboutX } =
    humanBodyCouplingFixture;
  const { spine, chest, twin } = humanBodyCouplingFixture;

  // 1. the curve, read off the chest's world rotation about +X
  const coupled = withChest([rhythm]);
  const build = createHumanBodyBasisBuilder(coupled.basis);
  for (const [title, flexion, addition] of [
    ["below the first knot", 20, 0],
    ["at the first knot", 30, 0],
    ["inside the first segment", 45, 10],
    ["at a knot", 60, 20],
    ["inside the second segment", 75, 35],
    ["at the last knot", 90, 50],
  ] as const)
    TestValidator.predicate(
      title,
      qclose(
        chestOf(build({ ...coupled.document, pose: [spine(flexion)] })),
        aboutX(flexion + addition),
      ),
    );
  TestValidator.predicate(
    "the empty document leaves the chest at rest",
    qclose(chestOf(build(coupled.document)), aboutX(0)),
  );

  // 2. the measure is the swing cone from the rest; each case equals the
  // explicit chest pose on a coupling-free basis
  const wide: HumanBodyBasisPatch = (basis) => {
    basis.joints[1].constraint!.abduction = { min: -90, max: 90 };
  };
  const swung = withChest([rhythm], wide);
  const swing = createHumanBodyBasisBuilder(swung.basis);
  const combined = (2 * Math.acos(0.75) * 180) / Math.PI;
  for (const [title, pose, addition] of [
    ["flexion and abduction combine", [spine(60, 60)], 20 + (combined - 60)],
    ["held past the last knot", [spine(90, 90)], 50],
    ["abduction alone elevates", [spine(null, 60)], 20],
  ] as const)
    TestValidator.predicate(
      title,
      qclose(
        chestOf(swing({ ...swung.document, pose: [...pose] })),
        twin([...pose, chest(addition)], wide),
      ),
    );
  const offset: HumanBodyBasisPatch = (basis) => {
    basis.joints[1].neutral.flexion = 20;
  };
  const rested = withChest([rhythm], offset);
  const rest = createHumanBodyBasisBuilder(rested.basis);
  TestValidator.predicate(
    "the rest and a pose below it add nothing",
    qclose(chestOf(rest(rested.document)), twin([], offset)) &&
      qclose(
        chestOf(rest({ ...rested.document, pose: [spine(10)] })),
        twin([spine(10)], offset),
      ),
  );
  const knotted = withChest([curveFrom(20)], offset);
  TestValidator.equals(
    "a first knot at the rest elevation adds no entry at rest",
    chestOf(createHumanBodyBasisBuilder(knotted.basis)(knotted.document)),
    twin([], offset),
  );
  TestValidator.predicate(
    "elevation is the clinical angle, not the travel from the rest",
    qclose(
      chestOf(rest({ ...rested.document, pose: [spine(50)] })),
      twin([spine(50), chest(40 / 3)], offset),
    ),
  );

  // 3. addition to the document's own angle, and a second coupling
  TestValidator.predicate(
    "adds to an explicit chest flexion",
    qclose(
      chestOf(build({ ...coupled.document, pose: [spine(45), chest(30)] })),
      aboutX(85),
    ),
  );
  TestValidator.predicate(
    "keeps the other axes of an existing entry",
    qclose(
      chestOf(
        build({ ...coupled.document, pose: [spine(45), chest(null, 5)] }),
      ),
      twin([spine(45), chest(10, 5)]),
    ),
  );
  const both = withChest([rhythm, retraction]);
  const pair = createHumanBodyBasisBuilder(both.basis);
  TestValidator.predicate(
    "a second coupling finds the entry the first added",
    qclose(
      chestOf(pair({ ...both.document, pose: [spine(90)] })),
      twin([spine(90), chest(50, -6)]),
    ),
  );

  // 4. the sum is validated, and the document is left alone
  for (const [title, pose, refused] of [
    ["sum past the flexion range", [spine(90), chest(41)], true],
    ["sum on the flexion range", [spine(90), chest(40)], false],
    ["sum past the abduction range", [spine(90), chest(null, -5)], true],
    ["sum on the abduction range", [spine(90), chest(null, -4)], false],
  ] as const)
    TestValidator.equals(
      title,
      throwsError(() => pair({ ...both.document, pose: [...pose] }), "chest"),
      refused,
    );
  const document = { ...both.document, pose: [spine(90), chest(20)] };
  const before = JSON.stringify(document);
  pair(document);
  TestValidator.equals(
    "the document is not mutated",
    JSON.stringify(document),
    before,
  );

  const edge = withChest(
    [
      rhythm,
      {
        ...retraction,
        curve: [
          [0.1, 0],
          [90, -6],
          [120, -6],
        ],
      },
    ],
    (basis) => {
      basis.joints[2].constraint!.abduction = { min: -6, max: 10 };
    },
  );
  const edged = createHumanBodyBasisBuilder(edge.basis);
  TestValidator.predicate(
    "the last knot's ordinate lands on the range's end exactly",
    !throwsError(() => edged({ ...edge.document, pose: [spine(90)] })) &&
      qclose(
        chestOf(edged({ ...edge.document, pose: [spine(90)] })),
        twin([spine(90), chest(50, -6)]),
      ),
  );

  // 5. a corrective ramp reads the coupled angle
  const folded: HumanBodyBasisPatch = (basis) => {
    basis.correctives!.push({
      id: "fold",
      inputs: [
        {
          bone: "chest",
          axis: "flexion",
          side: "positive",
          onset: 30,
          full: 60,
        },
      ],
      weight: 1,
      target: "fold",
    });
    basis.surfaces[0].targets.fold = [0, 0, 0, 0.02];
  };
  const order = [...new Set(coupled.basis.surfaces[0].regions[0].indices)];
  const z0 = (built: IAutoMovieHumanBodyBuild): number => {
    const geometry = built.model.parts[0].geometry;
    if (geometry.type !== "mesh") throw new Error("Expected resident mesh.");
    return geometry.mesh.positions[order.indexOf(0) * 3 + 2];
  };
  const ramped = withChest([rhythm], folded);
  const ramp = createHumanBodyBasisBuilder(ramped.basis);
  const restZ = z0(ramp(ramped.document));
  for (const [title, pose, expected] of [
    ["fires on the coupled angle", [spine(90)], 0.02 * (2 / 3)],
    ["stays off below the onset", [spine(45)], 0],
    [
      "adds the document's angle to the coupled one",
      [spine(45), chest(40)],
      0.02 * (2 / 3),
    ],
  ] as const)
    TestValidator.predicate(
      title,
      nclose(
        z0(ramp({ ...ramped.document, pose: [...pose] })) - restZ,
        expected,
      ),
    );
  const unramped = withChest(undefined, folded);
  TestValidator.predicate(
    "without the coupling the same spine angle arms nothing",
    nclose(
      z0(
        createHumanBodyBasisBuilder(unramped.basis)({
          ...unramped.document,
          pose: [spine(90)],
        }),
      ),
      restZ,
    ),
  );

  // 6. no couplings, absent or empty, is the spine alone
  const empty = withChest([]);
  TestValidator.predicate(
    "an absent and an empty table both leave the chest to the document",
    qclose(twin([spine(90)]), aboutX(90)) &&
      qclose(
        chestOf(
          createHumanBodyBasisBuilder(empty.basis)({
            ...empty.document,
            pose: [spine(90)],
          }),
        ),
        aboutX(90),
      ),
  );
};
